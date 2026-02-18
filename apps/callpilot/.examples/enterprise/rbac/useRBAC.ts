/**
 * useRBAC Hook
 *
 * Consumer hook for RBAC context.
 *
 * Usage:
 * ```tsx
 * const { hasPermission, userRoles } = useRBAC()
 * if (hasPermission('tasks:delete')) {
 *   // Show delete button
 * }
 * ```
 */

import { useContext } from 'react'
import { RBACContext } from './RBACProvider'
import type { RBACContextValue } from './types'

export function useRBAC(): RBACContextValue {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error('useRBAC must be used within RBACProvider')
  }
  return context
}
