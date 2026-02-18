/**
 * Feature Flags System
 *
 * Comprehensive feature flag system for gradual rollouts, A/B testing,
 * and per-organization feature management
 *
 * @example
 * ```tsx
 * // In app root
 * <FeatureFlagProvider>
 *   <App />
 * </FeatureFlagProvider>
 *
 * // In components
 * const { isEnabled } = useFeatureFlags()
 * if (isEnabled('new-ui')) {
 *   return <NewUI />
 * }
 *
 * // Or use FeatureGate component
 * <FeatureGate flag="new-ui" fallback={<OldUI />}>
 *   <NewUI />
 * </FeatureGate>
 * ```
 */

// Types
export type {
  FeatureFlag,
  FeatureFlagEvaluation,
  FeatureFlagContextValue,
  FeatureFlagProviderProps,
  FeatureGateProps,
} from './types'

// Provider
export { FeatureFlagProvider } from './FeatureFlagProvider'

// Hooks
export { useFeatureFlags, useFeatureFlag } from './hooks/useFeatureFlags'

// Components
export { FeatureGate } from './components/FeatureGate'

// Admin functions
export {
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  enableForUsers,
  enableForOrganizations,
  increaseRollout,
  getFeatureFlagStats,
  listFeatureFlags,
} from './admin'

// Utilities (for advanced usage)
export { evaluateFlag, hashString } from './utils'
