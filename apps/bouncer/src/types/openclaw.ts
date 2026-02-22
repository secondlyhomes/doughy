/**
 * OpenClaw Gateway Types
 *
 * Request/response shapes for the OpenClaw Gateway API
 */

import { HealthResponse } from './connection'
import { ConnectionId, ServiceConnection } from './connections'
import { PendingAction, ActionResult } from './actions'
import { TrustLevel } from './trust'

export interface GatewayConfig {
  trustLevel: TrustLevel
  pollingIntervalMs: number
  maxBatchSize: number
  channels: ChannelConfig[]
}

export interface ChannelConfig {
  name: string
  enabled: boolean
  connectionId: ConnectionId
}

export interface GatewayStatusResponse {
  health: HealthResponse
  config: GatewayConfig
  connections: ServiceConnection[]
  pendingActions: PendingAction[]
}

export interface ApproveActionRequest {
  actionId: string
  confirmation?: string
}

export interface DenyActionRequest {
  actionId: string
  reason?: string
}

export interface BatchApproveRequest {
  actionIds: string[]
}

export interface BatchApproveResponse {
  results: ActionResult[]
  successCount: number
  failureCount: number
}

/** A message in the Claw conversation */
export interface ClawMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  channel: 'sms' | 'app' | 'discord' | 'whatsapp' | 'email'
  created_at: string
  metadata?: Record<string, unknown>
}

/** Briefing response from the server */
export interface BriefingResponse {
  briefing: string
  generated_at: string
}

/** Response from sending a message */
export interface SendMessageResponse {
  message: string
  task_id?: string
  approvals_created?: number
}

/** Agent profile (skill/capability) */
export interface AgentProfile {
  id: string
  name: string
  slug: string
  description: string | null
  model: string
  tools: string[] | null
  requires_approval: boolean
  is_active: boolean
  created_at: string
}

/** Kill switch status */
export interface KillSwitchStatus {
  active: boolean
  last_event: {
    id: string
    action: string
    reason: string
    created_at: string
  } | null
}
