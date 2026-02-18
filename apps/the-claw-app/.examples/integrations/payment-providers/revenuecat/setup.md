# RevenueCat Integration Setup

Complete guide for integrating RevenueCat for in-app purchases and subscriptions.

## Overview

RevenueCat provides:
- Cross-platform subscription management
- iOS App Store and Google Play billing
- Server-side receipt validation
- Analytics and insights
- Easy integration with React Native

## Prerequisites

- RevenueCat account (https://www.revenuecat.com)
- iOS App Store Connect account (for iOS)
- Google Play Console account (for Android)
- Expo app with bare workflow or development build

## Installation

```bash
# Install RevenueCat SDK
npx expo install react-native-purchases

# Install required dependencies
npm install expo-application
```

## Environment Variables

Add to `.env`:

```env
# RevenueCat API Keys
EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY=goog_xxx

# Shared secret (optional, for webhooks)
REVENUECAT_WEBHOOK_SECRET=sk_xxx
```

## Project Structure

```
src/
├── services/
│   └── revenuecat/
│       ├── purchaseClient.ts     # RevenueCat initialization
│       ├── subscriptionService.ts # Subscription operations
│       └── productService.ts      # Product catalog
├── contexts/
│   └── SubscriptionContext.tsx   # React context for purchases
├── screens/
│   ├── paywall-screen.tsx        # Subscription paywall
│   └── subscription-screen.tsx   # Manage subscription
└── types/
    └── subscription.ts           # TypeScript types

supabase/
└── functions/
    └── revenuecat-webhook/       # Handle RevenueCat webhooks
```

## Database Schema

```sql
-- Subscription entitlements
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  revenuecat_customer_id text not null,
  subscription_id text,
  product_id text not null,
  entitlement_id text not null,
  is_active boolean default true,
  expires_at timestamptz,
  purchase_date timestamptz not null,
  original_purchase_date timestamptz,
  store text check (store in ('app_store', 'play_store', 'stripe', 'promotional')),
  is_sandbox boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Purchase history
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  revenuecat_customer_id text not null,
  transaction_id text not null unique,
  product_id text not null,
  store text not null,
  purchase_date timestamptz not null,
  revenue_usd decimal(10,2),
  is_trial_conversion boolean default false,
  created_at timestamptz default now()
);

-- Indexes
create index idx_entitlements_user_id on public.entitlements(user_id);
create index idx_entitlements_active on public.entitlements(is_active);
create index idx_purchases_user_id on public.purchases(user_id);
create index idx_purchases_transaction on public.purchases(transaction_id);

-- RLS Policies
alter table public.entitlements enable row level security;
alter table public.purchases enable row level security;

create policy "Users can view own entitlements"
  on public.entitlements for select
  using (auth.uid() = user_id);

create policy "Users can view own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

create policy "Service role full access to entitlements"
  on public.entitlements for all
  using (auth.jwt() ->> 'role' = 'service_role');

create policy "Service role full access to purchases"
  on public.purchases for all
  using (auth.jwt() ->> 'role' = 'service_role');
```

## Configuration

### 1. Configure Products in App Stores

**iOS (App Store Connect):**
1. Create products in App Store Connect
2. Note the product IDs (e.g., `premium_monthly`, `premium_yearly`)
3. Set up pricing and availability

**Android (Google Play Console):**
1. Create products in Google Play Console
2. Note the product IDs (must match iOS for cross-platform)
3. Set up pricing and availability

### 2. Configure RevenueCat Dashboard

1. Create app in RevenueCat dashboard
2. Add App Store Connect credentials
3. Add Google Play credentials
4. Create Offerings and attach products
5. Set up Entitlements

### 3. Initialize RevenueCat in App

```typescript
// App.tsx
import { initializePurchases } from '@/services/revenuecat/purchaseClient';
import { Platform } from 'react-native';

export function App() {
  useEffect(() => {
    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY,
    });

    if (apiKey) {
      initializePurchases(apiKey);
    }
  }, []);

  return (
    <SubscriptionProvider>
      {/* Your app content */}
    </SubscriptionProvider>
  );
}
```

### 4. Configure Webhooks

1. In RevenueCat Dashboard, go to Integrations → Webhooks
2. Add webhook URL: `https://[PROJECT_REF].supabase.co/functions/v1/revenuecat-webhook`
3. Select events to send:
   - Initial Purchase
   - Renewal
   - Cancellation
   - Expiration
   - Billing Issue
4. Copy authorization header to Supabase secrets

## Product Configuration

Create an Offerings configuration in RevenueCat:

```json
{
  "default": {
    "packages": [
      {
        "identifier": "$rc_monthly",
        "platform_product_identifier": "premium_monthly"
      },
      {
        "identifier": "$rc_annual",
        "platform_product_identifier": "premium_yearly"
      }
    ]
  },
  "promo": {
    "packages": [
      {
        "identifier": "$rc_monthly",
        "platform_product_identifier": "premium_monthly_promo"
      }
    ]
  }
}
```

## Testing

### Test Purchases

**iOS:**
1. Create sandbox tester account in App Store Connect
2. Sign out of App Store on device
3. Make test purchase (will prompt for sandbox account)
4. No charges to real account

**Android:**
1. Add test account in Google Play Console
2. Use license testing account
3. Configure test purchases to be free

### Restore Purchases

```typescript
import { restorePurchases } from '@/services/revenuecat/subscriptionService';

// Test restore
const result = await restorePurchases();
console.log('Restored entitlements:', result.entitlements);
```

## Security Checklist

- [ ] Never expose RevenueCat secret API key in client
- [ ] Validate purchases server-side via webhooks
- [ ] Store entitlements in Supabase with RLS
- [ ] Verify user identity before granting access
- [ ] Handle subscription status changes via webhooks
- [ ] Implement restore purchases functionality
- [ ] Test sandbox mode thoroughly
- [ ] Handle edge cases (refunds, cancellations)
- [ ] Log all purchase events for audit
- [ ] Implement proper error handling

## Common Pitfalls

### 1. Not Handling Anonymous Users

```typescript
// WRONG - RevenueCat allows anonymous users
await Purchases.configure({ apiKey });

// CORRECT - Identify user when logged in
await Purchases.configure({ apiKey });

// Later, when user logs in
if (user) {
  await Purchases.logIn(user.id);
}
```

### 2. Not Syncing with Backend

```typescript
// WRONG - Trusting client state only
const { entitlements } = await Purchases.getCustomerInfo();

// CORRECT - Verify with backend
const { entitlements } = await Purchases.getCustomerInfo();
await syncEntitlementsWithBackend(entitlements);
```

### 3. Missing Restore Flow

```typescript
// WRONG - No restore option
// User reinstalls app and loses subscription

// CORRECT - Provide restore option
<button onClick={handleRestore}>
  Restore Purchases
</button>
```

## Performance Tips

1. **Cache Offerings** - Don't fetch on every render
2. **Use Webhooks** - Don't poll for status changes
3. **Batch Operations** - Sync multiple entitlements at once
4. **Lazy Load Paywalls** - Only load when needed
5. **Optimize Images** - Use optimized assets for paywall

## Monitoring

```typescript
// Track purchase events
import { trackEvent } from '@/services/analytics';

// Track purchase start
trackEvent('purchase_initiated', {
  productId,
  price,
  currency,
});

// Track purchase success
trackEvent('purchase_completed', {
  productId,
  revenue,
  transactionId,
});

// Track purchase failure
trackEvent('purchase_failed', {
  productId,
  error: error.message,
});
```

## Migration from Stripe

If migrating from Stripe to RevenueCat:

1. RevenueCat supports Stripe as a billing platform
2. Configure Stripe integration in RevenueCat dashboard
3. Map existing Stripe products to RevenueCat products
4. Handle existing subscribers via webhooks
5. Maintain backward compatibility during transition

## Next Steps

1. Review example code in this directory
2. Set up products in App Store and Play Store
3. Configure RevenueCat dashboard
4. Create database tables with provided schema
5. Deploy webhook Edge Function
6. Test with sandbox accounts
7. Review RevenueCat documentation: https://docs.revenuecat.com

## Resources

- [RevenueCat Documentation](https://docs.revenuecat.com)
- [React Native SDK](https://docs.revenuecat.com/docs/reactnative)
- [iOS Setup Guide](https://docs.revenuecat.com/docs/ios-products)
- [Android Setup Guide](https://docs.revenuecat.com/docs/android-products)
- [Webhooks](https://docs.revenuecat.com/docs/webhooks)
