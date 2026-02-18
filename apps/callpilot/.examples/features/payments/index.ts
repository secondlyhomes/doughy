/**
 * Stripe Payments - Feature Export
 *
 * Centralized exports for the payments feature
 */

// Context and Hooks
export {
  StripeContextProvider,
  useStripe,
  useSubscriptionStatus,
  usePaymentMethods,
} from './stripe/StripeContext'

// Services
export {
  getCurrentSubscription,
  getAllSubscriptions,
  createSubscription,
  cancelSubscription,
  reactivateSubscription,
  updateSubscription,
  getBillingPortalUrl,
  hasActiveSubscription,
  isInTrial,
  getDaysRemainingInTrial,
  getDaysUntilRenewal,
  willCancelAtPeriodEnd,
} from './stripe/subscriptionService'

export {
  getPaymentMethods,
  getDefaultPaymentMethod,
  setDefaultPaymentMethod,
  removePaymentMethod,
  createCheckoutSession,
  createPaymentIntent,
  getStripePublishableKey,
  attachPaymentMethod,
  verifyPaymentStatus,
} from './stripe/paymentService'

// Components
export { SubscriptionPlans } from './components/SubscriptionPlans'
export { PaymentSheet } from './components/PaymentSheet'
export { SubscriptionStatus } from './components/SubscriptionStatus'

// Types
export type {
  Subscription,
  SubscriptionStatus,
  PaymentMethod,
  Invoice,
  PaymentStatus,
  SubscriptionInterval,
  PricingPlan,
  CreateCheckoutSessionInput,
  CheckoutSessionResponse,
  CreateSubscriptionInput,
  SubscriptionResponse,
  CancelSubscriptionInput,
  CreatePaymentIntentInput,
  PaymentIntentResponse,
  StripeWebhookEvent,
} from './stripe/types'

export { PRICING_PLANS } from './stripe/types'
