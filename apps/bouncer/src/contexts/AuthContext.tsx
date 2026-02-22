/**
 * Auth Context
 *
 * Provides Supabase authentication state to the app.
 * Matches Doughy's auth patterns: initCompleteRef to prevent REST query hangs,
 * hybrid SecureStore/AsyncStorage via supabase client, auto-refresh.
 *
 * Same Supabase instance as Doughy — same user, same credentials.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react'
import { AppState } from 'react-native'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signIn(email: string, password: string): Promise<{ error: string | null }>
  signOut(): Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Critical: prevents onAuthStateChange from setting loading=false
  // before getSession() completes. Without this, Supabase's internal
  // initializePromise lock causes REST queries to hang.
  const initCompleteRef = useRef(false)
  const signInInProgressRef = useRef(false)

  useEffect(() => {
    let mounted = true

    async function initializeAuth() {
      try {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(s)
          initCompleteRef.current = true
          setLoading(false)
        }
      } catch (err) {
        console.error('[Auth] Failed to get session:', err)
        if (mounted) {
          initCompleteRef.current = true
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return

      if (event === 'INITIAL_SESSION') {
        // Handled by initializeAuth — skip to avoid double-processing
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        // Only update session, don't change loading state
        if (newSession) {
          setSession(newSession)
        }
        return
      }

      if (event === 'SIGNED_IN') {
        setSession(newSession)
        if (initCompleteRef.current) {
          setLoading(false)
        }
        return
      }

      if (event === 'SIGNED_OUT') {
        setSession(null)
        if (initCompleteRef.current) {
          setLoading(false)
        }
        return
      }

      // Default: update session
      setSession(newSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Auto-reconnect when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Triggers token refresh if needed and reconnects Realtime
        supabase.auth.getSession().catch((err) => {
          console.warn('[Auth] Foreground session refresh failed:', err)
        })
      }
    })

    return () => subscription.remove()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (signInInProgressRef.current) {
      return { error: 'Sign in already in progress' }
    }
    signInInProgressRef.current = true
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { error: null }
    } finally {
      signInInProgressRef.current = false
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[Auth] signOut error (clearing session anyway):', err)
    }
    setSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!session,
  }), [session, loading, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
