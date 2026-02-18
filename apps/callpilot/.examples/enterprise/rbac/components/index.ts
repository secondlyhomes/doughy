/**
 * Permission Guard Components
 *
 * Declarative components for conditional rendering based on:
 * - Permissions (PermissionGuard)
 * - Roles (RoleGuard)
 * - Feature flags (FeatureFlagGuard)
 * - Subscription tiers (SubscriptionGuard)
 * - Combined conditions (CombinedGuard)
 */

// Components
export { PermissionGuard } from './PermissionGuard'
export { RoleGuard } from './RoleGuard'
export { FeatureFlagGuard } from './FeatureFlagGuard'
export { SubscriptionGuard } from './SubscriptionGuard'
export { CombinedGuard } from './CombinedGuard'

// Hooks
export {
  usePermissionCheck,
  usePermissionsCheck,
  useRoleCheck,
  useRolesCheck,
  useFeatureFlag,
  useSubscriptionCheck,
  useCurrentTier,
} from './hooks/usePermissionGuard'

// Types
export type {
  PermissionGuardProps,
  RoleGuardProps,
  FeatureFlagGuardProps,
  SubscriptionGuardProps,
  SubscriptionTier,
  CombinedGuardProps,
} from './types'
