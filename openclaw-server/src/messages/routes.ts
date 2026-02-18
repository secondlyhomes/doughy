// Messages API — Send messages to leads/contacts via SMS/email
// Used by CallPilot and Doughy to send outbound messages through a
// single endpoint that handles Twilio delivery + DB persistence.

import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { schemaQuery, schemaInsert, schemaUpdate } from '../claw/db.js';
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
    const userRes = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: config.supabaseServiceKey,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userRes.ok) {
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
    const { leadId, contactId, channel, body, conversationId } = req.body;

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
      const contacts = await schemaQuery<{ id: string; first_name: string | null; last_name: string | null; phone: string | null; user_id: string }>(
        'crm', 'contacts', `id=eq.${contactId}&user_id=eq.${userId}&select=id,first_name,last_name,phone,user_id&limit=1`
      );
      if (contacts.length === 0) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      recipientPhone = contacts[0].phone;
      recipientName = [contacts[0].first_name, contacts[0].last_name].filter(Boolean).join(' ') || 'Unknown';
    }

    if (channel === 'sms' && !recipientPhone) {
      return res.status(400).json({ error: `No phone number on file for ${recipientName}` });
    }

    // Find or create conversation
    let convId = conversationId;
    if (!convId && leadId) {
      // Look for existing conversation with this lead
      const convos = await schemaQuery<{ id: string }>(
        'investor', 'conversations',
        `user_id=eq.${userId}&lead_id=eq.${leadId}&channel=eq.${channel}&status=eq.active&select=id&order=updated_at.desc&limit=1`
      );
      if (convos.length > 0) {
        convId = convos[0].id;
      } else {
        // Create new conversation
        const newConvo = await schemaInsert<{ id: string }>(
          'investor', 'conversations', {
            user_id: userId,
            lead_id: leadId,
            channel,
            status: 'active',
            unread_count: 0,
            message_count: 0,
          }
        );
        convId = newConvo.id;
      }
    }

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

    // Store message in investor.messages
    const message = await schemaInsert<{ id: string; created_at: string }>(
      'investor', 'messages', {
        conversation_id: convId,
        direction: 'outbound',
        content: body.trim(),
        content_type: 'text',
        sent_by: 'user',
        delivered_at: deliveredAt,
        failed_at: failedAt,
        failure_reason: failureReason,
        metadata: twilioSid ? { twilio_sid: twilioSid } : {},
      }
    );

    // Update conversation
    if (convId) {
      schemaUpdate('investor', 'conversations', convId, {
        last_message_at: new Date().toISOString(),
        last_message_preview: body.trim().slice(0, 100),
        message_count: undefined, // Will use raw SQL increment in future
        updated_at: new Date().toISOString(),
      }).catch((err) => console.error('[Messages] Conversation update failed:', err));
    }

    // Also store in crm.messages for the unified CRM view
    schemaInsert('crm', 'messages', {
      user_id: userId,
      lead_id: leadId || null,
      contact_id: contactId || null,
      direction: 'outbound',
      channel,
      sender_type: 'user',
      phone_from: config.twilioPhoneNumber || null,
      phone_to: recipientPhone,
      body: body.trim(),
      status: deliveredAt ? 'delivered' : (failedAt ? 'failed' : 'sent'),
    }).catch((err) => console.error('[Messages] CRM message store failed:', err));

    console.log(`[Messages] ${channel} sent to ${recipientName} (${recipientPhone}) by ${userId}`);

    res.json({
      success: !failedAt,
      message_id: message.id,
      conversation_id: convId,
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
