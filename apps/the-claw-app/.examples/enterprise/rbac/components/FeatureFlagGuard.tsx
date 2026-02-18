/**
 * FeatureFlagGuard.tsx
 *
 * Component-level feature flag guard for conditional rendering.
 *
 * Usage:
 * ```tsx
 * <FeatureFlagGuard feature="ai_enabled">
 *   <AIAssistantButton />
 * </FeatureFlagGuard>
 * ```
 */

import React from 'react'
import { useOrganization } from '../OrganizationContext'
import type { FeatureFlagGuardProps } from './types'

export function FeatureFlagGuard({ feature, children, fallback }: FeatureFlagGuardProps) {
  const { currentOrg } = useOrganization()

  if (!currentOrg) {
    return fallback ? <>{fallback}</> : null
  }

  const isEnabled = currentOrg.settings.features[feature] === true

  if (isEnabled) {
    return <>{children}</>
  }

  return fallback ? <>{fallback}</> : null
}
