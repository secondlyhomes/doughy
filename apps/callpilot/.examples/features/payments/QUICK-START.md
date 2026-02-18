# Stripe Payments - Quick Start Guide

Get up and running with Stripe payments in 15 minutes.

## 1. Install Dependencies

```bash
npm install @stripe/stripe-react-native
```

## 2. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Go to Developers → API keys
3. Copy your **Publishable key** (pk_test_...)
4. Copy your **Secret key** (sk_test_...)

## 3. Store Keys in Supabase

```sql
-- Connect to your Supabase project
-- Go to SQL Editor and run:

INSERT INTO vault.secrets (name, secret)
VALUES
  ('stripe_secret_key', 'sk_test_YOUR_KEY_HERE'),
  ('stripe_publishable_key', 'pk_test_YOUR_KEY_HERE');
```

## 4. Run Database Migration

```bash
# Create migration
supabase migration new stripe_payments

# Copy schema.sql contents into the migration file
# Then apply:
supabase db reset  # local
# or
supabase db push   # remote
```

## 5. Create Products in Stripe

1. Go to Stripe Dashboard → Products
2. Click "Add product"
3. Create:
   - **Monthly**: $9.99/month (recurring)
   - **Yearly**: $95.99/year (recurring)
4. Copy the **Price IDs** (price_xxx...)

## 6. Update Price IDs in Code

Edit `stripe/types.ts`:

```typescript
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    stripePriceId: 'price_YOUR_MONTHLY_PRICE_ID', // ← UPDATE THIS
    stripeProductId: 'prod_YOUR_PRODUCT_ID',       // ← UPDATE THIS
    amount: 999,
    currency: 'usd',
    interval: 'month',
    intervalCount: 1,
    features: [
      'Unlimited access',
      'Premium features',
      'Priority support',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly',
    stripePriceId: 'price_YOUR_YEARLY_PRICE_ID',   // ← UPDATE THIS
    stripeProductId: 'prod_YOUR_PRODUCT_ID',       // ← UPDATE THIS
    amount: 9599,
    currency: 'usd',
    interval: 'year',
    intervalCount: 1,
    features: [
      'All monthly features',
      'Save 20%',
      'Early access',
    ],
    recommended: true,
  },
]
```

## 7. Deploy Edge Functions

```bash
cd .examples/edge-functions/stripe

# Deploy all functions
supabase functions deploy create-checkout-session
supabase functions deploy create-subscription
supabase functions deploy cancel-subscription
supabase functions deploy handle-webhook

# Set environment variables (if needed)
supabase secrets set SOME_SECRET=value
```

## 8. Configure Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL:
   ```
   https://YOUR_PROJECT.supabase.co/functions/v1/handle-webhook
   ```
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.*`
   - `invoice.*`
5. Click "Add endpoint"
6. Copy the **Signing secret** (whsec_...)
7. Store in Supabase:
   ```sql
   INSERT INTO vault.secrets (name, secret)
   VALUES ('stripe_webhook_secret', 'whsec_YOUR_SECRET_HERE');
   ```

## 9. Add to Your App

In `App.tsx`:

```typescript
import { StripeContextProvider } from './features/payments/stripe/StripeContext'

export default function App() {
  return (
    <StripeContextProvider>
      {/* Your existing app */}
    </StripeContextProvider>
  )
}
```

## 10. Use Components

### Show Pricing Plans

```typescript
import { SubscriptionPlans } from './features/payments/components/SubscriptionPlans'

export function PricingScreen() {
  return (
    <SubscriptionPlans
      onSubscribed={() => navigation.navigate('Success')}
    />
  )
}
```

### Show Subscription Status

```typescript
import { SubscriptionStatus } from './features/payments/components/SubscriptionStatus'

export function AccountScreen() {
  return (
    <View>
      <SubscriptionStatus />
    </View>
  )
}
```

### Check if User is Premium

```typescript
import { useSubscriptionStatus } from './features/payments/stripe/StripeContext'

export function PremiumFeature() {
  const { isPremium, isLoading } = useSubscriptionStatus()

  if (isLoading) return <LoadingSpinner />
  if (!isPremium) return <UpgradePrompt />

  return <PremiumContent />
}
```

## 11. Test It

### Using Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 9995 | Decline |

Use any future date for expiration, any 3-digit CVC.

### Test Flow

1. Open app
2. Navigate to pricing screen
3. Select a plan
4. Enter test card: 4242 4242 4242 4242
5. Complete payment
6. Check database:
   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'your-user-id';
   ```
7. Verify subscription shows as active

## 12. Test Webhooks Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-brew/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to http://localhost:54321/functions/v1/handle-webhook

# In another terminal, trigger events
stripe trigger customer.subscription.created
```

## Common Commands

### Check subscription

```typescript
import { getCurrentSubscription } from './features/payments/stripe/subscriptionService'

const subscription = await getCurrentSubscription()
console.log(subscription)
```

### Cancel subscription

```typescript
import { cancelSubscription } from './features/payments/stripe/subscriptionService'

await cancelSubscription({
  subscriptionId: 'sub_xxx',
  immediately: false, // or true
})
```

### Open billing portal

```typescript
import { getBillingPortalUrl } from './features/payments/stripe/subscriptionService'

const url = await getBillingPortalUrl('your-app://return')
await Linking.openURL(url)
```

## Troubleshooting

### "Configuration error"
- Check Stripe keys are in Vault
- Verify keys start with pk_test_ and sk_test_

### "Subscription not found"
- Webhook might not have processed
- Check Stripe Dashboard → Events
- Check `stripe_events` table

### Payment succeeds but no subscription
- Verify webhook endpoint is correct
- Check webhook secret is correct
- Look for errors in Edge Function logs

## Next Steps

- [ ] Switch to live mode when ready (replace test keys with live keys)
- [ ] Update CORS for production domain
- [ ] Set up monitoring for webhook failures
- [ ] Test cancellation and reactivation flows
- [ ] Add trial periods to plans
- [ ] Implement promo codes (Stripe Coupons)

## Resources

- [Full README](./README.md) - Complete documentation
- [Stripe Docs](https://stripe.com/docs)
- [Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)

## Support

If stuck:
1. Check Edge Function logs in Supabase Dashboard
2. Check Stripe Dashboard → Events
3. Check database tables for data
4. Review console logs in app
