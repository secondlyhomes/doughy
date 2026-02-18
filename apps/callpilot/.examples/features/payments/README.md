# Stripe Payment Integration

Complete Stripe payment integration for React Native with Supabase backend, supporting both subscriptions and one-time payments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Usage](#usage)
- [Subscription Flow](#subscription-flow)
- [One-Time Payment Flow](#one-time-payment-flow)
- [Webhook Handling](#webhook-handling)
- [Testing](#testing)
- [Production Checklist](#production-checklist)
- [Troubleshooting](#troubleshooting)

## Overview

This implementation provides:

- **Subscriptions**: Recurring billing with trials, cancellations, and upgrades
- **One-time payments**: Single purchase flows
- **Payment methods**: Save and manage customer payment methods
- **Secure architecture**: All sensitive operations server-side via Edge Functions
- **Webhook handling**: Real-time subscription sync via Stripe webhooks
- **Mobile-first**: Integrated with `@stripe/stripe-react-native`

## Prerequisites

### Stripe Account

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Dashboard → Developers → API keys
3. Note both **Publishable key** and **Secret key**

### Required Packages

```bash
npm install @stripe/stripe-react-native
```

### Supabase Configuration

- Supabase project with Edge Functions enabled
- Vault configured for secrets storage

## Setup

### 1. Store Stripe Keys in Supabase Vault

```sql
-- Store Stripe secret key
INSERT INTO vault.secrets (name, secret)
VALUES ('stripe_secret_key', 'sk_test_xxxxx');

-- Store Stripe webhook secret (after webhook setup)
INSERT INTO vault.secrets (name, secret)
VALUES ('stripe_webhook_secret', 'whsec_xxxxx');

-- Store Stripe publishable key (for client)
INSERT INTO vault.secrets (name, secret)
VALUES ('stripe_publishable_key', 'pk_test_xxxxx');
```

### 2. Create Database Tables

```bash
# Run the schema migration
supabase migration new stripe_payments
# Copy contents from database/schema.sql into the migration file
supabase db reset  # or supabase db push
```

### 3. Create Stripe Products and Prices

In Stripe Dashboard → Products:

1. **Create Product**: "Premium Monthly"
   - Price: $9.99/month
   - Copy Price ID (starts with `price_`)

2. **Create Product**: "Premium Yearly"
   - Price: $95.99/year
   - Copy Price ID

3. Update `stripe/types.ts` with your actual Price IDs:

```typescript
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    stripePriceId: 'price_1ABC123...', // YOUR PRICE ID
    stripeProductId: 'prod_ABC123...',  // YOUR PRODUCT ID
    // ... rest
  },
]
```

### 4. Deploy Edge Functions

```bash
# Deploy checkout session function
supabase functions deploy create-checkout-session

# Deploy subscription functions
supabase functions deploy create-subscription
supabase functions deploy cancel-subscription

# Deploy webhook handler
supabase functions deploy handle-stripe-webhook
```

### 5. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-project.supabase.co/functions/v1/handle-stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.created`
   - `customer.updated`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Store in Vault as `stripe_webhook_secret`

### 6. Add to App

Wrap your app with `StripeContextProvider`:

```typescript
// App.tsx
import { StripeContextProvider } from '@/features/payments/stripe/StripeContext'

export default function App() {
  return (
    <StripeContextProvider>
      {/* Your app */}
    </StripeContextProvider>
  )
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ SubscriptionPlans│  │  PaymentSheet  │  │Subscription │ │
│  │                 │  │                 │  │  Status     │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           └────────────────────┴───────────────────┘        │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │ StripeContext   │                      │
│                    └────────┬────────┘                      │
└─────────────────────────────┼──────────────────────────────┘
                              │
                    ┌─────────▼────────┐
                    │ Supabase Client  │
                    └─────────┬────────┘
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                    Supabase Backend                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Edge Functions (Auth Required)            │ │
│  │  • create-checkout-session                             │ │
│  │  • create-subscription                                 │ │
│  │  • cancel-subscription                                 │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  Stripe API     │                        │
│                  └────────┬────────┘                        │
└───────────────────────────┼──────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
     ┌──────▼──────┐              ┌────────▼────────┐
     │   Stripe    │   Webhooks   │  Edge Function  │
     │   Server    │─────────────→│  (Webhook)      │
     └─────────────┘              └────────┬────────┘
                                           │
                                  ┌────────▼────────┐
                                  │    Database     │
                                  │  • subscriptions│
                                  │  • invoices     │
                                  │  • payments     │
                                  └─────────────────┘
```

## Database Schema

### Tables Created

1. **subscriptions** - User subscription records
2. **payment_methods** - Saved payment methods
3. **invoices** - Invoice records
4. **payments** - Payment attempt tracking
5. **stripe_events** - Webhook event log (idempotency)

### Key RLS Policies

- Users can **view** their own data
- Only **service_role** can **modify** data (via Edge Functions)
- This ensures all payment operations are server-validated

## Usage

### Display Pricing Plans

```typescript
import { SubscriptionPlans } from '@/features/payments/components/SubscriptionPlans'

export function PricingScreen() {
  return (
    <SubscriptionPlans
      onSubscribed={() => {
        // Navigate to success screen
        navigation.navigate('SubscriptionSuccess')
      }}
    />
  )
}
```

### Show Subscription Status

```typescript
import { SubscriptionStatus } from '@/features/payments/components/SubscriptionStatus'

export function AccountScreen() {
  return (
    <View>
      <SubscriptionStatus />
    </View>
  )
}
```

### One-Time Payment

```typescript
import { PaymentSheet } from '@/features/payments/components/PaymentSheet'

export function CheckoutScreen() {
  return (
    <PaymentSheet
      amount={4999} // $49.99 in cents
      currency="usd"
      description="Premium feature unlock"
      onPaymentSuccess={(paymentIntentId) => {
        console.log('Payment successful:', paymentIntentId)
      }}
      onPaymentError={(error) => {
        console.error('Payment failed:', error)
      }}
    />
  )
}
```

### Check Subscription Status in Code

```typescript
import { useSubscriptionStatus } from '@/features/payments/stripe/StripeContext'

export function PremiumFeature() {
  const { isPremium, isLoading } = useSubscriptionStatus()

  if (isLoading) return <LoadingSpinner />

  if (!isPremium) {
    return <UpgradePrompt />
  }

  return <PremiumContent />
}
```

### Manage Payment Methods

```typescript
import { usePaymentMethods } from '@/features/payments/stripe/StripeContext'
import { removePaymentMethod } from '@/features/payments/stripe/paymentService'

export function PaymentMethodsScreen() {
  const { paymentMethods, refresh } = usePaymentMethods()

  const handleRemove = async (methodId: string) => {
    await removePaymentMethod(methodId)
    await refresh()
  }

  return (
    <FlatList
      data={paymentMethods}
      renderItem={({ item }) => (
        <PaymentMethodCard
          method={item}
          onRemove={() => handleRemove(item.id)}
        />
      )}
    />
  )
}
```

## Subscription Flow

### User Subscribes

1. User selects plan in `SubscriptionPlans` component
2. Component calls `createSubscription()` service function
3. Edge Function creates Stripe subscription
4. If payment method needed, returns `clientSecret`
5. App presents Stripe Payment Sheet
6. User completes payment
7. Stripe sends webhook to your server
8. Webhook handler updates database
9. App refreshes subscription status

### User Cancels

1. User clicks "Cancel" in `SubscriptionStatus` component
2. Component calls `cancelSubscription()` service function
3. Edge Function calls Stripe API to cancel
4. Subscription set to cancel at period end
5. User retains access until end of billing period
6. Stripe sends webhook when subscription ends
7. Database updated via webhook

### User Reactivates

1. User clicks "Reactivate" before period end
2. Component calls `reactivateSubscription()` service function
3. Edge Function updates Stripe subscription
4. Cancellation removed
5. Subscription continues normally

## One-Time Payment Flow

1. User initiates payment
2. App calls `createPaymentIntent()` service function
3. Edge Function creates Stripe PaymentIntent
4. Returns `clientSecret` to app
5. App presents Stripe Payment Sheet with secret
6. User completes payment
7. Stripe processes payment
8. App confirms payment status
9. Webhook notifies server of completion
10. Invoice record created in database

## Webhook Handling

### How It Works

1. Stripe sends event to webhook URL
2. Webhook handler verifies signature (prevents spoofing)
3. Checks for duplicate events (idempotency)
4. Logs event to `stripe_events` table
5. Processes event based on type
6. Updates database accordingly
7. Marks event as processed

### Supported Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Link customer to user, send notification |
| `customer.subscription.created` | Create subscription record |
| `customer.subscription.updated` | Update subscription status, dates |
| `customer.subscription.deleted` | Mark subscription as canceled |
| `invoice.paid` | Record payment, update status |
| `invoice.payment_failed` | Record failure, notify user |
| `customer.created` | Save customer ID to profile |
| `customer.updated` | Update customer info |

### Idempotency

Webhooks can be sent multiple times. The handler:
- Checks `stripe_events` table for existing event ID
- Skips processing if already handled
- Logs all events for audit trail

## Testing

### Test Mode

Stripe has separate test and live modes. Always test in **Test Mode** first.

### Test Cards

Use these cards in Test Mode:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0025 0000 3155 | Requires 3D Secure authentication |

Any future date for expiration, any 3-digit CVC.

### Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe  # macOS
# or download from stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local Supabase
stripe listen --forward-to \
  http://localhost:54321/functions/v1/handle-stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

### Test Subscription Lifecycle

1. **Create subscription**
   ```bash
   stripe trigger customer.subscription.created
   ```

2. **Update subscription**
   ```bash
   stripe trigger customer.subscription.updated
   ```

3. **Cancel subscription**
   ```bash
   stripe trigger customer.subscription.deleted
   ```

4. **Payment failure**
   ```bash
   stripe trigger invoice.payment_failed
   ```

### Verify Database

After webhook events:

```sql
-- Check subscription was created
SELECT * FROM subscriptions WHERE user_id = 'your-user-id';

-- Check event was logged
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 10;

-- Check invoice was recorded
SELECT * FROM invoices WHERE user_id = 'your-user-id';
```

## Production Checklist

### Before Launch

- [ ] **Replace test API keys** with live keys in Vault
- [ ] **Update Stripe product IDs** in `stripe/types.ts`
- [ ] **Configure webhook endpoint** with live endpoint URL
- [ ] **Test subscription flow** end-to-end in live mode
- [ ] **Test cancellation flow**
- [ ] **Test payment failure handling**
- [ ] **Verify webhook signature** validation is working
- [ ] **Check RLS policies** are properly configured
- [ ] **Review error handling** and user-facing messages
- [ ] **Set up monitoring** for webhook failures
- [ ] **Configure CORS** headers for your domain

### Security Checklist

- [ ] **Never expose** `stripe_secret_key` to client
- [ ] **Always verify** webhook signatures
- [ ] **Use RLS** on all payment tables
- [ ] **Validate** all user inputs in Edge Functions
- [ ] **Log** all payment operations for audit
- [ ] **Use HTTPS** only for webhook endpoint
- [ ] **Rate limit** Edge Functions (via Supabase)
- [ ] **Monitor** for unusual patterns

### Compliance

- [ ] Display **pricing clearly** (with taxes if applicable)
- [ ] Provide **terms of service** and **privacy policy**
- [ ] Allow **easy cancellation** (GDPR requirement)
- [ ] Store **minimal payment data** (only refs to Stripe)
- [ ] Implement **refund policy** if applicable
- [ ] Handle **disputed charges** process

## Troubleshooting

### "Subscription not found" error

**Cause**: Webhook hasn't processed yet or failed

**Fix**:
1. Check `stripe_events` table for recent events
2. Look for `processed = false` entries
3. Check Edge Function logs for errors
4. Manually trigger webhook processing

### Payment succeeds but subscription not active

**Cause**: Webhook delay or failure

**Fix**:
1. Check Stripe Dashboard → Events for webhook delivery
2. Verify webhook endpoint is correct
3. Check webhook signature is valid
4. Manually sync from Stripe:
   ```typescript
   // In Edge Function
   const subscription = await stripe.subscriptions.retrieve(subscriptionId)
   await handleSubscriptionUpdated(supabase, subscription)
   ```

### "No publishable key" error

**Cause**: Publishable key not loaded or invalid

**Fix**:
1. Verify key is stored in Vault: `stripe_publishable_key`
2. Check `getStripePublishableKey()` Edge Function
3. Ensure key starts with `pk_test_` or `pk_live_`

### Webhook signature verification fails

**Cause**: Wrong webhook secret or malformed request

**Fix**:
1. Get correct secret from Stripe Dashboard → Webhooks
2. Update in Vault: `stripe_webhook_secret`
3. Verify webhook URL matches deployed function
4. Check Stripe event logs for detailed error

### User can't cancel subscription

**Cause**: Permission or Stripe API error

**Fix**:
1. Check RLS policies allow user to view their subscription
2. Verify Edge Function has correct permissions
3. Check Stripe API logs for specific error
4. Ensure subscription ID is correct

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [PCI Compliance](https://stripe.com/docs/security/guide)

## Support

For issues specific to this implementation, check:
1. Edge Function logs in Supabase Dashboard
2. Stripe Dashboard → Events for webhook deliveries
3. Database tables for data consistency
4. Application logs for client-side errors

## License

This example is part of the mobile app blueprint and follows the same license.
