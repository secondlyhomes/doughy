/**
 * Queue → Activity Bridge
 *
 * Converts resolved QueueItems into ActionHistoryEntry records
 * so approved/denied/cancelled/executed items flow into the activity feed.
 */

import type { QueueItem } from '@/types/queue'
import type { ActionHistoryEntry, ResolutionMethod } from '@/types/activity'
import type { ActionTier } from '@/types/actions'
import type { TrustLevel } from '@/types/trust'

interface BridgeOptions {
  trustLevel: TrustLevel
}

const RISK_TO_TIER: Record<QueueItem['riskLevel'], ActionTier> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
}

const STATUS_MAP: Record<string, ActionHistoryEntry['status']> = {
  approved: 'approved',
  denied: 'denied',
  cancelled: 'denied',
  executed: 'executed',
}

function resolvedByForStatus(
  status: QueueItem['status'],
): ResolutionMethod | null {
  switch (status) {
    case 'approved':
    case 'denied':
    case 'cancelled':
      return 'manual-user'
    case 'executed':
      return 'auto-policy'
    default:
      return null
  }
}

export function queueItemToActivityEntry(
  item: QueueItem,
  { trustLevel }: BridgeOptions,
): ActionHistoryEntry {
  const now = new Date().toISOString()

  return {
    id: `activity-${item.id}`,
    tool: item.actionType,
    description: item.summary,
    tier: RISK_TO_TIER[item.riskLevel],
    status: STATUS_MAP[item.status] ?? 'executed',
    connectionId: item.connectionId,
    preview: {
      title: item.title,
      summary: item.summary,
      details: {},
    },
    channel: 'app',
    requestedAt: item.createdAt,
    resolvedAt: now,
    executedAt: item.status === 'executed' ? now : null,
    resolvedBy: resolvedByForStatus(item.status),
    trustLevelAtTime: trustLevel,
    undoable: false,
    undoneAt: null,
    costCents: 0,
  }
}
