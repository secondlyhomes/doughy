/**
 * useRBACOperations Hook
 *
 * Combines role and resource permission operations.
 */

import { useRoleOperations } from './useRoleOperations'
import { useResourcePermissions } from './useResourcePermissions'

interface UseRBACOperationsProps {
  refreshPermissions: () => Promise<void>
  fetchRoles: () => Promise<void>
}

export function useRBACOperations({ refreshPermissions, fetchRoles }: UseRBACOperationsProps) {
  const roleOps = useRoleOperations({ refreshPermissions, fetchRoles })
  const resourceOps = useResourcePermissions()

  return {
    ...roleOps,
    ...resourceOps,
  }
}
