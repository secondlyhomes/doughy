/**
 * usePermissionGuard.ts
 *
 * Hooks for programmatic permission, role, and subscription checking.
 */

import { useRBAC, type Permission } from '../../RBACContext'
import { useOrganization } from '../../OrganizationContext'
import { TIER_HIERARCHY, type SubscriptionTier } from '../types'

// ============================================================================
// PERMISSION HOOKS
// ============================================================================

/**
 * Hook for programmatic permission checking.
 */
export function usePermissionCheck(permission: Permission): boolean {
  const { hasPermission } = useRBAC()
  return hasPermission(permission)
}

/**
 * Hook for checking multiple permissions with various modes.
 */
export function usePermissionsCheck(
  permissions: Permission[],
  mode: 'any' | 'all' = 'all'
): boolean {
  const { hasAnyPermission, hasAllPermissions } = useRBAC()

  return mode === 'any'
    ? hasAnyPermission(...permissions)
    : hasAllPermissions(...permissions)
}

// ============================================================================
// ROLE HOOKS
// ============================================================================

/**
 * Hook for checking if user has a specific role.
 */
export function useRoleCheck(roleName: string): boolean {
  const { userRoles } = useRBAC()
  return userRoles.some(ur => ur.role.name === roleName)
}

/**
 * Hook for checking if user has any of the specified roles.
 */
export function useRolesCheck(roleNames: string[]): boolean {
  const { userRoles } = useRBAC()
  const userRoleNameList = userRoles.map(ur => ur.role.name)
  return roleNames.some(role => userRoleNameList.includes(role))
}

// ============================================================================
// FEATURE FLAG HOOKS
// ============================================================================

/**
 * Hook for checking if a feature flag is enabled.
 */
export function useFeatureFlag(feature: string): boolean {
  const { currentOrg } = useOrganization()

  if (!currentOrg) {
    return false
  }

  return currentOrg.settings.features[feature] === true
}

// ============================================================================
// SUBSCRIPTION HOOKS
// ============================================================================

/**
 * Hook for checking if current subscription meets minimum tier.
 */
export function useSubscriptionCheck(minTier: SubscriptionTier): boolean {
  const { currentOrg } = useOrganization()

  if (!currentOrg) {
    return false
  }

  const currentTierLevel = TIER_HIERARCHY[currentOrg.subscription_tier]
  const requiredTierLevel = TIER_HIERARCHY[minTier]

  return currentTierLevel >= requiredTierLevel
}

/**
 * Hook that returns current subscription tier.
 */
export function useCurrentTier(): SubscriptionTier | null {
  const { currentOrg } = useOrganization()
  return currentOrg?.subscription_tier ?? null
}
