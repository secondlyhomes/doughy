/**
 * Feature Flag Admin Functions
 *
 * CRUD operations and management functions for feature flags
 */

import { supabase } from '@/services/supabaseClient'
import type { FeatureFlag } from './types'

/**
 * Create a feature flag
 */
export async function createFeatureFlag(
  flag: Omit<FeatureFlag, 'created_at' | 'updated_at'>
): Promise<FeatureFlag> {
  const { data, error } = await supabase
    .from('feature_flags')
    .insert(flag)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a feature flag
 */
export async function updateFeatureFlag(
  key: string,
  updates: Partial<FeatureFlag>
): Promise<FeatureFlag> {
  const { data, error } = await supabase
    .from('feature_flags')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('key', key)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a feature flag
 */
export async function deleteFeatureFlag(key: string): Promise<void> {
  const { error } = await supabase.from('feature_flags').delete().eq('key', key)

  if (error) throw error
}

/**
 * Enable a feature flag for specific users
 */
export async function enableForUsers(
  key: string,
  userIds: string[]
): Promise<FeatureFlag> {
  const { data } = await supabase
    .from('feature_flags')
    .select('target_users')
    .eq('key', key)
    .single()

  const existingUsers = data?.target_users || []
  const updatedUsers = Array.from(new Set([...existingUsers, ...userIds]))

  return updateFeatureFlag(key, { targetUsers: updatedUsers })
}

/**
 * Enable a feature flag for specific organizations
 */
export async function enableForOrganizations(
  key: string,
  orgIds: string[]
): Promise<FeatureFlag> {
  const { data } = await supabase
    .from('feature_flags')
    .select('target_organizations')
    .eq('key', key)
    .single()

  const existingOrgs = data?.target_organizations || []
  const updatedOrgs = Array.from(new Set([...existingOrgs, ...orgIds]))

  return updateFeatureFlag(key, { targetOrganizations: updatedOrgs })
}

/**
 * Gradually increase rollout percentage
 */
export async function increaseRollout(
  key: string,
  targetPercentage: number
): Promise<FeatureFlag> {
  if (targetPercentage < 0 || targetPercentage > 100) {
    throw new Error('Rollout percentage must be between 0 and 100')
  }

  return updateFeatureFlag(key, { rolloutPercentage: targetPercentage })
}

/**
 * Get feature flag statistics
 */
export async function getFeatureFlagStats(key: string) {
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('*')
    .eq('key', key)
    .single()

  if (!flag) return null

  // Count enabled users (this would need tracking in production)
  const enabledCount = 0 // Implement actual tracking

  return {
    key: flag.key,
    enabled: flag.enabled,
    rolloutPercentage: flag.rolloutPercentage,
    targetedUsers: flag.target_users?.length || 0,
    targetedOrgs: flag.target_organizations?.length || 0,
    estimatedEnabledUsers: enabledCount,
  }
}

/**
 * List all feature flags with their status
 */
export async function listFeatureFlags(): Promise<FeatureFlag[]> {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('key')

  if (error) throw error
  return data
}
