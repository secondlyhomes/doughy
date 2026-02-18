/**
 * types.ts
 *
 * Type definitions for permission guard components.
 */

import type { ReactNode } from 'react'
import type { Permission } from '../RBACContext'

// ============================================================================
// PERMISSION GUARD TYPES
// ============================================================================

export interface PermissionGuardProps {
  /**
   * Required permission(s) to render children.
   * Can be a single permission or an array of permissions.
   */
  permission?: Permission | Permission[]

  /**
   * Require any of the permissions (OR logic) vs all permissions (AND logic).
   * Default: 'all'
   */
  requireMode?: 'any' | 'all'

  /**
   * Content to render if user has permission.
   */
  children: ReactNode

  /**
   * Optional content to render if user lacks permission.
   * If not provided, nothing is rendered.
   */
  fallback?: ReactNode

  /**
   * Optional function to render custom unauthorized message.
   */
  renderUnauthorized?: () => ReactNode

  /**
   * If true, shows a default "Unauthorized" message when permission is denied.
   * Default: false
   */
  showUnauthorizedMessage?: boolean
}

// ============================================================================
// ROLE GUARD TYPES
// ============================================================================

export interface RoleGuardProps {
  /**
   * Required role(s). User must have at least one of these roles.
   */
  roles: string | string[]

  /**
   * Content to render if user has role.
   */
  children: ReactNode

  /**
   * Optional content to render if user lacks role.
   */
  fallback?: ReactNode
}

// ============================================================================
// FEATURE FLAG GUARD TYPES
// ============================================================================

export interface FeatureFlagGuardProps {
  /**
   * Feature flag to check (from organization settings).
   */
  feature: string

  /**
   * Content to render if feature is enabled.
   */
  children: ReactNode

  /**
   * Optional content to render if feature is disabled.
   */
  fallback?: ReactNode
}

// ============================================================================
// SUBSCRIPTION GUARD TYPES
// ============================================================================

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise'

export interface SubscriptionGuardProps {
  /**
   * Minimum subscription tier required.
   */
  minTier: SubscriptionTier

  /**
   * Content to render if subscription tier is sufficient.
   */
  children: ReactNode

  /**
   * Optional content to render if subscription tier is insufficient.
   */
  fallback?: ReactNode

  /**
   * Optional upgrade prompt component.
   */
  renderUpgradePrompt?: (currentTier: string, requiredTier: string) => ReactNode
}

// ============================================================================
// COMBINED GUARD TYPES
// ============================================================================

export interface CombinedGuardProps {
  /**
   * Permission requirements.
   */
  permission?: Permission | Permission[]

  /**
   * Role requirements.
   */
  role?: string | string[]

  /**
   * Feature flag requirements.
   */
  feature?: string

  /**
   * Subscription tier requirement.
   */
  minTier?: SubscriptionTier

  /**
   * Logic mode: require all conditions or any condition.
   * Default: 'all'
   */
  mode?: 'all' | 'any'

  /**
   * Content to render if conditions are met.
   */
  children: ReactNode

  /**
   * Optional content to render if conditions are not met.
   */
  fallback?: ReactNode
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
}
