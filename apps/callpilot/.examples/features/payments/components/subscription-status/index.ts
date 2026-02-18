/**
 * Subscription Status Module
 *
 * Clean re-exports for the subscription status component and related utilities
 */

// Main component
export { SubscriptionStatus } from './SubscriptionStatus'

// Sub-components (for custom compositions)
export { StatusBadge } from './components/StatusBadge'
export { DetailRow } from './components/DetailRow'
export { PlanDetails } from './components/PlanDetails'
export { ActionButtons } from './components/ActionButtons'

// Hooks
export { useSubscriptionStatusLogic } from './hooks/useSubscriptionStatusLogic'

// Types
export type {
  Theme,
  Subscription,
  StatusBadgeProps,
  DetailRowProps,
  PlanDetailsProps,
  ActionButtonsProps,
  NoSubscriptionProps,
  UseSubscriptionStatusLogicReturn,
} from './types'

// Styles (for extending or custom components)
export { styles } from './styles'
