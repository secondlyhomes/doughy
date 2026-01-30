/**
 * Threat Tracker
 *
 * Tracks cumulative threat scores for users to detect slow attacks.
 * Updates are non-blocking to avoid impacting request latency.
 */

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import type { ThreatScoreResult, ThreatScoreUpdate } from "./types.ts";
import type { ThreatSeverity } from "../security.ts";

// Score deltas for different threat severities
const SEVERITY_SCORES: Record<ThreatSeverity, number> = {
  low: 10,
  medium: 25,
  high: 50,
  critical: 100,
};

// Thresholds
const FLAG_THRESHOLD = 500;
const BLOCK_THRESHOLD = 800;

// In-memory cache for blocked users (short TTL)
const blockedUsersCache = new Map<string, { isBlocked: boolean; checkedAt: Date }>();
const BLOCKED_CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Check if a user is blocked due to threat score
 * Uses in-memory cache to avoid DB calls on every request
 */
export async function isUserBlocked(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  // Check cache first
  const cached = blockedUsersCache.get(userId);
  if (cached && new Date().getTime() - cached.checkedAt.getTime() < BLOCKED_CACHE_TTL_MS) {
    return cached.isBlocked;
  }

  try {
    const { data, error } = await supabase
      .from('moltbot_user_threat_scores')
      .select('is_blocked')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[ThreatTracker] Error checking blocked status:', error.message);
      return false; // Fail open
    }

    const isBlocked = data?.is_blocked || false;

    // Cache result
    blockedUsersCache.set(userId, { isBlocked, checkedAt: new Date() });

    return isBlocked;
  } catch (err) {
    console.error('[ThreatTracker] Exception checking blocked status:', err);
    return false;
  }
}

/**
 * Update threat score for a user (non-blocking)
 *
 * This is designed to be called asynchronously without awaiting
 * to avoid impacting request latency.
 */
export function updateThreatScore(
  supabase: SupabaseClient,
  update: ThreatScoreUpdate
): void {
  // Fire and forget
  updateThreatScoreAsync(supabase, update)
    .then((result) => {
      if (result?.isBlocked) {
        console.warn(`[ThreatTracker] User ${update.userId} is now blocked`);
        // Invalidate cache
        blockedUsersCache.delete(update.userId);
      }
    })
    .catch((err) => console.error('[ThreatTracker] Error updating score:', err));
}

/**
 * Internal async update function
 */
async function updateThreatScoreAsync(
  supabase: SupabaseClient,
  update: ThreatScoreUpdate
): Promise<ThreatScoreResult | null> {
  try {
    const { data, error } = await supabase.rpc('update_user_threat_score', {
      p_user_id: update.userId,
      p_score_delta: update.scoreDelta,
      p_event_type: update.eventType,
    });

    if (error) {
      console.error('[ThreatTracker] Error updating score:', error.message);
      return null;
    }

    const row = data?.[0];
    return {
      newScore: row?.new_score || 0,
      isFlagged: row?.is_flagged || false,
      isBlocked: row?.is_blocked || false,
    };
  } catch (err) {
    console.error('[ThreatTracker] Exception updating score:', err);
    return null;
  }
}

/**
 * Calculate score delta from threat severity
 */
export function calculateScoreDelta(severity: ThreatSeverity): number {
  return SEVERITY_SCORES[severity] || 0;
}

/**
 * Get user's current threat score
 * Used for admin dashboard
 */
export async function getUserThreatScore(
  supabase: SupabaseClient,
  userId: string
): Promise<ThreatScoreResult | null> {
  try {
    const { data, error } = await supabase
      .from('moltbot_user_threat_scores')
      .select('current_score, is_flagged, is_blocked')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[ThreatTracker] Error getting score:', error.message);
      return null;
    }

    if (!data) {
      return { newScore: 0, isFlagged: false, isBlocked: false };
    }

    return {
      newScore: data.current_score,
      isFlagged: data.is_flagged,
      isBlocked: data.is_blocked,
    };
  } catch (err) {
    console.error('[ThreatTracker] Exception getting score:', err);
    return null;
  }
}

/**
 * Clear a user's threat score (admin action)
 */
export async function clearUserThreatScore(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('moltbot_user_threat_scores')
      .update({
        current_score: 0,
        is_flagged: false,
        is_blocked: false,
        flagged_at: null,
        blocked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('[ThreatTracker] Error clearing score:', error.message);
      return false;
    }

    // Invalidate cache
    blockedUsersCache.delete(userId);

    return true;
  } catch (err) {
    console.error('[ThreatTracker] Exception clearing score:', err);
    return false;
  }
}

/**
 * Clear blocked users cache (for testing)
 */
export function clearBlockedUsersCache(): void {
  blockedUsersCache.clear();
}

/**
 * Get threat tracker stats for debugging
 */
export function getThreatTrackerStats(): {
  cachedUserCount: number;
  blockedUserCount: number;
} {
  let blockedCount = 0;
  for (const value of blockedUsersCache.values()) {
    if (value.isBlocked) blockedCount++;
  }

  return {
    cachedUserCount: blockedUsersCache.size,
    blockedUserCount: blockedCount,
  };
}
