/**
 * useSSO Hook
 *
 * Consumer hook for SSO context.
 * Must be used within SSOProvider.
 *
 * Usage:
 * ```tsx
 * const { signInWithSSO, loading, error } = useSSO()
 *
 * const handleLogin = async () => {
 *   try {
 *     await signInWithSSO('user@company.com')
 *   } catch (err) {
 *     console.error('SSO login failed:', err)
 *   }
 * }
 * ```
 */

import { useContext } from 'react'
import { SSOContext } from './SSOProvider'
import type { SSOContextValue } from './types'

export function useSSO(): SSOContextValue {
  const context = useContext(SSOContext)

  if (context === undefined) {
    throw new Error('useSSO must be used within SSOProvider')
  }

  return context
}
