// The Claw — Cost Logging
// Every API call that costs money gets logged to claw.cost_log.
// Costs are in CENTS to avoid floating point issues.

import { clawInsert, clawQuery } from './db.js';

/**
 * Log a cost event to claw.cost_log.
 * Non-blocking — errors are logged but never thrown.
 */
export async function logCost(
  userId: string,
  service: string,
  action: string,
  costCents: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await clawInsert('cost_log', {
      user_id: userId,
      service,
      action,
      cost_cents: Math.round(costCents * 100) / 100, // Fractional cents allowed
      input_tokens: metadata?.input_tokens || 0,
      output_tokens: metadata?.output_tokens || 0,
      duration_seconds: metadata?.duration_seconds || 0,
      metadata: metadata || {},
    });
  } catch (err) {
    console.error(`[Costs] Failed to log cost: ${service}/${action} ${costCents}c for ${userId}:`, err);
  }
}

/**
 * Estimate cost for a Claude API call based on token counts.
 *
 * Pricing (per million tokens):
 * - Haiku 4.5: $1.00 input, $5.00 output
 * - Sonnet 4.5: $3.00 input, $15.00 output
 * - Opus 4: $15.00 input, $75.00 output
 *
 * Returns cost in cents.
 */
export function estimateClaudeCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  let inputRate: number;
  let outputRate: number;

  if (model.includes('haiku')) {
    inputRate = 1.0;
    outputRate = 5.0;
  } else if (model.includes('opus')) {
    inputRate = 15.0;
    outputRate = 75.0;
  } else {
    // Default to Sonnet pricing
    inputRate = 3.0;
    outputRate = 15.0;
  }

  // (tokens × rate_per_MTok / 1_000_000) × 100 cents/dollar
  const costCents = ((inputTokens * inputRate + outputTokens * outputRate) / 1_000_000) * 100;
  return Math.round(costCents * 100) / 100; // Rounded to hundredths of a cent, no artificial floor
}

/**
 * Log a Claude API call cost. Call this after every Anthropic API request.
 */
export async function logClaudeCost(
  userId: string,
  model: string,
  action: string,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  const costCents = estimateClaudeCost(model, inputTokens, outputTokens);
  await logCost(userId, 'anthropic', action, costCents, {
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
}

/**
 * Get total costs for a user today (in cents).
 */
export async function getTodayCosts(userId: string): Promise<{
  total_cents: number;
  by_service: Record<string, number>;
  count: number;
  error?: boolean;
}> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const rows = await clawQuery<{ service: string; cost_cents: number }>(
      'cost_log',
      `user_id=eq.${userId}&created_at=gte.${today}&select=service,cost_cents`
    );

    const byService: Record<string, number> = {};
    let total = 0;

    for (const row of rows) {
      total += row.cost_cents || 0;
      byService[row.service] = (byService[row.service] || 0) + (row.cost_cents || 0);
    }

    return { total_cents: total, by_service: byService, count: rows.length };
  } catch (err) {
    console.error('[Costs] Failed to get today costs:', err);
    return { total_cents: 0, by_service: {}, count: 0, error: true };
  }
}

/**
 * Get cost summary for the current month.
 */
export async function getMonthlyCosts(userId: string): Promise<{
  total_cents: number;
  by_service: Record<string, number>;
  error?: boolean;
}> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  try {
    const rows = await clawQuery<{ service: string; cost_cents: number }>(
      'cost_log',
      `user_id=eq.${userId}&created_at=gte.${monthStartStr}&select=service,cost_cents`
    );

    const byService: Record<string, number> = {};
    let total = 0;

    for (const row of rows) {
      total += row.cost_cents || 0;
      byService[row.service] = (byService[row.service] || 0) + (row.cost_cents || 0);
    }

    return { total_cents: total, by_service: byService };
  } catch (err) {
    console.error('[Costs] Failed to get monthly costs:', err);
    return { total_cents: 0, by_service: {}, error: true };
  }
}
