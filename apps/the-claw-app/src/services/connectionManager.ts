/**
 * Connection Manager
 *
 * Manages the lifecycle of a gateway connection.
 * For the POC this always resolves to a mock "connected" state.
 */

import type { OpenClawConnection, ConnectionStatus } from '@/types'

export class ConnectionManager {
  private connection: OpenClawConnection | null = null

  /**
   * Establish a connection to an OpenClaw Gateway.
   * In the POC this immediately returns a mock connected state.
   */
  async connect(gatewayUrl: string): Promise<OpenClawConnection> {
    // Simulate brief connection handshake
    this.connection = {
      gatewayUrl,
      displayName: 'OpenClaw Gateway',
      status: 'connecting' as ConnectionStatus,
      serverVersion: null,
      agentName: null,
      lastHealthCheck: null,
    }

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, 400))

    this.connection = {
      gatewayUrl,
      displayName: 'OpenClaw Gateway',
      status: 'connected',
      serverVersion: '0.1.0-poc',
      agentName: 'OpenClaw Demo',
      lastHealthCheck: new Date().toISOString(),
    }

    return this.connection
  }

  /** Disconnect from the gateway and clear state. */
  disconnect(): void {
    this.connection = null
  }

  /** Return the current connection, or null if not connected. */
  getConnection(): OpenClawConnection | null {
    return this.connection ? { ...this.connection } : null
  }

  /** Check whether a connection is currently active. */
  isConnected(): boolean {
    return this.connection?.status === 'connected'
  }
}
