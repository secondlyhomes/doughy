// The Claw — Agent Execution Engine
// Generic runner: load profile → create run → call Anthropic → process tools → save results

import { config } from '../config.js';
import { TOOL_REGISTRY } from './tools.js';
import { clawQuery, clawInsert, clawUpdate } from './db.js';
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
  read_deals: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max number of deals to return (default 20)' },
      stage: { type: 'string', description: 'Filter by deal stage (e.g. "negotiation", "due_diligence")' },
    },
  },
  read_leads: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max number of leads to return (default 20)' },
      min_score: { type: 'number', description: 'Minimum lead score filter' },
      recent_days: { type: 'number', description: 'Only leads created in the last N days' },
    },
  },
  read_bookings: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max number of bookings to return (default 20)' },
      upcoming_only: { type: 'boolean', description: 'Only return future bookings (default true)' },
    },
  },
  read_follow_ups: {
    type: 'object',
    properties: {
      limit: { type: 'number', description: 'Max number of follow-ups to return (default 20)' },
      overdue_only: { type: 'boolean', description: 'Only return overdue follow-ups' },
      upcoming_days: { type: 'number', description: 'Return follow-ups in the next N days' },
    },
  },
  draft_sms: {
    type: 'object',
    properties: {
      recipient_name: { type: 'string', description: 'Name of the recipient' },
      recipient_phone: { type: 'string', description: 'Phone number of the recipient' },
      message: { type: 'string', description: 'The SMS message content to draft' },
      context: { type: 'string', description: 'Context about the conversation or deal' },
    },
    required: ['recipient_name', 'recipient_phone', 'message'],
  },
  create_approval: {
    type: 'object',
    properties: {
      action_type: { type: 'string', description: 'Type of action (e.g. "send_sms")' },
      title: { type: 'string', description: 'Short title for the approval' },
      description: { type: 'string', description: 'Why this action is being proposed' },
      draft_content: { type: 'string', description: 'The message or content to approve' },
      recipient_name: { type: 'string', description: 'Name of the recipient' },
      recipient_phone: { type: 'string', description: 'Phone number of the recipient' },
      recipient_email: { type: 'string', description: 'Email of the recipient' },
    },
    required: ['action_type', 'title', 'draft_content'],
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
    const client = new Anthropic({ apiKey: config.anthropicApiKey });

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

    // Estimate cost (Sonnet: $3/$15 per MTok, Haiku: $0.80/$4 per MTok)
    // Rates are per-token, so divide by 1M (rates are $/token already in dollars)
    const isHaiku = profile.model.includes('haiku');
    const inputRate = isHaiku ? 0.80 : 3.0;   // $ per million tokens
    const outputRate = isHaiku ? 4.0 : 15.0;   // $ per million tokens
    const costCents = ((totalInputTokens * inputRate + totalOutputTokens * outputRate) / 1_000_000) * 100;

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
