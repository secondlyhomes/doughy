# Stripe Web Billing Integration

> Web subscription management with Stripe, synced to RevenueCat.

## Overview

Stripe handles web payments while RevenueCat unifies subscription state across platforms:

```
Web User → Stripe Checkout → Stripe Webhook → RevenueCat → App
```

## Setup

### Create Stripe Products

Match your RevenueCat products in Stripe:

```bash
# Using Stripe CLI
stripe products create --name="Premium Monthly"
stripe prices create \
  --product="prod_xxx" \
  --unit-amount=999 \
  --currency=usd \
  --recurring[interval]=month

stripe products create --name="Premium Yearly"
stripe prices create \
  --product="prod_yyy" \
  --unit-amount=7999 \
  --currency=usd \
  --recurring[interval]=year
```

### Connect Stripe to RevenueCat

1. RevenueCat Dashboard → Integrations → Stripe
2. Enter Stripe API keys (restricted key with required permissions)
3. Map Stripe products to RevenueCat products:
   - `price_xxx_monthly` → `monthly_premium`
   - `price_xxx_yearly` → `yearly_premium`

### Environment Variables

```bash
# .env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

## Checkout Session

### Create Session Endpoint

```typescript
// supabase/functions/create-checkout/index.ts
import Stripe from 'stripe';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

Deno.serve(async (req) => {
  const { priceId, userId, successUrl, cancelUrl } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get or create Stripe customer
  const { data: user } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', userId)
    .single();

  let customerId = user?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email,
      metadata: { supabase_user_id: userId },
    });
    customerId = customer.id;

    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', userId);
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl || `${req.headers.get('origin')}/success`,
    cancel_url: cancelUrl || `${req.headers.get('origin')}/pricing`,
    subscription_data: {
      metadata: {
        supabase_user_id: userId,
        // RevenueCat will use this to link the subscription
        app_user_id: userId,
      },
    },
    // Allow promotion codes
    allow_promotion_codes: true,
  });

  return new Response(JSON.stringify({ url: session.url }));
});
```

### Web Pricing Page

```typescript
// web/pages/pricing.tsx (Next.js example)
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const PLANS = [
  {
    name: 'Monthly',
    price: '$9.99/mo',
    priceId: 'price_xxx_monthly',
    features: ['All premium features', 'No ads'],
  },
  {
    name: 'Yearly',
    price: '$79.99/yr',
    priceId: 'price_xxx_yearly',
    features: ['All premium features', 'No ads', 'Save 33%', 'Unlimited AI'],
    popular: true,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(priceId: string) {
    if (!user) {
      // Redirect to login
      window.location.href = '/login?redirect=/pricing';
      return;
    }

    setLoading(priceId);

    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId,
        userId: user.id,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      }),
    });

    const { url } = await response.json();
    window.location.href = url;
  }

  return (
    <div className="pricing-container">
      {PLANS.map((plan) => (
        <div key={plan.priceId} className={`plan ${plan.popular ? 'popular' : ''}`}>
          {plan.popular && <span className="badge">Most Popular</span>}
          <h2>{plan.name}</h2>
          <p className="price">{plan.price}</p>
          <ul>
            {plan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <button
            onClick={() => handleSubscribe(plan.priceId)}
            disabled={loading === plan.priceId}
          >
            {loading === plan.priceId ? 'Loading...' : 'Subscribe'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Customer Portal

Allow users to manage their subscription:

```typescript
// supabase/functions/create-portal-session/index.ts
import Stripe from 'stripe';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  const { userId, returnUrl } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: user } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (!user?.stripe_customer_id) {
    return new Response(JSON.stringify({ error: 'No subscription found' }), {
      status: 404,
    });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id,
    return_url: returnUrl || req.headers.get('origin') || '',
  });

  return new Response(JSON.stringify({ url: session.url }));
});
```

### Manage Subscription Button

```typescript
// web/components/ManageSubscription.tsx
export function ManageSubscriptionButton() {
  const { user } = useAuth();

  async function handleManage() {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        returnUrl: window.location.href,
      }),
    });

    const { url } = await response.json();
    window.location.href = url;
  }

  return (
    <button onClick={handleManage}>
      Manage Subscription
    </button>
  );
}
```

## Webhook Handler

Stripe webhooks sync subscription changes:

```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'stripe';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

Deno.serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Subscription is now active
      // RevenueCat will also receive this via their Stripe integration
      console.log('Checkout completed:', session.id);
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;

      if (userId) {
        // Update local subscription status
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          product_id: getProductIdFromStripe(subscription),
          platform: 'stripe',
          status: mapStripeStatus(subscription.status),
          expires_at: new Date(subscription.current_period_end * 1000),
          updated_at: new Date(),
        }, {
          onConflict: 'user_id,product_id',
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // Handle failed payment - send email, update status
      console.log('Payment failed:', invoice.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }));
});

function mapStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'billing_issue',
    canceled: 'canceled',
    unpaid: 'billing_issue',
    trialing: 'active',
  };
  return statusMap[status] || 'unknown';
}
```

## Cross-Platform Access

When a user subscribes on web and opens the mobile app:

```typescript
// Mobile app
import Purchases from 'react-native-purchases';
import { useAuth } from '@/contexts/AuthContext';

function useSubscriptionSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Log in with the same user ID used in web checkout
      Purchases.logIn(user.id);
    }
  }, [user]);
}
```

RevenueCat automatically syncs the Stripe subscription to the user's RevenueCat account.

## Testing

### Stripe Test Mode

Use test API keys and test card numbers:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |
| 4000 0000 0000 3220 | 3D Secure required |

### Webhook Testing

```bash
# Forward webhooks locally
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

## Checklist

- [ ] Stripe products created matching RevenueCat
- [ ] Stripe connected to RevenueCat
- [ ] Checkout session endpoint deployed
- [ ] Customer portal session endpoint deployed
- [ ] Webhook handler deployed
- [ ] Webhook secret configured
- [ ] Test mode verified
- [ ] Production keys configured
- [ ] Cross-platform access tested

## Related Docs

- [Payment Architecture](./PAYMENT-ARCHITECTURE.md) - Overall system design
- [RevenueCat Setup](./REVENUECAT-SETUP.md) - Mobile SDK
- [Entitlements System](./ENTITLEMENTS-SYSTEM.md) - Feature gating
