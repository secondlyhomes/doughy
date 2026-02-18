# Stripe Payment Integration - File Structure

Complete overview of all files in the Stripe payment integration.

## Directory Structure

```
.examples/
├── features/
│   └── payments/
│       ├── components/          # React Native UI components
│       │   ├── PaymentSheet.tsx
│       │   ├── SubscriptionPlans.tsx
│       │   └── SubscriptionStatus.tsx
│       ├── stripe/              # Core payment logic
│       │   ├── StripeContext.tsx
│       │   ├── subscriptionService.ts
│       │   ├── paymentService.ts
│       │   └── types.ts
│       ├── database/            # SQL migrations
│       │   ├── schema.sql
│       │   └── profile-migration.sql
│       ├── index.ts             # Feature exports
│       ├── README.md            # Full documentation
│       ├── QUICK-START.md       # 15-minute setup guide
│       └── STRUCTURE.md         # This file
└── edge-functions/
    └── stripe/                  # Supabase Edge Functions
        ├── _shared/
        │   └── cors.ts
        ├── create-checkout-session/
        │   └── index.ts
        ├── create-subscription/
        │   └── index.ts
        ├── cancel-subscription/
        │   └── index.ts
        └── handle-webhook/
            └── index.ts
```

## File Descriptions

### Components (`components/`)

#### `SubscriptionPlans.tsx`
- Displays available pricing plans
- Handles plan selection
- Initiates subscription creation
- Shows features and pricing
- Mobile-optimized UI with theme tokens

**Usage:**
```typescript
<SubscriptionPlans onSubscribed={() => navigate('Success')} />
```

#### `PaymentSheet.tsx`
- One-time payment collection
- Integrates Stripe Payment Sheet
- Handles payment confirmation
- Shows amount and description
- 3D Secure support

**Usage:**
```typescript
<PaymentSheet
  amount={4999}
  currency="usd"
  description="Premium unlock"
  onPaymentSuccess={(id) => console.log(id)}
/>
```

#### `SubscriptionStatus.tsx`
- Shows current subscription status
- Manage subscription (cancel/reactivate)
- Open billing portal
- Display renewal dates
- Trial status indicator

**Usage:**
```typescript
<SubscriptionStatus />
```

### Core Logic (`stripe/`)

#### `StripeContext.tsx`
- React Context provider for Stripe state
- Manages subscription data
- Handles payment methods
- Provides hooks for consuming components
- Wraps app with StripeProvider

**Exports:**
- `StripeContextProvider` - Wrap your app
- `useStripe()` - Access full Stripe state
- `useSubscriptionStatus()` - Subscription-specific state
- `usePaymentMethods()` - Payment method management

#### `subscriptionService.ts`
- Subscription CRUD operations
- Call Edge Functions for server-side operations
- Transform database types to app types
- Utility functions (hasActiveSubscription, etc.)

**Functions:**
- `getCurrentSubscription()` - Get active subscription
- `createSubscription()` - Start new subscription
- `cancelSubscription()` - Cancel subscription
- `reactivateSubscription()` - Undo cancellation
- `updateSubscription()` - Change plan
- `getBillingPortalUrl()` - Get Stripe portal URL
- `hasActiveSubscription()` - Check if user is subscribed
- `isInTrial()` - Check if in trial period
- `getDaysRemainingInTrial()` - Trial days left
- `getDaysUntilRenewal()` - Days until next bill
- `willCancelAtPeriodEnd()` - Check if canceling

#### `paymentService.ts`
- One-time payment operations
- Payment method management
- Payment intent creation
- Stripe configuration retrieval

**Functions:**
- `getPaymentMethods()` - List saved payment methods
- `getDefaultPaymentMethod()` - Get default method
- `setDefaultPaymentMethod()` - Set new default
- `removePaymentMethod()` - Delete payment method
- `createCheckoutSession()` - Create checkout for web
- `createPaymentIntent()` - Create payment intent
- `getStripePublishableKey()` - Get publishable key
- `attachPaymentMethod()` - Attach method to customer
- `verifyPaymentStatus()` - Check payment status

#### `types.ts`
- TypeScript type definitions
- Database row types
- Application types
- Transform functions
- Pricing plan configuration

**Types:**
- `Subscription` - Subscription data
- `PaymentMethod` - Payment method data
- `Invoice` - Invoice data
- `PricingPlan` - Plan configuration
- Input/Output types for all operations

**Constants:**
- `PRICING_PLANS` - Array of available plans (UPDATE WITH YOUR STRIPE IDs)

### Database (`database/`)

#### `schema.sql`
- Complete payment database schema
- Tables: subscriptions, payment_methods, invoices, payments, stripe_events
- RLS policies for security
- Indexes for performance
- Triggers for automation
- Helper functions

**Tables:**
- `subscriptions` - User subscription records
- `payment_methods` - Saved payment methods
- `invoices` - Invoice records
- `payments` - Payment tracking
- `stripe_events` - Webhook idempotency

**Run with:**
```bash
supabase migration new stripe_payments
# Copy schema.sql contents
supabase db reset
```

#### `profile-migration.sql`
- Adds `stripe_customer_id` to profiles
- Creates profiles table if needed
- Sets up RLS policies
- Auto-creates profile on signup

**Run if needed:**
```bash
supabase migration new add_stripe_to_profiles
# Copy profile-migration.sql contents
supabase db reset
```

### Edge Functions (`edge-functions/stripe/`)

#### `_shared/cors.ts`
- CORS headers configuration
- Security headers
- Shared across all functions

#### `create-checkout-session/index.ts`
- Creates Stripe Checkout session
- For web-based payment flows
- Returns checkout URL
- Handles customer creation

**Endpoint:** `POST /functions/v1/create-checkout-session`

**Body:**
```json
{
  "priceId": "price_xxx",
  "successUrl": "https://...",
  "cancelUrl": "https://...",
  "metadata": {}
}
```

#### `create-subscription/index.ts`
- Creates subscription directly
- For mobile payment flows
- Handles payment method attachment
- Supports trial periods
- Returns client secret if action needed

**Endpoint:** `POST /functions/v1/create-subscription`

**Body:**
```json
{
  "priceId": "price_xxx",
  "paymentMethodId": "pm_xxx",  // optional
  "trialPeriodDays": 7           // optional
}
```

#### `cancel-subscription/index.ts`
- Cancels user subscription
- Option for immediate or end-of-period
- Verifies user owns subscription
- Updates database

**Endpoint:** `POST /functions/v1/cancel-subscription`

**Body:**
```json
{
  "subscriptionId": "sub_xxx",
  "immediately": false  // true for immediate cancellation
}
```

#### `handle-webhook/index.ts`
- Processes Stripe webhook events
- Verifies webhook signature
- Ensures idempotency
- Updates database based on events
- Handles all subscription lifecycle events

**Endpoint:** `POST /functions/v1/handle-webhook`

**Events handled:**
- `checkout.session.completed`
- `customer.subscription.*`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_intent.*`
- `payment_method.attached/detached`

### Documentation

#### `README.md`
- Complete feature documentation
- Architecture overview
- Setup instructions
- Usage examples
- Testing guide
- Production checklist
- Troubleshooting

#### `QUICK-START.md`
- 15-minute setup guide
- Step-by-step instructions
- Common commands
- Quick reference

#### `STRUCTURE.md`
- This file
- Complete file listing
- Purpose of each file
- How everything connects

#### `index.ts`
- Feature barrel export
- Re-exports all public APIs
- Provides clean import paths

## Import Paths

From your app:

```typescript
// Components
import {
  SubscriptionPlans,
  PaymentSheet,
  SubscriptionStatus,
} from '@/examples/features/payments'

// Context & Hooks
import {
  StripeContextProvider,
  useStripe,
  useSubscriptionStatus,
  usePaymentMethods,
} from '@/examples/features/payments'

// Services
import {
  getCurrentSubscription,
  createSubscription,
  cancelSubscription,
  getPaymentMethods,
  createPaymentIntent,
} from '@/examples/features/payments'

// Types
import type {
  Subscription,
  PaymentMethod,
  PricingPlan,
} from '@/examples/features/payments'
```

## Setup Checklist

- [ ] Install `@stripe/stripe-react-native`
- [ ] Run `database/schema.sql` migration
- [ ] Run `database/profile-migration.sql` if needed
- [ ] Store Stripe keys in Supabase Vault
- [ ] Create products in Stripe Dashboard
- [ ] Update `PRICING_PLANS` in `stripe/types.ts`
- [ ] Deploy all Edge Functions
- [ ] Configure webhook in Stripe Dashboard
- [ ] Store webhook secret in Vault
- [ ] Wrap app with `StripeContextProvider`
- [ ] Test with test cards
- [ ] Test webhook with Stripe CLI
- [ ] Switch to live mode when ready

## Data Flow

### Subscription Creation

```
User → SubscriptionPlans Component
       ↓ (user selects plan)
       createSubscription()
       ↓
       Edge Function: create-subscription
       ↓
       Stripe API
       ↓ (webhook)
       Edge Function: handle-webhook
       ↓
       Database: subscriptions table
       ↓ (real-time or polling)
       StripeContext refreshes
       ↓
       UI updates
```

### Payment Processing

```
User → PaymentSheet Component
       ↓
       createPaymentIntent()
       ↓
       Edge Function: create-payment-intent
       ↓
       Returns clientSecret
       ↓
       Stripe Payment Sheet
       ↓ (user confirms)
       Stripe processes payment
       ↓ (webhook)
       Edge Function: handle-webhook
       ↓
       Database: payments table
       ↓
       onPaymentSuccess callback
```

## Security Model

- **Client**: Read-only access to own data
- **Edge Functions**: Full access with authentication
- **Webhooks**: Service role access with signature verification
- **RLS**: Users can only view their own payment data
- **Secrets**: Stored in Supabase Vault, never in code

## Dependencies

### Required npm packages:
- `@stripe/stripe-react-native` - Stripe SDK for React Native

### Supabase features:
- Edge Functions (Deno runtime)
- Vault (secret storage)
- RLS (row-level security)
- Real-time (optional, for live updates)

### Stripe features:
- Products & Prices
- Subscriptions
- Payment Intents
- Customers
- Webhooks

## Next Steps After Setup

1. Customize pricing plans
2. Add trial period logic
3. Implement promo codes
4. Add usage-based billing (if needed)
5. Create upgrade/downgrade flows
6. Build analytics dashboard
7. Set up payment failure alerts
8. Configure tax collection (Stripe Tax)

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe React Native**: https://stripe.com/docs/payments/accept-a-payment?platform=react-native
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **This Blueprint**: See main project documentation
