/**
 * PermissionGuard.tsx
 *
 * Component-level permission guard for conditional rendering based on user permissions.
 * Provides declarative permission checks in the component tree.
 *
 * Usage:
 * ```tsx
 * <PermissionGuard permission="tasks:delete">
 *   <DeleteButton />
 * </PermissionGuard>
 * ```
 */

import React from 'react'
import { View, Text } from 'react-native'
import { useRBAC } from '../RBACContext'
import { styles } from './styles'
import type { PermissionGuardProps } from './types'

export function PermissionGuard({
  permission,
  requireMode = 'all',
  children,
  fallback,
  renderUnauthorized,
  showUnauthorizedMessage = false,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = useRBAC()

  // Loading state
  if (loading) {
    return null
  }

  // No permission specified - render children
  if (!permission) {
    return <>{children}</>
  }

  // Check permissions
  let hasAccess = false

  if (Array.isArray(permission)) {
    if (requireMode === 'any') {
      hasAccess = hasAnyPermission(...permission)
    } else {
      hasAccess = hasAllPermissions(...permission)
    }
  } else {
    hasAccess = hasPermission(permission)
  }

  // Render based on permission check
  if (hasAccess) {
    return <>{children}</>
  }

  // User lacks permission
  if (renderUnauthorized) {
    return <>{renderUnauthorized()}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  if (showUnauthorizedMessage) {
    return (
      <View style={styles.unauthorized}>
        <Text style={styles.unauthorizedText}>
          You don't have permission to access this feature
        </Text>
      </View>
    )
  }

  return null
}
