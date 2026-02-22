/**
 * Gateway Adapter Interface
 *
 * Defines the contract for communicating with an OpenClaw Gateway.
 * Implementation: SupabaseGatewayAdapter (reads claw.* schema, calls server API for actions).
 */

import type {
  HealthResponse,
  GatewayConfig,
  PendingAction,
  ActionResult,
  BatchApproveResponse,
  ActionHistoryEntry,
  ClawMessage,
  BriefingResponse,
  SendMessageResponse,
  AgentProfile,
  KillSwitchStatus,
  ServiceConnection,
  ConnectionId,
  QueueItem,
  TrustConfig,
  MonthlyCostSummary,
} from '@/types'

export interface GatewayAdapter {
  /** Check gateway health and connectivity */
  healthCheck(): Promise<HealthResponse>

  /** Retrieve current gateway configuration */
  getConfig(): Promise<GatewayConfig>

  /** Partially update gateway configuration */
  updateConfig(patch: Partial<GatewayConfig>): Promise<void>

  // -- Connections (replaces integrations) --

  /** List all service connections and their current status */
  getConnections(): Promise<ServiceConnection[]>

  /** Toggle a specific permission within a connection */
  toggleConnectionPermission(
    connectionId: ConnectionId,
    permissionId: string,
    enabled: boolean,
  ): Promise<void>

  /** Disconnect a service */
  disconnectConnection(connectionId: ConnectionId): Promise<void>

  // -- Queue (replaces pending actions) --

  /** Get all queue items (pending, countdown, etc.) */
  getQueueItems(): Promise<QueueItem[]>

  /** Cancel a queue item before it executes */
  cancelQueueItem(id: string): Promise<void>

  /** Approve a pending queue item */
  approveQueueItem(id: string): Promise<void>

  /** Deny a pending queue item */
  denyQueueItem(id: string): Promise<void>

  // -- Trust config --

  /** Get the user's trust configuration */
  getTrustConfig(): Promise<TrustConfig>

  /** Update the user's trust configuration */
  updateTrustConfig(config: Partial<TrustConfig>): Promise<void>

  // -- Cost --

  /** Get monthly cost summary */
  getMonthlyCost(): Promise<MonthlyCostSummary>

  // -- Activity --

  /** Get combined activity history */
  getActivityHistory(): Promise<ActionHistoryEntry[]>

  /** Undo a reversible activity entry */
  undoActivity(id: string): Promise<void>

  // -- Legacy (kept for server compatibility) --

  /** Retrieve all pending actions awaiting approval */
  getPendingActions(): Promise<PendingAction[]>

  /** Approve a pending action */
  approveAction(id: string, editedContent?: string): Promise<ActionResult>

  /** Deny a pending action */
  denyAction(id: string, reason?: string): Promise<ActionResult>

  /** Approve multiple actions in a single batch */
  batchApproveActions(actionIds: string[]): Promise<BatchApproveResponse>

  /** Send a message to The Claw */
  sendMessage(message: string): Promise<SendMessageResponse>

  /** Get conversation history */
  getMessages(limit?: number): Promise<ClawMessage[]>

  /** Get the daily briefing */
  getBriefing(): Promise<BriefingResponse>

  /** Get agent profiles */
  getAgentProfiles(): Promise<AgentProfile[]>

  /** Toggle an agent profile */
  toggleAgentProfile(id: string, isActive: boolean): Promise<void>

  /** Get kill switch status */
  getKillSwitchStatus(): Promise<KillSwitchStatus>

  /** Activate kill switch */
  activateKillSwitch(reason: string): Promise<{ agents_disabled: number }>

  /** Deactivate kill switch */
  deactivateKillSwitch(): Promise<{ agents_restored: number }>
}
