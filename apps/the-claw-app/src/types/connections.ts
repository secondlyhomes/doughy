/**
 * Connection Types
 *
 * Connections are external services The Claw can interact with.
 * Each connection has per-module permissions (read, write, send, etc.).
 */

export type ConnectionId =
  | 'doughy'
  | 'whatsapp'
  | 'discord'
  | 'bland'
  | 'sms'
  | 'slack'
  | 'hubspot'
  | 'gmail'

export type ServiceConnectionStatus = 'connected' | 'warning' | 'disconnected' | 'error'

export interface ConnectionPermission {
  id: string
  module: string
  name: string
  description: string
  enabled: boolean
  riskLevel: 'low' | 'medium' | 'high'
}

export interface BlandConfig {
  maxCallsPerDay: number
  maxSpendPerDayCents: number
  queueDelaySeconds: number
  voice: string
  language: string
}

export interface ServiceConnection {
  id: ConnectionId
  name: string
  icon: string
  status: ServiceConnectionStatus
  permissions: ConnectionPermission[]
  summary: string
  blandConfig?: BlandConfig
}
