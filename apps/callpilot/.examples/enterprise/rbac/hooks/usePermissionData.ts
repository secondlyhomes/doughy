/**
 * usePermissionData Hook
 *
 * Data fetching for RBAC permissions, roles, and user roles.
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../services/supabase'
import { useOrganization } from '../../contexts/OrganizationContext'
import { useAuth } from '../../contexts/AuthContext'
import type { Permission, PermissionDefinition, UserRole, Role } from '../types'

export interface PermissionDataState {
  permissions: Permission[]
  availablePermissions: PermissionDefinition[]
  userRoles: UserRole[]
  roles: Role[]
  loading: boolean
  error: Error | null
}

export interface PermissionDataActions {
  refreshPermissions: () => Promise<void>
  fetchRoles: () => Promise<void>
}

export function usePermissionData(): PermissionDataState & PermissionDataActions {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()

  const [permissions, setPermissions] = useState<Permission[]>([])
  const [availablePermissions, setAvailablePermissions] = useState<PermissionDefinition[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAvailablePermissions = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (fetchError) throw fetchError
      setAvailablePermissions(data)
    } catch (err) {
      console.error('Error fetching available permissions:', err)
    }
  }, [])

  const fetchUserPermissions = useCallback(async () => {
    if (!user || !currentOrg) {
      setPermissions([])
      setUserRoles([])
      setLoading(false)
      return
    }

    try {
      const { data: permsData, error: permsError } = await supabase.rpc(
        'get_user_permissions',
        { p_user_id: user.id, p_organization_id: currentOrg.id }
      )

      if (permsError) throw permsError

      setPermissions(
        permsData.map(
          (p: { resource: string; action: string }) =>
            `${p.resource}:${p.action}` as Permission
        )
      )

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          id, user_id, role_id, organization_id, granted_by, granted_at,
          expires_at, status,
          role:role_id (
            id, organization_id, name, description, color, icon, is_system,
            priority, created_at, updated_at,
            role_permissions ( permission:permission_id ( resource, action ) )
          )
        `)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrg.id)
        .eq('status', 'active')

      if (rolesError) throw rolesError

      setUserRoles(
        rolesData.map((ur: any) => ({
          ...ur,
          role: {
            ...ur.role,
            permissions: ur.role.role_permissions.map(
              (rp: any) => `${rp.permission.resource}:${rp.permission.action}` as Permission
            ),
          },
        }))
      )
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching user permissions:', err)
    } finally {
      setLoading(false)
    }
  }, [user, currentOrg])

  const fetchRoles = useCallback(async () => {
    if (!currentOrg) return

    try {
      const { data, error: fetchError } = await supabase
        .from('roles')
        .select(`
          id, organization_id, name, description, color, icon, is_system,
          priority, created_at, updated_at,
          role_permissions ( permission:permission_id ( resource, action ) )
        `)
        .eq('organization_id', currentOrg.id)
        .order('priority', { ascending: false })

      if (fetchError) throw fetchError

      setRoles(
        data.map((r: any) => ({
          ...r,
          permissions: r.role_permissions.map(
            (rp: any) => `${rp.permission.resource}:${rp.permission.action}` as Permission
          ),
        }))
      )
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }, [currentOrg])

  useEffect(() => {
    fetchAvailablePermissions()
  }, [fetchAvailablePermissions])

  useEffect(() => {
    fetchUserPermissions()
  }, [fetchUserPermissions])

  useEffect(() => {
    if (currentOrg) fetchRoles()
  }, [currentOrg, fetchRoles])

  return {
    permissions,
    availablePermissions,
    userRoles,
    roles,
    loading,
    error,
    refreshPermissions: fetchUserPermissions,
    fetchRoles,
  }
}
