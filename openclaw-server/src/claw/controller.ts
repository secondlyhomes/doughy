// The Claw — Master Controller
// Entry point for all Claw interactions: classify intent, route, respond

import { config } from '../config.js';
import { INTENT_CLASSIFIER_PROMPT } from './prompts.js';
import { generateBriefingData, formatBriefing } from './briefing.js';
import { runAgent } from './agents.js';
import { clawInsert, clawUpdate, clawQuery } from './db.js';
import type { ClawIntent, ClawResponse, ClawSmsInbound } from './types.js';

/**
 * Load recent conversation messages for context
 */
async function loadRecentMessages(
  userId: string,
  channel: 'sms' | 'app',
  limit = 10
): Promise<Array<{ role: string; content: string }>> {
  const messages = await clawQuery<{ role: string; content: string; created_at: string }>(
    'messages',
    `user_id=eq.${userId}&channel=eq.${channel}&select=role,content,created_at&order=created_at.desc&limit=${limit}`
  );
  // Reverse so oldest is first (DB returns newest first)
  return messages.reverse();
}

/**
 * Classify user intent using Claude Haiku (fast)
 * Includes recent conversation history for context-aware classification
 */
async function classifyIntent(
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ClawIntent> {
  if (!config.anthropicApiKey) {
    return guessIntentFromKeywords(message);
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: config.anthropicApiKey });

    // Build messages with conversation context
    let classifierInput = message;
    if (conversationHistory.length > 0) {
      const historyText = conversationHistory
        .slice(-6) // Last 3 exchanges max for the classifier
        .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
        .join('\n');
      classifierInput = `Recent conversation:\n${historyText}\n\nNew message: ${message}`;
    }

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 20,
      temperature: 0,
      system: INTENT_CLASSIFIER_PROMPT,
      messages: [{ role: 'user', content: classifierInput }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const intent = (textBlock && 'text' in textBlock ? textBlock.text : '').trim().toLowerCase() as ClawIntent;

    const validIntents: ClawIntent[] = [
      'briefing', 'draft_followups', 'check_deal', 'check_bookings',
      'new_leads', 'what_did_i_miss', 'help', 'approve', 'unknown',
    ];

    return validIntents.includes(intent) ? intent : 'unknown';
  } catch (error) {
    console.error('[Controller] Intent classification failed:', error);
    return guessIntentFromKeywords(message);
  }
}

/**
 * Fallback keyword-based intent detection
 */
function guessIntentFromKeywords(message: string): ClawIntent {
  const lower = message.toLowerCase().trim();

  if (/\b(brief(ing)?|morning|update|status|day look|what.?s (up|going|new)|hello|hey|hi)\b/.test(lower)) return 'briefing';
  if (/\b(draft|follow.?up|text.*lead|send.*follow|reach out)\b/.test(lower)) return 'draft_followups';
  if (/\b(deal|property|investment|offer)\b/.test(lower)) return 'check_deal';
  if (/\b(booking|guest|check.?in|reservation|arrival)\b/.test(lower)) return 'check_bookings';
  if (/\b(new lead|recent lead|inquir)\b/.test(lower)) return 'new_leads';
  if (/\b(miss|catch up|since|away)\b/.test(lower)) return 'what_did_i_miss';
  if (/\b(help|command|can you|what do)\b/.test(lower)) return 'help';
  if (/\b(approve|yes|send|confirm|reject|no don.?t)\b/.test(lower)) return 'approve';

  return 'unknown';
}

/**
 * Save a message to claw.messages
 */
async function saveMessage(
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  channel: 'sms' | 'app' = 'sms',
  taskId?: string
): Promise<string> {
  const msg = await clawInsert<{ id: string }>('messages', {
    user_id: userId,
    channel,
    role,
    content,
    task_id: taskId || null,
  });
  return msg.id;
}

/**
 * Create a task in claw.tasks
 */
async function createTask(
  userId: string,
  type: string,
  title: string,
  input: Record<string, unknown> = {}
): Promise<{ id: string }> {
  return clawInsert<{ id: string }>('tasks', {
    user_id: userId,
    type,
    status: 'running',
    title,
    input,
  });
}

/**
 * Main entry point: handle an incoming message from any channel
 */
export async function handleClawMessage(
  userId: string,
  message: string,
  channel: 'sms' | 'app' = 'sms'
): Promise<ClawResponse> {
  console.log(`[Controller] Message from ${userId} via ${channel}: "${message.slice(0, 100)}"`);

  // Load conversation history before saving the new message
  const conversationHistory = await loadRecentMessages(userId, channel);

  // Save inbound message
  await saveMessage(userId, 'user', message, channel);

  // Classify intent with conversation context
  const intent = await classifyIntent(message, conversationHistory);
  console.log(`[Controller] Intent: ${intent}`);

  let response: ClawResponse;

  switch (intent) {
    case 'briefing':
    case 'what_did_i_miss':
      response = await handleBriefing(userId);
      break;

    case 'draft_followups':
      response = await handleDraftFollowups(userId, message, conversationHistory);
      break;

    case 'check_deal':
      response = await handleQuery(userId, message, 'check_deal', conversationHistory);
      break;

    case 'check_bookings':
      response = await handleQuery(userId, message, 'check_bookings', conversationHistory);
      break;

    case 'new_leads':
      response = await handleQuery(userId, message, 'new_leads', conversationHistory);
      break;

    case 'help':
      response = {
        message: `Here's what I can do:\n\n` +
          `- "Brief me" — Get your morning business update\n` +
          `- "Draft follow ups" — I'll draft SMS to warm leads for your approval\n` +
          `- "Check [deal name]" — Status on a specific deal\n` +
          `- "Bookings this week" — Upcoming guest arrivals\n` +
          `- "New leads" — Recent inquiries\n` +
          `- "What did I miss" — Activity since you last checked\n\n` +
          `All drafted messages need your approval before sending.`,
      };
      break;

    case 'approve':
      response = {
        message: 'Open The Claw app to review and approve pending messages. Tap each one to approve, edit, or reject.',
      };
      break;

    default:
      response = {
        message: `I'm not sure what you need. Try "brief me" for an update, "draft follow ups" to reach out to leads, or "help" to see all commands.`,
      };
  }

  // Save outbound message
  await saveMessage(userId, 'assistant', response.message, channel, response.task_id);

  return response;
}

/**
 * Handle briefing request
 */
async function handleBriefing(userId: string): Promise<ClawResponse> {
  const task = await createTask(userId, 'briefing', 'Morning briefing');

  try {
    const data = await generateBriefingData(userId);
    const briefingText = await formatBriefing(data, config.anthropicApiKey);

    await clawUpdate('tasks', task.id, {
      status: 'done',
      output: { briefing: data },
      completed_at: new Date().toISOString(),
    });

    return { message: briefingText, task_id: task.id };
  } catch (error) {
    console.error('[Controller] Briefing failed:', error);
    await clawUpdate('tasks', task.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { message: 'Sorry, I had trouble generating your briefing. Try again in a moment.' };
  }
}

/**
 * Handle draft follow-ups request — the demo's key moment
 */
async function handleDraftFollowups(
  userId: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ClawResponse> {
  const task = await createTask(userId, 'draft_followups', 'Draft follow-up messages', { message });

  try {
    // Build conversation context for the agents
    const recentContext = conversationHistory.length > 0
      ? conversationHistory.slice(-4).map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n')
      : undefined;

    // Step 1: Lead Ops agent reads data and identifies warm leads
    const leadOpsResult = await runAgent({
      userId,
      taskId: task.id,
      agentSlug: 'lead-ops',
      userMessage: 'Find warm leads that need follow-up. Include their name, phone, last interaction, and deal context. Focus on overdue and upcoming follow-ups.',
      context: recentContext ? { recent_conversation: recentContext } : undefined,
    });

    // Step 2: Draft Specialist generates personalized messages
    const draftResult = await runAgent({
      userId,
      taskId: task.id,
      agentSlug: 'draft-specialist',
      userMessage: 'Draft personalized follow-up SMS messages for these leads. Create an approval entry for each one.',
      context: { leads_data: leadOpsResult.response },
    });

    // Count approvals created
    const approvalCount = draftResult.toolCalls.filter(
      (tc) => tc.tool === 'create_approval'
    ).length;

    await clawUpdate('tasks', task.id, {
      status: approvalCount > 0 ? 'awaiting_approval' : 'done',
      output: {
        leads_analyzed: leadOpsResult.response,
        drafts_created: approvalCount,
      },
      completed_at: new Date().toISOString(),
    });

    if (approvalCount > 0) {
      // Send push notification
      try {
        await fetch(`${config.supabaseUrl}/functions/v1/notification-push`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            title: `${approvalCount} follow-up${approvalCount > 1 ? 's' : ''} ready to review`,
            body: 'Open The Claw to approve or edit before sending.',
            data: { type: 'claw_approvals', task_id: task.id },
          }),
        });
      } catch (err) {
        console.error('[Controller] Push notification failed:', err);
      }

      return {
        message: `I've drafted ${approvalCount} follow-up message${approvalCount > 1 ? 's' : ''}. Open The Claw app to review and approve them before they're sent.`,
        task_id: task.id,
        approvals_created: approvalCount,
      };
    }

    return {
      message: draftResult.response || 'No warm leads found that need follow-up right now.',
      task_id: task.id,
    };
  } catch (error) {
    console.error('[Controller] Draft follow-ups failed:', error);
    await clawUpdate('tasks', task.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { message: 'Sorry, I had trouble analyzing your leads. Try again in a moment.' };
  }
}

/**
 * Handle data query requests (deals, bookings, leads)
 */
async function handleQuery(
  userId: string,
  message: string,
  type: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ClawResponse> {
  const task = await createTask(userId, 'query', `Query: ${type}`, { message, type });

  try {
    const recentContext = conversationHistory.length > 0
      ? conversationHistory.slice(-4).map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n')
      : undefined;

    const result = await runAgent({
      userId,
      taskId: task.id,
      agentSlug: 'lead-ops', // Reuse lead-ops for all data queries
      userMessage: message,
      context: recentContext ? { recent_conversation: recentContext } : undefined,
    });

    await clawUpdate('tasks', task.id, {
      status: 'done',
      output: { response: result.response },
      completed_at: new Date().toISOString(),
    });

    return { message: result.response, task_id: task.id };
  } catch (error) {
    console.error(`[Controller] Query ${type} failed:`, error);
    await clawUpdate('tasks', task.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { message: `Sorry, I couldn't look that up right now. Try again in a moment.` };
  }
}

/**
 * Handle incoming SMS via Twilio webhook
 */
export async function handleClawSms(inbound: ClawSmsInbound): Promise<string | null> {
  if (!config.clawEnabled) {
    console.log('[Controller] Claw disabled, ignoring SMS');
    return null;
  }

  // Look up user by phone number
  const userId = config.phoneUserMap[inbound.from];
  if (!userId) {
    console.log(`[Controller] Unknown phone number: ${inbound.from}`);
    return null;
  }

  // Validate userId is a UUID (defense against config injection)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(userId)) {
    console.error(`[Controller] Invalid userId in phone map for ${inbound.from}`);
    return null;
  }

  const response = await handleClawMessage(userId, inbound.body, 'sms');

  // No truncation here — server.ts handles SMS length limits in the TwiML response
  return response.message;
}
