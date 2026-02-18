/**
 * TypeScript interfaces for Subscription Status components
 */

import { ViewStyle, TextStyle } from 'react-native'

/**
 * Theme type representing the application theme
 */
export interface Theme {
  colors: {
    surface: string
    primary: string
    border: string
    warning: string
    error: string
    success: string
    text: {
      primary: string
      secondary: string
      inverse: string
    }
  }
}

/**
 * Subscription data from the subscription service
 */
export interface Subscription {
  stripeSubscriptionId: string
  status: string
  currentPeriodEnd: string
  cancelAt?: string | null
}

/**
 * Props for the StatusBadge component
 */
export interface StatusBadgeProps {
  statusText: string
  statusColor: string
  isTrial: boolean
  daysUntilRenewal: number | null
  theme: Theme
}

/**
 * Props for the DetailRow component
 */
export interface DetailRowProps {
  label: string
  value: string
  theme: Theme
}

/**
 * Props for the PlanDetails component
 */
export interface PlanDetailsProps {
  subscription: Subscription | null
  daysUntilRenewal: number | null
  theme: Theme
}

/**
 * Props for the ActionButtons component
 */
export interface ActionButtonsProps {
  subscription: Subscription | null
  isLoading: boolean
  theme: Theme
  onManageBilling: () => void
  onCancelSubscription: () => void
  onReactivateSubscription: () => void
}

/**
 * Props for the NoSubscription view
 */
export interface NoSubscriptionProps {
  theme: Theme
}

/**
 * Return type for the useSubscriptionStatusLogic hook
 */
export interface UseSubscriptionStatusLogicReturn {
  subscription: Subscription | null
  isSubscribed: boolean
  isTrial: boolean
  isPremium: boolean
  isLoading: boolean
  daysUntilRenewal: number | null
  theme: Theme
  statusColor: string
  statusText: string
  renewalDate: string
  handleCancelSubscription: () => void
  handleReactivateSubscription: () => void
  handleManageBilling: () => void
}
