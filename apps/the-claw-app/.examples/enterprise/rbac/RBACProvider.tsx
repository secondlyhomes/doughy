/**
 * RBACProvider.tsx
 *
 * Role-Based Access Control context provider.
 * Thin wrapper that composes permission and operation hooks.
 */

import React, { createContext, useMemo } from 'react'
import { usePermissions } from './hooks/usePermissions'
import { useRBACOperations } from './hooks/useRBACOperations'
import type { RBACContextValue } from './types'

export const RBACContext = createContext<RBACContextValue | undefined>(undefined)

interface RBACProviderProps {
  children: React.ReactNode
}

export function RBACProvider({ children }: RBACProviderProps) {
  const {
    permissions,
    availablePermissions,
    userRoles,
    roles,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasResourcePermission,
    getUserRoles,
    getPrimaryRole,
    refreshPermissions,
    fetchRoles,
  } = usePermissions()

  const {
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    revokeRole,
    grantResourcePermission,
    revokeResourcePermission,
  } = useRBACOperations({ refreshPermissions, fetchRoles })

  const value: RBACContextValue = useMemo(
    () => ({
      // State
      permissions,
      availablePermissions,
      userRoles,
      roles,
      loading,
      error,
      // Permission checking
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasResourcePermission,
      // Role management
      createRole,
      updateRole,
      deleteRole,
      assignRole,
      revokeRole,
      // Resource permissions
      grantResourcePermission,
      revokeResourcePermission,
      // Utilities
      getUserRoles,
      getPrimaryRole,
      refreshPermissions,
    }),
    [
      permissions,
      availablePermissions,
      userRoles,
      roles,
      loading,
      error,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      hasResourcePermission,
      createRole,
      updateRole,
      deleteRole,
      assignRole,
      revokeRole,
      grantResourcePermission,
      revokeResourcePermission,
      getUserRoles,
      getPrimaryRole,
      refreshPermissions,
    ]
  )

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>
}
