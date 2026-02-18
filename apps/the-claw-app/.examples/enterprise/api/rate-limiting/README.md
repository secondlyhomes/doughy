# API Rate Limiting

Comprehensive rate limiting system for protecting your API from abuse and ensuring fair usage across all users.

## Table of Contents

- [Overview](#overview)
- [Rate Limiting Strategies](#rate-limiting-strategies)
- [Implementation](#implementation)
- [Database Schema](#database-schema)
- [Usage Examples](#usage-examples)
- [Configuration](#configuration)
- [Testing](#testing)
- [Monitoring](#monitoring)
- [Best Practices](#best-practices)

## Overview

Rate limiting controls the number of requests a user can make to your API within a specific time window. This protects your infrastructure from:

- **Abuse**: Prevents malicious actors from overwhelming your system
- **Resource exhaustion**: Ensures fair resource allocation
- **Cost control**: Limits expensive operations (AI calls, exports, etc.)
- **Quality of service**: Maintains performance for all users

### Key Features

- Multiple strategies (fixed window, sliding window, token bucket)
- Per-user and per-API-key limits
- Configurable limits per endpoint
- Rate limit exemptions (whitelisting)
- Violation tracking and analytics
- Standard rate limit headers
- Graceful degradation (fails open)

## Rate Limiting Strategies

### 1. Fixed Window

Counts requests within fixed time windows (e.g., per minute).

**Pros:**
- Simple to implement
- Predictable behavior
- Low memory usage

**Cons:**
- Allows burst at window boundaries
- Can accept 2x limit across windows

```typescript
// 100 requests per minute
const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  strategy: 'fixed_window',
})
```

**Best for:** General API endpoints, task creation, simple operations

### 2. Sliding Window

Maintains a moving window of request timestamps.

**Pros:**
- Smoother rate limiting
- No boundary burst issues
- More accurate

**Cons:**
- Higher memory usage
- Slightly more complex

```typescript
// 100 requests per minute (sliding)
const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  strategy: 'sliding_window',
})
```

**Best for:** Search, listing endpoints, user-facing APIs

### 3. Token Bucket

Allows bursts while maintaining average rate.

**Pros:**
- Allows controlled bursts
- Flexible token costs
- Natural rate limiting

**Cons:**
- Most complex
- Requires token tracking

```typescript
// 100 token bucket, refills at 10/second
const limiter = new DatabaseRateLimiter()
await limiter.checkTokenBucket(userId, 'ai.chat', {
  bucketSize: 100,
  refillRate: 10,
  cost: 5, // This request costs 5 tokens
})
```

**Best for:** AI endpoints, expensive operations, variable-cost requests

## Implementation

### Client-Side (In-Memory)

For mobile apps and client-side validation:

```typescript
import { InMemoryRateLimiter } from './RateLimiter'

const limiter = new InMemoryRateLimiter({
  maxRequests: 100,
  windowMs: 60000,
})

export async function createTask(userId: string, task: Task) {
  const result = await limiter.checkLimit(userId, 'tasks.create')

  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded. Try again in ${result.retryAfter}s`
    )
  }

  // Create task...
}
```

### Server-Side (Database)

For server APIs with Supabase:

```typescript
import { DatabaseRateLimiter } from './RateLimiter'

const limiter = new DatabaseRateLimiter()

export async function handleRequest(userId: string, endpoint: string) {
  const result = await limiter.checkLimit(userId, endpoint)

  if (!result.allowed) {
    return {
      status: 429,
      headers: {
        'Retry-After': result.retryAfter,
        'X-RateLimit-Limit': 100,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': result.resetAt?.getTime(),
      },
      body: {
        error: 'rate_limit_exceeded',
        message: 'Too many requests',
        retryAfter: result.retryAfter,
      },
    }
  }

  // Process request...
}
```

### Unified (Auto-detect)

Automatically uses database on server, in-memory on client:

```typescript
import { RateLimiter } from './RateLimiter'

const limiter = new RateLimiter(
  { maxRequests: 100, windowMs: 60000 },
  __SERVER__ // use database on server
)

await limiter.checkAndThrow(userId, 'tasks.create')
```

## Database Schema

### Tables

**`rate_limit_configs`**
Defines rate limits per endpoint:

```sql
INSERT INTO rate_limit_configs (endpoint, strategy, max_requests, window_duration)
VALUES ('api.tasks.create', 'fixed_window', 60, '1 minute');
```

**`rate_limits`**
Tracks requests (fixed window):

```sql
-- Automatically managed by check_rate_limit_fixed_window()
```

**`rate_limit_sliding_window`**
Tracks request timestamps (sliding window):

```sql
-- Automatically managed by check_rate_limit_sliding_window()
```

**`rate_limit_token_bucket`**
Tracks token buckets:

```sql
-- Automatically managed by check_rate_limit_token_bucket()
```

**`rate_limit_violations`**
Logs when users exceed limits:

```sql
SELECT endpoint, COUNT(*) as violations
FROM rate_limit_violations
WHERE created_at > now() - interval '24 hours'
GROUP BY endpoint;
```

**`rate_limit_exemptions`**
Whitelist users/keys:

```sql
INSERT INTO rate_limit_exemptions (user_id, reason)
VALUES ('user-uuid', 'Premium plan - unlimited API access');
```

### Functions

**`check_rate_limit(user_id, api_key, endpoint)`**
Smart function that uses config table:

```sql
SELECT check_rate_limit(
  'user-uuid',
  NULL,
  'api.tasks.create'
);
-- Returns: {"allowed": true, "remaining": 59, "reset_at": "..."}
```

**`check_rate_limit_fixed_window(...)`**
Manual fixed window check:

```sql
SELECT check_rate_limit_fixed_window(
  'user-uuid',
  NULL,
  'api.tasks.create',
  100, -- max requests
  '1 minute'::interval
);
```

**`check_rate_limit_sliding_window(...)`**
Manual sliding window check:

```sql
SELECT check_rate_limit_sliding_window(
  'user-uuid',
  NULL,
  'api.search',
  30,
  '1 minute'::interval
);
```

**`check_rate_limit_token_bucket(...)`**
Manual token bucket check:

```sql
SELECT check_rate_limit_token_bucket(
  'user-uuid',
  NULL,
  'api.ai.chat',
  100, -- bucket size
  10.0, -- refill rate (tokens/second)
  5.0  -- cost of this request
);
```

## Usage Examples

### Example 1: Basic Rate Limiting

```typescript
import { RateLimiter } from './RateLimiter'

const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
})

export async function createTask(task: CreateTaskInput) {
  const userId = auth.user.id

  await limiter.checkAndThrow(userId, 'tasks.create')

  const { data, error } = await supabase
    .from('tasks')
    .insert(task)

  return data
}
```

### Example 2: Function Decorator

```typescript
const limiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60000,
})

export const createTask = limiter.withRateLimit('tasks.create')(
  async (params: { userId: string; task: any }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert(params.task)

    return data
  }
)

// Usage
await createTask({ userId: 'user-123', task: {...} })
```

### Example 3: Per-Endpoint Limiters

```typescript
const limiters = {
  'tasks.create': new RateLimiter({
    maxRequests: 60,
    windowMs: 60000,
  }),
  'ai.chat': new RateLimiter({
    maxRequests: 20,
    windowMs: 60000,
  }),
  'export.data': new RateLimiter({
    maxRequests: 5,
    windowMs: 3600000, // 1 hour
  }),
}

export async function handleEndpoint(endpoint: string, userId: string) {
  const limiter = limiters[endpoint]
  if (!limiter) throw new Error('Unknown endpoint')

  await limiter.checkAndThrow(userId, endpoint)
  // Process request...
}
```

### Example 4: Custom Key Generator

```typescript
const limiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 60000,
  keyGenerator: (req) => {
    // Rate limit by IP instead of user
    return req.ip
  },
})
```

### Example 5: Different Limits per Plan

```typescript
const PLAN_LIMITS = {
  free: { maxRequests: 100, windowMs: 60000 },
  pro: { maxRequests: 1000, windowMs: 60000 },
  enterprise: { maxRequests: 10000, windowMs: 60000 },
}

export async function checkRateLimit(userId: string, endpoint: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan')
    .eq('user_id', userId)
    .single()

  const limits = PLAN_LIMITS[profile.subscription_plan] || PLAN_LIMITS.free
  const limiter = new RateLimiter(limits)

  return limiter.checkLimit(userId, endpoint)
}
```

### Example 6: Token Bucket for AI

```typescript
const aiLimiter = new DatabaseRateLimiter()

export async function generateAIResponse(userId: string, prompt: string) {
  // Different token costs based on prompt length
  const tokenCost = Math.ceil(prompt.length / 100)

  const result = await aiLimiter.checkTokenBucket(userId, 'ai.chat', {
    bucketSize: 1000,
    refillRate: 10, // 10 tokens/second
    cost: tokenCost,
  })

  if (!result.allowed) {
    throw new Error(
      `AI rate limit exceeded. Need ${tokenCost} tokens, have ${result.tokensRemaining}. ` +
      `Retry in ${result.retryAfter}s`
    )
  }

  // Generate AI response...
}
```

### Example 7: Graceful Degradation

```typescript
export async function searchTasks(query: string) {
  const userId = auth.user.id

  const result = await limiter.checkLimit(userId, 'tasks.search')

  if (!result.allowed) {
    // Fall back to cached results
    const cached = await getCachedResults(query)
    if (cached) {
      return {
        data: cached,
        fromCache: true,
        rateLimited: true,
        retryAfter: result.retryAfter,
      }
    }

    throw new RateLimitError(
      'Rate limit exceeded and no cache available',
      result.retryAfter || 0,
      100
    )
  }

  // Perform fresh search...
}
```

## Configuration

### Default Configurations

```typescript
// config/rateLimits.ts
export const RATE_LIMITS = {
  // Task operations
  'tasks.create': { maxRequests: 60, windowMs: 60000 },
  'tasks.update': { maxRequests: 120, windowMs: 60000 },
  'tasks.delete': { maxRequests: 60, windowMs: 60000 },
  'tasks.list': { maxRequests: 200, windowMs: 60000 },

  // AI operations
  'ai.chat': { maxRequests: 20, windowMs: 60000 },
  'ai.completion': { maxRequests: 10, windowMs: 60000 },
  'ai.embedding': { maxRequests: 100, windowMs: 60000 },

  // Search
  'search.global': { maxRequests: 30, windowMs: 60000 },
  'search.advanced': { maxRequests: 10, windowMs: 60000 },

  // Data operations
  'export.csv': { maxRequests: 5, windowMs: 3600000 },
  'export.pdf': { maxRequests: 10, windowMs: 3600000 },
  'import.bulk': { maxRequests: 5, windowMs: 3600000 },

  // Authentication
  'auth.login': { maxRequests: 5, windowMs: 300000 },
  'auth.signup': { maxRequests: 3, windowMs: 3600000 },
  'auth.reset-password': { maxRequests: 3, windowMs: 3600000 },
}
```

### Environment-Based Configuration

```typescript
const isProd = process.env.NODE_ENV === 'production'

export const RATE_LIMIT_CONFIG = {
  maxRequests: isProd ? 100 : 1000,
  windowMs: isProd ? 60000 : 1000,
  useDatabase: isProd,
}
```

### Database Configuration

```sql
-- Update rate limit configuration
UPDATE rate_limit_configs
SET max_requests = 200
WHERE endpoint = 'api.tasks.list';

-- Add new endpoint configuration
INSERT INTO rate_limit_configs (
  endpoint,
  strategy,
  max_requests,
  window_duration,
  description
)
VALUES (
  'api.reports.generate',
  'fixed_window',
  10,
  '1 hour',
  'Report generation - 10 per hour'
);
```

## Testing

### Unit Tests

```typescript
import { InMemoryRateLimiter } from './RateLimiter'

describe('RateLimiter', () => {
  it('allows requests under limit', async () => {
    const limiter = new InMemoryRateLimiter({
      maxRequests: 5,
      windowMs: 60000,
    })

    for (let i = 0; i < 5; i++) {
      const result = await limiter.checkLimit('user-1', 'test')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(5 - i - 1)
    }
  })

  it('blocks requests over limit', async () => {
    const limiter = new InMemoryRateLimiter({
      maxRequests: 5,
      windowMs: 60000,
    })

    // Use up limit
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('user-1', 'test')
    }

    // Next request should be blocked
    const result = await limiter.checkLimit('user-1', 'test')
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('resets after window expires', async () => {
    jest.useFakeTimers()

    const limiter = new InMemoryRateLimiter({
      maxRequests: 5,
      windowMs: 1000, // 1 second
    })

    // Use up limit
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('user-1', 'test')
    }

    // Fast forward past window
    jest.advanceTimersByTime(1001)

    // Should allow again
    const result = await limiter.checkLimit('user-1', 'test')
    expect(result.allowed).toBe(true)

    jest.useRealTimers()
  })

  it('isolates different users', async () => {
    const limiter = new InMemoryRateLimiter({
      maxRequests: 2,
      windowMs: 60000,
    })

    // User 1 uses up their limit
    await limiter.checkLimit('user-1', 'test')
    await limiter.checkLimit('user-1', 'test')

    // User 2 should still have full limit
    const result = await limiter.checkLimit('user-2', 'test')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })
})
```

### Integration Tests

```typescript
describe('Database Rate Limiter', () => {
  it('enforces rate limits via database', async () => {
    const limiter = new DatabaseRateLimiter()
    const userId = 'test-user-1'

    // Make requests up to limit
    for (let i = 0; i < 60; i++) {
      const result = await limiter.checkFixedWindow(
        userId,
        'api.tasks.create',
        60,
        60000
      )
      expect(result.allowed).toBe(true)
    }

    // Next request should fail
    const result = await limiter.checkFixedWindow(
      userId,
      'api.tasks.create',
      60,
      60000
    )
    expect(result.allowed).toBe(false)
  })

  it('respects exemptions', async () => {
    // Add exemption
    await supabase
      .from('rate_limit_exemptions')
      .insert({
        user_id: 'exempt-user',
        reason: 'Test exemption',
      })

    const limiter = new DatabaseRateLimiter()

    // Should allow unlimited requests
    for (let i = 0; i < 200; i++) {
      const result = await limiter.checkLimit(
        'exempt-user',
        'api.tasks.create'
      )
      expect(result.allowed).toBe(true)
      expect(result.exempt).toBe(true)
    }
  })
})
```

### Load Testing

```typescript
// loadTest.ts
import { RateLimiter } from './RateLimiter'

async function loadTest() {
  const limiter = new RateLimiter({
    maxRequests: 1000,
    windowMs: 60000,
  })

  const users = 100
  const requestsPerUser = 20

  const start = Date.now()

  const promises = []
  for (let user = 0; user < users; user++) {
    for (let req = 0; req < requestsPerUser; req++) {
      promises.push(
        limiter.checkLimit(`user-${user}`, 'test')
      )
    }
  }

  const results = await Promise.all(promises)
  const allowed = results.filter(r => r.allowed).length
  const blocked = results.filter(r => !r.allowed).length

  const elapsed = Date.now() - start

  console.log(`
    Total requests: ${users * requestsPerUser}
    Allowed: ${allowed}
    Blocked: ${blocked}
    Time: ${elapsed}ms
    Rate: ${Math.round((users * requestsPerUser) / (elapsed / 1000))} req/s
  `)
}

loadTest()
```

## Monitoring

### Violation Dashboard

```typescript
export async function getRateLimitDashboard(timeRange = '24 hours') {
  const { data: summary } = await supabase
    .from('rate_limit_violations_summary')
    .select('*')

  const { data: topViolators } = await supabase
    .from('rate_limit_violations')
    .select('user_id, endpoint, COUNT(*) as violation_count')
    .gte('created_at', `now() - interval '${timeRange}'`)
    .groupBy('user_id, endpoint')
    .orderBy('violation_count', { ascending: false })
    .limit(10)

  return { summary, topViolators }
}
```

### Alerts

```typescript
// Monitor violations and alert
export async function monitorViolations() {
  const threshold = 100 // violations per hour

  const { data } = await supabase
    .from('rate_limit_violations')
    .select('endpoint, COUNT(*) as count')
    .gte('created_at', 'now() - interval \'1 hour\'')
    .groupBy('endpoint')

  for (const row of data) {
    if (row.count > threshold) {
      await sendAlert({
        type: 'rate_limit_violations',
        endpoint: row.endpoint,
        count: row.count,
        severity: 'high',
      })
    }
  }
}
```

### Metrics

```typescript
export async function getRateLimitMetrics() {
  return {
    violationsLast24h: await getViolationCount('24 hours'),
    topViolatedEndpoints: await getTopViolatedEndpoints(),
    averageRequestsPerUser: await getAvgRequestsPerUser(),
    exemptedUsers: await getExemptedUserCount(),
  }
}
```

## Best Practices

### 1. Choose the Right Strategy

- **Fixed window**: Simple endpoints, low traffic
- **Sliding window**: User-facing APIs, moderate traffic
- **Token bucket**: AI/expensive operations, variable costs

### 2. Set Appropriate Limits

```typescript
// Too strict - frustrates users
const tooStrict = { maxRequests: 10, windowMs: 60000 }

// Too loose - allows abuse
const tooLoose = { maxRequests: 10000, windowMs: 1000 }

// Just right - balances UX and protection
const justRight = { maxRequests: 100, windowMs: 60000 }
```

### 3. Provide Clear Error Messages

```typescript
if (!result.allowed) {
  throw new RateLimitError(
    `You've made too many requests. Please wait ${result.retryAfter} seconds before trying again.`,
    result.retryAfter,
    100,
    0
  )
}
```

### 4. Include Rate Limit Headers

```typescript
response.headers = {
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '45',
  'X-RateLimit-Reset': '1640995200',
  'Retry-After': '30',
}
```

### 5. Fail Open on Errors

```typescript
try {
  await checkRateLimit(userId, endpoint)
} catch (error) {
  // Log error but allow request
  console.error('Rate limit check failed:', error)
  // Continue processing...
}
```

### 6. Use Different Limits per Plan

```typescript
const limits = {
  free: 100,
  pro: 1000,
  enterprise: 10000,
}
```

### 7. Monitor and Adjust

- Review violation logs weekly
- Adjust limits based on usage patterns
- Alert on unusual spikes
- Track user feedback

### 8. Whitelist Essential Operations

```typescript
// Don't rate limit health checks, webhooks, etc.
const EXEMPT_ENDPOINTS = [
  'health',
  'webhooks.stripe',
  'webhooks.supabase',
]
```

### 9. Clean Up Old Data

```sql
-- Run daily via cron
SELECT cleanup_rate_limits();
```

### 10. Document Limits

```typescript
/**
 * Create a new task
 *
 * Rate limit: 60 requests per minute
 *
 * @throws RateLimitError if limit exceeded
 */
export async function createTask(task: Task) {
  // ...
}
```

## Advanced Topics

### Distributed Rate Limiting

For multi-server deployments, use Redis:

```typescript
import Redis from 'ioredis'

const redis = new Redis()

export class RedisRateLimiter {
  async checkLimit(key: string, max: number, window: number) {
    const count = await redis.incr(key)

    if (count === 1) {
      await redis.expire(key, window)
    }

    return count <= max
  }
}
```

### Dynamic Rate Limits

Adjust limits based on system load:

```typescript
export async function getDynamicLimit(endpoint: string) {
  const load = await getSystemLoad()
  const baseLimit = 100

  if (load > 0.9) {
    return baseLimit * 0.5 // Reduce by 50%
  } else if (load > 0.7) {
    return baseLimit * 0.75 // Reduce by 25%
  }

  return baseLimit
}
```

### Cost-Based Rate Limiting

Different operations cost different amounts:

```typescript
const OPERATION_COSTS = {
  'tasks.create': 1,
  'tasks.update': 1,
  'ai.chat': 10,
  'export.data': 50,
}

export async function checkCostLimit(userId: string, operation: string) {
  const cost = OPERATION_COSTS[operation] || 1

  return limiter.checkTokenBucket(userId, 'global', {
    bucketSize: 1000,
    refillRate: 10,
    cost,
  })
}
```

## Migration Guide

### From No Rate Limiting

1. Deploy database schema
2. Configure default limits
3. Add rate limit checks (fail open initially)
4. Monitor for 1 week
5. Enable enforcement

### From Simple to Advanced

1. Start with fixed window
2. Monitor violation patterns
3. Switch high-traffic endpoints to sliding window
4. Use token bucket for AI/expensive operations
5. Add exemptions for premium users

## Troubleshooting

### Users Reporting False Positives

- Check for shared IPs (office networks)
- Review violation logs
- Consider exemptions
- Adjust limits upward

### Too Many Violations

- Limits too strict
- Bots/scrapers
- Review top violators
- Consider IP-based blocking

### Performance Issues

- Too many database calls
- Use in-memory for client
- Cache rate limit configs
- Optimize cleanup queries

## Conclusion

Rate limiting is essential for:
- Protecting your infrastructure
- Ensuring fair usage
- Controlling costs
- Maintaining quality of service

Start with simple fixed window limits, monitor usage, and evolve to more sophisticated strategies as needed.
