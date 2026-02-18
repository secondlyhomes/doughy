/**
 * Feature Flag Utilities
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { FeatureFlag, FeatureFlagEvaluation, CachedFlags } from './types'

const CACHE_KEY = 'feature_flags'

/**
 * Simple string hash for consistent bucketing
 */
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Load feature flags from cache
 */
export async function loadFromCache(): Promise<CachedFlags | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const data = JSON.parse(cached)
    return {
      flags: new Map(data.flags),
      evaluations: new Map(data.evaluations),
    }
  } catch {
    return null
  }
}

/**
 * Save feature flags to cache
 */
export async function saveToCache(
  flags: Map<string, boolean>,
  evaluations: Map<string, FeatureFlagEvaluation>
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        flags: Array.from(flags.entries()),
        evaluations: Array.from(evaluations.entries()),
        timestamp: Date.now(),
      })
    )
  } catch (error) {
    console.error('Failed to cache feature flags:', error)
  }
}

/**
 * Evaluate a feature flag for a specific user/org/role
 */
export function evaluateFlag(
  flag: FeatureFlag,
  userId: string,
  orgId: string,
  userRole: string
): FeatureFlagEvaluation {
  // Check if globally disabled
  if (!flag.enabled) {
    return { key: flag.key, enabled: false, reason: 'globally_disabled' }
  }

  // Check date range
  if (flag.startDate && new Date(flag.startDate) > new Date()) {
    return { key: flag.key, enabled: false, reason: 'not_started' }
  }
  if (flag.endDate && new Date(flag.endDate) < new Date()) {
    return { key: flag.key, enabled: false, reason: 'expired' }
  }

  // Check user targeting
  if (flag.targetUsers && flag.targetUsers.length > 0) {
    if (!flag.targetUsers.includes(userId)) {
      return { key: flag.key, enabled: false, reason: 'user_not_targeted' }
    }
    return { key: flag.key, enabled: true, reason: 'user_targeted' }
  }

  // Check organization targeting
  if (flag.targetOrganizations && flag.targetOrganizations.length > 0) {
    if (!flag.targetOrganizations.includes(orgId)) {
      return { key: flag.key, enabled: false, reason: 'org_not_targeted' }
    }
    return { key: flag.key, enabled: true, reason: 'org_targeted' }
  }

  // Check role targeting
  if (flag.targetRoles && flag.targetRoles.length > 0) {
    if (!flag.targetRoles.includes(userRole)) {
      return { key: flag.key, enabled: false, reason: 'role_not_targeted' }
    }
    return { key: flag.key, enabled: true, reason: 'role_targeted' }
  }

  // Check rollout percentage
  if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
    const hash = hashString(userId)
    const bucket = hash % 100
    const enabled = bucket < flag.rolloutPercentage
    return {
      key: flag.key,
      enabled,
      reason: enabled ? 'rollout_included' : 'rollout_excluded',
    }
  }

  // Enabled for everyone
  return { key: flag.key, enabled: true, reason: 'enabled_for_all' }
}
