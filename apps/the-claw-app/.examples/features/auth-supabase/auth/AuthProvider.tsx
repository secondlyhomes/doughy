/**
 * Supabase Auth Provider
 *
 * Manages authentication state with Supabase Auth.
 * Automatically handles:
 * - Session persistence (expo-secure-store)
 * - Token refresh
 * - Auth state changes
 *
 * @example
 * ```tsx
 * // Wrap your app
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 *
 * // Use in components
 * function MyScreen() {
 *   const { user, signIn, signOut } = useAuth()
 *
 *   if (!user) {
 *     return <LoginScreen />
 *   }
 *
 *   return <HomeScreen user={user} onLogout={signOut} />
 * }
 * ```
 */

import React, { createContext, ReactNode, useMemo } from 'react'
import { useAuthSession } from './hooks/useAuthSession'
import { useAuthActions } from './hooks/useAuthActions'
import type { AuthContextValue } from './types'

/**
 * Auth context - undefined when outside provider
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Auth provider component
 *
 * Combines session state and auth actions into a single context value.
 * Uses memoization to prevent unnecessary re-renders.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Get session state (user, session, loading, isAuthenticated)
  const sessionState = useAuthSession()

  // Get auth actions (signIn, signOut, signUp, etc.)
  const actions = useAuthActions({ user: sessionState.user })

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<AuthContextValue>(
    () => ({
      ...sessionState,
      ...actions,
    }),
    [sessionState, actions]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
