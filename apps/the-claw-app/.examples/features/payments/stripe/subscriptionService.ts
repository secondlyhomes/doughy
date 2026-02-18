/**
 * Subscription Service
 *
 * Handles subscription management with Stripe via Supabase Edge Functions
 */

import { supabase } from '@/lib/supabase'
import type {
  Subscription,
  SubscriptionRow,
  CreateSubscriptionInput,
  SubscriptionResponse,
  CancelSubscriptionInput,
  transformSubscription,
} from './types'

/**
 * Get current user's active subscription
 */
export async function getCurrentSubscription(): Promise<Subscription | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(error.message)
  }

  return transformSubscription(data as SubscriptionRow)
}

/**
 * Get all user's subscriptions (including canceled)
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as SubscriptionRow[]).map(transformSubscription)
}

/**
 * Create a new subscription
 * Calls Edge Function to create subscription via Stripe API
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<SubscriptionResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('create-subscription', {
    body: {
      priceId: input.priceId,
      paymentMethodId: input.paymentMethodId,
      trialPeriodDays: input.trialPeriodDays,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    subscription: transformSubscription(data.subscription),
    clientSecret: data.clientSecret,
    requiresAction: data.requiresAction,
  }
}

/**
 * Cancel a subscription
 * Calls Edge Function to cancel subscription via Stripe API
 */
export async function cancelSubscription(
  input: CancelSubscriptionInput
): Promise<Subscription> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('cancel-subscription', {
    body: {
      subscriptionId: input.subscriptionId,
      immediately: input.immediately ?? false,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return transformSubscription(data.subscription)
}

/**
 * Reactivate a canceled subscription before period end
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<Subscription> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('reactivate-subscription', {
    body: { subscriptionId },
  })

  if (error) {
    throw new Error(error.message)
  }

  return transformSubscription(data.subscription)
}

/**
 * Update subscription (change plan, payment method, etc.)
 */
export async function updateSubscription(
  subscriptionId: string,
  updates: {
    priceId?: string
    paymentMethodId?: string
  }
): Promise<Subscription> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('update-subscription', {
    body: {
      subscriptionId,
      ...updates,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return transformSubscription(data.subscription)
}

/**
 * Get subscription billing portal URL
 * Allows user to manage their subscription, payment methods, and invoices
 */
export async function getBillingPortalUrl(returnUrl: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('create-billing-portal', {
    body: { returnUrl },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data.url
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getCurrentSubscription()
  return subscription !== null && subscription.status === 'active'
}

/**
 * Check if user is in trial period
 */
export async function isInTrial(): Promise<boolean> {
  const subscription = await getCurrentSubscription()
  if (!subscription) return false

  return (
    subscription.status === 'trialing' &&
    subscription.trialEnd !== null &&
    subscription.trialEnd > new Date()
  )
}

/**
 * Get days remaining in trial
 */
export async function getDaysRemainingInTrial(): Promise<number> {
  const subscription = await getCurrentSubscription()
  if (!subscription || !subscription.trialEnd) return 0

  const now = new Date()
  const trialEnd = subscription.trialEnd

  if (trialEnd <= now) return 0

  const diffMs = trialEnd.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Get days until subscription renewal
 */
export async function getDaysUntilRenewal(): Promise<number> {
  const subscription = await getCurrentSubscription()
  if (!subscription) return 0

  const now = new Date()
  const periodEnd = subscription.currentPeriodEnd

  if (periodEnd <= now) return 0

  const diffMs = periodEnd.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Check if subscription is set to cancel at period end
 */
export async function willCancelAtPeriodEnd(): Promise<boolean> {
  const subscription = await getCurrentSubscription()
  return subscription?.cancelAt !== null
}
