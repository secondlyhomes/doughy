// CallPilot — AI Engines
// Pre-call briefing (Sonnet), Live coaching (Haiku), Post-call summary (Sonnet)

import { config } from '../config.js';
import { schemaQuery } from '../claw/db.js';
import { cpQuery, cpInsert, cpUpdate } from './db.js';

// ============================================================================
// Pre-Call Briefing Engine (Sonnet — generates rich briefing from lead context)
// ============================================================================

export async function generatePreCallBriefing(userId: string, params: {
  call_id: string;
  lead_id?: string;
  contact_id?: string;
  deal_id?: string;
}): Promise<Record<string, unknown>> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  console.log('[CallPilot] Generating pre-call briefing...');

  // Gather context from multiple schemas
  const context: Record<string, unknown> = {};

  // Lead/contact info
  if (params.contact_id || params.lead_id) {
    const contactId = params.contact_id || params.lead_id;
    const contacts = await schemaQuery<Record<string, unknown>>(
      'crm', 'contacts',
      `id=eq.${contactId}&select=*&limit=1`
    );
    if (contacts[0]) context.contact = contacts[0];
  }

  // Deal info
  if (params.deal_id) {
    try {
      const deals = await schemaQuery<Record<string, unknown>>(
        'investor', 'deals_pipeline',
        `id=eq.${params.deal_id}&select=*&limit=1`
      );
      if (deals[0]) context.deal = deals[0];
    } catch {
      // Non-critical: briefing works without deal context
    }
  }

  // Follow-up history
  if (params.contact_id || params.lead_id) {
    const contactId = params.contact_id || params.lead_id;
    try {
      const followUps = await schemaQuery<Record<string, unknown>>(
        'investor', 'follow_ups',
        `contact_id=eq.${contactId}&select=*&order=scheduled_at.desc&limit=5`
      );
      context.recent_follow_ups = followUps;
    } catch {
      // Non-critical: briefing works without follow-up history
      context.recent_follow_ups = [];
    }
  }

  // User's script templates — filter by module if contact has one
  const rawModule = (context.contact as any)?.module;
  const contactModule = (rawModule === 'investor' || rawModule === 'landlord') ? rawModule : 'investor';
  const templates = await cpQuery<Record<string, unknown>>(
    'script_templates',
    `user_id=eq.${userId}&is_default=eq.true&module=eq.${contactModule}&limit=1`
  );
  if (templates[0]) context.default_script = templates[0];

  // User profile for buying criteria
  const profiles = await cpQuery<Record<string, unknown>>(
    'user_profiles',
    `user_id=eq.${userId}&limit=1`
  );
  if (profiles[0]) context.user_profile = profiles[0];

  // Call Claude Sonnet to generate briefing
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: config.anthropicApiKey, timeout: 30_000 });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: [{
      type: 'text' as const,
      text: PRE_CALL_BRIEFING_PROMPT,
      cache_control: { type: 'ephemeral' as const },
    }],
    messages: [{
      role: 'user',
      content: `Generate a pre-call briefing based on this context:\n${JSON.stringify(context, null, 2)}`,
    }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const briefingText = textBlock && 'text' in textBlock ? textBlock.text : '{}';

  let briefingContent: Record<string, unknown>;
  try {
    briefingContent = JSON.parse(briefingText);
  } catch {
    briefingContent = {
      lead_name: (context.contact as any)?.first_name || 'Unknown',
      talking_points: ['Unable to generate briefing — use general approach'],
    };
  }

  // Save to database
  const saved = await cpInsert<{ id: string }>('pre_call_briefings', {
    call_id: params.call_id,
    user_id: userId,
    lead_id: params.lead_id || params.contact_id,
    briefing_content: briefingContent,
  });

  return { ...saved, briefing_content: briefingContent };
}

// ============================================================================
// Live Coaching Engine (Haiku — fast cards every ~25 seconds)
// ============================================================================

export async function generateCoachingCard(userId: string, callId: string, params: {
  elapsed_seconds: number;
  phase: string;
  recent_transcript?: string;
  questions_asked?: string[];
  call_context?: Record<string, unknown>;
}): Promise<Record<string, unknown> | null> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  console.log(`[CallPilot] Generating coaching card at ${params.elapsed_seconds}s...`);

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: config.anthropicApiKey, timeout: 30_000 });

  // Load the pre-call briefing for context
  const briefings = await cpQuery<{ briefing_content: Record<string, unknown> }>(
    'pre_call_briefings',
    `call_id=eq.${callId}&limit=1`
  );

  // Load existing cards to avoid repetition
  const existingCards = await cpQuery<{ card_type: string; content: string }>(
    'coaching_cards',
    `call_id=eq.${callId}&was_dismissed=eq.false&select=card_type,content&order=created_at.desc&limit=5`
  );

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: [{
      type: 'text' as const,
      text: COACHING_CARD_PROMPT,
      cache_control: { type: 'ephemeral' as const },
    }],
    messages: [{
      role: 'user',
      content: JSON.stringify({
        elapsed_seconds: params.elapsed_seconds,
        phase: params.phase,
        briefing: briefings[0]?.briefing_content || {},
        recent_cards: existingCards.map((c) => c.content).slice(0, 3),
        call_context: params.call_context,
      }),
    }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const cardText = textBlock && 'text' in textBlock ? textBlock.text : null;

  if (!cardText || cardText.trim() === 'null' || cardText.trim() === 'SKIP') {
    return null; // No card needed right now
  }

  let cardData: { card_type?: string; content?: string; priority?: string; context?: string };
  try {
    cardData = JSON.parse(cardText);
  } catch {
    cardData = { card_type: 'suggestion', content: cardText, priority: 'normal' };
  }

  if (!cardData.content) return null;

  const saved = await cpInsert<{ id: string }>('coaching_cards', {
    call_id: callId,
    card_type: cardData.card_type || 'suggestion',
    content: cardData.content,
    priority: cardData.priority || 'normal',
    phase: params.phase,
    context: cardData.context,
    timestamp_ms: params.elapsed_seconds * 1000,
  });

  return { ...saved, ...cardData };
}

// ============================================================================
// Post-Call Summary Engine (Sonnet — comprehensive analysis)
// ============================================================================

export async function generatePostCallSummary(userId: string, callId: string): Promise<{
  summary: Record<string, unknown>;
  action_items: Record<string, unknown>[];
}> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  console.log('[CallPilot] Generating post-call summary...');

  // Gather all call data
  const [calls, briefings, cards, questions, transcripts] = await Promise.all([
    cpQuery<Record<string, unknown>>('calls', `id=eq.${callId}&limit=1`),
    cpQuery<Record<string, unknown>>('pre_call_briefings', `call_id=eq.${callId}&limit=1`),
    cpQuery<Record<string, unknown>>('coaching_cards', `call_id=eq.${callId}&order=created_at.asc`),
    cpQuery<Record<string, unknown>>('question_tracking', `call_id=eq.${callId}&order=display_order.asc`),
    cpQuery<Record<string, unknown>>('transcript_chunks', `call_id=eq.${callId}&order=timestamp_ms.asc`),
  ]);

  const call = calls[0];
  if (!call) throw new Error('Call not found');

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: config.anthropicApiKey, timeout: 30_000 });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2048,
    system: [{
      type: 'text' as const,
      text: POST_CALL_SUMMARY_PROMPT,
      cache_control: { type: 'ephemeral' as const },
    }],
    messages: [{
      role: 'user',
      content: JSON.stringify({
        call,
        briefing: briefings[0],
        coaching_cards: cards,
        questions,
        transcript_chunks: transcripts,
      }),
    }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const summaryText = textBlock && 'text' in textBlock ? textBlock.text : '{}';

  let parsed: { summary?: string; sentiment?: string; key_points?: string[]; lead_temperature?: string; closing_recommendation?: string; unanswered_questions?: string[]; action_items?: Array<{ description: string; category?: string; due_date?: string }> };
  try {
    parsed = JSON.parse(summaryText);
  } catch {
    parsed = { summary: summaryText, sentiment: 'neutral', key_points: [], action_items: [] };
  }

  // Save summary
  const savedSummary = await cpInsert<{ id: string }>('call_summaries', {
    call_id: callId,
    user_id: userId,
    summary: parsed.summary,
    sentiment: parsed.sentiment,
    key_points: parsed.key_points || [],
    lead_temperature: parsed.lead_temperature,
    closing_recommendation: parsed.closing_recommendation,
    unanswered_questions: parsed.unanswered_questions || [],
  });

  // Save action items
  const actionItems: Record<string, unknown>[] = [];
  for (const item of (parsed.action_items || [])) {
    const saved = await cpInsert<{ id: string }>('action_items', {
      call_id: callId,
      user_id: userId,
      description: item.description,
      category: item.category,
      due_date: item.due_date,
    });
    actionItems.push({ ...saved, ...item });
  }

  // Update call status
  await cpUpdate('calls', callId, {
    status: 'completed',
    ended_at: new Date().toISOString(),
  });

  return { summary: { ...savedSummary, ...parsed }, action_items: actionItems };
}

// ============================================================================
// Prompts
// ============================================================================

const PRE_CALL_BRIEFING_PROMPT = `You generate pre-call briefings for real estate investors about to call leads.

Given context about the lead, deal, and follow-up history, produce a JSON briefing with these fields:
{
  "lead_name": "Full name",
  "lead_score": 85,
  "property_address": "123 Main St",
  "last_interaction": "Called 3 days ago, interested but hesitant",
  "deal_context": "2-sentence deal summary",
  "opening_script": "Natural conversational opener",
  "talking_points": ["Point 1", "Point 2", "Point 3"],
  "questions_to_ask": ["Question 1", "Question 2"],
  "warnings": ["Watch out for X"]
}

Rules:
- Opening script should sound natural, NOT robotic
- Reference specific details (property, dates, previous conversations)
- Talking points should be actionable and specific
- Questions should uncover motivation, timeline, and price expectations
- Warnings should flag potential objections or red flags
- If data is sparse, still provide a useful briefing with general guidance
- Respond ONLY with valid JSON, no other text`;

const COACHING_CARD_PROMPT = `You generate live coaching cards during real estate investor phone calls.

Given the call context (elapsed time, phase, briefing), produce a SINGLE coaching card as JSON:
{
  "card_type": "suggestion|question|warning|objection_handler|closing",
  "content": "Short, actionable coaching tip (max 2 sentences)",
  "priority": "low|normal|high|urgent",
  "context": "Brief reason why this tip is relevant now"
}

Rules:
- Cards must be SHORT — the user is on a live call
- Never repeat a card that was already shown (check recent_cards)
- Phase-aware: opening (0-60s), rapport (60-180s), discovery (180-360s), negotiation (360-600s), closing (600s+)
- Respond with "SKIP" if no card is needed (don't flood the user)
- At most 1 card per request
- Focus on what to SAY or ASK next, not analysis
- Respond ONLY with valid JSON or "SKIP"`;

const POST_CALL_SUMMARY_PROMPT = `You analyze completed real estate investor phone calls and produce comprehensive summaries.

Given the call data (briefing, coaching cards, questions, transcript), produce JSON:
{
  "summary": "2-3 sentence call summary",
  "sentiment": "positive|neutral|negative|mixed",
  "key_points": ["Key point 1", "Key point 2"],
  "lead_temperature": "hot|warm|cold|dead",
  "closing_recommendation": "What to do next",
  "unanswered_questions": ["Question that wasn't answered"],
  "action_items": [
    {
      "description": "What needs to be done",
      "category": "follow_up|document|research|offer|other",
      "due_date": "2026-02-20"
    }
  ]
}

Rules:
- Be specific and actionable
- Lead temperature should reflect actual conversation signals
- Action items should have realistic due dates (within 7 days usually)
- If transcript is unavailable, infer from coaching cards and questions
- Respond ONLY with valid JSON`;
