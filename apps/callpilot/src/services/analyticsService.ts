/**
 * Analytics Service
 *
 * Coaching insights and performance metrics.
 *
 * // TODO: Phase 2 — replace mock imports with Supabase queries
 * // TODO: Phase 5 — add getCallMetrics(dateRange) when real data exists
 */

import type { CoachingInsight } from '@/types'
import { mockCoachingInsight } from '@/mocks'

export async function getCoachingInsights(): Promise<CoachingInsight> {
  return mockCoachingInsight
}
