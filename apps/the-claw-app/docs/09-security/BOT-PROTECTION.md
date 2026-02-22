# Bot Protection Guide

> Protecting your app from automated abuse, credential stuffing, and scraping.

## Overview

Bot protection prevents:
- **Credential stuffing** - Automated login attempts with stolen credentials
- **Account enumeration** - Probing for valid usernames/emails
- **Scraping** - Automated data extraction
- **Spam** - Automated form submissions
- **API abuse** - Excessive automated API calls

**This guide complements rate limiting in [COST-OPTIMIZATION.md](../07-ai-integration/COST-OPTIMIZATION.md).**

## Protection Layers

### Layer 1: Rate Limiting

First line of defense (already covered in COST-OPTIMIZATION.md):

```typescript
// Quick reference - see COST-OPTIMIZATION.md for full implementation
const rateLimits = {
  login: { maxAttempts: 5, windowMinutes: 15 },
  signup: { maxAttempts: 3, windowMinutes: 60 },
  passwordReset: { maxAttempts: 3, windowMinutes: 60 },
  apiGeneral: { maxRequests: 100, windowMinutes: 1 },
};
```

### Layer 2: CAPTCHA / Challenge

#### Option A: ALTCHA (Recommended)

**Why ALTCHA:**
- Privacy-first (no cookies, no tracking)
- GDPR and WCAG 2.2 AA compliant
- Proof-of-Work mechanism (no visual puzzles)
- Self-hosted option available
- ~30KB vs ~300KB for reCAPTCHA
- Open source

**Server Setup (Supabase Edge Function):**

```typescript
// supabase/functions/altcha-challenge/index.ts
import { createChallenge, verifySolution } from 'altcha-lib';

const ALTCHA_SECRET = Deno.env.get('ALTCHA_SECRET')!;

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'GET' && url.pathname === '/challenge') {
    // Generate challenge
    const challenge = await createChallenge({
      hmacKey: ALTCHA_SECRET,
      maxNumber: 100000, // Difficulty (higher = harder)
      expires: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
    });

    return new Response(JSON.stringify(challenge), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST' && url.pathname === '/verify') {
    const { payload } = await req.json();

    const isValid = await verifySolution(payload, ALTCHA_SECRET);

    return new Response(JSON.stringify({ valid: isValid }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not found', { status: 404 });
});
```

**React Native Client:**

```typescript
// src/components/AltchaChallenge.tsx
import { useState, useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

interface AltchaChallengeProps {
  onSolved: (payload: string) => void;
  onError: (error: Error) => void;
}

export function AltchaChallenge({ onSolved, onError }: AltchaChallengeProps) {
  const [status, setStatus] = useState<'loading' | 'solving' | 'solved' | 'error'>('loading');

  useEffect(() => {
    solveChallenge();
  }, []);

  async function solveChallenge() {
    try {
      setStatus('loading');

      // Get challenge from server
      const challengeRes = await fetch(`${API_URL}/altcha-challenge/challenge`);
      const challenge = await challengeRes.json();

      setStatus('solving');

      // Solve proof-of-work (runs in background)
      const solution = await solveProofOfWork(challenge);

      // Encode solution
      const payload = btoa(JSON.stringify({
        algorithm: challenge.algorithm,
        challenge: challenge.challenge,
        number: solution,
        salt: challenge.salt,
        signature: challenge.signature,
      }));

      setStatus('solved');
      onSolved(payload);
    } catch (error) {
      setStatus('error');
      onError(error as Error);
    }
  }

  return (
    <View style={styles.container}>
      {status === 'loading' && <ActivityIndicator />}
      {status === 'solving' && <Text>Verifying...</Text>}
      {status === 'solved' && <Text>Verified</Text>}
      {status === 'error' && <Text>Verification failed</Text>}
    </View>
  );
}

// Proof-of-work solver
async function solveProofOfWork(challenge: {
  algorithm: string;
  challenge: string;
  maxnumber: number;
  salt: string;
}): Promise<number> {
  const { algorithm, challenge: challengeHash, maxnumber, salt } = challenge;

  for (let n = 0; n <= maxnumber; n++) {
    const hash = await crypto.subtle.digest(
      algorithm.toUpperCase(),
      new TextEncoder().encode(salt + n)
    );
    const hashHex = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hashHex === challengeHash) {
      return n;
    }
  }

  throw new Error('Could not solve challenge');
}
```

**Integration in Forms:**

```typescript
// src/screens/signup-screen.tsx
function SignupScreen() {
  const [altchaPayload, setAltchaPayload] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!altchaPayload) {
      Alert.alert('Please complete verification');
      return;
    }

    setIsSubmitting(true);

    // Include ALTCHA payload in signup request
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        altcha: altchaPayload,
      }),
    });

    // Server verifies ALTCHA before creating account
  };

  return (
    <View>
      {/* Form fields */}

      <AltchaChallenge
        onSolved={setAltchaPayload}
        onError={(e) => console.error('ALTCHA error:', e)}
      />

      <Button
        title="Sign Up"
        onPress={handleSignup}
        disabled={!altchaPayload || isSubmitting}
      />
    </View>
  );
}
```

#### Option B: Cloudflare Turnstile

Alternative if you use Cloudflare:

```typescript
// Server-side verification
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    }
  );

  const data = await response.json();
  return data.success === true;
}
```

### Layer 3: Device Fingerprinting

Basic fingerprinting for abuse detection:

```typescript
// src/services/device-fingerprint.ts
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';

export async function getDeviceFingerprint(): Promise<string> {
  const components = [
    Application.applicationId,
    Device.modelName,
    Device.osName,
    Device.osVersion,
    Device.deviceYearClass?.toString(),
    // Add more stable attributes
  ].filter(Boolean);

  const fingerprint = components.join('|');

  // Hash for privacy
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    fingerprint
  );

  return hash;
}
```

**Store and track devices:**

```sql
-- Supabase migration
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  is_trusted BOOLEAN DEFAULT false,
  UNIQUE(user_id, device_fingerprint)
);

-- RLS
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);
```

### Layer 4: Behavioral Analysis

Detect bot-like patterns:

```typescript
// src/services/behavior-analysis.ts
interface BehaviorSignals {
  requestTimestamps: number[];
  mouseMovements?: number; // Web only
  touchEvents: number;
  sessionDuration: number;
}

export function analyzeUserBehavior(signals: BehaviorSignals): {
  isBot: boolean;
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let botScore = 0;

  // Check for impossibly fast actions
  const timeDiffs = signals.requestTimestamps
    .slice(1)
    .map((t, i) => t - signals.requestTimestamps[i]);

  const avgTimeBetweenRequests = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;

  if (avgTimeBetweenRequests < 100) { // Less than 100ms between requests
    botScore += 40;
    reasons.push('Requests too fast');
  }

  // Check for no touch/mouse activity
  if (signals.touchEvents === 0 && signals.sessionDuration > 30000) {
    botScore += 30;
    reasons.push('No user interaction detected');
  }

  // Check for perfectly regular timing (bots often have exact intervals)
  const timingVariance = calculateVariance(timeDiffs);
  if (timingVariance < 10 && timeDiffs.length > 5) {
    botScore += 30;
    reasons.push('Suspiciously regular timing');
  }

  return {
    isBot: botScore >= 70,
    confidence: Math.min(botScore, 100),
    reasons,
  };
}
```

## When to Use What

| Endpoint | Rate Limit | CAPTCHA | Device FP | Behavior |
|----------|------------|---------|-----------|----------|
| Login | 5/15min | After 3 failures | Track | Optional |
| Signup | 3/hour | Always | Required | Optional |
| Password Reset | 3/hour | Always | Track | No |
| AI API | 10/min, 300/day | No (too slow) | Required | Yes |
| Public API | 100/min | Optional | Optional | Yes |
| Contact Form | 5/hour | Always | No | No |

## Edge Function with All Protections

```typescript
// supabase/functions/protected-endpoint/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { verifySolution } from 'altcha-lib';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SECRET_KEY')!
);

Deno.serve(async (req) => {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const body = await req.json();

  // 1. Rate limiting
  const rateLimitKey = `ratelimit:${ip}`;
  const { data: rateData } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', rateLimitKey)
    .single();

  if (rateData && rateData.count >= 10) {
    return new Response(JSON.stringify({ error: 'Rate limited' }), {
      status: 429,
    });
  }

  // 2. ALTCHA verification (if provided)
  if (body.altcha) {
    const isValid = await verifySolution(
      body.altcha,
      Deno.env.get('ALTCHA_SECRET')!
    );
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid verification' }), {
        status: 400,
      });
    }
  }

  // 3. Device fingerprint check
  if (body.deviceFingerprint) {
    const { data: deviceData } = await supabase
      .from('abuse_signals')
      .select('signal_count')
      .eq('device_fingerprint', body.deviceFingerprint)
      .single();

    if (deviceData && deviceData.signal_count > 10) {
      return new Response(JSON.stringify({ error: 'Device blocked' }), {
        status: 403,
      });
    }
  }

  // 4. Process request
  // ... your logic here

  // Update rate limit
  await supabase.rpc('increment_rate_limit', { key: rateLimitKey });

  return new Response(JSON.stringify({ success: true }));
});
```

## Anti-Patterns

### Don't Block Legitimate Users

```typescript
// ❌ BAD: Block on first suspicious signal
if (anySignal) blockUser();

// ✅ GOOD: Graduated response
if (score < 30) continue();
if (score < 70) addChallenge();
if (score >= 70) block();
```

### Don't Add Friction Everywhere

```typescript
// ❌ BAD: CAPTCHA on every page
<AltchaChallenge /> // On home screen

// ✅ GOOD: CAPTCHA only on sensitive actions
// Signup, login after failures, password reset
```

### Don't Rely Solely on IP

```typescript
// ❌ BAD: IP-only rate limiting (fails for NAT, VPN, mobile)
const key = `ratelimit:${ip}`;

// ✅ GOOD: Combine IP + device fingerprint
const key = `ratelimit:${ip}:${deviceFingerprint}`;
```

## Monitoring

```typescript
// Track bot detection metrics
interface BotMetrics {
  totalRequests: number;
  challengesIssued: number;
  challengesPassed: number;
  challengesFailed: number;
  rateLimitHits: number;
  blockedRequests: number;
}

// Alert thresholds
const ALERT_THRESHOLDS = {
  challengeFailRate: 0.5, // 50% failure rate
  rateLimitHitRate: 0.3, // 30% of requests rate limited
  blockedRate: 0.1, // 10% blocked
};
```

## Checklist

- [ ] Rate limiting on all sensitive endpoints
- [ ] ALTCHA or Turnstile on signup and password reset
- [ ] CAPTCHA after failed login attempts
- [ ] Device fingerprinting implemented
- [ ] Fingerprints stored with user accounts
- [ ] Behavioral analysis for high-value endpoints
- [ ] Graduated response (challenge before block)
- [ ] Monitoring and alerting configured
- [ ] False positive rate tracked
- [ ] Appeals/unblock process documented

## Related Docs

- [Cost Optimization](../07-ai-integration/COST-OPTIMIZATION.md) - Rate limiting patterns
- [Free Tier Abuse Prevention](./FREE-TIER-ABUSE-PREVENTION.md) - Multi-account detection
- [Security Checklist](./SECURITY-CHECKLIST.md) - Pre-launch audit
- [Auth Setup](../04-authentication/AUTH-SETUP.md) - Authentication patterns
