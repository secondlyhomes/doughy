/**
 * Activity Types
 *
 * Audit trail, approval channels, and consent tracking
 */

import type { ActionTier, ActionStatus, ActionPreview } from './actions'
import type { ConnectionId } from './connections'
import type { TrustLevel } from './trust'

/** Where an action was approved/executed */
export type ApprovalChannel =
  | 'app'
  | 'discord'
  | 'whatsapp'
  | 'sms'
  | 'slack'
  | 'auto-policy'
  | 'api'

/** How an action was resolved */
export type ResolutionMethod =
  | 'manual-user'
  | 'auto-policy'
  | 'auto-autonomous'
  | 'timeout'
  | 'denied'

/** Full audit trail entry for the activity feed */
export interface ActionHistoryEntry {
  id: string
  tool: string
  description: string
  tier: ActionTier
  status: ActionStatus
  connectionId: ConnectionId | null
  preview: ActionPreview
  channel: ApprovalChannel | null
  requestedAt: string
  resolvedAt: string | null
  executedAt: string | null
  resolvedBy: ResolutionMethod | null
  trustLevelAtTime: TrustLevel
  undoable: boolean
  undoneAt: string | null
  costCents: number
}

/** Consent record for autonomous mode */
export interface AutonomousConsent {
  agreedAt: string
  tosVersion: string
  privacyVersion: string
  revokedAt: string | null
}

/** Filter options for the activity feed */
export type ActivityFilter = 'all' | 'today' | 'this-week'
export type ActivityStatusFilter = 'all' | 'approved' | 'denied' | 'auto-approved' | 'auto-executed' | 'failed' | 'pending'
export type ActivityConnectionFilter = ConnectionId | 'all'
