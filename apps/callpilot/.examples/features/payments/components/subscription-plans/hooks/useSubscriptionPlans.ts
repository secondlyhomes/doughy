/**
 * Hook for managing subscription plans state and logic
 */

import { useState, useCallback } from 'react'
import { Alert } from 'react-native'
import { PRICING_PLANS } from '../../stripe/types'
import { createSubscription } from '../../stripe/subscriptionService'
import { useStripe } from '../../stripe/StripeContext'
import type { PricingPlan, UseSubscriptionPlansReturn } from '../types'

interface UseSubscriptionPlansOptions {
  onSubscribed?: () => void
}

export function useSubscriptionPlans({
  onSubscribed,
}: UseSubscriptionPlansOptions = {}): UseSubscriptionPlansReturn {
  const { refreshSubscription } = useStripe()

  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    PRICING_PLANS.find((p) => p.recommended)?.id || PRICING_PLANS[0]?.id || null
  )
  const [isLoading, setIsLoading] = useState(false)

  const calculateSavingsPercent = useCallback((plan: PricingPlan): number => {
    if (plan.interval !== 'year') return 0

    const monthlyPlan = PRICING_PLANS.find((p) => p.interval === 'month')
    if (!monthlyPlan) return 0

    const monthlyEquivalent = plan.amount / 12
    const savings = 1 - monthlyEquivalent / monthlyPlan.amount
    return Math.round(savings * 100)
  }, [])

  const handleSubscribe = useCallback(async () => {
    if (!selectedPlanId) return

    const plan = PRICING_PLANS.find((p) => p.id === selectedPlanId)
    if (!plan) return

    setIsLoading(true)

    try {
      const result = await createSubscription({
        priceId: plan.stripePriceId,
      })

      if (result.requiresAction && result.clientSecret) {
        // Handle 3D Secure or other payment action
        Alert.alert(
          'Payment Action Required',
          'Additional authentication is required for your payment method.'
        )
        // TODO: Implement payment sheet with client secret
      } else {
        // Subscription created successfully
        await refreshSubscription()
        onSubscribed?.()
      }
    } catch (error) {
      Alert.alert(
        'Subscription Failed',
        error instanceof Error ? error.message : 'Failed to create subscription'
      )
    } finally {
      setIsLoading(false)
    }
  }, [selectedPlanId, refreshSubscription, onSubscribed])

  return {
    selectedPlanId,
    isLoading,
    setSelectedPlanId,
    handleSubscribe,
    calculateSavingsPercent,
  }
}
