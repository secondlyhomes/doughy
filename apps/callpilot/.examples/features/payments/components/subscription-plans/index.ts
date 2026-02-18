/**
 * Subscription Plans Module
 *
 * Clean re-exports for the subscription plans component and related utilities
 */

// Main component
export { SubscriptionPlans } from './SubscriptionPlans'

// Sub-components (for advanced composition)
export { PlanCard } from './components/PlanCard'
export { FeatureList } from './components/FeatureList'

// Hook (for custom implementations)
export { useSubscriptionPlans } from './hooks/useSubscriptionPlans'

// Types
export type {
  SubscriptionPlansProps,
  PlanCardProps,
  FeatureListProps,
  PricingPlan,
  UseSubscriptionPlansReturn,
} from './types'

// Styles (for extending)
export { styles } from './styles'
