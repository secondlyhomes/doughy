/**
 * useAuthSession Hook
 *
 * Manages authentication session state with Supabase Auth.
 * Handles session initialization and auth state changes.
 */

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/services/supabase'
import type { AuthSessionState, User, AuthSession } from '../types'

/**
 * Hook for managing auth session state
 *
 * Automatically handles:
 * - Session persistence (expo-secure-store)
 * - Token refresh
 * - Auth state changes
 *
 * @returns Session state including user, session, loading, and isAuthenticated
 */
export function useAuthSession(): AuthSessionState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Update state from session
  const updateSessionState = useCallback((newSession: AuthSession | null) => {
    setSession(newSession)
    setUser(newSession?.user ?? null)
    setLoading(false)
  }, [])

  // Initialize auth state on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateSessionState(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateSessionState(session)
    })

    return () => subscription.unsubscribe()
  }, [updateSessionState])

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
  }
}
