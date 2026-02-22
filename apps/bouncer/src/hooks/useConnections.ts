/**
 * useConnections Hook
 *
 * Wraps the connection store with gateway adapter calls.
 */

import { useCallback } from 'react'
import { useConnectionStore } from '@/stores/useConnectionStore'
import { useConnectionContext } from '@/contexts/ConnectionContext'
import type { ConnectionId } from '@/types'

export const useConnections = () => {
  const {
    connections, loading, error,
    setConnections, togglePermission: storeTogglePerm,
    updateConnectionStatus, setLoading, setError,
  } = useConnectionStore()

  const { adapter } = useConnectionContext()

  const loadConnections = useCallback(async () => {
    if (!adapter) return
    setError(null)
    setLoading(true)
    try {
      const data = await adapter.getConnections()
      setConnections(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections')
    } finally {
      setLoading(false)
    }
  }, [adapter, setConnections, setLoading, setError])

  const togglePermission = useCallback(async (connectionId: ConnectionId, permissionId: string, enabled: boolean) => {
    if (!adapter) return
    storeTogglePerm(connectionId, permissionId, enabled)
    try {
      await adapter.toggleConnectionPermission(connectionId, permissionId, enabled)
    } catch (err) {
      // Revert on failure
      storeTogglePerm(connectionId, permissionId, !enabled)
      setError(err instanceof Error ? err.message : 'Failed to toggle permission')
    }
  }, [adapter, storeTogglePerm, setError])

  const disconnect = useCallback(async (connectionId: ConnectionId) => {
    if (!adapter) return
    try {
      await adapter.disconnectConnection(connectionId)
      updateConnectionStatus(connectionId, 'disconnected')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect')
    }
  }, [adapter, updateConnectionStatus, setError])

  return {
    connections,
    loading,
    error,
    loadConnections,
    togglePermission,
    disconnect,
  }
}
