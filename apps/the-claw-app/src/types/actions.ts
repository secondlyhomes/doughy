/**
 * Action Types
 *
 * Pending actions, approval status, and action tiers
 */

import { ConnectionId } from './connections'

export type ActionTier = 'none' | 'low' | 'medium' | 'high' | 'blocked'

export type ActionStatus = 'pending' | 'approved' | 'denied' | 'executed' | 'failed' | 'expired' | 'auto-approved' | 'auto-executed'

export interface ActionPreview {
  title: string
  summary: string
  details: Record<string, string>
}

export interface PendingAction {
  id: string
  tool: string
  description: string
  tier: ActionTier
  status: ActionStatus
  timestamp: string
  expiresAt: string | null
  connectionId: ConnectionId | null
  preview: ActionPreview
}

export interface ActionResult {
  success: boolean
  actionId: string
  newStatus: ActionStatus
  error?: string
}

export interface ActionBatch {
  tier: ActionTier
  actions: PendingAction[]
  count: number
}

export interface ActionStats {
  pending: number
  approvedToday: number
  deniedToday: number
  expiredToday: number
}
