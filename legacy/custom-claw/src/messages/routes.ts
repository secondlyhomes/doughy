// Messages API — Send messages to leads/contacts via SMS/email
// Used by CallPilot and Doughy to send outbound messages through a
// single endpoint that handles Twilio delivery + DB persistence.

import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { schemaQuery, rpcCall } from '../claw/db.js';
import { sendSms } from '../claw/twilio.js';
import { logCost } from '../claw/costs.js';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ============================================================================
// Auth Middleware — verify Supabase JWT (same as claw routes)
// ============================================================================

async function requireAuth(req: Request, res: Response, next: () => void): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    if (!config.supabasePublishableKey) {
      console.error('[MessagesAPI] SUPABASE_PUBLISHABLE_KEY not configured');
      res.status(500).json({ error: 'Server misconfiguration' });
      return;
    }

    const userRes = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userRes.ok) {
      const body = await userRes.text().catch(() => '');
      console.error(`[MessagesAPI] Auth verify failed: ${userRes.status} ${body.slice(0, 200)}`);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const user = (await userRes.json()) as { id: string };
    if (!user.id || !UUID_RE.test(user.id)) {
      res.status(401).json({ error: 'Invalid user' });
      return;
    }

    (req as any).userId = user.id;
    next();
  } catch {
    res.status(401).json({ error: 'Auth verification failed' });
  }
}

// ============================================================================
// POST /api/messages/send — Send a message to a lead/contact
// ============================================================================

router.post('/send', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { leadId, contactId, channel, body } = req.body;

    // Validate required fields
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({ error: 'Message body is required' });
    }
    if (body.length > 2000) {
      return res.status(400).json({ error: 'Message body too long (max 2000 chars)' });
    }
    if (!channel || !['sms', 'email'].includes(channel)) {
      return res.status(400).json({ error: 'Channel must be "sms" or "email"' });
    }
    if (!leadId && !contactId) {
      return res.status(400).json({ error: 'Either leadId or contactId is required' });
    }

    // Look up recipient phone number
    let recipientPhone: string | null = null;
    let recipientName: string = 'Unknown';

    if (leadId) {
      if (!UUID_RE.test(leadId)) {
        return res.status(400).json({ error: 'Invalid leadId' });
      }
      const leads = await schemaQuery<{ id: string; name: string; phone: string | null; user_id: string }>(
        'crm', 'leads', `id=eq.${leadId}&user_id=eq.${userId}&select=id,name,phone,user_id&limit=1`
      );
      if (leads.length === 0) {
        return res.status(404).json({ error: 'Lead not found' });
      }
      recipientPhone = leads[0].phone;
      recipientName = leads[0].name;
    } else if (contactId) {
      if (!UUID_RE.test(contactId)) {
        return res.status(400).json({ error: 'Invalid contactId' });
      }
      // Try crm.contacts first
      const contacts = await schemaQuery<{ id: string; first_name: string | null; last_name: string | null; phone: string | null; user_id: string }>(
        'crm', 'contacts', `id=eq.${contactId}&user_id=eq.${userId}&select=id,first_name,last_name,phone,user_id&limit=1`
      );
      if (contacts.length > 0) {
        recipientPhone = contacts[0].phone;
        recipientName = [contacts[0].first_name, contacts[0].last_name].filter(Boolean).join(' ') || 'Unknown';
      } else {
        // Fall back to crm.leads (CallPilot sends contactId for both contacts and leads)
        const leads = await schemaQuery<{ id: string; name: string; phone: string | null; user_id: string }>(
          'crm', 'leads', `id=eq.${contactId}&user_id=eq.${userId}&select=id,name,phone,user_id&limit=1`
        );
        if (leads.length === 0) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        recipientPhone = leads[0].phone;
        recipientName = leads[0].name;
        // Reclassify as a lead for conversation/message storage
        (req as any).resolvedLeadId = contactId;
      }
    }

    if (channel === 'sms' && !recipientPhone) {
      return res.status(400).json({ error: `No phone number on file for ${recipientName}` });
    }

    const effectiveLeadId = leadId || (req as any).resolvedLeadId;

    // Send via Twilio (SMS only for now)
    let deliveredAt: string | null = null;
    let failedAt: string | null = null;
    let failureReason: string | null = null;
    let twilioSid: string | undefined;

    if (channel === 'sms' && recipientPhone) {
      const result = await sendSms(recipientPhone, body.trim());
      if (result.success) {
        deliveredAt = new Date().toISOString();
        twilioSid = result.sid;
        // Log cost
        logCost(userId, 'twilio', 'sms', 0.75).catch((err) =>
          console.error('[Messages] Cost logging failed:', err)
        );
      } else {
        failedAt = new Date().toISOString();
        failureReason = result.error || 'Send failed';
      }
    }

    // Store message in crm.messages via RPC (bypasses PostgREST Content-Profile
    // schema resolution which is unreliable when multiple schemas have a "messages" table)
    const rpcResult = await rpcCall('insert_crm_outbound_message', {
      p_user_id: userId,
      p_lead_id: effectiveLeadId || null,
      p_contact_id: (effectiveLeadId ? null : contactId) || null,
      p_direction: 'outbound',
      p_channel: channel,
      p_sender_type: 'user',
      p_phone_from: config.twilioPhoneNumber || null,
      p_phone_to: recipientPhone,
      p_body: body.trim(),
      p_status: deliveredAt ? 'delivered' : (failedAt ? 'failed' : 'sent'),
      p_metadata: twilioSid ? { twilio_sid: twilioSid } : {},
    });
    const message = (Array.isArray(rpcResult) ? rpcResult[0] : rpcResult) as { id: string; created_at: string };

    console.log(`[Messages] ${channel} sent to ${recipientName} (${recipientPhone}) by ${userId}`);

    res.json({
      success: !failedAt,
      message_id: message.id,
      delivered: !!deliveredAt,
      created_at: message.created_at,
      error: failureReason,
    });
  } catch (error) {
    console.error('[Messages] Send error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
