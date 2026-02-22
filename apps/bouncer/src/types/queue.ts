/**
 * Queue Types
 *
 * The action queue holds items waiting for approval, counting down, or executed.
 */

import type { ConnectionId } from './connections'

export type QueueItemStatus =
  | 'pending'
  | 'countdown'
  | 'approved'
  | 'denied'
  | 'executed'
  | 'cancelled'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface QueueItem {
  id: string
  connectionId: ConnectionId
  actionType: string
  title: string
  summary: string
  status: QueueItemStatus
  riskLevel: RiskLevel
  countdownEndsAt: string | null
  createdAt: string
}
