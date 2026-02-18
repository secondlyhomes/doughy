/**
 * Hook for Subscription Status logic
 *
 * Manages state, effects, and callbacks for subscription management
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert, Linking } from 'react-native'
import { useTheme } from '@/theme'
import { useSubscriptionStatus, useStripe } from '../../stripe/StripeContext'
import {
  cancelSubscription,
  reactivateSubscription,
  getBillingPortalUrl,
  getDaysUntilRenewal,
} from '../../stripe/subscriptionService'
import type { UseSubscriptionStatusLogicReturn, Theme } from '../types'

export function useSubscriptionStatusLogic(): UseSubscriptionStatusLogicReturn {
  const theme = useTheme() as Theme
  const { subscription, isSubscribed, isTrial, isPremium } = useSubscriptionStatus()
  const { refreshSubscription } = useStripe()
  const [isLoading, setIsLoading] = useState(false)
  const [daysUntilRenewal, setDaysUntilRenewal] = useState<number | null>(null)

  // Fetch days until renewal when subscription changes
  useEffect(() => {
    if (subscription) {
      getDaysUntilRenewal().then(setDaysUntilRenewal)
    }
  }, [subscription])

  // Calculate derived values
  const statusColor = isTrial
    ? theme.colors.warning
    : subscription?.cancelAt
      ? theme.colors.error
      : theme.colors.success

  const statusText = isTrial
    ? 'Trial'
    : subscription?.cancelAt
      ? 'Canceling'
      : 'Active'

  const renewalDate = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : 'N/A'

  // Handle cancel subscription with confirmation
  const handleCancelSubscription = useCallback(() => {
    if (!subscription) return

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You will retain access until the end of your billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true)
            try {
              await cancelSubscription({
                subscriptionId: subscription.stripeSubscriptionId,
                immediately: false,
              })
              await refreshSubscription()
              Alert.alert('Subscription Canceled', 'Your subscription has been canceled.')
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to cancel subscription'
              )
            } finally {
              setIsLoading(false)
            }
          },
        },
      ]
    )
  }, [subscription, refreshSubscription])

  // Handle reactivate subscription
  const handleReactivateSubscription = useCallback(async () => {
    if (!subscription) return

    setIsLoading(true)
    try {
      await reactivateSubscription(subscription.stripeSubscriptionId)
      await refreshSubscription()
      Alert.alert('Subscription Reactivated', 'Your subscription has been reactivated.')
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to reactivate subscription'
      )
    } finally {
      setIsLoading(false)
    }
  }, [subscription, refreshSubscription])

  // Handle manage billing portal
  const handleManageBilling = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = await getBillingPortalUrl('your-app://billing-return')
      await Linking.openURL(url)
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to open billing portal'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    subscription,
    isSubscribed,
    isTrial,
    isPremium,
    isLoading,
    daysUntilRenewal,
    theme,
    statusColor,
    statusText,
    renewalDate,
    handleCancelSubscription,
    handleReactivateSubscription,
    handleManageBilling,
  }
}
