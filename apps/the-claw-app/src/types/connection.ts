/**
 * Connection Types
 *
 * Gateway connection status and health response types
 */

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface OpenClawConnection {
  gatewayUrl: string
  displayName: string
  status: ConnectionStatus
  serverVersion: string | null
  agentName: string | null
  lastHealthCheck: string | null
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down'
  version: string
  agentName: string
  uptime: number
  channelCount: number
  pendingActionCount: number
}

export interface ConnectionError {
  code: 'UNREACHABLE' | 'AUTH_FAILED' | 'TIMEOUT' | 'UNKNOWN'
  message: string
  timestamp: string
}
