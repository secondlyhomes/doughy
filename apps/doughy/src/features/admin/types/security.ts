// src/features/admin/types/security.ts
// Type definitions for API key security and health monitoring

/**
 * Key age status classification
 * - fresh: Key < 60 days old - no action needed
 * - aging: Key 60-180 days old - consider rotating
 * - stale: Key > 180 days old - rotation recommended
 */
export type KeyAgeStatus = 'fresh' | 'aging' | 'stale';

/**
 * Thresholds for key age classification (in days)
 */
export const KEY_AGE_THRESHOLDS = {
  /** Days before key is considered aging (yellow warning) */
  WARNING: 60,
  /** Days before key is considered stale (red alert) */
  CRITICAL: 180,
} as const;

/**
 * Security health summary for the dashboard
 */
export interface SecurityHealthSummary {
  /** Overall security score from 0-100 */
  score: number;
  /** Total number of configured API keys */
  totalKeys: number;
  /** Keys updated within the last 60 days */
  freshKeys: number;
  /** Keys updated 60-180 days ago */
  agingKeys: number;
  /** Keys updated more than 180 days ago */
  staleKeys: number;
  /** Keys with health check errors */
  errorKeys: number;
  /** When the health check was last performed */
  lastChecked: Date;
}

/**
 * Extended API key record with age information
 */
export interface ApiKeyWithAge {
  service: string;
  name: string;
  ageStatus: KeyAgeStatus;
  ageDays: number;
  updatedAt: Date | null;
  createdAt: Date | null;
  hasError: boolean;
}

/**
 * Color scheme for key age status
 */
export const KEY_AGE_COLORS = {
  fresh: 'success',
  aging: 'warning',
  stale: 'destructive',
} as const;
