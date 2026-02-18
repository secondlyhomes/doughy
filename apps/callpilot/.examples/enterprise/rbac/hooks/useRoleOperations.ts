/**
 * useRoleOperations Hook
 *
 * CRUD operations for roles and role assignments.
 */

import { useCallback } from 'react'
import { supabase } from '../../services/supabase'
import { useOrganization } from '../../contexts/OrganizationContext'
import { useAuth } from '../../contexts/AuthContext'
import type { CreateRoleParams, Permission, Role } from '../types'

interface UseRoleOperationsProps {
  refreshPermissions: () => Promise<void>
  fetchRoles: () => Promise<void>
}

async function getPermissionId(permission: Permission): Promise<string> {
  const [resource, action] = permission.split(':')
  const { data } = await supabase
    .from('permissions')
    .select('id')
    .eq('resource', resource)
    .eq('action', action)
    .single()

  if (!data) throw new Error(`Permission not found: ${permission}`)
  return data.id
}

export function useRoleOperations({ refreshPermissions, fetchRoles }: UseRoleOperationsProps) {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()

  const createRole = useCallback(
    async (params: CreateRoleParams): Promise<Role> => {
      if (!currentOrg) throw new Error('No organization selected')
      if (!user) throw new Error('Must be authenticated')

      const { data: role, error } = await supabase
        .from('roles')
        .insert({
          organization_id: currentOrg.id,
          name: params.name,
          description: params.description,
          color: params.color || '#6B7280',
          icon: params.icon,
        })
        .select()
        .single()

      if (error) throw error

      const records = await Promise.all(
        params.permissions.map(async (perm) => ({
          role_id: role.id,
          permission_id: await getPermissionId(perm),
          granted: true,
          granted_by: user.id,
        }))
      )

      const { error: permsError } = await supabase.from('role_permissions').insert(records)
      if (permsError) throw permsError

      await fetchRoles()
      return { ...role, permissions: params.permissions }
    },
    [currentOrg, user, fetchRoles]
  )

  const updateRole = useCallback(
    async (roleId: string, updates: Partial<CreateRoleParams>): Promise<void> => {
      if (!user) throw new Error('Must be authenticated')

      if (updates.name || updates.description || updates.color || updates.icon) {
        const { error } = await supabase
          .from('roles')
          .update({
            name: updates.name,
            description: updates.description,
            color: updates.color,
            icon: updates.icon,
          })
          .eq('id', roleId)

        if (error) throw error
      }

      if (updates.permissions) {
        await supabase.from('role_permissions').delete().eq('role_id', roleId)

        const records = await Promise.all(
          updates.permissions.map(async (perm) => ({
            role_id: roleId,
            permission_id: await getPermissionId(perm),
            granted: true,
            granted_by: user.id,
          }))
        )

        const { error } = await supabase.from('role_permissions').insert(records)
        if (error) throw error
      }

      await fetchRoles()
    },
    [user, fetchRoles]
  )

  const deleteRole = useCallback(
    async (roleId: string): Promise<void> => {
      const { error } = await supabase.from('roles').delete().eq('id', roleId)
      if (error) throw error
      await fetchRoles()
    },
    [fetchRoles]
  )

  const assignRole = useCallback(
    async (userId: string, roleId: string, expiresAt?: string): Promise<void> => {
      if (!currentOrg) throw new Error('No organization selected')
      if (!user) throw new Error('Must be authenticated')

      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role_id: roleId,
        organization_id: currentOrg.id,
        granted_by: user.id,
        expires_at: expiresAt,
      })

      if (error) throw error
      await refreshPermissions()
    },
    [currentOrg, user, refreshPermissions]
  )

  const revokeRole = useCallback(
    async (userRoleId: string): Promise<void> => {
      if (!user) throw new Error('Must be authenticated')

      const { error } = await supabase
        .from('user_roles')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: user.id,
        })
        .eq('id', userRoleId)

      if (error) throw error
      await refreshPermissions()
    },
    [user, refreshPermissions]
  )

  return { createRole, updateRole, deleteRole, assignRole, revokeRole }
}
