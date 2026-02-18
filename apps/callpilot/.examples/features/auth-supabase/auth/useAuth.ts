/**
 * useAuth Hook
 *
 * Consumer hook for accessing auth context.
 * Must be used within an AuthProvider.
 */

import { useContext } from 'react'
import { AuthContext } from './AuthProvider'
import type { AuthContextValue } from './types'

/**
 * Hook to access auth context
 *
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signIn, signOut } = useAuth()
 *
 *   if (!user) {
 *     return <LoginButton onPress={() => signIn({ email, password })} />
 *   }
 *
 *   return <LogoutButton onPress={signOut} />
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
