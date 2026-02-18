/**
 * usePermissions Hook
 *
 * Permission checking logic for RBAC system.
 * Combines data fetching with permission checking utilities.
 */

import { useCallback } from 'react'
import { supabase } from '../../services/supabase'
import { useOrganization } from '../../contexts/OrganizationContext'
import { useAuth } from '../../contexts/AuthContext'
import { usePermissionData } from './usePermissionData'
import type { Permission, UserRole } from '../types'

export function usePermissions() {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()
  const data = usePermissionData()

  const hasPermission = useCallback(
    (permission: Permission): boolean => data.permissions.includes(permission),
    [data.permissions]
  )

  const hasAnyPermission = useCallback(
    (...perms: Permission[]): boolean => perms.some((p) => data.permissions.includes(p)),
    [data.permissions]
  )

  const hasAllPermissions = useCallback(
    (...perms: Permission[]): boolean => perms.every((p) => data.permissions.includes(p)),
    [data.permissions]
  )

  const hasResourcePermission = useCallback(
    async (resourceType: string, resourceId: string, action: string): Promise<boolean> => {
      if (!user || !currentOrg) return false

      try {
        const { data: result, error } = await supabase.rpc('has_resource_permission', {
          p_user_id: user.id,
          p_organization_id: currentOrg.id,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_action: action,
        })

        if (error) throw error
        return result
      } catch (err) {
        console.error('Error checking resource permission:', err)
        return false
      }
    },
    [user, currentOrg]
  )

  const getUserRoles = useCallback(
    (userId: string): UserRole[] => data.userRoles.filter((ur) => ur.user_id === userId),
    [data.userRoles]
  )

  const getPrimaryRole = useCallback((): UserRole | null => {
    if (data.userRoles.length === 0) return null
    return data.userRoles.reduce((prev, current) =>
      current.role.priority > prev.role.priority ? current : prev
    )
  }, [data.userRoles])

  return {
    ...data,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasResourcePermission,
    getUserRoles,
    getPrimaryRole,
  }
}
