// The Claw — Agent Execution Engine
// Generic runner: load profile → create run → call Anthropic → process tools → save results

import { config } from '../config.js';
import { TOOL_REGISTRY } from './tools.js';
import { clawQuery, clawInsert, clawUpdate } from './db.js';
import { logClaudeCost, estimateClaudeCost } from './costs.js';
import { getApiKey } from '../services/api-keys.js';
import type { AgentProfile, AgentToolCall } from './types.js';

/**
 * Load an agent profile by slug
 */
export async function getAgentProfile(slug: string): Promise<AgentProfile | null> {
  const profiles = await clawQuery<AgentProfile>(
    'agent_profiles',
    `slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&limit=1`
  );
  return profiles[0] || null;
}

/**
 * Per-tool input schemas so agents know exactly what parameters to pass
 */
const TOOL_INPUT_SCHEMAS: Record<string, { type: string; properties: Record<string, unknown>; required?: string[] }> = {
  // Read tools
  read_deals: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
      stage: { type: 'string', description: 'Filter by stage (e.g. "negotiation", "due_diligence")' },
    },
  },
  read_leads: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
      recent_days: { type: 'number', description: 'Only leads from last N days' },
      module: { type: 'string', description: "Module filter: 'investor' or 'landlord' (default: investor)" },
    },
  },
  read_bookings: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
      upcoming_only: { type: 'boolean', description: 'Only future bookings (default true)' },
    },
  },
  read_follow_ups: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
      overdue_only: { type: 'boolean', description: 'Only overdue follow-ups' },
      upcoming_days: { type: 'number', description: 'Follow-ups in next N days' },
    },
  },
  read_maintenance: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
      status: { type: 'string', description: 'Filter by status (reported, in_progress, completed)' },
    },
  },
  read_vendors: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
      category: { type: 'string', description: 'Filter by vendor category' },
    },
  },
  read_contacts_detail: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 10)' },
      search: { type: 'string', description: 'Search by name' },
      contact_id: { type: 'string', description: 'Get specific contact by UUID' },
      module: { type: 'string', description: "Module filter: 'investor' or 'landlord' (default: investor)" },
    },
  },
  read_portfolio: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
  },
  read_documents: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
      deal_id: { type: 'string', description: 'Filter by deal UUID' },
      property_id: { type: 'string', description: 'Filter by property UUID' },
    },
  },
  read_comps: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 10)' },
      property_id: { type: 'string', description: 'Filter by property UUID' },
    },
  },
  read_campaigns: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 10)' },
      status: { type: 'string', description: 'Filter by campaign status' },
    },
  },
  read_conversations: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
  },

  // Write tools
  draft_sms: {
    type: 'object',
    properties: {
      recipient_name: { type: 'string', description: 'Name of the recipient' },
      recipient_phone: { type: 'string', description: 'Phone number' },
      message: { type: 'string', description: 'The message content' },
      context: { type: 'string', description: 'Context about the conversation' },
    },
    required: ['recipient_name', 'recipient_phone', 'message'],
  },
  create_approval: {
    type: 'object',
    properties: {
      action_type: { type: 'string', description: 'Type: "send_sms", "send_whatsapp", "send_email"' },
      title: { type: 'string', description: 'Short title' },
      description: { type: 'string', description: 'Why this action is proposed' },
      draft_content: { type: 'string', description: 'Message or content to approve' },
      recipient_name: { type: 'string', description: 'Recipient name' },
      recipient_phone: { type: 'string', description: 'Recipient phone' },
      recipient_email: { type: 'string', description: 'Recipient email' },
    },
    required: ['action_type', 'title', 'draft_content'],
  },
  create_lead: {
    type: 'object',
    properties: {
      first_name: { type: 'string', description: 'First name (required)' },
      last_name: { type: 'string', description: 'Last name' },
      phone: { type: 'string', description: 'Phone number' },
      email: { type: 'string', description: 'Email address' },
      source: { type: 'string', description: 'Lead source (cold_call, referral, driving_for_dollars, etc.)' },
      status: { type: 'string', description: 'Status (new, contacted, qualified, etc.)' },
      score: { type: 'number', description: 'Lead score 0-100' },
      city: { type: 'string', description: 'City' },
      state: { type: 'string', description: 'State' },
      tags: { type: 'array', description: 'Tags like ["motivated", "inherited"]', items: { type: 'string' } },
      module: { type: 'string', description: "Module: 'investor' or 'landlord' (default: investor)" },
    },
    required: ['first_name'],
  },
  update_lead: {
    type: 'object',
    properties: {
      contact_id: { type: 'string', description: 'Contact UUID to update' },
      status: { type: 'string', description: 'New status' },
      score: { type: 'number', description: 'New score' },
      phone: { type: 'string', description: 'Updated phone' },
      email: { type: 'string', description: 'Updated email' },
      tags: { type: 'array', description: 'Updated tags', items: { type: 'string' } },
    },
    required: ['contact_id'],
  },
  update_deal_stage: {
    type: 'object',
    properties: {
      deal_id: { type: 'string', description: 'Deal UUID to update' },
      stage: { type: 'string', description: 'New stage (e.g. "due_diligence", "under_contract")' },
      next_action: { type: 'string', description: 'Next action to take' },
      next_action_due: { type: 'string', description: 'Due date (ISO format)' },
    },
    required: ['deal_id', 'stage'],
  },
  mark_followup_complete: {
    type: 'object',
    properties: {
      followup_id: { type: 'string', description: 'Follow-up UUID to mark complete' },
    },
    required: ['followup_id'],
  },
  send_whatsapp: {
    type: 'object',
    properties: {
      recipient_name: { type: 'string', description: 'Recipient name' },
      recipient_phone: { type: 'string', description: 'Phone number' },
      message: { type: 'string', description: 'Message content' },
      context: { type: 'string', description: 'Context' },
    },
    required: ['recipient_name', 'recipient_phone', 'message'],
  },
  send_email: {
    type: 'object',
    properties: {
      recipient_name: { type: 'string', description: 'Recipient name' },
      recipient_email: { type: 'string', description: 'Email address' },
      subject: { type: 'string', description: 'Email subject' },
      body: { type: 'string', description: 'Email body' },
      context: { type: 'string', description: 'Context' },
    },
    required: ['recipient_name', 'recipient_email', 'subject', 'body'],
  },
  add_note: {
    type: 'object',
    properties: {
      target_type: { type: 'string', description: 'Type: "deal", "lead", "property", or "maintenance"' },
      target_id: { type: 'string', description: 'UUID of the record' },
      note: { type: 'string', description: 'Note text to add' },
    },
    required: ['target_type', 'target_id', 'note'],
  },
  create_maintenance_request: {
    type: 'object',
    properties: {
      property_id: { type: 'string', description: 'Property UUID' },
      title: { type: 'string', description: 'Short title of the issue' },
      description: { type: 'string', description: 'Detailed description' },
      priority: { type: 'string', description: 'Priority: low, medium, high, urgent' },
      category: { type: 'string', description: 'Category: plumbing, electrical, hvac, general, etc.' },
      location: { type: 'string', description: 'Location in property (e.g. "Kitchen", "Unit 3")' },
    },
    required: ['property_id', 'title'],
  },
  read_email_timeline: {
    type: 'object',
    properties: {
      contact_id: { type: 'string', description: 'CRM contact UUID to get email history for' },
      limit: { type: 'number', description: 'Max results (default 10)' },
    },
    required: ['contact_id'],
  },
};

/**
 * Build Anthropic tool definitions from agent's tool list
 */
function buildAnthropicTools(toolNames: string[]): Array<{
  name: string;
  description: string;
  input_schema: { type: string; properties: Record<string, unknown>; required?: string[] };
}> {
  return toolNames
    .filter((name) => name in TOOL_REGISTRY)
    .map((name) => ({
      name,
      description: TOOL_REGISTRY[name as keyof typeof TOOL_REGISTRY].description,
      input_schema: TOOL_INPUT_SCHEMAS[name] || {
        type: 'object',
        properties: {},
      },
    }));
}

/**
 * Run an agent: load profile, call Claude, handle tool calls, save results
 */
export async function runAgent(options: {
  userId: string;
  taskId: string;
  agentSlug: string;
  userMessage: string;
  context?: Record<string, unknown>;
}): Promise<{
  runId: string;
  response: string;
  toolCalls: AgentToolCall[];
  inputTokens: number;
  outputTokens: number;
}> {
  const { userId, taskId, agentSlug, userMessage, context } = options;
  const startTime = Date.now();

  // Load agent profile
  const profile = await getAgentProfile(agentSlug);
  if (!profile) {
    throw new Error(`Agent profile not found: ${agentSlug}`);
  }

  // Create agent run record
  const run = await clawInsert<{ id: string }>('agent_runs', {
    user_id: userId,
    task_id: taskId,
    agent_profile_id: profile.id,
    status: 'running',
    model: profile.model,
  });

  const toolCalls: AgentToolCall[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const apiKey = await getApiKey(userId, 'anthropic');
    const client = new Anthropic({ apiKey, timeout: 30_000 });

    // Build messages — uses `any` because Anthropic SDK message types are complex
    // and we dynamically push tool_result blocks into the conversation
    const messages: any[] = [];

    // Add context if provided, with prompt injection safety delimiters
    let userContent = userMessage;
    if (context) {
      userContent = `Context:\n${JSON.stringify(context, null, 2)}\n\n<user_message>\n${userMessage}\n</user_message>`;
    } else {
      userContent = `<user_message>\n${userMessage}\n</user_message>`;
    }
    messages.push({ role: 'user', content: userContent });

    // Build tools
    const tools = buildAnthropicTools(profile.tools);

    // Call Claude (with tool use loop)
    let response = await client.messages.create({
      model: profile.model,
      max_tokens: profile.max_tokens,
      temperature: profile.temperature,
      system: [
        {
          type: 'text' as const,
          text: profile.system_prompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages,
      ...(tools.length > 0 ? { tools: tools as any } : {}),
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Tool use loop (max 5 iterations)
    let iterations = 0;
    while (response.stop_reason === 'tool_use' && iterations < 5) {
      iterations++;

      // Process tool calls
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
      const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];

      for (const block of toolUseBlocks) {
        if (block.type !== 'tool_use') continue;

        const toolName = block.name as keyof typeof TOOL_REGISTRY;
        const toolInput = block.input as Record<string, unknown> || {};

        // Inject task_id for create_approval so agents don't need to track it
        if (toolName === 'create_approval' && !toolInput.task_id) {
          toolInput.task_id = taskId;
        }

        console.log(`[Agent:${agentSlug}] Tool call: ${toolName}`, JSON.stringify(toolInput).slice(0, 200));

        let toolOutput: unknown;
        try {
          const tool = TOOL_REGISTRY[toolName];
          if (!tool) {
            toolOutput = { error: `Unknown tool: ${toolName}` };
          } else {
            toolOutput = await tool.execute(userId, toolInput);
          }
        } catch (err) {
          console.error(`[Agent:${agentSlug}] Tool error:`, err);
          // Sanitize error — don't leak schema/table names to the AI
          toolOutput = { error: 'Tool execution failed. Try a different approach.' };
        }

        toolCalls.push({
          tool: toolName as any,
          input: toolInput,
          output: toolOutput as Record<string, unknown>,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(toolOutput),
        });
      }

      // Continue conversation with tool results
      messages.push({ role: 'assistant', content: response.content as any });
      messages.push({ role: 'user', content: toolResults as any });

      response = await client.messages.create({
        model: profile.model,
        max_tokens: profile.max_tokens,
        temperature: profile.temperature,
        system: [
          {
            type: 'text' as const,
            text: profile.system_prompt,
            cache_control: { type: 'ephemeral' as const },
          },
        ],
        messages,
        ...(tools.length > 0 ? { tools: tools as any } : {}),
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;
    }

    // Extract final text response
    const textBlock = response.content.find((b) => b.type === 'text');
    const responseText = textBlock && 'text' in textBlock ? textBlock.text : 'Agent completed without response.';

    const durationMs = Date.now() - startTime;

    // Use shared cost estimator (single source of truth for token rates)
    const costCents = estimateClaudeCost(profile.model, totalInputTokens, totalOutputTokens);

    // Update agent run
    await clawUpdate('agent_runs', run.id, {
      status: 'completed',
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      cost_cents: costCents.toFixed(4),
      duration_ms: durationMs,
      tool_calls: toolCalls,
      result: { response: responseText },
      completed_at: new Date().toISOString(),
    });

    // Log cost to claw.cost_log (non-blocking)
    logClaudeCost(userId, profile.model, `agent_${agentSlug}`, totalInputTokens, totalOutputTokens)
      .catch((err) => console.error('[Agent] Cost logging failed:', err));

    return {
      runId: run.id,
      response: responseText,
      toolCalls,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    };
  } catch (error) {
    console.error(`[Agent:${agentSlug}] Run failed:`, error);

    await clawUpdate('agent_runs', run.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration_ms: Date.now() - startTime,
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
    });

    throw error;
  }
}
