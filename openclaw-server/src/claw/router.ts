// The Claw — Smart Message Router
// Routes incoming SMS/WhatsApp messages to the right handler:
// 1. Known Claw user → The Claw controller
// 2. Known lead/contact → store in crm.messages, notify user
// 3. Unknown sender → create draft lead, notify user
//
// This replaces the simple phone→userId lookup in handleClawSms.

import { config } from '../config.js';
import { schemaQuery, schemaInsert, rpcCall } from './db.js';
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
    const result = await rpcCall('insert_crm_outbound_message', {
      p_user_id: params.userId,
      p_lead_id: params.leadId || null,
      p_contact_id: params.contactId || null,
      p_direction: params.direction,
      p_channel: params.channel,
      p_sender_type: params.senderType,
      p_phone_from: params.phoneFrom || null,
      p_phone_to: params.phoneTo || null,
      p_body: params.body,
      p_status: 'delivered',
    });
    const msg = (Array.isArray(result) ? result[0] : result) as { id: string };
    return msg.id;
  } catch (err) {
    console.error('[Router] Failed to store CRM message:', err);
    return null;
  }
}

/**
 * Store a message in schema-specific conversation/message tables for Doughy inbox.
 * Determines schema from contactId (landlord) or leadId (investor).
 * Non-blocking — errors are logged but don't propagate.
 */
async function storeSchemaMessage(params: {
  userId: string;
  leadId?: string;
  contactId?: string;
  direction: 'inbound' | 'outbound';
  channel: string;
  senderType: string;
  body: string;
}): Promise<void> {
  const { userId, leadId, contactId, direction, channel, body } = params;

  // Determine schema + entity key
  let schema: 'investor' | 'landlord';
  let entityKey: 'lead_id' | 'contact_id';
  let entityId: string;
  let sentBy: string;

  if (contactId) {
    schema = 'landlord';
    entityKey = 'contact_id';
    entityId = contactId;
    sentBy = params.senderType === 'lead' || params.senderType === 'contact' ? 'contact' : params.senderType;
  } else if (leadId) {
    schema = 'investor';
    entityKey = 'lead_id';
    entityId = leadId;
    sentBy = params.senderType === 'contact' ? 'lead' : params.senderType;
  } else {
    return; // No entity to link — skip
  }

  // Normalize channel to match schema enum
  const validChannels: Record<string, Record<string, string>> = {
    investor: { sms: 'sms', email: 'email', whatsapp: 'whatsapp', phone: 'phone' },
    landlord: { sms: 'sms', email: 'email', whatsapp: 'whatsapp', phone: 'phone', telegram: 'telegram', imessage: 'imessage', discord: 'discord', webchat: 'webchat' },
  };
  const normalizedChannel = validChannels[schema][channel] || 'sms';

  try {
    // Find existing conversation for this entity + channel
    const conversations = await schemaQuery<{ id: string }>(
      schema,
      'conversations',
      `user_id=eq.${userId}&${entityKey}=eq.${entityId}&channel=eq.${normalizedChannel}&select=id&limit=1`
    );

    let conversationId: string;

    if (conversations.length > 0) {
      conversationId = conversations[0].id;
    } else {
      // Create new conversation
      const conv = await schemaInsert<{ id: string }>(schema, 'conversations', {
        user_id: userId,
        [entityKey]: entityId,
        channel: normalizedChannel,
        status: 'active',
        message_count: 0,
      });
      conversationId = conv.id;
    }

    // Insert message (triggers auto-update last_message_at, last_message_preview, unread_count)
    await schemaInsert(schema, 'messages', {
      conversation_id: conversationId,
      direction,
      content: body,
      content_type: 'text',
      sent_by: sentBy,
    });

    console.log(`[Router] Schema message stored: ${schema}.messages (conversation ${conversationId})`);
  } catch (err) {
    // Non-blocking — log and continue
    console.error(`[Router] Failed to store schema message (${schema}):`, err);
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
      `or=(phone.ilike.*${normalized}*)&select=id,first_name,last_name,phone,user_id,module&limit=1`
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
      `or=(phone.ilike.*${normalized}*)&is_deleted=eq.false&select=id,name,phone,user_id,module&limit=1`
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
 * Demo prefix routing — strips LEAD:/TENANT:/VENDOR: prefixes from messages.
 * In the demo, multiple personas text from the same phone number, so we use
 * prefixes to differentiate. In production these would be different numbers.
 */
type DemoPersona = 'lead' | 'tenant' | 'vendor' | null;

function extractDemoPrefix(body: string): { persona: DemoPersona; cleanBody: string } {
  const prefixMap: Array<{ prefix: string; persona: DemoPersona }> = [
    { prefix: 'LEAD:', persona: 'lead' },
    { prefix: 'TENANT:', persona: 'tenant' },
    { prefix: 'VENDOR:', persona: 'vendor' },
  ];

  for (const { prefix, persona } of prefixMap) {
    if (body.toUpperCase().startsWith(prefix)) {
      return { persona, cleanBody: body.slice(prefix.length).trim() };
    }
  }

  return { persona: null, cleanBody: body };
}

/**
 * Smart message router — the main entry point for all inbound SMS/WhatsApp.
 *
 * 0. Check for demo prefixes (LEAD:/TENANT:/VENDOR:) — route as that persona
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

  // Step 0: Check for demo prefixes (LEAD: / TENANT: / VENDOR:)
  const { persona, cleanBody } = extractDemoPrefix(body);

  if (persona) {
    console.log(`[Router] Demo prefix detected: ${persona.toUpperCase()}`);
    // Find the default Claw user (owner of this system)
    const ownerId = Object.values(config.phoneUserMap).find((id) => UUID_RE.test(id));

    if (ownerId) {
      // Try to match against existing CRM data by phone
      const senderMatch = await matchSender(phoneFrom);

      // Store in crm.messages as an inbound message from the persona
      await storeCrmMessage({
        userId: ownerId,
        leadId: senderMatch?.lead?.id,
        contactId: senderMatch?.contact?.id,
        direction: 'inbound',
        channel,
        senderType: 'lead',
        phoneFrom,
        phoneTo,
        body: cleanBody,
      });

      // Dual-write to schema-specific tables for Doughy inbox (non-blocking)
      storeSchemaMessage({
        userId: ownerId,
        leadId: senderMatch?.lead?.id,
        contactId: senderMatch?.contact?.id,
        direction: 'inbound',
        channel,
        senderType: 'lead',
        body: cleanBody,
      }).catch((err) => console.error('[Router] Schema message failed:', err));

      const senderName = senderMatch?.contact
        ? [senderMatch.contact.first_name, senderMatch.contact.last_name].filter(Boolean).join(' ')
        : senderMatch?.lead?.name || `Unknown ${persona}`;

      // Notify user
      await notifyLeadReply(
        ownerId,
        `[${persona.toUpperCase()}] ${senderName}`,
        cleanBody,
        senderMatch?.lead?.id,
        senderMatch?.contact?.id
      );

      // Generate draft reply suggestion
      const targetId = senderMatch?.lead?.id || senderMatch?.contact?.id;
      if (targetId) {
        createDraftSuggestion({
          userId: ownerId,
          leadId: targetId,
          contactId: senderMatch?.contact?.id,
          leadName: senderName,
          leadPhone: phoneFrom,
          triggerType: 'lead_reply',
          conversationContext: `[Demo ${persona}] ${senderName} said: "${cleanBody.slice(0, 300)}"`,
          channel,
        }).catch((err) => console.error('[Router] Draft suggestion failed:', err));
      }

      return { type: 'lead_reply', userId: ownerId };
    }
  }

  // Step 1: Check if this is a known Claw user (no prefix = owner command)
  const clawUserId = config.phoneUserMap[phoneFrom];
  if (clawUserId && UUID_RE.test(clawUserId)) {
    // Dual-write to crm.messages so CallPilot can see the message
    const senderMatch = await matchSender(phoneFrom);
    if (senderMatch) {
      storeCrmMessage({
        userId: clawUserId,
        leadId: senderMatch.lead?.id,
        contactId: senderMatch.contact?.id,
        direction: 'inbound',
        channel,
        senderType: 'lead',
        phoneFrom,
        phoneTo,
        body: cleanBody,
      }).catch(err => console.error('[Router] CRM dual-write failed:', err));
    }

    // Route to The Claw controller
    const response = await handleClawMessage(clawUserId, cleanBody, channel);
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

    // Dual-write to schema-specific tables for Doughy inbox (non-blocking)
    storeSchemaMessage({
      userId,
      leadId: match.lead?.id,
      contactId: match.contact?.id,
      direction: 'inbound',
      channel,
      senderType: 'lead',
      body,
    }).catch((err) => console.error('[Router] Schema message failed:', err));

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

    // Dual-write to schema-specific tables for Doughy inbox (non-blocking)
    if (leadId) {
      storeSchemaMessage({
        userId: defaultUserId,
        leadId,
        direction: 'inbound',
        channel,
        senderType: 'lead',
        body,
      }).catch((err) => console.error('[Router] Schema message failed:', err));
    }

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
