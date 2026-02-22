/**
 * Connection Store
 *
 * Zustand store with AsyncStorage persistence for service connections.
 * Tracks which services are connected and their permission states.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ServiceConnection, ConnectionId } from '@/types'

interface ConnectionState {
  connections: ServiceConnection[]
  loading: boolean
  error: string | null
}

interface ConnectionActions {
  setConnections(connections: ServiceConnection[]): void
  togglePermission(connectionId: ConnectionId, permissionId: string, enabled: boolean): void
  updateConnectionStatus(connectionId: ConnectionId, status: ServiceConnection['status']): void
  setLoading(loading: boolean): void
  setError(error: string | null): void
}

export const useConnectionStore = create<ConnectionState & ConnectionActions>()(
  persist(
    (set) => ({
      connections: [],
      loading: false,
      error: null,

      setConnections: (connections) => set({ connections, error: null }),

      togglePermission: (connectionId, permissionId, enabled) =>
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === connectionId
              ? {
                  ...conn,
                  permissions: conn.permissions.map((perm) =>
                    perm.id === permissionId ? { ...perm, enabled } : perm,
                  ),
                }
              : conn,
          ),
        })),

      updateConnectionStatus: (connectionId, status) =>
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === connectionId ? { ...conn, status } : conn,
          ),
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: '@the-claw/connections',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ connections: state.connections }),
    },
  ),
)
