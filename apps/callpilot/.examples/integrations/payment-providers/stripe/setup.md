# Stripe Integration Setup

Complete guide for integrating Stripe payments into your React Native + Expo + Supabase app.

## Overview

This integration provides:
- Payment processing with Stripe
- Subscription management
- Webhook handling via Supabase Edge Functions
- Secure payment flows with PCI compliance

## Prerequisites

- Stripe account (https://stripe.com)
- Supabase project with Edge Functions enabled
- Expo app with bare workflow or development build

## Installation

```bash
# Install Stripe SDK
npx expo install @stripe/stripe-react-native

# Install required dependencies
npm install stripe @stripe/stripe-js
```

## Environment Variables

Add to `.env`:

```env
# Client-side (safe for mobile app)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Server-side (Supabase Edge Functions only)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Add to Supabase Edge Functions secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## Project Structure

```
src/
├── services/
│   └── stripe/
│       ├── stripeClient.ts       # Stripe SDK initialization
│       ├── paymentService.ts     # Payment operations
│       └── subscriptionService.ts # Subscription operations
├── contexts/
│   └── StripeContext.tsx         # React context for Stripe
├── screens/
│   ├── checkout-screen.tsx       # Checkout flow
│   └── subscription-screen.tsx   # Subscription management
└── types/
    └── stripe.ts                 # TypeScript types

supabase/
└── functions/
    ├── stripe-checkout/          # Create checkout session
    ├── stripe-webhook/           # Handle Stripe webhooks
    └── stripe-subscription/      # Manage subscriptions
```

## Database Schema

```sql
-- Customer records
create table public.stripe_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  stripe_customer_id text not null unique,
  email text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subscription records
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status text not null check (status in (
    'active', 'past_due', 'canceled', 'incomplete',
    'incomplete_expired', 'trialing', 'unpaid'
  )),
  plan_id text not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  canceled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payment records
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  stripe_payment_intent_id text not null unique,
  amount bigint not null, -- Amount in cents
  currency text not null default 'usd',
  status text not null check (status in (
    'succeeded', 'processing', 'requires_payment_method',
    'requires_confirmation', 'requires_action', 'canceled', 'failed'
  )),
  description text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_stripe_customers_user_id on public.stripe_customers(user_id);
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);
create index idx_payments_user_id on public.payments(user_id);
create index idx_payments_status on public.payments(status);

-- RLS Policies
alter table public.stripe_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

-- Users can read their own customer record
create policy "Users can view own customer record"
  on public.stripe_customers for select
  using (auth.uid() = user_id);

-- Users can read their own subscriptions
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Users can read their own payments
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Service role can do everything (for webhooks)
create policy "Service role full access to stripe_customers"
  on public.stripe_customers for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to subscriptions"
  on public.subscriptions for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to payments"
  on public.payments for all
  using (auth.jwt() ->> 'role' = 'service_role');
```

## Configuration

### 1. Initialize Stripe in App

```typescript
// App.tsx
import { StripeProvider } from '@stripe/stripe-react-native';

export function App() {
  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.yourapp" // For Apple Pay
    >
      {/* Your app content */}
    </StripeProvider>
  );
}
```

### 2. Configure Webhooks

1. In Stripe Dashboard, go to Developers → Webhooks
2. Add endpoint: `https://[PROJECT_REF].supabase.co/functions/v1/stripe-webhook`
3. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to Supabase secrets

### 3. Deploy Edge Functions

```bash
# Deploy checkout session function
supabase functions deploy stripe-checkout

# Deploy webhook handler
supabase functions deploy stripe-webhook

# Deploy subscription management
supabase functions deploy stripe-subscription
```

## Testing

### Test Cards

```typescript
// Use Stripe test cards
const TEST_CARDS = {
  success: '4242424242424242',
  declined: '4000000000000002',
  requiresAuth: '4000002500003155',
  insufficientFunds: '4000000000009995',
};
```

### Test Mode

```typescript
// stripeClient.ts
const isTestMode = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_');

if (isTestMode) {
  console.warn('Stripe running in TEST mode');
}
```

## Security Checklist

- [ ] Never expose secret key in client code
- [ ] Always validate webhook signatures
- [ ] Use HTTPS for all Stripe communications
- [ ] Implement idempotency for payment operations
- [ ] Store customer data securely with RLS
- [ ] Log all payment events for audit trail
- [ ] Handle PCI compliance requirements
- [ ] Implement retry logic for failed payments
- [ ] Use Stripe Customer Portal for self-service
- [ ] Validate amounts server-side (never trust client)

## Common Pitfalls

### 1. Amount Confusion

```typescript
// WRONG - Stripe uses cents
const amount = 10.99;

// CORRECT - Convert to cents
const amount = Math.round(10.99 * 100); // 1099 cents
```

### 2. Missing Error Handling

```typescript
// WRONG - No error handling
const paymentIntent = await stripe.paymentIntents.create({...});

// CORRECT - Handle errors
try {
  const paymentIntent = await stripe.paymentIntents.create({...});
} catch (error) {
  if (error.type === 'StripeCardError') {
    // Card was declined
  } else if (error.type === 'StripeInvalidRequestError') {
    // Invalid parameters
  } else {
    // Other error
  }
}
```

### 3. Webhook Replay Attacks

```typescript
// WRONG - No signature verification
app.post('/webhook', (req, res) => {
  const event = req.body;
  handleEvent(event);
});

// CORRECT - Verify signature
app.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  handleEvent(event);
});
```

## Performance Tips

1. **Use Payment Intents API** - More reliable than deprecated APIs
2. **Implement Webhooks** - Don't poll for payment status
3. **Cache Customer IDs** - Store in database to avoid lookups
4. **Use Stripe Customer Portal** - Let Stripe handle UI
5. **Batch Operations** - Use bulk APIs when possible

## Monitoring

```typescript
// Track payment metrics
import { trackEvent } from '@/services/analytics';

// Track payment start
trackEvent('payment_initiated', {
  amount,
  currency,
  method,
});

// Track payment success
trackEvent('payment_succeeded', {
  paymentIntentId,
  amount,
  currency,
});

// Track payment failure
trackEvent('payment_failed', {
  error: error.message,
  amount,
  currency,
});
```

## Next Steps

1. Review example code in this directory
2. Set up Stripe Dashboard and get API keys
3. Create database tables with provided schema
4. Deploy Edge Functions for webhook handling
5. Test with Stripe test cards
6. Configure production webhooks
7. Review Stripe documentation: https://stripe.com/docs

## Resources

- [Stripe React Native SDK](https://stripe.com/docs/mobile/react-native)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [PCI Compliance](https://stripe.com/docs/security/guide)
