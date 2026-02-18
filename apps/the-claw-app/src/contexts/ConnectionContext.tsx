/**
 * Connection Context
 *
 * Provides the gateway adapter to the app. Always uses SupabaseGatewayAdapter.
 * Auto-initializes when authenticated — no manual connect() needed.
 */

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import type { GatewayAdapter } from '@/services/gateway/types'
import { SupabaseGatewayAdapter } from '@/services/gateway/supabaseAdapter'
import { useAuth } from '@/contexts/AuthContext'

interface ConnectionContextValue {
  adapter: GatewayAdapter | null
  isConnected: boolean
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth()
  const [adapter, setAdapter] = useState<SupabaseGatewayAdapter | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      setAdapter(prev => prev ?? new SupabaseGatewayAdapter())
    } else {
      setAdapter(null)
    }
  }, [isAuthenticated])

  const value = useMemo<ConnectionContextValue>(() => ({
    adapter,
    isConnected: isAuthenticated && adapter !== null,
  }), [adapter, isAuthenticated])

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  )
}

export const useConnectionContext = (): ConnectionContextValue => {
  const context = useContext(ConnectionContext)
  if (!context) {
    throw new Error('useConnectionContext must be used within a ConnectionProvider')
  }
  return context
}
