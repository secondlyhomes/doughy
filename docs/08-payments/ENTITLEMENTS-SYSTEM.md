# Entitlements System Guide

> Gating premium features based on subscription status.

## Overview

Entitlements define what features a user can access based on their subscription:

| Entitlement | Features | Products that Grant |
|-------------|----------|---------------------|
| `premium` | Ad-free, all features | Monthly, Yearly, Lifetime |
| `ai_unlimited` | Unlimited AI requests | Yearly, Lifetime |
| `early_access` | Beta features | Yearly, Lifetime |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   RevenueCat    │────▶│    Webhook      │────▶│    Database     │
│  (Source of     │     │   (Sync to      │     │  (subscriptions │
│   truth)        │     │    Supabase)    │     │   table)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                        ┌───────────────────────────────┘
                        ▼
              ┌─────────────────┐
              │  Entitlement    │
              │    Checks       │
              ├─────────────────┤
              │ • Client (UX)   │
              │ • Server (Auth) │
              └─────────────────┘
```

## Database Schema

```sql
-- Subscriptions (synced from RevenueCat webhooks)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'active', 'canceled', 'expired', 'grace_period', 'billing_issue', 'paused'
  )),
  expires_at TIMESTAMPTZ,
  is_trial BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Entitlements definition
CREATE TABLE entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  product_ids TEXT[] NOT NULL -- Products that grant this entitlement
);

-- Seed entitlements
INSERT INTO entitlements (name, description, product_ids) VALUES
  ('premium', 'Premium subscription', ARRAY['monthly_premium', 'yearly_premium', 'lifetime_premium']),
  ('ai_unlimited', 'Unlimited AI requests', ARRAY['yearly_premium', 'lifetime_premium']),
  ('early_access', 'Early access to new features', ARRAY['yearly_premium', 'lifetime_premium']);

-- Helper function to check entitlement
CREATE OR REPLACE FUNCTION has_entitlement(
  p_user_id UUID,
  p_entitlement TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM subscriptions s
    JOIN entitlements e ON s.product_id = ANY(e.product_ids)
    WHERE s.user_id = p_user_id
      AND e.name = p_entitlement
      AND s.status IN ('active', 'grace_period')
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Client-Side Checks (UX Only)

Use client checks for UI purposes, but **never for security**:

```typescript
// src/hooks/useEntitlements.ts
import { useState, useEffect, useCallback } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

interface UseEntitlementsReturn {
  isLoading: boolean;
  isPremium: boolean;
  hasUnlimitedAI: boolean;
  hasEarlyAccess: boolean;
  expirationDate: string | null;
  isTrialing: boolean;
  refresh: () => Promise<void>;
}

export function useEntitlements(): UseEntitlementsReturn {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Failed to fetch customer info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Listen for updates (e.g., after purchase)
    const listener = Purchases.addCustomerInfoUpdateListener(setCustomerInfo);
    return () => listener.remove();
  }, [refresh]);

  const getEntitlement = (name: string) =>
    customerInfo?.entitlements.active[name];

  const premiumEntitlement = getEntitlement('premium');
  const aiEntitlement = getEntitlement('ai_unlimited');
  const earlyAccessEntitlement = getEntitlement('early_access');

  return {
    isLoading,
    isPremium: !!premiumEntitlement,
    hasUnlimitedAI: !!aiEntitlement,
    hasEarlyAccess: !!earlyAccessEntitlement,
    expirationDate: premiumEntitlement?.expirationDate ?? null,
    isTrialing: premiumEntitlement?.periodType === 'TRIAL',
    refresh,
  };
}
```

### Usage in Components

```typescript
// Feature gating
function AIFeature() {
  const { hasUnlimitedAI, isLoading } = useEntitlements();

  if (isLoading) return <Skeleton />;

  if (!hasUnlimitedAI) {
    return <UpgradePrompt feature="ai_unlimited" />;
  }

  return <AIInterface />;
}

// Conditional UI
function SettingsScreen() {
  const { isPremium } = useEntitlements();

  return (
    <View>
      <SettingRow title="Notifications" />
      {isPremium && <SettingRow title="Advanced Settings" />}
      {!isPremium && <UpgradeBanner />}
    </View>
  );
}

// Badge/indicator
function ProfileHeader() {
  const { isPremium, isTrialing } = useEntitlements();

  return (
    <View>
      <Text>Profile</Text>
      {isPremium && !isTrialing && <Badge>Premium</Badge>}
      {isTrialing && <Badge variant="info">Trial</Badge>}
    </View>
  );
}
```

## Server-Side Checks (Security)

**Always validate entitlements server-side for protected resources:**

```typescript
// supabase/functions/_shared/entitlements.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

export async function checkEntitlement(
  userId: string,
  entitlement: string
): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data, error } = await supabase.rpc('has_entitlement', {
    p_user_id: userId,
    p_entitlement: entitlement,
  });

  if (error) {
    console.error('Entitlement check failed:', error);
    return false;
  }

  return data === true;
}
```

### Protected Edge Function

```typescript
// supabase/functions/ai-request/index.ts
import { checkEntitlement } from '../_shared/entitlements.ts';
import { getUserFromRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  // Get authenticated user
  const user = await getUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }

  // Check if user has free requests remaining OR has unlimited entitlement
  const hasUnlimited = await checkEntitlement(user.id, 'ai_unlimited');

  if (!hasUnlimited) {
    // Check free tier limits
    const remainingRequests = await getRemainingFreeRequests(user.id);

    if (remainingRequests <= 0) {
      return new Response(JSON.stringify({
        error: 'AI request limit reached',
        upgrade_url: '/pricing',
        remaining: 0,
      }), { status: 403 });
    }

    // Decrement free request count
    await decrementFreeRequests(user.id);
  }

  // Process AI request...
  const result = await processAIRequest(req);

  return new Response(JSON.stringify(result));
});
```

## Upgrade Prompts

### Context-Aware Prompt

```typescript
// src/components/UpgradePrompt.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface UpgradePromptProps {
  feature: 'premium' | 'ai_unlimited' | 'early_access';
  compact?: boolean;
}

const FEATURE_COPY = {
  premium: {
    title: 'Go Premium',
    description: 'Unlock all features and remove ads',
    cta: 'Upgrade Now',
  },
  ai_unlimited: {
    title: 'Unlimited AI',
    description: 'Get unlimited AI-powered suggestions',
    cta: 'Unlock AI',
  },
  early_access: {
    title: 'Early Access',
    description: 'Be the first to try new features',
    cta: 'Get Early Access',
  },
};

export function UpgradePrompt({ feature, compact }: UpgradePromptProps) {
  const router = useRouter();
  const copy = FEATURE_COPY[feature];

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactBanner}
        onPress={() => router.push('/paywall')}
      >
        <Text>{copy.cta}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.description}>{copy.description}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/paywall')}
      >
        <Text style={styles.buttonText}>{copy.cta}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Graceful Degradation

Handle subscription expiration and billing issues gracefully:

```typescript
// src/hooks/useEntitlements.ts
export function useEntitlements() {
  // ... existing code ...

  const subscriptionStatus = customerInfo?.entitlements.active['premium'];

  // Check for grace period
  const isInGracePeriod = subscriptionStatus?.periodType === 'GRACE_PERIOD';

  // Check for billing issue
  const hasBillingIssue = subscriptionStatus?.billingIssueDetectedAt != null;

  return {
    // ... existing returns ...
    isInGracePeriod,
    hasBillingIssue,
  };
}

// Show warning for grace period
function SubscriptionWarning() {
  const { isInGracePeriod, hasBillingIssue } = useEntitlements();

  if (isInGracePeriod) {
    return (
      <Banner variant="warning">
        Your subscription is about to expire. Please update your payment method.
      </Banner>
    );
  }

  if (hasBillingIssue) {
    return (
      <Banner variant="error">
        There's an issue with your payment. Please update your payment method to continue.
      </Banner>
    );
  }

  return null;
}
```

## Feature Flags + Entitlements

Combine feature flags with entitlements for controlled rollouts:

```typescript
// src/hooks/useFeatureAccess.ts
import { useEntitlements } from './useEntitlements';
import { useFeatureFlags } from './useFeatureFlags';

export function useFeatureAccess(featureName: string): {
  hasAccess: boolean;
  reason: 'entitled' | 'feature_flag' | 'none';
} {
  const { isPremium, hasEarlyAccess } = useEntitlements();
  const { isEnabled } = useFeatureFlags();

  // Feature flag overrides (for beta testing)
  if (isEnabled(`${featureName}_beta`)) {
    return { hasAccess: true, reason: 'feature_flag' };
  }

  // Early access users get new features
  if (hasEarlyAccess && isEnabled(`${featureName}_early_access`)) {
    return { hasAccess: true, reason: 'entitled' };
  }

  // Premium users get all stable features
  if (isPremium && isEnabled(`${featureName}_premium`)) {
    return { hasAccess: true, reason: 'entitled' };
  }

  // General availability
  if (isEnabled(featureName)) {
    return { hasAccess: true, reason: 'feature_flag' };
  }

  return { hasAccess: false, reason: 'none' };
}
```

## Analytics

Track entitlement-related events:

```typescript
// src/services/analytics.ts
export function trackUpgradePromptShown(feature: string, location: string) {
  analytics.track('upgrade_prompt_shown', { feature, location });
}

export function trackUpgradeStarted(source: string) {
  analytics.track('upgrade_started', { source });
}

export function trackUpgradeCompleted(product: string, price: number) {
  analytics.track('upgrade_completed', { product, price });
}

export function trackFeatureGated(feature: string) {
  analytics.track('feature_gated', { feature });
}
```

## Checklist

- [ ] Entitlements defined in RevenueCat dashboard
- [ ] Database schema with subscriptions and entitlements tables
- [ ] Client-side hook for UX checks
- [ ] Server-side validation for protected resources
- [ ] Upgrade prompts for each feature tier
- [ ] Grace period and billing issue handling
- [ ] Analytics tracking for conversion funnel
- [ ] Feature flags integration (optional)
- [ ] Restore purchases functionality
- [ ] Entitlement caching (RevenueCat handles this)

## Related Docs

- [Payment Architecture](./PAYMENT-ARCHITECTURE.md) - Overall payment system
- [RevenueCat Setup](./REVENUECAT-SETUP.md) - SDK integration
- [Free Tier Abuse Prevention](../09-security/FREE-TIER-ABUSE-PREVENTION.md) - Preventing bypasses
- [RLS Policies](../03-database/RLS-POLICIES.md) - Database-level access control
