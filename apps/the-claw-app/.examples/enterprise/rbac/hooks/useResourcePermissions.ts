/**
 * useResourcePermissions Hook
 *
 * Operations for resource-level permissions.
 */

import { useCallback } from 'react'
import { supabase } from '../../services/supabase'
import { useOrganization } from '../../contexts/OrganizationContext'
import { useAuth } from '../../contexts/AuthContext'
import type { GrantResourcePermissionParams } from '../types'

export function useResourcePermissions() {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()

  const grantResourcePermission = useCallback(
    async (params: GrantResourcePermissionParams): Promise<void> => {
      if (!currentOrg) throw new Error('No organization selected')
      if (!user) throw new Error('Must be authenticated')
      if (!params.userId && !params.roleId) {
        throw new Error('Must specify either userId or roleId')
      }

      const { error } = await supabase.from('resource_permissions').insert({
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        user_id: params.userId,
        role_id: params.roleId,
        organization_id: currentOrg.id,
        permissions: params.permissions,
        granted_by: user.id,
        expires_at: params.expiresAt,
      })

      if (error) throw error
    },
    [currentOrg, user]
  )

  const revokeResourcePermission = useCallback(async (permissionId: string): Promise<void> => {
    const { error } = await supabase.from('resource_permissions').delete().eq('id', permissionId)
    if (error) throw error
  }, [])

  return { grantResourcePermission, revokeResourcePermission }
}
