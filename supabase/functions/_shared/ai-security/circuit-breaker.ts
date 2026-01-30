/**
 * Circuit Breaker
 *
 * Emergency stop capability for AI systems.
 * Checks are optimized with in-memory caching.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import type { CircuitBreakerState } from "./types.ts";

// In-memory cache for circuit breaker state
// Key: scope, Value: { state, checkedAt }
const circuitBreakerCache = new Map<string, { state: CircuitBreakerState; checkedAt: Date }>();

// Cache TTL: 10 seconds for open breakers, 30 seconds for closed
const OPEN_CACHE_TTL_MS = 10 * 1000;
const CLOSED_CACHE_TTL_MS = 30 * 1000;

/**
 * Check if a circuit breaker is open
 *
 * Performance optimizations:
 * - In-memory cache with short TTL (10s open, 30s closed)
 * - Single DB call checks global > function > user hierarchy
 * - Returns immediately if cache hit
 */
export async function isCircuitBreakerOpen(
  supabase: SupabaseClient,
  functionName: string,
  userId: string | null
): Promise<CircuitBreakerState> {
  // Build cache keys
  const cacheKeys = ['global'];
  if (functionName) cacheKeys.push(`function:${functionName}`);
  if (userId) cacheKeys.push(`user:${userId}`);

  // Check cache first (in priority order)
  for (const key of cacheKeys) {
    const cached = circuitBreakerCache.get(key);
    if (cached) {
      const ttl = cached.state.isOpen ? OPEN_CACHE_TTL_MS : CLOSED_CACHE_TTL_MS;
      if (new Date().getTime() - cached.checkedAt.getTime() < ttl) {
        if (cached.state.isOpen) {
          return cached.state;
        }
      }
    }
  }

  try {
    // Call DB function to check circuit breaker (handles hierarchy)
    const { data, error } = await supabase.rpc('is_circuit_breaker_open', {
      p_function_name: functionName,
      p_user_id: userId,
    });

    if (error) {
      console.error('[CircuitBreaker] Error checking state:', error.message);
      // On error, assume closed (fail open for availability)
      return { isOpen: false, scope: null, reason: null, openedAt: null };
    }

    // Parse result
    const row = data?.[0];
    const state: CircuitBreakerState = {
      isOpen: row?.is_open || false,
      scope: row?.scope || null,
      reason: row?.reason || null,
      openedAt: row?.opened_at ? new Date(row.opened_at) : null,
    };

    // Cache the result
    if (state.scope) {
      circuitBreakerCache.set(state.scope, { state, checkedAt: new Date() });
    } else {
      // Cache all checked scopes as closed
      for (const key of cacheKeys) {
        circuitBreakerCache.set(key, {
          state: { isOpen: false, scope: key, reason: null, openedAt: null },
          checkedAt: new Date(),
        });
      }
    }

    return state;
  } catch (err) {
    console.error('[CircuitBreaker] Exception checking state:', err);
    return { isOpen: false, scope: null, reason: null, openedAt: null };
  }
}

/**
 * Trip a circuit breaker
 *
 * @param scope - 'global', 'function:name', or 'user:uuid'
 * @param reason - Why the breaker was tripped
 * @param userId - Who tripped it (for audit)
 * @param autoCloseMinutes - Auto-close after N minutes (null = manual)
 */
export async function tripCircuitBreaker(
  supabase: SupabaseClient,
  scope: string,
  reason: string,
  userId: string | null = null,
  autoCloseMinutes: number | null = null
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('trip_circuit_breaker', {
      p_scope: scope,
      p_reason: reason,
      p_user_id: userId,
      p_auto_close_minutes: autoCloseMinutes,
    });

    if (error) {
      console.error('[CircuitBreaker] Error tripping breaker:', error.message);
      return false;
    }

    // Invalidate cache
    circuitBreakerCache.delete(scope);

    console.log(`[CircuitBreaker] Tripped: ${scope} - ${reason}`);
    return true;
  } catch (err) {
    console.error('[CircuitBreaker] Exception tripping breaker:', err);
    return false;
  }
}

/**
 * Reset a circuit breaker
 */
export async function resetCircuitBreaker(
  supabase: SupabaseClient,
  scope: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('reset_circuit_breaker', {
      p_scope: scope,
    });

    if (error) {
      console.error('[CircuitBreaker] Error resetting breaker:', error.message);
      return false;
    }

    // Invalidate cache
    circuitBreakerCache.delete(scope);

    console.log(`[CircuitBreaker] Reset: ${scope}`);
    return true;
  } catch (err) {
    console.error('[CircuitBreaker] Exception resetting breaker:', err);
    return false;
  }
}

/**
 * Clear circuit breaker cache (for testing/admin)
 */
export function clearCircuitBreakerCache(): void {
  circuitBreakerCache.clear();
}

/**
 * Get circuit breaker cache stats for debugging
 */
export function getCircuitBreakerCacheStats(): {
  cachedScopes: string[];
  openBreakers: string[];
} {
  const cachedScopes: string[] = [];
  const openBreakers: string[] = [];

  for (const [key, value] of circuitBreakerCache.entries()) {
    cachedScopes.push(key);
    if (value.state.isOpen) {
      openBreakers.push(key);
    }
  }

  return { cachedScopes, openBreakers };
}
