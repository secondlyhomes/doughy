/**
 * Action Service
 *
 * Thin wrapper around a GatewayAdapter for action-specific operations.
 */

import type {
  PendingAction,
  ActionResult,
  ActionStats,
  BatchApproveResponse,
} from '@/types'
import type { GatewayAdapter } from './gateway/types'

export class ActionService {
  constructor(private readonly gateway: GatewayAdapter) {}

  /** Retrieve all currently pending actions. */
  async getPending(): Promise<PendingAction[]> {
    return this.gateway.getPendingActions()
  }

  /** Approve a single action, optionally with a confirmation message. */
  async approve(id: string, confirmation?: string): Promise<ActionResult> {
    return this.gateway.approveAction(id, confirmation)
  }

  /** Deny a single action, optionally with a reason. */
  async deny(id: string, reason?: string): Promise<ActionResult> {
    return this.gateway.denyAction(id, reason)
  }

  /** Approve multiple actions in a single batch. */
  async batchApprove(ids: string[]): Promise<BatchApproveResponse> {
    return this.gateway.batchApproveActions(ids)
  }

  /**
   * Compute action statistics from the current pending list.
   * In a real implementation this would hit a dedicated stats endpoint.
   */
  async getStats(): Promise<ActionStats> {
    const pending = await this.gateway.getPendingActions()
    return {
      pending: pending.length,
      approvedToday: 0,
      deniedToday: 0,
      expiredToday: 0,
    }
  }
}
