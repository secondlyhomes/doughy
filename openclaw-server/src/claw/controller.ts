// The Claw — Master Controller
// Entry point for all Claw interactions: classify intent, route, respond

import { config } from '../config.js';
import { INTENT_CLASSIFIER_PROMPT } from './prompts.js';
import { generateBriefingData, formatBriefing } from './briefing.js';
import { runAgent } from './agents.js';
import { clawInsert, clawUpdate, clawQuery } from './db.js';
import { broadcastMessage } from './broadcast.js';
import type { ClawIntent, ClawChannel, ClawResponse, ClawSmsInbound } from './types.js';

/**
 * Load recent conversation messages for context
 */
async function loadRecentMessages(
  userId: string,
  channel: ClawChannel,
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
    const client = new Anthropic({ apiKey: config.anthropicApiKey, timeout: 30_000 });

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
      system: [
        {
          type: 'text' as const,
          text: INTENT_CLASSIFIER_PROMPT,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [{ role: 'user', content: classifierInput }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const intent = (textBlock && 'text' in textBlock ? textBlock.text : '').trim().toLowerCase() as ClawIntent;

    const validIntents: ClawIntent[] = [
      'briefing', 'draft_followups', 'query', 'action', 'chat',
      'help', 'approve', 'unknown',
      // Legacy intents map to 'query'
      'check_deal', 'check_bookings', 'new_leads', 'what_did_i_miss',
    ];

    if (!validIntents.includes(intent)) return 'unknown';

    // Map legacy intents to new categories
    if (['check_deal', 'check_bookings', 'new_leads'].includes(intent)) return 'query';
    if (intent === 'what_did_i_miss') return 'briefing';

    return intent;
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

  if (/\b(brief(ing)?|morning|update|status|day look|what.?s (up|going|new)|hello|hey|hi|miss|catch up)\b/.test(lower)) return 'briefing';
  if (/\b(draft|follow.?up|text.*lead|send.*follow|reach out)\b/.test(lower)) return 'draft_followups';
  if (/\b(move|create|add|assign|schedule|new lead)\b/.test(lower)) return 'action';
  if (/\b(text|email|send.*to|whatsapp)\b/.test(lower)) return 'action';
  if (/\b(deal|property|investment|booking|guest|check.?in|lead|contact|maintenance|vendor|document|campaign|portfolio)\b/.test(lower)) return 'query';
  if (/\b(what should|how should|advice|strategy|approach|recommend)\b/.test(lower)) return 'chat';
  if (/\b(help|command|can you|what do)\b/.test(lower)) return 'help';
  if (/\b(approve|confirm|reject|no don.?t|looks good|skip\s*(all|them|\d))\b/.test(lower)) return 'approve';
  if (/^(yes|send\s*(them|all|it)|just\s+\d)$/i.test(lower.trim())) return 'approve';

  return 'unknown';
}

/**
 * Save a message to claw.messages
 */
async function saveMessage(
  userId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  channel: ClawChannel = 'sms',
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
  channel: ClawChannel = 'sms'
): Promise<ClawResponse> {
  console.log(`[Controller] Message from ${userId} via ${channel}: "${message.slice(0, 100)}"`);

  // Load conversation history before saving the new message
  const conversationHistory = await loadRecentMessages(userId, channel);

  // Save inbound message (non-fatal — don't block processing if DB write fails)
  try {
    await saveMessage(userId, 'user', message, channel);
  } catch (err) {
    console.error('[Controller] Failed to save inbound message:', err);
  }

  // Classify intent with conversation context
  const intent = await classifyIntent(message, conversationHistory);
  console.log(`[Controller] Intent: ${intent}`);

  let response: ClawResponse;

  switch (intent) {
    case 'briefing':
      response = await handleBriefing(userId);
      break;

    case 'draft_followups':
      response = await handleDraftFollowups(userId, message, conversationHistory);
      break;

    case 'query':
      response = await handleQuery(userId, message, 'query', conversationHistory);
      break;

    case 'action':
      response = await handleAction(userId, message, conversationHistory);
      break;

    case 'chat':
      response = await handleChat(userId, message, conversationHistory);
      break;

    case 'approve':
      response = await handleApproval(userId, message, conversationHistory);
      break;

    case 'help':
      response = {
        message: `Here's what I can do:\n\n` +
          `Ask me anything:\n` +
          `- "Brief me" — Morning business update\n` +
          `- "How's the Oak St deal?" — Check any deal, lead, or property\n` +
          `- "Any maintenance issues?" — Check bookings, maintenance, vendors\n` +
          `- "Draft follow ups" — I'll write personalized messages for your approval\n\n` +
          `Tell me to do things:\n` +
          `- "Move Oak St to DD" — Update deals, leads, records\n` +
          `- "Text John about the walkthrough" — Draft messages via WhatsApp\n` +
          `- "New lead: Sarah, 321 Elm, inherited" — Add new leads\n\n` +
          `Or just chat:\n` +
          `- "What should I offer on Oak St?" — Business advice\n\n` +
          `All outbound messages need your approval before sending.`,
      };
      break;

    default:
      // For unknown intents, try to handle as a query
      response = await handleQuery(userId, message, 'unknown', conversationHistory);
  }

  // Save outbound message (non-fatal — still return the response to the user)
  try {
    await saveMessage(userId, 'assistant', response.message, channel, response.task_id);
  } catch (err) {
    console.error('[Controller] Failed to save outbound message:', err);
  }

  // Broadcast to all other enabled channels (async, don't block response)
  broadcastMessage(userId, { content: response.message }, channel).catch((err) => {
    console.error('[Controller] Broadcast failed:', err);
  });

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
        const pushRes = await fetch(`${config.supabaseUrl}/functions/v1/notification-push`, {
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
        if (!pushRes.ok) {
          console.error(`[Controller] Push notification failed: ${pushRes.status}`);
        }
      } catch (err) {
        console.error('[Controller] Push notification error:', err);
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
 * Handle action requests (create lead, move deal, send message, etc.)
 */
async function handleAction(
  userId: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ClawResponse> {
  const task = await createTask(userId, 'action', `Action: ${message.slice(0, 50)}`, { message });

  try {
    const recentContext = conversationHistory.length > 0
      ? conversationHistory.slice(-4).map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n')
      : undefined;

    // Use lead-ops first for context, then action agent for execution
    // For simple actions, go straight to action agent
    const result = await runAgent({
      userId,
      taskId: task.id,
      agentSlug: 'lead-ops', // Uses data tools + write tools
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
    console.error('[Controller] Action failed:', error);
    await clawUpdate('tasks', task.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { message: 'Sorry, I couldn\'t complete that action. Try again in a moment.' };
  }
}

/**
 * Handle chat/advice requests
 */
async function handleChat(
  userId: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ClawResponse> {
  const task = await createTask(userId, 'chat', `Chat: ${message.slice(0, 50)}`, { message });

  try {
    const recentContext = conversationHistory.length > 0
      ? conversationHistory.slice(-6).map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n')
      : undefined;

    // Chat agent with read-only tools for data context
    const result = await runAgent({
      userId,
      taskId: task.id,
      agentSlug: 'lead-ops', // Uses data tools for context
      userMessage: `The user wants business advice: ${message}`,
      context: recentContext ? { recent_conversation: recentContext } : undefined,
    });

    await clawUpdate('tasks', task.id, {
      status: 'done',
      output: { response: result.response },
      completed_at: new Date().toISOString(),
    });

    return { message: result.response, task_id: task.id };
  } catch (error) {
    console.error('[Controller] Chat failed:', error);
    await clawUpdate('tasks', task.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return { message: 'Sorry, I\'m having trouble thinking through that. Try again.' };
  }
}

/**
 * Handle approval requests (natural language approve/reject/edit)
 */
async function handleApproval(
  userId: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ClawResponse> {
  const lower = message.toLowerCase().trim();

  // Check for pending approvals
  const pendingApprovals = await clawQuery<{
    id: string;
    title: string;
    draft_content: string;
    recipient_name: string | null;
    recipient_phone: string | null;
    action_type: string;
    task_id: string;
  }>('approvals', `user_id=eq.${userId}&status=eq.pending&order=created_at.asc&limit=20`);

  if (pendingApprovals.length === 0) {
    return { message: 'No pending approvals right now. Everything\'s been handled!' };
  }

  // Parse the approval command
  const now = new Date().toISOString();

  // "approve all" / "send them" / "yes" / "looks good" / "go ahead"
  if (/\b(approve\s*all|send\s*(them|all)|yes|looks?\s*good|go\s*ahead|do\s*it)\b/.test(lower)) {
    const results: string[] = [];

    for (const approval of pendingApprovals) {
      await clawUpdate('approvals', approval.id, {
        status: 'approved',
        decided_at: now,
      });

      // Execute if it's a send action
      if (approval.action_type === 'send_sms' && approval.recipient_phone) {
        const sent = await executeApprovedAction(userId, approval);
        results.push(sent
          ? `WhatsApp sent to ${approval.recipient_name || approval.recipient_phone}`
          : `Approved: ${approval.recipient_name || 'Unknown'} (send failed — retry from the app)`
        );
      } else {
        results.push(`Approved: ${approval.title}`);
      }
    }

    return {
      message: `Great! Done!\n${results.map((r) => `- ${r}`).join('\n')}`,
    };
  }

  // "reject" / "no" (standalone only) / "don't send" / "skip all"
  if (/\b(reject|don.?t\s*send|skip\s*all|cancel)\b/.test(lower) || /^no\.?$/i.test(lower.trim())) {
    for (const approval of pendingApprovals) {
      await clawUpdate('approvals', approval.id, {
        status: 'rejected',
        decided_at: now,
      });
    }
    return { message: `Skipped all ${pendingApprovals.length} pending approval${pendingApprovals.length > 1 ? 's' : ''}.` };
  }

  // "approve 1" / "just John" / "skip Maria"
  const numberMatch = lower.match(/\b(?:approve|just|only|send)\s*(?:#?\s*)?(\d+)\b/);
  if (numberMatch) {
    const index = parseInt(numberMatch[1]) - 1;
    if (index >= 0 && index < pendingApprovals.length) {
      const approval = pendingApprovals[index];
      await clawUpdate('approvals', approval.id, {
        status: 'approved',
        decided_at: now,
      });
      const sent = await executeApprovedAction(userId, approval);
      return {
        message: sent
          ? `Sent to ${approval.recipient_name || approval.recipient_phone}! ✅`
          : `Approved: ${approval.title} ✅`,
      };
    }
  }

  // "just [name]" / "skip [name]"
  const nameMatch = lower.match(/\b(?:just|only|send to)\s+(\w+)/);
  const skipMatch = lower.match(/\b(?:skip|not)\s+(\w+)/);

  if (nameMatch) {
    const name = nameMatch[1].toLowerCase();
    const matched = pendingApprovals.filter((a) =>
      a.recipient_name?.toLowerCase().includes(name)
    );
    if (matched.length > 0) {
      const results: string[] = [];
      for (const approval of matched) {
        await clawUpdate('approvals', approval.id, {
          status: 'approved',
          decided_at: now,
        });
        const sent = await executeApprovedAction(userId, approval);
        results.push(sent
          ? `Sent to ${approval.recipient_name}`
          : `Approved: ${approval.recipient_name}`
        );
      }
      return { message: `Done! ${results.join(', ')} ✅` };
    }
  }

  if (skipMatch) {
    const name = skipMatch[1].toLowerCase();
    const matched = pendingApprovals.filter((a) =>
      a.recipient_name?.toLowerCase().includes(name)
    );
    if (matched.length > 0) {
      for (const approval of matched) {
        await clawUpdate('approvals', approval.id, {
          status: 'rejected',
          decided_at: now,
        });
      }
      return { message: `Skipped ${matched.map((a) => a.recipient_name).join(', ')}.` };
    }
  }

  // "edit 1: ..." / "change 1 to ..."
  const editMatch = lower.match(/\b(?:edit|change)\s*(?:#?\s*)?(\d+)\s*[:\-]?\s*(.*)/);
  if (editMatch) {
    const index = parseInt(editMatch[1]) - 1;
    const newContent = message.slice(message.indexOf(editMatch[2]));
    if (index >= 0 && index < pendingApprovals.length && newContent.trim()) {
      const approval = pendingApprovals[index];
      await clawUpdate('approvals', approval.id, {
        draft_content: newContent.trim(),
      });
      return {
        message: `Updated draft for ${approval.recipient_name || '#' + (index + 1)}:\n"${newContent.trim()}"\n\nSay "approve ${index + 1}" to send it.`,
      };
    }
  }

  // If we can't parse the approval command, list them
  const list = pendingApprovals.map((a, i) =>
    `${i + 1}. ${a.recipient_name || a.title}: "${a.draft_content.slice(0, 80)}..."`
  ).join('\n');

  return {
    message: `You have ${pendingApprovals.length} pending:\n${list}\n\nSay "approve all", "approve 1", "just [name]", "skip [name]", or "edit 1: new text"`,
  };
}

/**
 * Execute an approved action (send WhatsApp/SMS)
 */
async function executeApprovedAction(
  userId: string,
  approval: { id: string; action_type: string; draft_content: string; recipient_phone: string | null }
): Promise<boolean> {
  if (approval.action_type !== 'send_sms' || !approval.recipient_phone) return false;

  try {
    // Default to WhatsApp (cheaper)
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`;
    const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString('base64');

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 10_000);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: config.twilioWhatsAppNumber,
        To: `whatsapp:${approval.recipient_phone}`,
        Body: approval.draft_content,
      }).toString(),
      signal: abortController.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      await clawUpdate('approvals', approval.id, {
        status: 'executed',
        executed_at: new Date().toISOString(),
      });
      return true;
    }

    console.error('[Controller] WhatsApp send failed:', await response.text().catch(() => ''));
    return false;
  } catch (error) {
    console.error('[Controller] Execute approval failed:', error);
    return false;
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
