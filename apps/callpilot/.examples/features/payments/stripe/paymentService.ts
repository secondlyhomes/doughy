/**
 * Payment Service
 *
 * Handles one-time payments and payment methods with Stripe
 */

import { supabase } from '@/lib/supabase'
import type {
  PaymentMethod,
  PaymentMethodRow,
  CreatePaymentIntentInput,
  PaymentIntentResponse,
  CreateCheckoutSessionInput,
  CheckoutSessionResponse,
  transformPaymentMethod,
} from './types'

/**
 * Get all payment methods for current user
 */
export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as PaymentMethodRow[]).map(transformPaymentMethod)
}

/**
 * Get default payment method
 */
export async function getDefaultPaymentMethod(): Promise<PaymentMethod | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(error.message)
  }

  return transformPaymentMethod(data as PaymentMethodRow)
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase.functions.invoke('set-default-payment-method', {
    body: { paymentMethodId },
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Remove payment method
 */
export async function removePaymentMethod(paymentMethodId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { error } = await supabase.functions.invoke('remove-payment-method', {
    body: { paymentMethodId },
  })

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Create a checkout session for one-time payment
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CheckoutSessionResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId: input.priceId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: input.metadata,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    sessionId: data.sessionId,
    url: data.url,
  }
}

/**
 * Create a payment intent for custom payment flow
 */
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<PaymentIntentResponse> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: {
      amount: input.amount,
      currency: input.currency,
      metadata: input.metadata,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    clientSecret: data.clientSecret,
    paymentIntentId: data.paymentIntentId,
  }
}

/**
 * Get Stripe publishable key
 * This should be called once on app startup
 */
export async function getStripePublishableKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('get-stripe-config', {
    body: {},
  })

  if (error) {
    throw new Error(error.message)
  }

  return data.publishableKey
}

/**
 * Attach payment method to customer
 * Used after collecting payment method via Stripe Elements
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  setAsDefault = false
): Promise<PaymentMethod> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('attach-payment-method', {
    body: {
      paymentMethodId,
      setAsDefault,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return transformPaymentMethod(data.paymentMethod)
}

/**
 * Verify payment status
 * Used after payment intent confirmation
 */
export async function verifyPaymentStatus(
  paymentIntentId: string
): Promise<{
  status: 'succeeded' | 'processing' | 'requires_action' | 'failed'
  error?: string
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase.functions.invoke('verify-payment', {
    body: { paymentIntentId },
  })

  if (error) {
    throw new Error(error.message)
  }

  return {
    status: data.status,
    error: data.error,
  }
}
