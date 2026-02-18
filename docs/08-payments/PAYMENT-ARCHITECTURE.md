# Payment Architecture Overview

> RevenueCat for mobile subscriptions + Stripe for web = unified cross-platform billing.

## Overview

This architecture provides:
- **iOS/Android**: Native in-app purchases via RevenueCat
- **Web**: Stripe Checkout and Customer Portal
- **Unified entitlements**: Same premium access across all platforms
- **Server-side validation**: Never trust the client

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Devices                              │
├─────────────────┬─────────────────┬─────────────────────────────┤
│      iOS        │     Android     │            Web              │
│   App Store     │   Play Store    │          Stripe             │
└────────┬────────┴────────┬────────┴──────────────┬──────────────┘
         │                 │                       │
         ▼                 ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                       RevenueCat                                 │
│            (Unified subscription management)                     │
│  - Customer info    - Entitlements    - Webhooks                │
└────────────────────────────┬────────────────────────────────────┘
                             │ Webhook
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Edge Functions                       │
│              (Webhook handler, entitlement sync)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Database                           │
│    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│    │ subscriptions│    │ entitlements │    │    users     │     │
│    └──────────────┘    └──────────────┘    └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### RevenueCat

**What it does:**
- Wraps App Store and Play Store billing APIs
- Provides unified SDK for React Native
- Handles receipt validation
- Manages subscription lifecycle
- Sends webhooks on subscription events

**Why use it:**
- One SDK instead of two platform-specific ones
- Cross-platform subscription sharing
- Analytics and insights
- A/B testing for pricing
- Handles edge cases (refunds, grace periods, billing issues)

### Stripe

**What it does:**
- Web payment processing
- Customer Portal for self-service
- Recurring billing
- Invoice management

**Integration with RevenueCat:**
- RevenueCat can sync Stripe subscriptions
- Users can subscribe on web, access on mobile

### Supabase

**What it does:**
- Stores subscription state
- Processes webhooks
- Validates entitlements server-side
- Enforces access via RLS

## Data Flow

### Purchase Flow (iOS/Android)

```
1. User taps "Subscribe" in app
2. App calls RevenueCat SDK
3. RevenueCat presents native purchase UI
4. User completes purchase via App Store/Play Store
5. Store validates and charges user
6. RevenueCat receives receipt
7. RevenueCat validates receipt
8. RevenueCat sends webhook to our server
9. Supabase Edge Function processes webhook
10. Database updated with subscription status
11. App receives updated CustomerInfo
12. Premium features unlocked
```

### Purchase Flow (Web)

```
1. User clicks "Subscribe" on web
2. Web app creates Stripe Checkout session
3. User redirected to Stripe Checkout
4. User enters payment details
5. Stripe processes payment
6. Stripe sends webhook to RevenueCat
7. RevenueCat syncs subscription
8. RevenueCat sends webhook to our server
9. Same as mobile flow from step 9
```

### Entitlement Check Flow

```
1. App/Web requests protected resource
2. Server extracts user ID from auth token
3. Server queries subscriptions table
4. Server checks entitlements
5. If entitled: return resource
6. If not entitled: return 403 with upgrade prompt
```

## Database Schema

```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- RevenueCat identifiers
  revenuecat_app_user_id TEXT,

  -- Subscription details
  product_id TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios' | 'android' | 'stripe'
  status TEXT NOT NULL, -- 'active' | 'expired' | 'canceled' | 'grace_period' | 'billing_issue'

  -- Dates
  purchased_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Renewal info
  will_renew BOOLEAN DEFAULT true,
  is_trial BOOLEAN DEFAULT false,

  -- Metadata
  original_transaction_id TEXT,
  latest_transaction_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, product_id)
);

-- Entitlements table (maps products to features)
CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'premium', 'ai_unlimited', etc.
  description TEXT,
  product_ids TEXT[] NOT NULL, -- Products that grant this entitlement
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User entitlements view (computed)
CREATE VIEW user_entitlements AS
SELECT DISTINCT
  s.user_id,
  e.name as entitlement
FROM subscriptions s
JOIN entitlements e ON s.product_id = ANY(e.product_ids)
WHERE s.status IN ('active', 'grace_period')
  AND (s.expires_at IS NULL OR s.expires_at > now());

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only server can modify (via secret key)
CREATE POLICY "Server can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

## Webhook Handler

```typescript
// supabase/functions/revenuecat-webhook/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';
// Note: crypto.subtle is available globally in Deno - no import needed

const REVENUECAT_WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!;

// Create Supabase client outside handler for connection reuse
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SECRET_KEY')!
);

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature || !REVENUECAT_WEBHOOK_SECRET) return false;

  try {
    // RevenueCat uses HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(REVENUECAT_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return false;
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Get raw body for signature verification
  const body = await req.text();

  // Verify webhook signature (CRITICAL: do not skip!)
  const signature = req.headers.get('X-RevenueCat-Signature');
  if (!await verifySignature(body, signature)) {
    console.error('Webhook signature verification failed');
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(body);
  const { app_user_id, event: eventType, product_id } = event;

  // Map RevenueCat event to our status
  const statusMap: Record<string, string> = {
    'INITIAL_PURCHASE': 'active',
    'RENEWAL': 'active',
    'PRODUCT_CHANGE': 'active',
    'CANCELLATION': 'canceled',
    'EXPIRATION': 'expired',
    'BILLING_ISSUE': 'billing_issue',
    'SUBSCRIBER_ALIAS': 'active',
  };

  const status = statusMap[eventType];
  if (!status) {
    console.log('Unhandled event type:', eventType);
    return new Response('OK');
  }

  // Upsert subscription
  await supabase.from('subscriptions').upsert({
    user_id: app_user_id,
    revenuecat_app_user_id: app_user_id,
    product_id,
    platform: event.store,
    status,
    purchased_at: event.purchased_at_ms ? new Date(event.purchased_at_ms) : new Date(),
    expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms) : null,
    will_renew: event.auto_resume_date_ms != null,
    is_trial: event.is_trial_period === true,
    original_transaction_id: event.original_transaction_id,
    latest_transaction_id: event.transaction_id,
    updated_at: new Date(),
  }, {
    onConflict: 'user_id,product_id',
  });

  return new Response('OK');
});
```

## Products Configuration

### RevenueCat Dashboard

```
Products:
├── monthly_premium
│   ├── iOS: com.yourapp.premium.monthly
│   ├── Android: premium_monthly
│   └── Stripe: price_xxx_monthly
├── yearly_premium
│   ├── iOS: com.yourapp.premium.yearly
│   ├── Android: premium_yearly
│   └── Stripe: price_xxx_yearly
└── lifetime_premium
    ├── iOS: com.yourapp.premium.lifetime
    └── Android: premium_lifetime

Entitlements:
├── premium
│   └── Grants access to: monthly_premium, yearly_premium, lifetime_premium
└── ai_unlimited
    └── Grants access to: yearly_premium, lifetime_premium
```

### Database Seed

```sql
-- Insert entitlements
INSERT INTO entitlements (name, description, product_ids) VALUES
  ('premium', 'Premium subscription features',
   ARRAY['monthly_premium', 'yearly_premium', 'lifetime_premium']),
  ('ai_unlimited', 'Unlimited AI features',
   ARRAY['yearly_premium', 'lifetime_premium']);
```

## Security Considerations

### Never Trust the Client

```typescript
// ❌ BAD: Client-side entitlement check
const isPremium = await AsyncStorage.getItem('isPremium');
if (isPremium) showPremiumContent();

// ✅ GOOD: Server validates on every request
const response = await fetch('/api/premium-content', {
  headers: { Authorization: `Bearer ${token}` },
});
// Server checks database, returns 403 if not entitled
```

### Webhook Security

1. **Verify signatures** - Always validate webhook signatures
2. **Use HTTPS** - Never accept webhooks over HTTP
3. **Idempotency** - Handle duplicate webhooks gracefully
4. **Secret key** - Use secret key for database updates

### Receipt Validation

- RevenueCat handles this automatically
- For manual validation, always validate server-side with Apple/Google

## Testing

### Sandbox Testing

| Platform | Setup |
|----------|-------|
| iOS | Create Sandbox tester in App Store Connect |
| Android | Add license testers in Play Console |
| Stripe | Use `4242 4242 4242 4242` test card |

### Test Scenarios

- [ ] New subscription purchase
- [ ] Subscription renewal
- [ ] Subscription cancellation
- [ ] Subscription expiration
- [ ] Billing issue (card declined)
- [ ] Restore purchases
- [ ] Cross-platform access (buy on iOS, use on web)
- [ ] Upgrade/downgrade between plans
- [ ] Refund handling

## Checklist

- [ ] RevenueCat account and app created
- [ ] iOS products created in App Store Connect
- [ ] Android products created in Play Console
- [ ] Stripe products created (if using web)
- [ ] Products configured in RevenueCat dashboard
- [ ] Entitlements mapped to products
- [ ] Webhook endpoint deployed
- [ ] Webhook secret configured
- [ ] Database schema migrated
- [ ] RLS policies in place
- [ ] Sandbox/test accounts created
- [ ] All purchase flows tested
- [ ] Restore purchases tested
- [ ] Cross-platform access verified

## Related Docs

- [RevenueCat Setup](./REVENUECAT-SETUP.md) - Detailed SDK integration
- [Stripe Web Billing](./STRIPE-WEB-BILLING.md) - Web payment setup
- [Entitlements System](./ENTITLEMENTS-SYSTEM.md) - Feature gating
- [RLS Policies](../03-database/RLS-POLICIES.md) - Database security
