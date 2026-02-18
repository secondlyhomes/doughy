/**
 * CombinedGuard.tsx
 *
 * Combined guard that can check multiple conditions (permissions, roles, features, subscription).
 * Useful when you need to check permission AND subscription tier, etc.
 *
 * Usage:
 * ```tsx
 * <CombinedGuard
 *   permission="analytics:export"
 *   minTier="professional"
 *   mode="all"
 * >
 *   <ExportButton />
 * </CombinedGuard>
 * ```
 */

import React from 'react'
import { useRBAC } from '../RBACContext'
import { useOrganization } from '../OrganizationContext'
import { TIER_HIERARCHY, type CombinedGuardProps } from './types'

export function CombinedGuard({
  permission,
  role,
  feature,
  minTier,
  mode = 'all',
  children,
  fallback,
}: CombinedGuardProps) {
  const { hasPermission, hasAnyPermission, userRoles, loading: rbacLoading } = useRBAC()
  const { currentOrg } = useOrganization()

  if (rbacLoading || !currentOrg) {
    return null
  }

  const checks: boolean[] = []

  // Check permissions
  if (permission) {
    if (Array.isArray(permission)) {
      checks.push(hasAnyPermission(...permission))
    } else {
      checks.push(hasPermission(permission))
    }
  }

  // Check roles
  if (role) {
    const requiredRoles = Array.isArray(role) ? role : [role]
    const userRoleNames = userRoles.map(ur => ur.role.name)
    checks.push(requiredRoles.some(r => userRoleNames.includes(r)))
  }

  // Check feature flag
  if (feature) {
    checks.push(currentOrg.settings.features[feature] === true)
  }

  // Check subscription tier
  if (minTier) {
    const currentTierLevel = TIER_HIERARCHY[currentOrg.subscription_tier]
    const requiredTierLevel = TIER_HIERARCHY[minTier]
    checks.push(currentTierLevel >= requiredTierLevel)
  }

  // Evaluate based on mode
  const hasAccess = mode === 'all'
    ? checks.every(check => check)
    : checks.some(check => check)

  if (hasAccess) {
    return <>{children}</>
  }

  return fallback ? <>{fallback}</> : null
}
