/**
 * Tier Constants
 *
 * Single source of truth for tier indicator colors and labels.
 * Uses theme-compatible color references from tokens.
 */

import { colors } from '@/theme/tokens'
import type { ActionTier } from '@/types'

/** Tier indicator for swipeable actions and badges */
export const TIER_INDICATOR: Record<ActionTier, { color: string; label: string }> = {
  blocked: { color: colors.error[900], label: 'BLOCKED' },
  high: { color: colors.error[500], label: 'HIGH' },
  medium: { color: colors.warning[500], label: 'MED' },
  low: { color: colors.success[500], label: 'LOW' },
  none: { color: colors.neutral[400], label: '--' },
}
