// The Claw — Smart Message Router
// Routes incoming SMS/WhatsApp messages to the right handler:
// 1. Known Claw user → The Claw controller
// 2. Known lead/contact → store in crm.messages, notify user
// 3. Unknown sender → create draft lead, notify user
//
// This replaces the simple phone→userId lookup in handleClawSms.

import { config } from '../config.js';
import { schemaQuery, schemaInsert } from './db.js';
import { handleClawMessage } from './controller.js';
import { broadcastMessage } from './broadcast.js';
import { callEdgeFunction } from './edge.js';
import { createDraftSuggestion } from './drafts.js';
import type { ClawChannel } from './types.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RoutingResult {
  type: 'claw_response' | 'lead_reply' | 'unknown_sender' | 'ignored';
  reply?: string;
  userId?: string;
}

interface ContactMatch {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  user_id: string | null;
  module: string;
}

interface LeadMatch {
  id: string;
  name: string;
  phone: string | null;
  user_id: string | null;
  module: string;
}

/**
 * Normalize phone number for matching (strip +1, spaces, dashes, parens)
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Strip leading '1' if US number (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

/**
 * Store a message in crm.messages for conversation history.
 */
async function storeCrmMessage(params: {
  userId: string;
  leadId?: string;
  contactId?: string;
  direction: 'inbound' | 'outbound';
  channel: string;
  senderType: string;
  phoneFrom?: string;
  phoneTo?: string;
  body: string;
  clawDraftId?: string;
}): Promise<string | null> {
  try {
    const msg = await schemaInsert<{ id: string }>('crm', 'messages', {
      user_id: params.userId,
      lead_id: params.leadId || null,
      contact_id: params.contactId || null,
      direction: params.direction,
      channel: params.channel,
      sender_type: params.senderType,
      phone_from: params.phoneFrom || null,
      phone_to: params.phoneTo || null,
      body: params.body,
      status: 'delivered',
      claw_draft_id: params.clawDraftId || null,
    });
    return msg.id;
  } catch (err) {
    console.error('[Router] Failed to store CRM message:', err);
    return null;
  }
}

/**
 * Match a phone number against CRM contacts and leads.
 */
async function matchSender(phone: string): Promise<{
  contact?: ContactMatch;
  lead?: LeadMatch;
  userId?: string;
} | null> {
  const normalized = normalizePhone(phone);
  if (!normalized || normalized.length < 7) return null;

  // Search crm.contacts by normalized phone (digits only — safe for PostgREST)
  try {
    const contacts = await schemaQuery<ContactMatch>(
      'crm',
      'contacts',
      `or=(phone.ilike.%${normalized}%)&select=id,first_name,last_name,phone,user_id,module&limit=1`
    );
    if (contacts.length > 0) {
      return { contact: contacts[0], userId: contacts[0].user_id || undefined };
    }
  } catch (err) {
    console.warn('[Router] Contact search failed:', err);
  }

  // Search crm.leads by phone field
  try {
    const leads = await schemaQuery<LeadMatch>(
      'crm',
      'leads',
      `or=(phone.ilike.%${normalized}%)&is_deleted=eq.false&select=id,name,phone,user_id,module&limit=1`
    );
    if (leads.length > 0) {
      return { lead: leads[0], userId: leads[0].user_id || undefined };
    }
  } catch (err) {
    console.warn('[Router] Lead search failed:', err);
  }

  return null;
}

/**
 * Notify user that a lead replied.
 */
async function notifyLeadReply(
  userId: string,
  senderName: string,
  preview: string,
  leadId?: string,
  contactId?: string
): Promise<void> {
  const truncatedPreview = preview.length > 100 ? preview.slice(0, 97) + '...' : preview;

  // Push notification
  callEdgeFunction('notification-push', {
    user_id: userId,
    title: `New message from ${senderName}`,
    body: truncatedPreview,
    data: {
      type: 'lead_reply',
      lead_id: leadId,
      contact_id: contactId,
    },
  }).catch((err) => console.error('[Router] Push notification failed:', err));

  // Broadcast to Discord and other channels
  broadcastMessage(userId, {
    content: `New message from ${senderName}:\n"${truncatedPreview}"`,
  }, 'sms').catch((err) => console.error('[Router] Broadcast failed:', err));
}

/**
 * Create a draft lead for an unknown sender.
 */
async function createDraftLead(
  userId: string,
  phone: string,
  messageBody: string,
  module: 'investor' | 'landlord' = 'investor'
): Promise<string | null> {
  try {
    const lead = await schemaInsert<{ id: string }>('crm', 'leads', {
      user_id: userId,
      name: `Unknown (${phone})`,
      phone,
      status: 'new',
      source: 'inbound_sms',
      module,
      auto_created: true,
      review_status: 'pending_review',
      metadata: { first_message: messageBody.slice(0, 500) },
    });
    return lead.id;
  } catch (err) {
    console.error('[Router] Failed to create draft lead:', err);
    return null;
  }
}

/**
 * Smart message router — the main entry point for all inbound SMS/WhatsApp.
 *
 * 1. Is this from a known Claw user (phone in phoneUserMap)? → handleClawMessage
 * 2. Is this from a known lead/contact? → store, notify user, optionally generate draft reply
 * 3. Unknown sender? → create draft lead, notify
 */
export async function routeInboundMessage(
  phoneFrom: string,
  phoneTo: string,
  body: string,
  channel: ClawChannel,
  messageSid?: string
): Promise<RoutingResult> {
  console.log(`[Router] Routing ${channel} from ${phoneFrom}: "${body.slice(0, 80)}"`);

  // Step 1: Check if this is a known Claw user
  const clawUserId = config.phoneUserMap[phoneFrom];
  if (clawUserId && UUID_RE.test(clawUserId)) {
    // This is the user themselves — route to The Claw controller
    const response = await handleClawMessage(clawUserId, body, channel);
    return { type: 'claw_response', reply: response.message, userId: clawUserId };
  }

  // Step 2: Check if sender is a known lead/contact
  const match = await matchSender(phoneFrom);

  if (match && match.userId) {
    const userId = match.userId;
    const senderName = match.contact
      ? [match.contact.first_name, match.contact.last_name].filter(Boolean).join(' ') || 'Unknown Contact'
      : match.lead?.name || 'Unknown';

    // Store in crm.messages
    await storeCrmMessage({
      userId,
      leadId: match.lead?.id,
      contactId: match.contact?.id,
      direction: 'inbound',
      channel,
      senderType: 'lead',
      phoneFrom,
      phoneTo,
      body,
    });

    // Notify user
    await notifyLeadReply(userId, senderName, body, match.lead?.id, match.contact?.id);

    // Generate draft reply suggestion (async, non-blocking)
    const leadId = match.lead?.id || match.contact?.id;
    if (leadId) {
      createDraftSuggestion({
        userId,
        leadId,
        contactId: match.contact?.id,
        leadName: senderName,
        leadPhone: match.contact?.phone || match.lead?.phone || phoneFrom,
        triggerType: 'lead_reply',
        conversationContext: `${senderName} just replied: "${body.slice(0, 300)}"`,
        channel,
      }).catch((err) => console.error('[Router] Draft suggestion failed:', err));
    }

    console.log(`[Router] Lead reply from ${senderName} (${phoneFrom}) stored and user notified`);
    return { type: 'lead_reply', userId };
  }

  // Step 3: Unknown sender — try to find a default user to assign to
  // For now, use the first user in phoneUserMap (single-user system)
  const defaultUserId = Object.values(config.phoneUserMap).find((id) => UUID_RE.test(id));

  if (defaultUserId) {
    // Create draft lead
    const leadId = await createDraftLead(defaultUserId, phoneFrom, body);

    // Store message
    await storeCrmMessage({
      userId: defaultUserId,
      leadId: leadId || undefined,
      direction: 'inbound',
      channel,
      senderType: 'lead',
      phoneFrom,
      phoneTo,
      body,
    });

    // Notify
    callEdgeFunction('notification-push', {
      user_id: defaultUserId,
      title: `New message from unknown number`,
      body: `${phoneFrom}: ${body.slice(0, 80)}`,
      data: { type: 'unknown_sender', phone: phoneFrom, lead_id: leadId },
    }).catch((err) => console.error('[Router] Push notification failed for unknown sender:', err));

    broadcastMessage(defaultUserId, {
      content: `New message from unknown number ${phoneFrom}:\n"${body.slice(0, 100)}"\n\nDraft lead created — review in the app.`,
    }, 'sms').catch((err) => console.error('[Router] Broadcast failed for unknown sender:', err));

    console.log(`[Router] Unknown sender ${phoneFrom} — draft lead created, user notified`);
    return { type: 'unknown_sender', userId: defaultUserId };
  }

  console.log(`[Router] Unknown sender ${phoneFrom} and no default user — ignoring`);
  return { type: 'ignored' };
}

// Re-export storeCrmMessage for use by other modules
export { storeCrmMessage };
