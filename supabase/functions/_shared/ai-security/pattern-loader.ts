/**
 * Pattern Loader
 *
 * Loads security patterns from database with in-memory caching.
 * Designed for minimal performance impact with lazy loading.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import type { SecurityPattern, PatternCache } from "./types.ts";

// In-memory cache - shared across requests in the same Deno isolate
let patternCache: PatternCache | null = null;

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
  if (!patternCache) return false;
  return new Date() < patternCache.expiresAt;
}

/**
 * Load patterns from database or return cached patterns
 *
 * Performance optimizations:
 * - Returns cached patterns if still valid (no DB call)
 * - Loads asynchronously in background if cache is stale
 * - Falls back to empty array on error (doesn't block)
 */
export async function loadSecurityPatterns(
  supabase: SupabaseClient
): Promise<SecurityPattern[]> {
  // Fast path: return cached patterns
  if (isCacheValid() && patternCache) {
    return patternCache.patterns;
  }

  try {
    // Load patterns from database using RPC function
    const { data, error } = await supabase.rpc('get_active_security_patterns');

    if (error) {
      console.error('[PatternLoader] Error loading patterns:', error.message);
      // Return stale cache if available, otherwise empty
      return patternCache?.patterns || [];
    }

    // Transform to typed patterns
    const patterns: SecurityPattern[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      pattern: row.pattern as string,
      patternType: row.pattern_type as string,
      severity: row.severity as SecurityPattern['severity'],
      description: row.description as string | null,
      appliesToChannels: row.applies_to_channels as string[] | null,
      hitCount: row.hit_count as number,
    }));

    // Update cache
    const now = new Date();
    patternCache = {
      patterns,
      loadedAt: now,
      expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
    };

    return patterns;
  } catch (err) {
    console.error('[PatternLoader] Exception loading patterns:', err);
    return patternCache?.patterns || [];
  }
}

/**
 * Compile patterns to RegExp for efficient matching
 * This is called once per pattern load, not per request
 */
export function compilePatterns(
  patterns: SecurityPattern[]
): Array<{ regex: RegExp; pattern: SecurityPattern }> {
  const compiled: Array<{ regex: RegExp; pattern: SecurityPattern }> = [];

  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern.pattern, 'i');
      compiled.push({ regex, pattern });
    } catch (err) {
      console.error(`[PatternLoader] Invalid pattern regex: ${pattern.pattern}`, err);
    }
  }

  return compiled;
}

// Compiled patterns cache
let compiledPatternsCache: Array<{ regex: RegExp; pattern: SecurityPattern }> | null = null;
let compiledPatternsCacheKey: string | null = null;

/**
 * Get compiled patterns with caching
 */
export async function getCompiledPatterns(
  supabase: SupabaseClient
): Promise<Array<{ regex: RegExp; pattern: SecurityPattern }>> {
  const patterns = await loadSecurityPatterns(supabase);

  // Check if we need to recompile
  const cacheKey = patterns.map(p => p.id).join(',');
  if (compiledPatternsCacheKey === cacheKey && compiledPatternsCache) {
    return compiledPatternsCache;
  }

  // Compile and cache
  compiledPatternsCache = compilePatterns(patterns);
  compiledPatternsCacheKey = cacheKey;

  return compiledPatternsCache;
}

/**
 * Record a pattern hit asynchronously (fire and forget)
 * Does not block the request
 */
export function recordPatternHit(
  supabase: SupabaseClient,
  patternId: string
): void {
  // Fire and forget - don't await
  supabase.rpc('record_pattern_hit', { p_pattern_id: patternId })
    .then(() => {})
    .catch((err: Error) => console.error('[PatternLoader] Error recording hit:', err.message));
}

/**
 * Force cache invalidation (useful for admin actions)
 */
export function invalidatePatternCache(): void {
  patternCache = null;
  compiledPatternsCache = null;
  compiledPatternsCacheKey = null;
}

/**
 * Get cache stats for debugging
 */
export function getPatternCacheStats(): {
  isCached: boolean;
  patternCount: number;
  loadedAt: Date | null;
  expiresAt: Date | null;
} {
  return {
    isCached: isCacheValid(),
    patternCount: patternCache?.patterns.length || 0,
    loadedAt: patternCache?.loadedAt || null,
    expiresAt: patternCache?.expiresAt || null,
  };
}
