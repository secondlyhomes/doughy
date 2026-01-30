/**
 * Rate Limiter
 *
 * Cross-function rate limiting with burst protection.
 * Designed for minimal latency with optimized DB calls.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import type { RateLimitResult, RateLimitConfig } from "./types.ts";

// Default rate limits
const DEFAULT_CONFIG: RateLimitConfig = {
  globalHourlyLimit: 200,
  functionHourlyLimit: 100,
  burstLimit: 20,
};

/**
 * Check and update rate limit for a user
 *
 * Uses a single DB call that checks all limits and updates counters.
 * This is more efficient than separate read/write operations.
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  functionName: string,
  channel: string = 'api',
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const limits = { ...DEFAULT_CONFIG, ...config };

  try {
    const { data, error } = await supabase.rpc('check_cross_function_rate_limit', {
      p_user_id: userId,
      p_function_name: functionName,
      p_channel: channel,
      p_global_hourly_limit: limits.globalHourlyLimit,
      p_function_hourly_limit: limits.functionHourlyLimit,
      p_burst_limit: limits.burstLimit,
    });

    if (error) {
      console.error('[RateLimiter] Error checking rate limit:', error.message);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        limitType: 'allowed',
        currentCount: 0,
        remaining: limits.functionHourlyLimit,
      };
    }

    const row = data?.[0];
    return {
      allowed: row?.allowed ?? true,
      limitType: row?.limit_type || 'allowed',
      currentCount: row?.current_count || 0,
      remaining: row?.remaining || limits.functionHourlyLimit,
    };
  } catch (err) {
    console.error('[RateLimiter] Exception checking rate limit:', err);
    // Fail open
    return {
      allowed: true,
      limitType: 'allowed',
      currentCount: 0,
      remaining: limits.functionHourlyLimit,
    };
  }
}

/**
 * Get current rate limit status without incrementing counters
 * Used for informational purposes (e.g., admin dashboard)
 */
export async function getRateLimitStatus(
  supabase: SupabaseClient,
  userId: string,
  functionName?: string
): Promise<{
  globalCount: number;
  functionCounts: Record<string, number>;
  burstCount: number;
}> {
  try {
    const hourStart = new Date();
    hourStart.setMinutes(0, 0, 0);

    const minuteStart = new Date();
    minuteStart.setSeconds(0, 0);

    // Get all rate limit records for this user in the current hour
    const { data, error } = await supabase
      .from('ai_moltbot_rate_limits')
      .select('function_name, request_count, window_start')
      .eq('user_id', userId)
      .gte('window_start', hourStart.toISOString());

    if (error) {
      console.error('[RateLimiter] Error getting status:', error.message);
      return { globalCount: 0, functionCounts: {}, burstCount: 0 };
    }

    let globalCount = 0;
    let burstCount = 0;
    const functionCounts: Record<string, number> = {};

    for (const row of data || []) {
      const count = row.request_count || 0;
      globalCount += count;

      // Count by function
      const fn = row.function_name || 'default';
      functionCounts[fn] = (functionCounts[fn] || 0) + count;

      // Burst count (within last minute)
      if (new Date(row.window_start) >= minuteStart) {
        burstCount += count;
      }
    }

    // Filter to specific function if requested
    if (functionName) {
      return {
        globalCount,
        functionCounts: { [functionName]: functionCounts[functionName] || 0 },
        burstCount,
      };
    }

    return { globalCount, functionCounts, burstCount };
  } catch (err) {
    console.error('[RateLimiter] Exception getting status:', err);
    return { globalCount: 0, functionCounts: {}, burstCount: 0 };
  }
}

/**
 * Calculate retry-after time based on limit type
 */
export function calculateRetryAfter(limitType: string): number {
  switch (limitType) {
    case 'burst':
      return 60; // Retry after 1 minute
    case 'function_hourly':
    case 'global_hourly':
      // Calculate seconds until next hour
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return Math.ceil((nextHour.getTime() - now.getTime()) / 1000);
    default:
      return 60;
  }
}

/**
 * Format rate limit for response headers
 */
export function formatRateLimitHeaders(
  result: RateLimitResult,
  config: Partial<RateLimitConfig> = {}
): Record<string, string> {
  const limits = { ...DEFAULT_CONFIG, ...config };

  return {
    'X-RateLimit-Limit': limits.functionHourlyLimit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': new Date(
      new Date().setMinutes(0, 0, 0) + 3600000
    ).toISOString(),
  };
}
