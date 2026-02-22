/**
 * Supabase Gateway Adapter
 *
 * Real implementation of GatewayAdapter that reads from Supabase claw schema
 * and calls the openclaw-server API for actions.
 *
 * Split into domain-specific modules:
 * - helpers.ts — shared fetch, parsing, mapping utilities
 * - queueMethods.ts — queue/approval/messaging methods
 * - costMethods.ts — cost tracking/aggregation
 * - trustMethods.ts — trust level config + kill switch
 * - connectionMethods.ts — connection/channel management
 * - activityMethods.ts — activity feed
 */

import type { GatewayAdapter } from './types'
import type { HealthResponse, GatewayConfig } from '@/types'
import { CLAW_API_URL, clawFetch } from './helpers'
import { createQueueMethods } from './queueMethods'
import { createCostMethods } from './costMethods'
import { createTrustMethods } from './trustMethods'
import { createConnectionMethods } from './connectionMethods'
import { createActivityMethods } from './activityMethods'

const queueMethods = createQueueMethods()
const costMethods = createCostMethods()
const trustMethods = createTrustMethods()
const connectionMethods = createConnectionMethods()
const activityMethods = createActivityMethods()

export class SupabaseGatewayAdapter implements GatewayAdapter {
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${CLAW_API_URL.replace('/api/claw', '/health')}`)
      const data = await response.json()

      let pendingCount = 0
      try {
        const approvals = await clawFetch<{ approvals: unknown[] }>('/approvals?status=pending')
        pendingCount = approvals.approvals.length
      } catch (err) {
        console.warn('[SupabaseAdapter] Failed to fetch pending count:', err instanceof Error ? err.message : err)
      }

      return {
        status: data.status === 'ok' ? 'ok' : 'degraded',
        version: data.version || '1.0.0',
        agentName: 'The Claw',
        uptime: 0,
        channelCount: 4,
        pendingActionCount: pendingCount,
      }
    } catch (err) {
      console.error('[SupabaseAdapter] healthCheck failed:', err instanceof Error ? err.message : err)
      return { status: 'down', version: '0.0.0', agentName: 'The Claw', uptime: 0, channelCount: 0, pendingActionCount: 0 }
    }
  }

  async getConfig(): Promise<GatewayConfig> {
    return { trustLevel: 'guarded', pollingIntervalMs: 5000, maxBatchSize: 20, channels: [] }
  }

  async updateConfig(_patch: Partial<GatewayConfig>): Promise<void> {}

  // -- Connections --
  getConnections = connectionMethods.getConnections
  toggleConnectionPermission = connectionMethods.toggleConnectionPermission
  disconnectConnection = connectionMethods.disconnectConnection

  // -- Queue --
  getQueueItems = queueMethods.getQueueItems
  cancelQueueItem = queueMethods.cancelQueueItem
  approveQueueItem = queueMethods.approveQueueItem
  denyQueueItem = queueMethods.denyQueueItem

  // -- Trust --
  getTrustConfig = trustMethods.getTrustConfig
  updateTrustConfig = trustMethods.updateTrustConfig
  getKillSwitchStatus = trustMethods.getKillSwitchStatus
  activateKillSwitch = trustMethods.activateKillSwitch
  deactivateKillSwitch = trustMethods.deactivateKillSwitch

  // -- Cost --
  getMonthlyCost = costMethods.getMonthlyCost

  // -- Activity --
  getActivityHistory = activityMethods.getActivityHistory
  undoActivity = activityMethods.undoActivity

  // -- Legacy methods --
  getPendingActions = queueMethods.getPendingActions
  approveAction = queueMethods.approveAction
  denyAction = queueMethods.denyAction
  batchApproveActions = queueMethods.batchApproveActions
  sendMessage = queueMethods.sendMessage
  getMessages = queueMethods.getMessages
  getBriefing = queueMethods.getBriefing
  getAgentProfiles = queueMethods.getAgentProfiles
  toggleAgentProfile = queueMethods.toggleAgentProfile
}
