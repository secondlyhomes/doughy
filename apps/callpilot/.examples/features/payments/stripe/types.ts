/**
 * Stripe Payment Types
 *
 * Type definitions for Stripe payment integration with Supabase backend
 */

/**
 * Subscription status values
 */
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

/**
 * Payment status values
 */
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'

/**
 * Subscription interval
 */
export type SubscriptionInterval = 'month' | 'year'

/**
 * Database row for subscriptions table
 */
export interface SubscriptionRow {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  stripe_price_id: string
  stripe_product_id: string
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at: string | null
  canceled_at: string | null
  trial_end: string | null
  created_at: string
  updated_at: string
}

/**
 * Database row for payment_methods table
 */
export interface PaymentMethodRow {
  id: string
  user_id: string
  stripe_payment_method_id: string
  stripe_customer_id: string
  type: string
  card_brand: string | null
  card_last4: string | null
  card_exp_month: number | null
  card_exp_year: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}

/**
 * Database row for invoices table
 */
export interface InvoiceRow {
  id: string
  user_id: string
  stripe_invoice_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string
  amount: number
  currency: string
  status: string
  invoice_url: string | null
  invoice_pdf: string | null
  paid_at: string | null
  created_at: string
}

/**
 * Application-level subscription type
 */
export interface Subscription {
  id: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  stripeProductId: string
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAt: Date | null
  canceledAt: Date | null
  trialEnd: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Application-level payment method type
 */
export interface PaymentMethod {
  id: string
  userId: string
  stripePaymentMethodId: string
  stripeCustomerId: string
  type: string
  cardBrand: string | null
  cardLast4: string | null
  cardExpMonth: number | null
  cardExpYear: number | null
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Application-level invoice type
 */
export interface Invoice {
  id: string
  userId: string
  stripeInvoiceId: string
  stripeSubscriptionId: string | null
  stripeCustomerId: string
  amount: number
  currency: string
  status: string
  invoiceUrl: string | null
  invoicePdf: string | null
  paidAt: Date | null
  createdAt: Date
}

/**
 * Pricing plan definition
 */
export interface PricingPlan {
  id: string
  name: string
  description: string
  stripePriceId: string
  stripeProductId: string
  amount: number
  currency: string
  interval: SubscriptionInterval
  intervalCount: number
  features: string[]
  recommended?: boolean
}

/**
 * Checkout session creation input
 */
export interface CreateCheckoutSessionInput {
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

/**
 * Checkout session response
 */
export interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

/**
 * Create subscription input
 */
export interface CreateSubscriptionInput {
  priceId: string
  paymentMethodId?: string
  trialPeriodDays?: number
}

/**
 * Subscription response
 */
export interface SubscriptionResponse {
  subscription: Subscription
  clientSecret?: string
  requiresAction?: boolean
}

/**
 * Cancel subscription input
 */
export interface CancelSubscriptionInput {
  subscriptionId: string
  immediately?: boolean
}

/**
 * Payment intent creation input
 */
export interface CreatePaymentIntentInput {
  amount: number
  currency: string
  metadata?: Record<string, string>
}

/**
 * Payment intent response
 */
export interface PaymentIntentResponse {
  clientSecret: string
  paymentIntentId: string
}

/**
 * Stripe webhook event payload
 */
export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
  created: number
}

/**
 * Transform database row to application type for Subscription
 */
export function transformSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeCustomerId: row.stripe_customer_id,
    stripePriceId: row.stripe_price_id,
    stripeProductId: row.stripe_product_id,
    status: row.status,
    currentPeriodStart: new Date(row.current_period_start),
    currentPeriodEnd: new Date(row.current_period_end),
    cancelAt: row.cancel_at ? new Date(row.cancel_at) : null,
    canceledAt: row.canceled_at ? new Date(row.canceled_at) : null,
    trialEnd: row.trial_end ? new Date(row.trial_end) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Transform database row to application type for PaymentMethod
 */
export function transformPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    userId: row.user_id,
    stripePaymentMethodId: row.stripe_payment_method_id,
    stripeCustomerId: row.stripe_customer_id,
    type: row.type,
    cardBrand: row.card_brand,
    cardLast4: row.card_last4,
    cardExpMonth: row.card_exp_month,
    cardExpYear: row.card_exp_year,
    isDefault: row.is_default,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Transform database row to application type for Invoice
 */
export function transformInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    userId: row.user_id,
    stripeInvoiceId: row.stripe_invoice_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripeCustomerId: row.stripe_customer_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    invoiceUrl: row.invoice_url,
    invoicePdf: row.invoice_pdf,
    paidAt: row.paid_at ? new Date(row.paid_at) : null,
    createdAt: new Date(row.created_at),
  }
}

/**
 * Pricing plans configuration
 * Replace with your actual Stripe price IDs
 */
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    description: 'Perfect for getting started',
    stripePriceId: 'price_monthly_xxxxx', // Replace with actual Stripe price ID
    stripeProductId: 'prod_xxxxx', // Replace with actual Stripe product ID
    amount: 999,
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    features: [
      'Unlimited access',
      'Premium features',
      'Priority support',
      'No ads',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    description: 'Best value - save 20%',
    stripePriceId: 'price_yearly_xxxxx', // Replace with actual Stripe price ID
    stripeProductId: 'prod_xxxxx', // Replace with actual Stripe product ID
    amount: 9599,
    currency: 'usd',
    interval: 'year',
    intervalCount: 1,
    features: [
      'All monthly features',
      'Save 20%',
      'Annual roadmap input',
      'Early access to new features',
    ],
    recommended: true,
  },
]
