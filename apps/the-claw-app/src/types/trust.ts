/**
 * Trust Level Types
 *
 * Trust levels control whether actions queue for approval, countdown, or auto-execute.
 * Replaces the old 5-level guard system with a clearer 4-level trust model.
 */

export type TrustLevel = 'locked' | 'manual' | 'guarded' | 'autonomous'

export type HeaderMode = 'compact' | 'detailed'

export interface TrustLevelConfig {
  level: TrustLevel
  emoji: string
  label: string
  description: string
  color: string
  queueBehavior: string
}

/** Ordered from most restrictive to least */
export const TRUST_LEVEL_ORDER: TrustLevel[] = [
  'locked',
  'manual',
  'guarded',
  'autonomous',
]

export const TRUST_LEVEL_CONFIGS: Record<TrustLevel, TrustLevelConfig> = {
  locked: {
    level: 'locked',
    emoji: '\uD83D\uDD12',
    label: 'Locked',
    description: 'Read-only. The Claw can observe but cannot act.',
    color: '#6b7280',
    queueBehavior: 'Everything blocked',
  },
  manual: {
    level: 'manual',
    emoji: '\u270B',
    label: 'Manual',
    description: 'All actions queue for your approval before executing.',
    color: '#3b82f6',
    queueBehavior: 'All actions queued',
  },
  guarded: {
    level: 'guarded',
    emoji: '\u23F1\uFE0F',
    label: 'Guarded',
    description: 'Actions execute after a countdown. Cancel anytime before it fires.',
    color: '#f59e0b',
    queueBehavior: 'Countdown before execution',
  },
  autonomous: {
    level: 'autonomous',
    emoji: '\u26A1',
    label: 'Autonomous',
    description: 'Fire and forget. Everything auto-executes immediately.',
    color: '#22c55e',
    queueBehavior: 'Immediate execution',
  },
}

export interface ActionOverride {
  actionType: string
  trustLevel: TrustLevel
}

export interface TrustConfig {
  globalLevel: TrustLevel
  countdownSeconds: number
  overrides: ActionOverride[]
  dailySpendLimitCents: number
  dailyCallLimit: number
}
