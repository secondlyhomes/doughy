/**
 * Stripe Context
 *
 * Provides Stripe-related state and actions throughout the app
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { StripeProvider } from '@stripe/stripe-react-native'
import type { Subscription, PaymentMethod } from './types'
import {
  getCurrentSubscription,
  hasActiveSubscription,
  isInTrial,
} from './subscriptionService'
import { getPaymentMethods, getStripePublishableKey } from './paymentService'

/**
 * Stripe context value
 */
interface StripeContextValue {
  // Subscription state
  subscription: Subscription | null
  isSubscribed: boolean
  isTrial: boolean
  isLoading: boolean

  // Payment methods
  paymentMethods: PaymentMethod[]
  defaultPaymentMethod: PaymentMethod | null

  // Actions
  refreshSubscription: () => Promise<void>
  refreshPaymentMethods: () => Promise<void>

  // Stripe publishable key
  publishableKey: string | null
}

const StripeContext = createContext<StripeContextValue | undefined>(undefined)

/**
 * Stripe Provider Component
 */
export function StripeContextProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isTrial, setIsTrial] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<PaymentMethod | null>(
    null
  )
  const [publishableKey, setPublishableKey] = useState<string | null>(null)

  /**
   * Load Stripe publishable key
   */
  useEffect(() => {
    loadStripeKey()
  }, [])

  const loadStripeKey = async () => {
    try {
      const key = await getStripePublishableKey()
      setPublishableKey(key)
    } catch (error) {
      console.error('Failed to load Stripe key:', error)
    }
  }

  /**
   * Refresh subscription data
   */
  const refreshSubscription = useCallback(async () => {
    setIsLoading(true)
    try {
      const [currentSub, hasActive, inTrial] = await Promise.all([
        getCurrentSubscription(),
        hasActiveSubscription(),
        isInTrial(),
      ])

      setSubscription(currentSub)
      setIsSubscribed(hasActive)
      setIsTrial(inTrial)
    } catch (error) {
      console.error('Failed to refresh subscription:', error)
      setSubscription(null)
      setIsSubscribed(false)
      setIsTrial(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Refresh payment methods
   */
  const refreshPaymentMethods = useCallback(async () => {
    try {
      const methods = await getPaymentMethods()
      setPaymentMethods(methods)

      const defaultMethod = methods.find((m) => m.isDefault) || null
      setDefaultPaymentMethod(defaultMethod)
    } catch (error) {
      console.error('Failed to refresh payment methods:', error)
      setPaymentMethods([])
      setDefaultPaymentMethod(null)
    }
  }, [])

  /**
   * Load initial data
   */
  useEffect(() => {
    refreshSubscription()
    refreshPaymentMethods()
  }, [refreshSubscription, refreshPaymentMethods])

  const value: StripeContextValue = {
    subscription,
    isSubscribed,
    isTrial,
    isLoading,
    paymentMethods,
    defaultPaymentMethod,
    refreshSubscription,
    refreshPaymentMethods,
    publishableKey,
  }

  // Don't render children until we have the publishable key
  if (!publishableKey) {
    return null
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      <StripeContext.Provider value={value}>{children}</StripeContext.Provider>
    </StripeProvider>
  )
}

/**
 * Hook to use Stripe context
 */
export function useStripe() {
  const context = useContext(StripeContext)
  if (context === undefined) {
    throw new Error('useStripe must be used within StripeContextProvider')
  }
  return context
}

/**
 * Hook to check subscription status
 */
export function useSubscriptionStatus() {
  const { subscription, isSubscribed, isTrial, isLoading } = useStripe()

  return {
    subscription,
    isSubscribed,
    isTrial,
    isLoading,
    isPremium: isSubscribed || isTrial,
    status: subscription?.status,
  }
}

/**
 * Hook to manage payment methods
 */
export function usePaymentMethods() {
  const { paymentMethods, defaultPaymentMethod, refreshPaymentMethods } = useStripe()

  return {
    paymentMethods,
    defaultPaymentMethod,
    hasPaymentMethod: paymentMethods.length > 0,
    refresh: refreshPaymentMethods,
  }
}
