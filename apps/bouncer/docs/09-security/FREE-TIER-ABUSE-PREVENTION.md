# Free Tier Abuse Prevention Guide

> Preventing subscription bypasses, multi-account abuse, and free tier exploitation.

## Overview

Free tier abuse costs money and degrades service for legitimate users:

| Abuse Type | Impact | Prevention |
|------------|--------|------------|
| Multi-account creation | AI credits farming | Device fingerprinting |
| Disposable emails | Infinite trials | Email validation |
| Trial reset exploits | Subscription bypass | Server-side tracking |
| Client-side spoofing | Premium feature theft | Server validation |

## Common Abuse Vectors

### 1. Multi-Account Creation
Users create multiple accounts to get more free tier benefits:
- New email for each account
- Different devices
- VPN to change IP

### 2. Disposable Emails
Temporary email services (Guerrilla Mail, 10 Minute Mail, TempMail):
- Thousands of disposable domains
- Auto-generated addresses
- No verification possible

### 3. Trial Resets
Exploiting trial period logic:
- Changing device clock
- Clearing app data
- Re-installing app

### 4. Client-Side Entitlement Spoofing
Modifying app to bypass premium checks:
- Patched APKs
- Runtime memory editing
- API response interception

## Prevention Strategies

### Strategy 1: Disposable Email Blocking

**Option A: Third-Party Service (Recommended)**

```typescript
// supabase/functions/validate-email/index.ts
const ABSTRACT_API_KEY = Deno.env.get('ABSTRACT_EMAIL_API_KEY');

interface EmailValidation {
  isValid: boolean;
  isDisposable: boolean;
  reason?: string;
}

export async function validateEmail(email: string): Promise<EmailValidation> {
  const response = await fetch(
    `https://emailvalidation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&email=${encodeURIComponent(email)}`
  );

  const data = await response.json();

  if (data.is_disposable_email?.value === true) {
    return {
      isValid: false,
      isDisposable: true,
      reason: 'Disposable email addresses are not allowed',
    };
  }

  if (data.deliverability === 'UNDELIVERABLE') {
    return {
      isValid: false,
      isDisposable: false,
      reason: 'Email address is not deliverable',
    };
  }

  return { isValid: true, isDisposable: false };
}
```

**Option B: Local Blocklist (Free, but less comprehensive)**

```typescript
// src/services/email-validation.ts
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'mailinator.com',
  'temp-mail.org',
  'fakeinbox.com',
  'getnada.com',
  'mohmal.com',
  'maildrop.cc',
  // Add more from: https://github.com/disposable-email-domains/disposable-email-domains
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}
```

**Integration in Signup:**

```typescript
// supabase/functions/signup/index.ts
Deno.serve(async (req) => {
  const { email, password, deviceFingerprint } = await req.json();

  // Check disposable email
  const emailCheck = await validateEmail(email);
  if (!emailCheck.isValid) {
    return new Response(JSON.stringify({
      error: emailCheck.reason || 'Invalid email address',
    }), { status: 400 });
  }

  // Continue with signup...
});
```

### Strategy 2: Device Fingerprinting

**Collect Device ID:**

```typescript
// src/services/device.ts
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'device_unique_id';

export async function getDeviceId(): Promise<string> {
  // Check for existing ID
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (!deviceId) {
    // Generate new ID based on device characteristics
    const components = [
      Application.applicationId,
      await Application.getInstallationIdAsync(),
      Device.modelId,
      Device.osInternalBuildId,
    ].filter(Boolean);

    deviceId = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      components.join('|') + Date.now()
    );

    // Store for consistency
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}
```

**Track Devices Per User:**

```sql
-- Supabase migration
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  platform TEXT, -- 'ios' | 'android'
  app_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  is_primary BOOLEAN DEFAULT false,
  UNIQUE(user_id, device_id)
);

-- Index for lookups
CREATE INDEX idx_user_devices_device_id ON user_devices(device_id);

-- Limit devices per user
CREATE OR REPLACE FUNCTION check_device_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_devices WHERE user_id = NEW.user_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum devices reached for this account';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_device_limit
  BEFORE INSERT ON user_devices
  FOR EACH ROW
  EXECUTE FUNCTION check_device_limit();
```

**Detect Multi-Account per Device:**

```typescript
// supabase/functions/check-device/index.ts
export async function checkDeviceForAbuse(
  deviceId: string,
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = createClient(/* ... */);

  // Check how many accounts use this device
  const { data: devices, error } = await supabase
    .from('user_devices')
    .select('user_id')
    .eq('device_id', deviceId);

  if (error) throw error;

  const uniqueUsers = new Set(devices.map(d => d.user_id));

  // Allow if this is the only user or user is already registered
  if (uniqueUsers.size === 0 || uniqueUsers.has(userId)) {
    return { allowed: true };
  }

  // Multiple accounts on same device
  if (uniqueUsers.size >= 2) {
    // Log abuse signal
    await supabase.from('abuse_signals').insert({
      device_id: deviceId,
      user_id: userId,
      signal_type: 'multi_account',
      details: { existingAccounts: uniqueUsers.size },
    });

    return {
      allowed: false,
      reason: 'This device is already registered with another account',
    };
  }

  return { allowed: true };
}
```

### Strategy 3: Server-Side Entitlement Validation

**Never Trust the Client:**

```typescript
// ❌ BAD: Client-side premium check
function PremiumFeature() {
  const { isPremium } = useLocalStorage('subscription');

  if (!isPremium) return <UpgradePrompt />;
  return <PremiumContent />;
}

// ✅ GOOD: Server validates on every request
async function usePremiumFeature() {
  const response = await fetch('/api/premium-action', {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Server checks entitlement before processing
  if (response.status === 403) {
    // Show upgrade prompt
  }
}
```

**Server-Side Check:**

```typescript
// supabase/functions/_shared/entitlements.ts
export async function checkEntitlement(
  userId: string,
  requiredEntitlement: string
): Promise<boolean> {
  const supabase = createClient(/* ... */);

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, entitlements')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!subscription) return false;

  return subscription.entitlements?.includes(requiredEntitlement) ?? false;
}

// Usage in Edge Function
Deno.serve(async (req) => {
  const userId = await getUserIdFromRequest(req);

  if (!await checkEntitlement(userId, 'ai_unlimited')) {
    return new Response(JSON.stringify({
      error: 'Premium subscription required',
      upgrade_url: '/pricing',
    }), { status: 403 });
  }

  // Process premium request...
});
```

### Strategy 4: Usage-Based Limits with Server Tracking

```sql
-- Track usage server-side
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL, -- 'ai_requests', 'exports', etc.
  period_start DATE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  limit_count INTEGER NOT NULL,
  UNIQUE(user_id, feature, period_start)
);

-- Function to check and increment usage
CREATE OR REPLACE FUNCTION check_and_increment_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_limit INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage INTEGER;
  v_period_start DATE := date_trunc('month', now())::date;
BEGIN
  -- Insert or get current usage
  INSERT INTO usage_tracking (user_id, feature, period_start, usage_count, limit_count)
  VALUES (p_user_id, p_feature, v_period_start, 0, p_limit)
  ON CONFLICT (user_id, feature, period_start)
  DO UPDATE SET limit_count = p_limit
  RETURNING usage_count INTO v_current_usage;

  -- Check if under limit
  IF v_current_usage >= p_limit THEN
    RETURN FALSE;
  END IF;

  -- Increment usage
  UPDATE usage_tracking
  SET usage_count = usage_count + 1
  WHERE user_id = p_user_id
    AND feature = p_feature
    AND period_start = v_period_start;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

**Use in Edge Function:**

```typescript
// supabase/functions/ai-request/index.ts
Deno.serve(async (req) => {
  const userId = await getUserIdFromRequest(req);

  // Get user's tier
  const tier = await getUserTier(userId); // 'free' | 'premium'

  const limits = {
    free: 10,
    premium: 1000,
  };

  // Check and increment usage (atomic operation)
  const { data: allowed } = await supabase.rpc('check_and_increment_usage', {
    p_user_id: userId,
    p_feature: 'ai_requests',
    p_limit: limits[tier],
  });

  if (!allowed) {
    return new Response(JSON.stringify({
      error: 'Monthly limit reached',
      limit: limits[tier],
      upgrade_url: tier === 'free' ? '/pricing' : null,
    }), { status: 429 });
  }

  // Process AI request...
});
```

### Strategy 5: Phone Verification (High-Value Actions)

```typescript
// For apps requiring strong identity verification
import * as SMS from 'expo-sms';

// Server-side (Twilio example)
async function sendVerificationCode(phoneNumber: string): Promise<void> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store code with expiry
  await supabase.from('phone_verifications').upsert({
    phone_number: phoneNumber,
    code,
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 min
  });

  // Send via Twilio
  await twilioClient.messages.create({
    body: `Your verification code is: ${code}`,
    to: phoneNumber,
    from: TWILIO_PHONE_NUMBER,
  });
}

async function verifyCode(phoneNumber: string, code: string): Promise<boolean> {
  const { data } = await supabase
    .from('phone_verifications')
    .select('code, expires_at')
    .eq('phone_number', phoneNumber)
    .single();

  if (!data) return false;
  if (new Date(data.expires_at) < new Date()) return false;
  if (data.code !== code) return false;

  // Mark phone as verified
  await supabase.from('verified_phones').insert({
    phone_number: phoneNumber,
    verified_at: new Date(),
  });

  return true;
}
```

### Strategy 6: Payment Verification ($0 Authorization)

For high-value free tiers (e.g., free AI credits):

```typescript
// Stripe $0 authorization to verify card is real
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY);

async function verifyPaymentMethod(userId: string): Promise<boolean> {
  // Create setup intent (no charge)
  const setupIntent = await stripe.setupIntents.create({
    customer: await getOrCreateStripeCustomer(userId),
    payment_method_types: ['card'],
    usage: 'off_session',
  });

  // Client completes setup intent
  // If successful, card is valid and can be charged later

  return true;
}
```

## Abuse Detection Database Schema

```sql
-- Abuse signals for analysis
CREATE TABLE abuse_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  device_id TEXT,
  ip_address TEXT,
  signal_type TEXT NOT NULL, -- 'multi_account', 'disposable_email', 'rapid_signup', etc.
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_abuse_signals_device ON abuse_signals(device_id);
CREATE INDEX idx_abuse_signals_type ON abuse_signals(signal_type);

-- Blocked entities
CREATE TABLE blocked_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'device', 'ip', 'email_domain'
  entity_value TEXT NOT NULL,
  reason TEXT,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(entity_type, entity_value)
);
```

## Balancing Security vs UX

| Approach | Security | UX Impact | Use When |
|----------|----------|-----------|----------|
| Disposable email block | High | Low | Always |
| Device fingerprint | High | Low | Always |
| Phone verification | Very High | Medium | High-value actions |
| Card verification | Very High | High | Expensive free tiers |
| CAPTCHA on signup | Medium | Medium | Bot problems |

### Progressive Friction

Start light, increase friction for suspicious users:

```typescript
function determineVerificationLevel(signals: AbuseSignals): VerificationLevel {
  if (signals.knownAbuser) return 'blocked';
  if (signals.multipleAccounts > 2) return 'phone_verification';
  if (signals.disposableEmail) return 'blocked';
  if (signals.suspiciousTiming) return 'captcha';
  if (signals.newDevice) return 'email_verification';
  return 'none';
}
```

## Checklist

- [ ] Disposable email blocking implemented
- [ ] Device fingerprinting on signup and login
- [ ] Device ID stored and tracked server-side
- [ ] Multi-account detection per device
- [ ] Entitlements validated server-side (never trust client)
- [ ] Usage tracked server-side with atomic increments
- [ ] Rate limits per device, not just IP
- [ ] Abuse signals logged for analysis
- [ ] Appeals process documented
- [ ] Blocked entity expiry (not permanent by default)
- [ ] Progressive friction based on risk score

## Related Docs

- [Bot Protection](./BOT-PROTECTION.md) - CAPTCHA and rate limiting
- [Entitlements System](../08-payments/ENTITLEMENTS-SYSTEM.md) - Premium feature gating
- [Auth Setup](../04-authentication/AUTH-SETUP.md) - Authentication patterns
- [RLS Policies](../03-database/RLS-POLICIES.md) - Database security
