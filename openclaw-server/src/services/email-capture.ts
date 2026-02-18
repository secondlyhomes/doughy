// Email Capture Service — Captures inbound emails as CRM lead interactions
// Flow: Gmail webhook → extract sender → match/create CRM contact → log touch → AI analysis
// Extends existing Gmail adapter without modifying it

import { config } from '../config.js';
import { schemaQuery, schemaInsert, schemaUpdate } from '../claw/db.js';

interface CapturedEmail {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  messageId?: string;
  threadId?: string;
}

interface CrmContact {
  id: string;
  email: string | null;
  emails: string[];
  first_name: string | null;
  last_name: string | null;
  score: number | null;
  status: string;
  user_id: string;
}

/**
 * Process an inbound email and capture it in the CRM
 * Called from the Gmail webhook handler after normal processing
 */
export async function captureInboundEmail(
  userId: string,
  email: CapturedEmail
): Promise<{
  contact_id: string;
  touch_id: string;
  is_new_contact: boolean;
  sentiment?: string;
}> {
  console.log(`[EmailCapture] Processing email from ${email.from} for user ${userId}`);

  // 1. Try to match sender to existing CRM contact
  let contact = await findContactByEmail(userId, email.from);
  let isNewContact = false;

  if (!contact) {
    // 2. Create new contact from email
    contact = await createContactFromEmail(userId, email);
    isNewContact = true;
    console.log(`[EmailCapture] Created new contact: ${contact.id} (${email.fromName || email.from})`);
  } else {
    console.log(`[EmailCapture] Matched to existing contact: ${contact.id} (${contact.first_name} ${contact.last_name})`);
  }

  // 3. Analyze email with AI (quick Haiku analysis)
  let analysis: { sentiment?: string; intent?: string; key_points?: string[]; urgency?: string } = {};
  try {
    analysis = await analyzeEmail(email);
  } catch (err) {
    console.error('[EmailCapture] AI analysis failed:', err);
  }

  // 4. Create CRM touch (interaction record)
  const touch = await schemaInsert<{ id: string }>('crm', 'touches', {
    user_id: userId,
    lead_id: contact.id,
    touch_type: 'email_inbound',
    outcome: analysis.intent || 'received',
    is_response_received: true,
    notes: `Subject: ${email.subject}\n\n${email.body.slice(0, 500)}`,
    metadata: {
      from: email.from,
      from_name: email.fromName,
      subject: email.subject,
      message_id: email.messageId,
      thread_id: email.threadId,
      body_preview: email.body.slice(0, 1000),
      ai_analysis: analysis,
      captured_at: new Date().toISOString(),
    },
  });

  // 5. Update contact's last interaction and score
  const scoreBoost = analysis.sentiment === 'positive' ? 5
    : analysis.sentiment === 'negative' ? -3
    : analysis.urgency === 'high' ? 3
    : 2;

  const newScore = Math.min(100, Math.max(0, (contact.score || 50) + scoreBoost));

  const existingMetadata = (contact as any).metadata && typeof (contact as any).metadata === 'object'
    ? (contact as any).metadata as Record<string, unknown>
    : {};

  await schemaUpdate('crm', 'contacts', contact.id, {
    score: newScore,
    status: contact.status === 'new' ? 'contacted' : contact.status,
    updated_at: new Date().toISOString(),
    metadata: {
      ...existingMetadata,
      last_email_at: new Date().toISOString(),
      last_email_sentiment: analysis.sentiment,
      email_count: ((existingMetadata.email_count as number) || 0) + 1,
    },
  });

  console.log(`[EmailCapture] Touch ${touch.id} created, contact score: ${newScore}`);

  return {
    contact_id: contact.id,
    touch_id: touch.id,
    is_new_contact: isNewContact,
    sentiment: analysis.sentiment,
  };
}

/**
 * Find a CRM contact by email address
 * Checks both the `email` field and the `emails` JSONB array
 */
async function findContactByEmail(userId: string, senderEmail: string): Promise<CrmContact | null> {
  // First try exact email match
  const byEmail = await schemaQuery<CrmContact>(
    'crm', 'contacts',
    `user_id=eq.${userId}&email=eq.${encodeURIComponent(senderEmail)}&is_deleted=eq.false&limit=1`
  );
  if (byEmail[0]) return byEmail[0];

  // Then try the emails JSONB array (contains search)
  const escapedEmail = JSON.stringify(senderEmail);
  const byEmails = await schemaQuery<CrmContact>(
    'crm', 'contacts',
    `user_id=eq.${userId}&emails=cs.[${escapedEmail}]&is_deleted=eq.false&limit=1`
  );
  if (byEmails[0]) return byEmails[0];

  return null;
}

/**
 * Create a new CRM contact from an email sender
 */
async function createContactFromEmail(userId: string, email: CapturedEmail): Promise<CrmContact> {
  // Parse name from "From" header (e.g., "John Smith <john@example.com>")
  let firstName = '';
  let lastName = '';

  if (email.fromName) {
    const parts = email.fromName.trim().split(/\s+/);
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  // If no name, use email prefix
  if (!firstName) {
    firstName = email.from.split('@')[0].replace(/[._-]/g, ' ');
  }

  const contact = await schemaInsert<CrmContact>('crm', 'contacts', {
    user_id: userId,
    module: 'investor',
    email: email.from,
    emails: [email.from],
    first_name: firstName,
    last_name: lastName,
    source: 'email',
    status: 'new',
    score: 50,
    tags: ['email-lead'],
    metadata: {
      created_from: 'email_capture',
      first_email_subject: email.subject,
      first_email_at: new Date().toISOString(),
    },
  });

  return contact;
}

/**
 * Quick AI analysis of email content using Haiku
 * Returns sentiment, intent, key points, and urgency
 */
async function analyzeEmail(email: CapturedEmail): Promise<{
  sentiment?: string;
  intent?: string;
  key_points?: string[];
  urgency?: string;
}> {
  if (!config.anthropicApiKey) return {};

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: config.anthropicApiKey, timeout: 30_000 });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: [{
      type: 'text' as const,
      text: `You analyze real estate investor emails. Given an email, respond with ONLY valid JSON:
{
  "sentiment": "positive|neutral|negative|mixed",
  "intent": "inquiry|follow_up|negotiation|complaint|information|introduction",
  "key_points": ["point1", "point2"],
  "urgency": "low|medium|high"
}
Be concise. Max 3 key points.`,
      cache_control: { type: 'ephemeral' as const },
    }],
    messages: [{
      role: 'user',
      content: `Subject: ${email.subject}\n\nBody:\n${email.body.slice(0, 1500)}`,
    }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const text = textBlock && 'text' in textBlock ? textBlock.text : '{}';

  try {
    return JSON.parse(text);
  } catch {
    console.warn('[EmailCapture] Failed to parse AI analysis response, using defaults. Raw:', text.slice(0, 200));
    return { sentiment: 'neutral', intent: 'information', key_points: [], urgency: 'low' };
  }
}

/**
 * Get the email interaction timeline for a contact
 * Used by The Claw and CallPilot for context
 */
export async function getContactEmailTimeline(
  userId: string,
  contactId: string,
  limit = 10
): Promise<Array<{
  id: string;
  touch_type: string;
  outcome: string;
  notes: string;
  metadata: Record<string, unknown>;
  created_at: string;
}>> {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId) || !UUID_RE.test(contactId)) {
    throw new Error('Invalid user or contact ID');
  }
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 10, 1), 100);

  return schemaQuery('crm', 'touches',
    `user_id=eq.${userId}&lead_id=eq.${contactId}&touch_type=in.(email_inbound,email_outbound)&select=id,touch_type,outcome,notes,metadata,created_at&order=created_at.desc&limit=${safeLimit}`
  );
}

export type { CapturedEmail };
