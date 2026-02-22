// src/features/admin/services/securityHealthService.ts
// Service for calculating security health metrics and key age analysis

import { supabase } from '@/lib/supabase';
import type { ApiKeyRecord, IntegrationHealth } from '../types/integrations';
import {
  KEY_AGE_THRESHOLDS,
  type SecurityHealthSummary,
  type KeyAgeStatus,
  type ApiKeyWithAge,
} from '../types/security';

/**
 * Calculate the age of a key in days from a date string
 */
export function calculateKeyAgeDays(dateString: string | null): number {
  if (!dateString) return Infinity; // No date = very old
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine the age status of a key based on days old
 */
export function getKeyAgeStatus(ageDays: number): KeyAgeStatus {
  if (ageDays < KEY_AGE_THRESHOLDS.WARNING) {
    return 'fresh';
  } else if (ageDays < KEY_AGE_THRESHOLDS.CRITICAL) {
    return 'aging';
  } else {
    return 'stale';
  }
}

/**
 * Get the effective date for age calculation
 * Uses updated_at if available, otherwise created_at
 */
export function getEffectiveDate(key: ApiKeyRecord): string | null {
  return key.updated_at || key.created_at;
}

/**
 * Calculate security score (0-100) based on key health metrics
 *
 * Scoring breakdown:
 * - 50% from key rotation status (fresh/aging/stale)
 * - 30% from operational status
 * - 20% penalty for error keys
 */
export function calculateSecurityScore(
  keys: ApiKeyRecord[],
  healthStatuses?: Map<string, IntegrationHealth>
): number {
  if (keys.length === 0) return 100; // No keys = perfect score (nothing to secure)

  let score = 100;

  // Calculate age metrics
  let freshCount = 0;
  let agingCount = 0;
  let staleCount = 0;
  let errorCount = 0;

  for (const key of keys) {
    const effectiveDate = getEffectiveDate(key);
    const ageDays = calculateKeyAgeDays(effectiveDate);
    const status = getKeyAgeStatus(ageDays);

    if (status === 'fresh') freshCount++;
    else if (status === 'aging') agingCount++;
    else staleCount++;

    // Check for errors from health status
    if (healthStatuses) {
      const health = healthStatuses.get(key.service);
      if (health?.status === 'error') errorCount++;
    } else if (key.status === 'error') {
      errorCount++;
    }
  }

  // Age scoring (50% of total)
  const agePenalty = ((agingCount * 0.5 + staleCount * 1) / keys.length) * 50;
  score -= agePenalty;

  // Error penalty (20% of total)
  const errorPenalty = (errorCount / keys.length) * 20;
  score -= errorPenalty;

  // Operational bonus/penalty (30% of total)
  // Fresh keys with no errors get full operational credit
  const operationalRatio = (freshCount - errorCount) / keys.length;
  const operationalBonus = operationalRatio * 30;
  score = score - 15 + operationalBonus; // Baseline is 15, so we subtract then add bonus

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get comprehensive security health summary
 */
export function getSecurityHealthSummary(
  keys: ApiKeyRecord[],
  healthStatuses?: Map<string, IntegrationHealth>
): SecurityHealthSummary {
  let freshKeys = 0;
  let agingKeys = 0;
  let staleKeys = 0;
  let errorKeys = 0;

  for (const key of keys) {
    const effectiveDate = getEffectiveDate(key);
    const ageDays = calculateKeyAgeDays(effectiveDate);
    const status = getKeyAgeStatus(ageDays);

    if (status === 'fresh') freshKeys++;
    else if (status === 'aging') agingKeys++;
    else staleKeys++;

    // Check for errors
    if (healthStatuses) {
      const health = healthStatuses.get(key.service);
      if (health?.status === 'error') errorKeys++;
    } else if (key.status === 'error') {
      errorKeys++;
    }
  }

  return {
    score: calculateSecurityScore(keys, healthStatuses),
    totalKeys: keys.length,
    freshKeys,
    agingKeys,
    staleKeys,
    errorKeys,
    lastChecked: new Date(),
  };
}

/**
 * Get keys that need attention (stale or have errors)
 */
export function getKeysNeedingAttention(
  keys: ApiKeyRecord[],
  healthStatuses?: Map<string, IntegrationHealth>
): ApiKeyWithAge[] {
  const needsAttention: ApiKeyWithAge[] = [];

  for (const key of keys) {
    const effectiveDate = getEffectiveDate(key);
    const ageDays = calculateKeyAgeDays(effectiveDate);
    const ageStatus = getKeyAgeStatus(ageDays);

    // Check for errors
    let hasError = false;
    if (healthStatuses) {
      const health = healthStatuses.get(key.service);
      hasError = health?.status === 'error';
    } else {
      hasError = key.status === 'error';
    }

    // Include if stale or has error
    if (ageStatus === 'stale' || hasError) {
      needsAttention.push({
        service: key.service,
        name: key.description || key.service,
        ageStatus,
        ageDays: ageDays === Infinity ? -1 : ageDays, // -1 indicates unknown
        updatedAt: key.updated_at ? new Date(key.updated_at) : null,
        createdAt: key.created_at ? new Date(key.created_at) : null,
        hasError,
      });
    }
  }

  // Sort by priority: errors first, then by age (oldest first)
  return needsAttention.sort((a, b) => {
    if (a.hasError !== b.hasError) return a.hasError ? -1 : 1;
    return b.ageDays - a.ageDays;
  });
}

/**
 * Fetch all API keys from the database
 */
export async function fetchAllApiKeys(): Promise<{
  success: boolean;
  keys: ApiKeyRecord[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('security_api_keys')
      .select('*')
      .order('service', { ascending: true });

    if (error) {
      console.error('[securityHealthService] Error fetching API keys:', error);
      return { success: false, keys: [], error: error.message };
    }

    return { success: true, keys: data || [] };
  } catch (error) {
    console.error('[securityHealthService] Exception fetching API keys:', error);
    return {
      success: false,
      keys: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format age in human-readable format
 */
export function formatKeyAge(ageDays: number): string {
  if (ageDays < 0 || ageDays === Infinity) return 'Unknown';
  if (ageDays === 0) return 'Today';
  if (ageDays === 1) return '1 day ago';
  if (ageDays < 30) return `${ageDays} days ago`;
  if (ageDays < 60) return '1 month ago';
  if (ageDays < 365) return `${Math.floor(ageDays / 30)} months ago`;
  if (ageDays < 730) return '1 year ago';
  return `${Math.floor(ageDays / 365)} years ago`;
}

/**
 * Get age message based on status
 */
export function getAgeStatusMessage(status: KeyAgeStatus): string {
  switch (status) {
    case 'fresh':
      return 'Key is current';
    case 'aging':
      return 'Consider rotating';
    case 'stale':
      return 'Rotation recommended';
  }
}
