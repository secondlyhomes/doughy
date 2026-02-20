// The Claw — Master Controller
// Entry point for all Claw interactions: classify intent, route, respond

import { config } from '../config.js';
import { INTENT_CLASSIFIER_PROMPT, formatHelpText } from './prompts.js';
import { generateBriefingData, formatBriefing } from './briefing.js';
import { runAgent } from './agents.js';
import { clawInsert, clawUpdate, clawQuery, schemaQuery, schemaInsert, schemaUpdate, claimApproval } from './db.js';
import { createApproval } from './tools.js';
import { broadcastMessage } from './broadcast.js';
import { sendWhatsApp } from './twilio.js';
import { callEdgeFunction } from './edge.js';
import { logClaudeCost, logCost, getTodayCosts, getMonthlyCosts } from './costs.js';
import { enforceAction, getTrustConfig, type TrustLevel } from './trust.js';
import { getApiKey } from '../services/api-keys.js';
import type { ClawIntent, ClawChannel, ClawResponse, ClawSmsInbound } from './types.js';

/**
 * Load recent conversation messages for context
 */
async function loadRecentMessages(
  userId: string,
  channel: ClawChannel,
  limit = 10
): Promise<Array<{ role: string; content: string }>> {
  try {
    const messages = await clawQuery<{ role: string; content: string; created_at: string }>(
      'messages',
      `user_id=eq.${userId}&channel=eq.${channel}&select=role,content,created_at&order=created_at.desc&limit=${limit}`
    );
    // Reverse so oldest is first (DB returns newest first)
    return messages.reverse();
  } catch (err) {
    console.warn('[Controller] Failed to load conversation history:', err);
    return [];
  }
}

/**
 * Classify user intent using Claude Haiku (fast)
 * Includes recent conversation history for context-aware classification
 */
async function classifyIntent(
  userId: string,
  message: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ClawIntent> {
  const apiKey = await getApiKey(userId, 'anthropic');
  if (!apiKey) {
    return guessIntentFromKeywords(message);
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey, timeout: 30_000 });

    // Build messages with conversation context
    let classifierInput: string;
    if (conversationHistory.length > 0) {
      const historyText = conversationHistory
        .slice(-10) // Last 5 exchanges for better context continuity
        .map((m) => `${m.role}: ${m.content.slice(0, 300)}`)
        .join('\n');
      classifierInput = `Recent conversation:\n${historyText}\n\n<user_message>\n${message}\n</user_message>`;
    } else {
      classifierInput = `<user_message>\n${message}\n</user_message>`;
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
      'help', 'approve', 'call_list', 'cost_summary', 'trust_control',
      'dispatch', 'unknown',
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

  // Trust control — check first since "pause" could match other patterns
  if (/\b(kill|turn off|pause|stop|set to (manual|guarded|autonomous|locked)|resume|unpause)\b/.test(lower)) return 'trust_control';
  // Cost summary
  if (/\b(cost|spent|spend|budget|how much.*spent|billing)\b/.test(lower)) return 'cost_summary';
  // Call list
  if (/\b(who should i call|call list|priority calls|who.?s priority)\b/.test(lower)) return 'call_list';
  // Dispatch
  if (/\b(dispatch|send.*plumber|send.*electrician|send.*contractor|send.*vendor|send.*to fix)\b/.test(lower)) return 'dispatch';
  // Standard intents
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
 * Safely mark a task as failed — never throws (safe for use inside catch blocks)
 */
async function failTask(taskId: string, error: unknown): Promise<void> {
  try {
    await clawUpdate('tasks', taskId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } catch (updateErr) {
    console.error(`[Controller] Failed to mark task ${taskId} as failed:`, updateErr);
  }
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

  // Kill switch check — if activated, respond with a brief message
  try {
    const killLogs = await clawQuery<{ action: string }>(
      'kill_switch_log',
      `user_id=eq.${userId}&select=action&action=in.(activate_global,deactivate_global)&order=created_at.desc&limit=1`
    );
    if (killLogs.length > 0 && killLogs[0].action === 'activate_global') {
      return {
        message: 'The Claw is currently paused. All agents have been disabled. Re-enable from the Control tab in the app.',
      };
    }
  } catch (err) {
    console.error('[Controller] Kill switch check failed — refusing to process:', err);
    return {
      message: 'The Claw could not verify safety status. Please try again in a moment.',
    };
  }

  // Load conversation history before saving the new message
  const conversationHistory = await loadRecentMessages(userId, channel);

  // Save inbound message (non-fatal — don't block processing if DB write fails)
  try {
    await saveMessage(userId, 'user', message, channel);
  } catch (err) {
    console.error('[Controller] Failed to save inbound message:', err);
  }

  // Classify intent with conversation context
  const intent = await classifyIntent(userId, message, conversationHistory);
  console.log(`[Controller] Intent: ${intent}`);

  let response: ClawResponse;

  try {
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

      case 'call_list':
        response = await handleCallList(userId);
        break;

      case 'cost_summary':
        response = await handleCostSummary(userId);
        break;

      case 'trust_control':
        response = await handleTrustControl(userId, message);
        break;

      case 'dispatch':
        response = await handleDispatch(userId, message, conversationHistory);
        break;

      case 'help':
        response = { message: formatHelpText() };
        break;

      default:
        // For unknown intents, try to handle as a query
        response = await handleQuery(userId, message, 'unknown', conversationHistory);
    }
  } catch (error) {
    console.error(`[Controller] Handler for "${intent}" failed:`, error);
    response = { message: 'Sorry, something went wrong. Please try again in a moment.' };
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
    const apiKey = await getApiKey(userId, 'anthropic');
    const briefingText = await formatBriefing(data, apiKey, userId);

    await clawUpdate('tasks', task.id, {
      status: 'done',
      output: { briefing: data },
      completed_at: new Date().toISOString(),
    });

    return { message: briefingText, task_id: task.id };
  } catch (error) {
    console.error('[Controller] Briefing failed:', error);
    await failTask(task.id, error);
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
      ? conversationHistory.slice(-10).map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n')
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
      // Send push notification (non-blocking, 15s timeout)
      callEdgeFunction('notification-push', {
        user_id: userId,
        title: `${approvalCount} follow-up${approvalCount > 1 ? 's' : ''} ready to review`,
        body: 'Open The Claw to approve or edit before sending.',
        data: { type: 'claw_approvals', task_id: task.id },
      }).then((result) => {
        if (!result.ok) console.error(`[Controller] Push notification failed: ${result.error}`);
      }).catch((err) => console.error('[Controller] Push notification error:', err));

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
    await failTask(task.id, error);
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
      ? conversationHistory.slice(-10).map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n')
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
    await failTask(task.id, error);
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
      ? conversationHistory.slice(-10).map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n')
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
    await failTask(task.id, error);
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
      ? conversationHistory.slice(-10).map((m) => `${m.role}: ${m.content.slice(0, 300)}`).join('\n')
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
    await failTask(task.id, error);
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
      try {
        // Atomically claim: only succeeds if still pending (prevents double-send)
        const claimed = await claimApproval<typeof approval>(approval.id, userId, {
          decided_at: now,
        });

        if (!claimed) {
          results.push(`Already handled: ${approval.recipient_name || approval.title}`);
          continue;
        }

        // Execute if it's a send action
        if (claimed.action_type === 'send_sms' && claimed.recipient_phone) {
          const sent = await executeApprovedAction(userId, claimed);
          results.push(sent
            ? `WhatsApp sent to ${claimed.recipient_name || claimed.recipient_phone}`
            : `Approved: ${claimed.recipient_name || 'Unknown'} (send failed — retry from the app)`
          );
        } else {
          results.push(`Approved: ${claimed.title}`);
        }
      } catch (err) {
        console.error(`[Controller] Approval ${approval.id} failed:`, err);
        results.push(`Failed: ${approval.recipient_name || approval.title} (try again)`);
      }
    }

    return {
      message: `Great! Done!\n${results.map((r) => `- ${r}`).join('\n')}`,
    };
  }

  // "reject" / "no" (standalone only) / "don't send" / "skip all"
  if (/\b(reject|don.?t\s*send|skip\s*all|cancel)\b/.test(lower) || /^no\.?$/i.test(lower.trim())) {
    let rejected = 0;
    for (const approval of pendingApprovals) {
      try {
        await clawUpdate('approvals', approval.id, {
          status: 'rejected',
          decided_at: now,
        });
        rejected++;
      } catch (err) {
        console.error(`[Controller] Reject approval ${approval.id} failed:`, err);
      }
    }
    return { message: `Skipped ${rejected} of ${pendingApprovals.length} pending approval${pendingApprovals.length > 1 ? 's' : ''}.` };
  }

  // "approve 1" / "just John" / "skip Maria"
  const numberMatch = lower.match(/\b(?:approve|just|only|send)\s*(?:#?\s*)?(\d+)\b/);
  if (numberMatch) {
    const index = parseInt(numberMatch[1]) - 1;
    if (index >= 0 && index < pendingApprovals.length) {
      const approval = pendingApprovals[index];
      const claimed = await claimApproval<typeof approval>(approval.id, userId, { decided_at: now });
      if (!claimed) {
        return { message: 'That approval was already handled.' };
      }
      const sent = await executeApprovedAction(userId, claimed);
      return {
        message: sent
          ? `Sent to ${claimed.recipient_name || claimed.recipient_phone}! ✅`
          : `Approved: ${claimed.title} ✅`,
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
        try {
          const claimed = await claimApproval<typeof approval>(approval.id, userId, { decided_at: now });
          if (!claimed) {
            results.push(`Already handled: ${approval.recipient_name || 'Unknown'}`);
            continue;
          }
          const sent = await executeApprovedAction(userId, claimed);
          results.push(sent
            ? `Sent to ${claimed.recipient_name}`
            : `Approved: ${claimed.recipient_name}`
          );
        } catch (err) {
          console.error(`[Controller] Approve ${approval.id} (by name) failed:`, err);
          results.push(`Failed: ${approval.recipient_name || 'Unknown'}`);
        }
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
      const skipped: string[] = [];
      for (const approval of matched) {
        try {
          await clawUpdate('approvals', approval.id, {
            status: 'rejected',
            decided_at: now,
          });
          skipped.push(approval.recipient_name || 'Unknown');
        } catch (err) {
          console.error(`[Controller] Skip ${approval.id} (by name) failed:`, err);
        }
      }
      return { message: `Skipped ${skipped.join(', ')}.` };
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
  const list = pendingApprovals.map((a, i) => {
    const content = a.draft_content || '';
    const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;
    return `${i + 1}. ${a.recipient_name || a.title}: "${preview}"`;
  }).join('\n');

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
    const result = await sendWhatsApp(approval.recipient_phone, approval.draft_content);

    if (result.success) {
      await clawUpdate('approvals', approval.id, {
        status: 'executed',
        executed_at: new Date().toISOString(),
      });
      return true;
    }

    console.error(`[Controller] WhatsApp send failed: ${result.error}`);
    return false;
  } catch (error) {
    console.error('[Controller] Execute approval failed:', error);
    return false;
  }
}

/**
 * Handle call list request — prioritized list of who to call today
 */
async function handleCallList(userId: string): Promise<ClawResponse> {
  const task = await createTask(userId, 'query', 'Prioritized call list');

  try {
    const result = await runAgent({
      userId,
      taskId: task.id,
      agentSlug: 'lead-ops',
      userMessage: 'Generate a prioritized call list for today. Look at overdue follow-ups first, then contacts with recent activity but no follow-up scheduled. Include the contact name, reason for calling, and last interaction date. Do NOT mention scores. Rank by urgency.',
    });

    await clawUpdate('tasks', task.id, {
      status: 'done',
      output: { response: result.response },
      completed_at: new Date().toISOString(),
    });

    return { message: result.response, task_id: task.id };
  } catch (error) {
    console.error('[Controller] Call list failed:', error);
    await failTask(task.id, error);
    return { message: 'Sorry, I had trouble generating your call list. Try again.' };
  }
}

/**
 * Handle cost summary request
 */
async function handleCostSummary(userId: string): Promise<ClawResponse> {
  try {
    const today = await getTodayCosts(userId);
    const monthly = await getMonthlyCosts(userId);

    const lines: string[] = ['COST SUMMARY\n'];

    // Today
    lines.push(`Today: $${(today.total_cents / 100).toFixed(2)} (${today.count} operations)`);
    if (Object.keys(today.by_service).length > 0) {
      for (const [service, cents] of Object.entries(today.by_service)) {
        lines.push(`  ${service}: $${(cents / 100).toFixed(2)}`);
      }
    }
    lines.push('');

    // This month
    lines.push(`This month: $${(monthly.total_cents / 100).toFixed(2)}`);
    if (Object.keys(monthly.by_service).length > 0) {
      for (const [service, cents] of Object.entries(monthly.by_service)) {
        lines.push(`  ${service}: $${(cents / 100).toFixed(2)}`);
      }
    }

    // Trust config limits
    const trustConfig = await getTrustConfig(userId);
    lines.push('');
    lines.push(`Daily limit: $${(trustConfig.daily_spend_limit_cents / 100).toFixed(2)}`);
    lines.push(`Daily SMS limit: ${trustConfig.daily_sms_limit}`);
    lines.push(`Daily call limit: ${trustConfig.daily_call_limit}`);

    return { message: lines.join('\n') };
  } catch (error) {
    console.error('[Controller] Cost summary failed:', error);
    return { message: 'Sorry, I had trouble pulling cost data. Try again.' };
  }
}

/**
 * Handle trust control commands (pause, kill, resume, set level)
 */
async function handleTrustControl(userId: string, message: string): Promise<ClawResponse> {
  const lower = message.toLowerCase().trim();

  // Kill / Pause
  if (/\b(kill|turn off|pause|stop)\b/.test(lower)) {
    try {
      // Activate kill switch
      await clawInsert('kill_switch_log', {
        user_id: userId,
        action: 'activate_global',
        reason: `User requested via message: "${message.slice(0, 100)}"`,
      });

      // Disable all agent profiles
      const profiles = await clawQuery<{ id: string }>('agent_profiles', `select=id`);
      for (const profile of profiles) {
        await clawUpdate('agent_profiles', profile.id, { is_active: false });
      }

      return { message: 'Done. All agents paused. Nothing will send without your explicit approval.\n\nSay "resume" to start again.' };
    } catch (error) {
      console.error('[Controller] Kill switch failed:', error);
      return { message: 'Failed to activate kill switch. Try again or use the app.' };
    }
  }

  // Resume
  if (/\b(resume|unpause|start again|turn on)\b/.test(lower)) {
    try {
      await clawInsert('kill_switch_log', {
        user_id: userId,
        action: 'deactivate_global',
        reason: `User requested via message: "${message.slice(0, 100)}"`,
      });

      const profiles = await clawQuery<{ id: string }>('agent_profiles', `select=id`);
      for (const profile of profiles) {
        await clawUpdate('agent_profiles', profile.id, { is_active: true });
      }

      return { message: 'The Claw is back online. All agents re-enabled.\n\nSay "brief me" for an update.' };
    } catch (error) {
      console.error('[Controller] Resume failed:', error);
      return { message: 'Failed to resume. Try again or use the app.' };
    }
  }

  // Set trust level
  const levelMatch = lower.match(/\bset to (manual|guarded|autonomous|locked)\b/);
  if (levelMatch) {
    const newLevel = levelMatch[1] as TrustLevel;
    try {
      // Upsert trust config
      const existing = await clawQuery<{ id: string }>('trust_config', `user_id=eq.${userId}&limit=1`);
      if (existing.length > 0) {
        await clawUpdate('trust_config', existing[0].id, {
          global_level: newLevel,
          updated_at: new Date().toISOString(),
        });
      } else {
        await clawInsert('trust_config', {
          user_id: userId,
          global_level: newLevel,
        });
      }

      const descriptions: Record<string, string> = {
        locked: 'All actions blocked. Nothing will execute.',
        manual: 'Every action requires your explicit approval before executing.',
        guarded: 'Actions are queued with a 30-second countdown. Cancel in the app or say "cancel".',
        autonomous: 'Actions execute automatically within daily limits. You\'ll get notifications.',
      };

      return { message: `Trust level set to ${newLevel.toUpperCase()}.\n\n${descriptions[newLevel]}` };
    } catch (error) {
      console.error('[Controller] Trust level change failed:', error);
      return { message: 'Failed to change trust level. Try again.' };
    }
  }

  return { message: 'I can set your trust level. Try:\n- "set to manual" — approve everything\n- "set to guarded" — 30s countdown\n- "set to autonomous" — auto-execute within limits\n- "pause" / "resume" — stop/start all actions' };
}

/**
 * Handle contractor dispatch request
 * Creates maintenance record, finds matching vendor, generates two draft approvals
 */
async function handleDispatch(
  userId: string,
  message: string,
  _conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ClawResponse> {
  const task = await createTask(userId, 'dispatch', `Dispatch: ${message.slice(0, 50)}`, { message });

  try {
    // Step 1: Use Claude Haiku to extract structured info from the message
    let parsed: {
      property_hint: string;
      issue: string;
      category: string;
      tenant_name: string | null;
      priority: string;
      location: string | null;
    };

    const dispatchApiKey = await getApiKey(userId, 'anthropic');
    if (dispatchApiKey) {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: dispatchApiKey, timeout: 15_000 });

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        temperature: 0,
        system: 'Extract maintenance dispatch info from the user message. Return ONLY valid JSON:\n{"property_hint":"address fragment or name","issue":"what is broken","category":"plumber|electrician|hvac|cleaner|handyman|locksmith|pest_control|landscaper|appliance_repair|other","tenant_name":"name or null","priority":"low|medium|high|urgent","location":"unit/room or null"}',
        messages: [{ role: 'user', content: `<user_message>\n${message}\n</user_message>` }],
      });

      const textBlock = response.content.find((b) => b.type === 'text');
      const raw = textBlock && 'text' in textBlock ? textBlock.text : '{}';
      parsed = JSON.parse(raw);
    } else {
      // Keyword fallback
      const lower = message.toLowerCase();
      parsed = {
        property_hint: '',
        issue: message,
        category: /dishwasher|sink|toilet|leak|pipe|drain|faucet/.test(lower) ? 'plumber'
          : /outlet|wire|switch|light|electric/.test(lower) ? 'electrician'
          : /ac|heat|furnace|hvac|thermostat/.test(lower) ? 'hvac'
          : /appliance|washer|dryer|fridge|oven|stove/.test(lower) ? 'appliance_repair'
          : 'handyman',
        tenant_name: null,
        priority: /urgent|emergency|flood|fire|gas/.test(lower) ? 'urgent' : 'medium',
        location: null,
      };
    }

    // Step 2: Find matching property
    const properties = await schemaQuery<{
      id: string; name: string; address: string; city: string;
    }>(
      'landlord', 'properties',
      `user_id=eq.${userId}&select=id,name,address,city&limit=20`
    );

    let matchedProperty = properties[0]; // default to first
    if (parsed.property_hint && properties.length > 1) {
      const hint = parsed.property_hint.toLowerCase();
      const found = properties.find((p) =>
        p.name?.toLowerCase().includes(hint) ||
        p.address?.toLowerCase().includes(hint) ||
        p.city?.toLowerCase().includes(hint)
      );
      if (found) matchedProperty = found;
    }

    if (!matchedProperty) {
      await failTask(task.id, 'No properties found');
      return { message: 'I couldn\'t find any properties in your portfolio. Add a property first.' };
    }

    // Step 3: Create maintenance record
    const maintenanceRecord = await schemaInsert<{ id: string }>('landlord', 'maintenance_records', {
      user_id: userId,
      property_id: matchedProperty.id,
      title: parsed.issue.slice(0, 100),
      description: `Reported via The Claw: "${message}"`,
      category: parsed.category || 'other',
      location: parsed.location || null,
      status: 'reported',
      priority: parsed.priority || 'medium',
      reported_at: new Date().toISOString(),
    });

    // Step 4: Find matching vendor by category
    const vendors = await schemaQuery<{
      id: string; name: string; company_name: string; phone: string; category: string;
    }>(
      'landlord', 'vendors',
      `user_id=eq.${userId}&is_active=eq.true&category=eq.${parsed.category}&select=id,name,company_name,phone,category&order=rating.desc.nullslast&limit=1`
    );

    const vendor = vendors[0];

    // Step 5: Create approval entries
    const approvals: string[] = [];

    if (vendor && vendor.phone) {
      // Draft message to contractor
      const contractorDraft = `Hi ${vendor.name}, I have a maintenance request at ${matchedProperty.address || matchedProperty.name}. Issue: ${parsed.issue}. ${parsed.priority === 'urgent' ? 'This is urgent. ' : ''}Can you take a look today or tomorrow? Let me know your availability.`;

      await createApproval(userId, {
        task_id: task.id,
        action_type: 'send_sms',
        title: `Dispatch ${vendor.name} to ${matchedProperty.name}`,
        description: `${parsed.category} issue: ${parsed.issue}`,
        draft_content: contractorDraft,
        recipient_name: vendor.name,
        recipient_phone: vendor.phone,
        action_payload: {
          maintenance_id: maintenanceRecord.id,
          vendor_id: vendor.id,
          property_id: matchedProperty.id,
        },
      });
      approvals.push(`dispatch to ${vendor.name}`);

      // Update maintenance record with vendor info
      await schemaUpdate('landlord', 'maintenance_records', maintenanceRecord.id, {
        vendor_id: vendor.id,
        vendor_name: vendor.company_name || vendor.name,
        vendor_phone: vendor.phone,
      });
    }

    // Draft confirmation to tenant (if name was mentioned)
    if (parsed.tenant_name) {
      // Look up tenant contact
      const contacts = await schemaQuery<{
        id: string; first_name: string; last_name: string; phone: string;
      }>(
        'crm', 'contacts',
        `user_id=eq.${userId}&module=eq.landlord&or=(first_name.ilike.*${encodeURIComponent(parsed.tenant_name)}*,last_name.ilike.*${encodeURIComponent(parsed.tenant_name)}*)&select=id,first_name,last_name,phone&limit=1`
      );

      const tenant = contacts[0];
      if (tenant && tenant.phone) {
        const tenantDraft = `Hi ${tenant.first_name}, thanks for letting me know about the ${parsed.issue}. I've contacted ${vendor ? vendor.name : 'a contractor'} and they'll be reaching out to schedule a time. I'll keep you updated.`;

        await createApproval(userId, {
          task_id: task.id,
          action_type: 'send_sms',
          title: `Confirm to ${tenant.first_name} re: ${parsed.issue}`,
          description: `Tenant confirmation for maintenance at ${matchedProperty.name}`,
          draft_content: tenantDraft,
          recipient_name: `${tenant.first_name} ${tenant.last_name || ''}`.trim(),
          recipient_phone: tenant.phone,
          action_payload: {
            maintenance_id: maintenanceRecord.id,
            property_id: matchedProperty.id,
          },
        });
        approvals.push(`confirm to ${tenant.first_name}`);
      }
    }

    await clawUpdate('tasks', task.id, {
      status: approvals.length > 0 ? 'awaiting_approval' : 'done',
      output: {
        maintenance_id: maintenanceRecord.id,
        property: matchedProperty.name,
        vendor: vendor?.name || 'none found',
        approvals_created: approvals.length,
      },
      completed_at: new Date().toISOString(),
    });

    // Build response
    const lines: string[] = [];
    lines.push(`Maintenance request created for ${matchedProperty.name || matchedProperty.address}:`);
    lines.push(`Issue: ${parsed.issue}`);
    lines.push(`Priority: ${parsed.priority}`);
    if (vendor) {
      lines.push(`Vendor: ${vendor.company_name || vendor.name} (${parsed.category})`);
    } else {
      lines.push(`No ${parsed.category} vendor found — add one in Settings.`);
    }
    if (approvals.length > 0) {
      lines.push(`\n${approvals.length} draft message${approvals.length > 1 ? 's' : ''} ready to review:`);
      approvals.forEach((a) => lines.push(`- ${a}`));
      lines.push('\nOpen The Claw app to approve before sending.');
    }

    return {
      message: lines.join('\n'),
      task_id: task.id,
      approvals_created: approvals.length,
    };
  } catch (error) {
    console.error('[Controller] Dispatch failed:', error);
    await failTask(task.id, error);
    return { message: 'Sorry, I had trouble processing that maintenance request. Try again.' };
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
