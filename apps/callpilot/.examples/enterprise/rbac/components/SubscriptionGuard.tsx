/**
 * SubscriptionGuard.tsx
 *
 * Component-level subscription tier guard for conditional rendering.
 *
 * Usage:
 * ```tsx
 * <SubscriptionGuard
 *   minTier="professional"
 *   renderUpgradePrompt={(current, required) => (
 *     <UpgradePrompt
 *       message={`Upgrade from ${current} to ${required} to use this feature`}
 *     />
 *   )}
 * >
 *   <AdvancedAnalytics />
 * </SubscriptionGuard>
 * ```
 */

import React from 'react'
import { useOrganization } from '../OrganizationContext'
import { TIER_HIERARCHY, type SubscriptionGuardProps } from './types'

export function SubscriptionGuard({
  minTier,
  children,
  fallback,
  renderUpgradePrompt,
}: SubscriptionGuardProps) {
  const { currentOrg } = useOrganization()

  if (!currentOrg) {
    return fallback ? <>{fallback}</> : null
  }

  const currentTierLevel = TIER_HIERARCHY[currentOrg.subscription_tier]
  const requiredTierLevel = TIER_HIERARCHY[minTier]

  const hasAccess = currentTierLevel >= requiredTierLevel

  if (hasAccess) {
    return <>{children}</>
  }

  if (renderUpgradePrompt) {
    return <>{renderUpgradePrompt(currentOrg.subscription_tier, minTier)}</>
  }

  return fallback ? <>{fallback}</> : null
}
