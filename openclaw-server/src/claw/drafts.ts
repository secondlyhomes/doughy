// The Claw — Draft Suggestion System
// Proactively generates draft replies for leads and pushes to channels.
// Triggers: lead_reply, overdue_followup, post_call, user_request

import { config } from '../config.js';
import { clawInsert, clawUpdate, clawQuery, schemaQuery } from './db.js';
import { broadcastMessage, sendProactiveMessage } from './broadcast.js';
import { sendWhatsApp, sendSms } from './twilio.js';
import { callEdgeFunction } from './edge.js';
import { logCost } from './costs.js';
import { getTrustConfig } from './trust.js';
import { getApiKey } from '../services/api-keys.js';

interface DraftSuggestion {
  id: string;
  user_id: string;
  lead_id: string;
  contact_id?: string;
  trigger_type: string;
  draft_text: string;
  channel: string;
  status: string;
  pushed_to: string[];
}

interface LeadInfo {
  id: string;
  name: string;
  phone?: string;
  module?: string;
}

/**
 * Generate a draft reply using Claude Haiku (fast, cheap).
 */
async function generateDraftReply(
  userId: string,
  leadName: string,
  conversationContext: string,
  triggerType: string
): Promise<string | null> {
  const apiKey = await getApiKey(userId, 'anthropic');
  if (!apiKey) {
    console.warn('[Drafts] No Anthropic API key available — cannot generate drafts');
    return null;
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey, timeout: 15_000 });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      temperature: 0.7,
      system: [
        {
          type: 'text' as const,
          text: `You write short, personalized follow-up messages as a real estate investor. Write in first person as the user. Keep it under 160 characters. Sound natural and warm, not robotic. Include a call-to-action. No emojis unless the context suggests it.`,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `Write a follow-up message to ${leadName}.\n\nContext: ${conversationContext}\nTrigger: ${triggerType}\n\nRespond with ONLY the message text, nothing else.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock?.text?.trim() || null;
  } catch (err) {
    console.error('[Drafts] Failed to generate draft:', err);
    return null;
  }
}

/**
 * Create and push a draft suggestion.
 */
export async function createDraftSuggestion(params: {
  userId: string;
  leadId: string;
  contactId?: string;
  leadName: string;
  leadPhone?: string;
  triggerType: 'lead_reply' | 'overdue_followup' | 'post_call' | 'scheduled' | 'user_request';
  conversationContext: string;
  channel?: string;
}): Promise<DraftSuggestion | null> {
  const { userId, leadId, contactId, leadName, leadPhone, triggerType, conversationContext, channel } = params;
  console.log('[Drafts] createDraftSuggestion called:', { userId, leadId, contactId, triggerType });

  // Generate the draft text
  const draftText = await generateDraftReply(userId, leadName, conversationContext, triggerType);
  if (!draftText) {
    console.warn('[Drafts] No draft generated, skipping');
    return null;
  }

  // Store in claw.draft_suggestions
  try {
    const draft = await clawInsert<DraftSuggestion>('draft_suggestions', {
      user_id: userId,
      lead_id: leadId,
      contact_id: contactId || null,
      trigger_type: triggerType,
      draft_text: draftText,
      channel: channel || 'whatsapp',
      status: 'pending',
      pushed_to: [],
    });

    // Push to channels
    await pushDraftSuggestion(userId, draft, { id: leadId, name: leadName, phone: leadPhone });

    return draft;
  } catch (err) {
    console.error('[Drafts] Failed to create draft suggestion:', err);
    return null;
  }
}

/**
 * Push a draft suggestion to all configured channels.
 */
async function pushDraftSuggestion(
  userId: string,
  draft: DraftSuggestion,
  lead: LeadInfo
): Promise<void> {
  const trustConfig = await getTrustConfig(userId);
  const pushedTo: string[] = ['callpilot']; // Always available via Supabase Realtime

  const draftPreview = draft.draft_text.length > 100
    ? draft.draft_text.slice(0, 97) + '...'
    : draft.draft_text;

  // Push notification (free, always)
  callEdgeFunction('notification-push', {
    user_id: userId,
    title: `Draft for ${lead.name}`,
    body: draftPreview,
    data: { type: 'draft', draftId: draft.id, leadId: lead.id },
  }).catch((err) => console.error('[Drafts] Push notification failed:', err));

  // Discord broadcast (free, always)
  try {
    await broadcastMessage(userId, {
      content: `Draft for ${lead.name}:\n"${draft.draft_text}"\n\nApprove in the app or reply "send" here.`,
    }, 'app'); // 'app' as origin so it sends to discord + other channels
    pushedTo.push('discord');
  } catch (err) {
    console.warn('[Drafts] Broadcast failed:', err);
  }

  // WhatsApp push — only if opted in
  if (trustConfig.push_drafts_whatsapp && lead.phone) {
    // Don't send draft TO the lead — send to the USER's WhatsApp
    // This would need a user-specific WhatsApp number, which we don't have yet.
    // For now, skip WhatsApp push and rely on Discord + push notifications.
    // pushedTo.push('whatsapp');
  }

  // SMS push — only if opted in AND WhatsApp is off
  if (trustConfig.push_drafts_sms && !trustConfig.push_drafts_whatsapp) {
    // Same issue — would need user's personal SMS number, not the Twilio number.
    // Skip for now.
    // pushedTo.push('sms');
  }

  // Update draft with push destinations
  try {
    await clawUpdate('draft_suggestions', draft.id, { pushed_to: pushedTo });
  } catch (err) {
    console.warn('[Drafts] Failed to update pushed_to:', err);
  }
}

/**
 * Approve a draft suggestion (from any channel).
 * Returns the action taken.
 */
export async function approveDraft(
  userId: string,
  draftId: string,
  approvedFrom: string,
  editedText?: string
): Promise<{ sent: boolean; message: string }> {
  try {
    const drafts = await clawQuery<DraftSuggestion>(
      'draft_suggestions',
      `id=eq.${draftId}&user_id=eq.${userId}&limit=1`
    );
    if (drafts.length === 0) {
      return { sent: false, message: 'Draft not found' };
    }

    const draft = drafts[0];
    const textToSend = editedText || draft.draft_text;

    // Look up lead phone — try leads first, then contacts
    let leadPhone: string | null = null;
    let lookupFailed = false;
    try {
      const leads = await schemaQuery<{ phone: string }>('crm', 'leads', `id=eq.${draft.lead_id}&user_id=eq.${userId}&select=phone&limit=1`);
      if (leads.length > 0) leadPhone = leads[0].phone;
    } catch (err) {
      console.warn('[Drafts] Lead phone lookup failed, trying contacts:', err);
      try {
        const contacts = await schemaQuery<{ phone: string }>('crm', 'contacts', `id=eq.${draft.lead_id}&user_id=eq.${userId}&select=phone&limit=1`);
        if (contacts.length > 0) leadPhone = contacts[0].phone;
      } catch (err2) {
        console.error('[Drafts] Contact phone lookup also failed:', err2);
        lookupFailed = true;
      }
    }

    if (!leadPhone) {
      return {
        sent: false,
        message: lookupFailed
          ? 'Could not look up phone number — database may be temporarily unavailable'
          : 'No phone number found for this lead',
      };
    }

    // Send via WhatsApp (default channel)
    const result = await sendWhatsApp(leadPhone, textToSend);

    if (result.success) {
      await clawUpdate('draft_suggestions', draftId, {
        status: editedText ? 'edited_and_sent' : 'sent',
        approved_from: approvedFrom,
      });
      await logCost(draft.user_id, 'twilio', 'whatsapp_draft_send', 1);
      return { sent: true, message: 'Sent!' };
    } else {
      return { sent: false, message: `Send failed: ${result.error}` };
    }
  } catch (err) {
    console.error('[Drafts] Approve draft failed:', err);
    return { sent: false, message: 'Failed to process draft' };
  }
}

/**
 * Dismiss a draft suggestion.
 */
export async function dismissDraft(userId: string, draftId: string): Promise<void> {
  // Verify ownership before dismissing
  const drafts = await clawQuery<DraftSuggestion>(
    'draft_suggestions',
    `id=eq.${draftId}&user_id=eq.${userId}&limit=1`
  );
  if (drafts.length === 0) {
    throw new Error('Draft not found or access denied');
  }
  await clawUpdate('draft_suggestions', draftId, { status: 'dismissed' });
}

/**
 * Get pending drafts for a user.
 */
export async function getPendingDrafts(userId: string): Promise<DraftSuggestion[]> {
  try {
    return await clawQuery<DraftSuggestion>(
      'draft_suggestions',
      `user_id=eq.${userId}&status=eq.pending&order=created_at.desc&limit=20`
    );
  } catch (err) {
    console.error('[Drafts] Failed to get pending drafts:', err);
    return [];
  }
}
