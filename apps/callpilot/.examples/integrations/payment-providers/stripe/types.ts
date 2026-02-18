/**
 * Stripe TypeScript Types
 */

export interface PaymentIntent {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  amount: number; // in cents
  currency: string;
  status: PaymentStatus;
  description?: string;
  metadata?: Record<string, any>;
  client_secret?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus =
  | 'succeeded'
  | 'processing'
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'canceled'
  | 'failed';

export interface CreatePaymentIntentParams {
  amount: number; // in cents
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ConfirmPaymentParams {
  clientSecret: string;
  paymentMethodType?: 'Card' | 'Ideal' | 'Alipay';
  paymentMethodData?: {
    billingDetails?: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        city?: string;
        country?: string;
        line1?: string;
        line2?: string;
        postalCode?: string;
        state?: string;
      };
    };
  };
}

export interface StripeCustomer {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: SubscriptionStatus;
  plan_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'unpaid';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
  interval_count: number;
  trial_period_days?: number;
  features: string[];
  stripe_price_id: string;
  stripe_product_id: string;
  active: boolean;
}

export interface CreateSubscriptionParams {
  priceId: string;
  trialPeriodDays?: number;
  couponId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, any>;
}

export interface Invoice {
  id: string;
  subscription_id?: string;
  stripe_invoice_id: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'alipay' | 'ideal';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postal_code?: string;
      state?: string;
    };
  };
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}
