# AI Cost Optimization Guide

## Overview

AI API costs can quickly spiral out of control. This guide provides patterns to reduce costs by 50-70% while maintaining quality.

## The 3-Tier Model Routing Strategy

Route requests to the cheapest model that can handle them:

```
Tier 1: GPT-4o-mini (cheapest)
   ↓ if confidence < 0.85 or complex keywords detected
Tier 2: GPT-4o (balanced)
   ↓ if still low confidence or very complex
Tier 3: GPT-4 Turbo (highest quality)
```

### Implementation

```typescript
// src/services/ai/modelRouter.ts

type ModelTier = 'nano' | 'mini' | 'full';

interface RoutingDecision {
  model: string;
  tier: ModelTier;
  reason: string;
}

const COMPLEXITY_KEYWORDS = [
  'except', 'but not', 'unless', 'only if',
  'every day', 'weekly', 'daily', 'recurring',
  'cancel all', 'delete all', 'batch',
];

export function selectModel(input: string): RoutingDecision {
  const wordCount = input.trim().split(/\s+/).length;
  const hasComplexity = COMPLEXITY_KEYWORDS.some(kw =>
    input.toLowerCase().includes(kw)
  );

  // Tier 1: Simple requests
  if (wordCount < 20 && !hasComplexity) {
    return {
      model: 'gpt-4o-mini',
      tier: 'nano',
      reason: 'Simple request',
    };
  }

  // Tier 2: Medium complexity
  if (wordCount < 75 && !hasComplexity) {
    return {
      model: 'gpt-4o-mini',
      tier: 'mini',
      reason: 'Medium complexity',
    };
  }

  // Tier 3: Complex requests
  return {
    model: 'gpt-4o',
    tier: 'full',
    reason: hasComplexity ? 'Complex keywords' : 'Long input',
  };
}
```

## Response Caching

Cache identical or similar requests for 5 minutes:

```typescript
// src/services/ai/cache.ts

const cache = new Map<string, { response: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function hashInput(input: string): string {
  const normalized = input.toLowerCase().trim().replace(/\s+/g, ' ');
  // Simple hash - use crypto for production
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `cache_${hash}`;
}

export function getCached(input: string): any | null {
  const key = hashInput(input);
  const entry = cache.get(key);

  if (!entry) return null;

  const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    cache.delete(key);
    return null;
  }

  return entry.response;
}

export function setCache(input: string, response: any): void {
  const key = hashInput(input);
  cache.set(key, { response, timestamp: Date.now() });
}
```

## Input/Output Caps

Prevent runaway costs with hard limits:

```typescript
// src/services/ai/validation.ts

export const LIMITS = {
  MAX_INPUT_CHARS: 6000,
  MAX_OUTPUT_TOKENS: 400,
  MAX_OPERATIONS_PER_REQUEST: 20,
  REQUEST_TIMEOUT_MS: 30000,
};

export function validateInput(input: string): string {
  if (input.length > LIMITS.MAX_INPUT_CHARS) {
    console.warn(`Input truncated from ${input.length} chars`);
    return input.slice(0, LIMITS.MAX_INPUT_CHARS);
  }
  return input;
}
```

## Rate Limiting (Upstash Redis)

Prevent abuse with per-device rate limits:

```typescript
// supabase/functions/_shared/rateLimiter.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
});

const LIMITS = {
  PER_MINUTE: 10,
  PER_DAY: 300,
};

export async function checkRateLimit(deviceId: string): Promise<{
  allowed: boolean;
  remaining: number;
}> {
  const now = new Date();
  const minuteKey = `rate:min:${deviceId}:${now.toISOString().slice(0, 16)}`;
  const dayKey = `rate:day:${deviceId}:${now.toISOString().slice(0, 10)}`;

  const [minuteCount, dayCount] = await Promise.all([
    redis.incr(minuteKey),
    redis.incr(dayKey),
  ]);

  // Set expiry on first request
  if (minuteCount === 1) await redis.expire(minuteKey, 60);
  if (dayCount === 1) await redis.expire(dayKey, 86400);

  if (minuteCount > LIMITS.PER_MINUTE) {
    return { allowed: false, remaining: 0 };
  }

  if (dayCount > LIMITS.PER_DAY) {
    return { allowed: false, remaining: 0 };
  }

  return {
    allowed: true,
    remaining: LIMITS.PER_DAY - dayCount,
  };
}
```

## High-Confidence Skip

Skip expensive AI verification when local matching is confident:

```typescript
// Skip AI if local confidence is high
const topMatch = localMatches[0];
const skipAI = localMatches.length === 1 && topMatch.score >= 0.9;

if (skipAI) {
  return {
    result: topMatch.item,
    confidence: topMatch.score,
    method: 'local-high-confidence',
    aiCost: 0, // No AI call needed!
  };
}

// Only call AI for uncertain matches
const aiResult = await callAI(input);
```

## Usage Tracking

Track costs per device/user for analytics:

```typescript
// supabase/functions/_shared/usageTracker.ts

interface UsageEntry {
  deviceId: string;
  timestamp: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
}

export async function trackUsage(entry: UsageEntry): Promise<void> {
  // Fire and forget - don't block main flow
  try {
    const monthKey = `usage:${entry.deviceId}:${new Date().toISOString().slice(0, 7)}`;
    await redis.lpush(monthKey, JSON.stringify(entry));
    await redis.expire(monthKey, 90 * 86400); // 90 day retention
  } catch (e) {
    console.error('Usage tracking failed:', e);
    // Don't throw - tracking shouldn't break main flow
  }
}
```

## Budget Alerts

Set up alerts for unusual spending:

```typescript
// Check if device is spending too much
const DAILY_COST_ALERT_THRESHOLD = 0.50; // $0.50/device/day

async function checkBudget(deviceId: string): Promise<boolean> {
  const todayCost = await getDailySpend(deviceId);

  if (todayCost > DAILY_COST_ALERT_THRESHOLD) {
    console.warn(`Budget alert: ${deviceId} spent $${todayCost} today`);
    await sendAlertToAdmin(deviceId, todayCost);
    return false; // Block further requests
  }

  return true;
}
```

## Cost Reduction Checklist

Before deploying AI features:

- [ ] 3-tier model routing implemented
- [ ] Response caching enabled
- [ ] Input/output caps in place
- [ ] Rate limiting per device/user
- [ ] High-confidence skip for local matches
- [ ] Usage tracking for visibility
- [ ] Budget alerts configured
- [ ] Jailbreak detection (see security docs)

## Expected Savings

| Optimization | Cost Reduction |
|--------------|----------------|
| 3-tier routing | 20-40% |
| Response caching | 10-20% |
| High-confidence skip | 10-30% |
| Input caps | 5-10% |
| **Combined** | **50-70%** |
