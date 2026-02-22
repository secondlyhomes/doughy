# Rate Limiting Pattern

> Protecting resources and ensuring fair usage in React Native apps.

## Overview

Rate limiting prevents abuse and ensures fair resource allocation across tenants. This pattern covers server-side rate limiting with Supabase Edge Functions and client-side handling.

## Database Schema

```sql
-- Rate limit configurations
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  endpoint_pattern TEXT NOT NULL,
  requests_per_window INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  applies_to TEXT CHECK (applies_to IN ('user', 'tenant', 'ip', 'global')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limit tracking
CREATE TABLE rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_limit_id UUID REFERENCES rate_limits(id) ON DELETE CASCADE,
  identifier TEXT NOT NULL, -- user_id, tenant_id, ip, or 'global'
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rate_limit_id, identifier, window_start)
);

-- Index for fast lookups
CREATE INDEX idx_rate_limit_entries_lookup
  ON rate_limit_entries(rate_limit_id, identifier, window_start);

-- Cleanup old entries (run via pg_cron)
CREATE OR REPLACE FUNCTION cleanup_rate_limit_entries()
RETURNS void AS $$
  DELETE FROM rate_limit_entries
  WHERE window_start < NOW() - INTERVAL '1 hour';
$$ LANGUAGE sql;

-- Seed default limits
INSERT INTO rate_limits (name, endpoint_pattern, requests_per_window, window_seconds, applies_to) VALUES
  ('api_general', '/api/*', 1000, 3600, 'user'),
  ('ai_requests', '/api/ai/*', 100, 3600, 'tenant'),
  ('auth_attempts', '/auth/*', 10, 300, 'ip'),
  ('export_data', '/api/export/*', 5, 86400, 'user');
```

## Edge Function Rate Limiter

```typescript
// supabase/functions/_shared/rateLimiter.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class RateLimiter {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEY')!
    );
  }

  async check(
    limitName: string,
    identifier: string
  ): Promise<RateLimitResult> {
    // Get rate limit config
    const { data: limit } = await this.supabase
      .from('rate_limits')
      .select('*')
      .eq('name', limitName)
      .single();

    if (!limit) {
      return { allowed: true, remaining: -1, resetAt: new Date() };
    }

    const windowStart = new Date();
    windowStart.setSeconds(
      Math.floor(windowStart.getSeconds() / limit.window_seconds) * limit.window_seconds
    );
    windowStart.setMilliseconds(0);

    // Atomic increment or insert
    const { data: entry, error } = await this.supabase.rpc('increment_rate_limit', {
      p_rate_limit_id: limit.id,
      p_identifier: identifier,
      p_window_start: windowStart.toISOString(),
    });

    const currentCount = entry?.request_count || 1;
    const remaining = Math.max(0, limit.requests_per_window - currentCount);
    const resetAt = new Date(windowStart.getTime() + limit.window_seconds * 1000);

    if (currentCount > limit.requests_per_window) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - Date.now()) / 1000),
      };
    }

    return { allowed: true, remaining, resetAt };
  }
}

// SQL function for atomic increment
// CREATE OR REPLACE FUNCTION increment_rate_limit(
//   p_rate_limit_id UUID,
//   p_identifier TEXT,
//   p_window_start TIMESTAMPTZ
// ) RETURNS rate_limit_entries AS $$
//   INSERT INTO rate_limit_entries (rate_limit_id, identifier, window_start, request_count)
//   VALUES (p_rate_limit_id, p_identifier, p_window_start, 1)
//   ON CONFLICT (rate_limit_id, identifier, window_start)
//   DO UPDATE SET request_count = rate_limit_entries.request_count + 1
//   RETURNING *;
// $$ LANGUAGE sql;
```

## Edge Function with Rate Limiting

```typescript
// supabase/functions/api/index.ts
import { RateLimiter } from '../_shared/rateLimiter.ts';

const rateLimiter = new RateLimiter();

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const userId = await getUserIdFromToken(authHeader);
  const clientIP = req.headers.get('x-forwarded-for') || 'unknown';

  // Check rate limit
  const result = await rateLimiter.check('api_general', userId || clientIP);

  // Add rate limit headers to response
  const headers = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  };

  if (!result.allowed) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        ...headers,
        'Retry-After': result.retryAfter?.toString() || '60',
      },
    });
  }

  // Process request
  return handleRequest(req, headers);
});
```

## Client-Side Rate Limit Handler

```typescript
// src/services/apiClient.ts
import { Alert } from 'react-native';

interface RateLimitInfo {
  remaining: number;
  resetAt: Date;
}

class RateLimitedAPIClient {
  private rateLimitInfo: Map<string, RateLimitInfo> = new Map();

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Check if we're already rate limited for this endpoint
    const limitInfo = this.rateLimitInfo.get(endpoint);
    if (limitInfo && limitInfo.remaining <= 0 && new Date() < limitInfo.resetAt) {
      const waitTime = Math.ceil((limitInfo.resetAt.getTime() - Date.now()) / 1000);
      throw new RateLimitError(`Rate limited. Try again in ${waitTime} seconds.`, waitTime);
    }

    const response = await fetch(endpoint, options);

    // Parse rate limit headers
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '-1', 10);
    const resetAt = new Date(response.headers.get('X-RateLimit-Reset') || Date.now());
    this.rateLimitInfo.set(endpoint, { remaining, resetAt });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
      throw new RateLimitError('Rate limit exceeded', retryAfter);
    }

    return response.json();
  }

  getRateLimitInfo(endpoint: string): RateLimitInfo | undefined {
    return this.rateLimitInfo.get(endpoint);
  }
}

class RateLimitError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const apiClient = new RateLimitedAPIClient();
```

## Rate Limit Hook

```typescript
// src/hooks/useRateLimitedAction.ts
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface UseRateLimitedActionOptions {
  onRateLimited?: (retryAfter: number) => void;
  showAlert?: boolean;
}

export const useRateLimitedAction = <T extends (...args: unknown[]) => Promise<unknown>>(
  action: T,
  options: UseRateLimitedActionOptions = {}
) => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState(0);

  const execute = useCallback(async (...args: Parameters<T>) => {
    try {
      setIsRateLimited(false);
      return await action(...args);
    } catch (error) {
      if (error instanceof RateLimitError) {
        setIsRateLimited(true);
        setRetryAfter(error.retryAfter);

        if (options.onRateLimited) {
          options.onRateLimited(error.retryAfter);
        }

        if (options.showAlert !== false) {
          Alert.alert(
            'Please Wait',
            `You've made too many requests. Try again in ${error.retryAfter} seconds.`
          );
        }
      }
      throw error;
    }
  }, [action, options]);

  return { execute, isRateLimited, retryAfter };
};
```

## Rate Limit Status Component

```typescript
// src/components/RateLimitIndicator.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface RateLimitIndicatorProps {
  remaining: number;
  total: number;
  resetAt: Date;
}

export const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
  remaining,
  total,
  resetAt,
}) => {
  const { colors } = useTheme();
  const [countdown, setCountdown] = useState(0);
  const percentage = (remaining / total) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      const seconds = Math.max(0, Math.ceil((resetAt.getTime() - Date.now()) / 1000));
      setCountdown(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [resetAt]);

  const getStatusColor = () => {
    if (percentage > 50) return colors.success;
    if (percentage > 20) return colors.warning;
    return colors.error;
  };

  return (
    <View style={styles.container}>
      <View style={styles.barContainer}>
        <View
          style={[styles.bar, { width: `${percentage}%`, backgroundColor: getStatusColor() }]}
        />
      </View>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {remaining}/{total} requests remaining (resets in {countdown}s)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12 },
  barContainer: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 2 },
  text: { fontSize: 12, marginTop: 4 },
});
```

## Tenant-Specific Rate Limits

```sql
-- Override rate limits per tenant
CREATE TABLE tenant_rate_limit_overrides (
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  rate_limit_id UUID REFERENCES rate_limits(id) ON DELETE CASCADE,
  requests_per_window INTEGER NOT NULL,
  PRIMARY KEY (tenant_id, rate_limit_id)
);

-- Function to get effective limit
CREATE OR REPLACE FUNCTION get_effective_rate_limit(
  p_limit_name TEXT,
  p_tenant_id UUID
) RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT requests_per_window FROM tenant_rate_limit_overrides tro
     JOIN rate_limits rl ON rl.id = tro.rate_limit_id
     WHERE rl.name = p_limit_name AND tro.tenant_id = p_tenant_id),
    (SELECT requests_per_window FROM rate_limits WHERE name = p_limit_name)
  );
$$ LANGUAGE sql;
```

## Implementation Examples

See `.examples/enterprise/rate-limiting/` for a complete rate limiting implementation.

## Related Patterns

- [API Versioning](./API-VERSIONING.md)
- [Multi-Tenancy](./MULTI-TENANCY.md)
