/**
 * TypeScript interfaces for Subscription Plans components
 */

import type { ViewStyle, TextStyle } from 'react-native'

/**
 * Props for the main SubscriptionPlans component
 */
export interface SubscriptionPlansProps {
  onSubscribed?: () => void
}

/**
 * Pricing plan structure (matches PRICING_PLANS from stripe/types)
 */
export interface PricingPlan {
  id: string
  name: string
  description: string
  amount: number
  interval: 'month' | 'year'
  stripePriceId: string
  features: string[]
  recommended?: boolean
}

/**
 * Props for the PlanCard component
 */
export interface PlanCardProps {
  plan: PricingPlan
  isSelected: boolean
  savingsPercent: number
  onSelect: (planId: string) => void
}

/**
 * Props for the FeatureList component
 */
export interface FeatureListProps {
  features: string[]
}

/**
 * Return type for useSubscriptionPlans hook
 */
export interface UseSubscriptionPlansReturn {
  selectedPlanId: string | null
  isLoading: boolean
  setSelectedPlanId: (planId: string) => void
  handleSubscribe: () => Promise<void>
  calculateSavingsPercent: (plan: PricingPlan) => number
}

/**
 * Dynamic styles that depend on theme
 */
export interface DynamicStyles {
  container: ViewStyle
  planCard: (isSelected: boolean) => ViewStyle
  recommendedBadge: ViewStyle
  savingsBadge: ViewStyle
  selectedIndicator: ViewStyle
  subscribeButton: (disabled: boolean) => ViewStyle
  title: TextStyle
  subtitle: TextStyle
  planName: TextStyle
  planDescription: TextStyle
  priceAmount: TextStyle
  priceInterval: TextStyle
  featureText: TextStyle
  subscribeButtonText: TextStyle
  disclaimer: TextStyle
}
