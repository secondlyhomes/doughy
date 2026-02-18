/**
 * RoleGuard.tsx
 *
 * Component-level role guard for conditional rendering based on user roles.
 *
 * Usage:
 * ```tsx
 * <RoleGuard roles={['Owner', 'Admin']}>
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */

import React from 'react'
import { useRBAC } from '../RBACContext'
import type { RoleGuardProps } from './types'

export function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { userRoles, loading } = useRBAC()

  if (loading) {
    return null
  }

  const requiredRoles = Array.isArray(roles) ? roles : [roles]
  const userRoleNames = userRoles.map(ur => ur.role.name)

  const hasRole = requiredRoles.some(role => userRoleNames.includes(role))

  if (hasRole) {
    return <>{children}</>
  }

  return fallback ? <>{fallback}</> : null
}
