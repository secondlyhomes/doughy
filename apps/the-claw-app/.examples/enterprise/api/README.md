# Enterprise API & Infrastructure

Complete enterprise-grade API and infrastructure systems for scalable production applications.

## Overview

This directory contains comprehensive implementations of:

1. **Rate Limiting** - Protect your API from abuse
2. **API Versioning** - Manage multiple API versions
3. **White-Labeling** - Multi-tenant branding system
4. **Feature Flags** - Gradual rollouts and A/B testing
5. **Infrastructure Monitoring** - Health checks and uptime tracking

## Quick Links

| System | Description | Directory |
|--------|-------------|-----------|
| [Rate Limiting](./rate-limiting/README.md) | API rate limiting with multiple strategies | `./rate-limiting/` |
| [API Versioning](./versioning/README.md) | Multi-version API management | `./versioning/` |
| [White-Labeling](../white-label/README.md) | Multi-tenant branding system | `../white-label/` |
| [Feature Flags](../feature-flags/README.md) | Feature toggle system | `../feature-flags/` |
| [Monitoring](../infrastructure/README.md) | Health checks and monitoring | `../infrastructure/` |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Rate Limit │→ │ Feature Flag │→ │ API Version  │        │
│  └────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                          │
│  ┌──────────┐  ┌───────────┐  ┌────────────────┐           │
│  │ Database │  │  Storage  │  │  Edge Functions │           │
│  └──────────┘  └───────────┘  └────────────────┘           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               External Services                              │
│  ┌─────────┐  ┌────────┐  ┌────────┐  ┌──────────┐        │
│  │ OpenAI  │  │ Stripe │  │ Sentry │  │ PostHog  │        │
│  └─────────┘  └────────┘  └────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Getting Started

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
npm install @react-native-async-storage/async-storage
```

### 2. Set Up Database

```bash
# Run schema migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript
```

### 3. Configure Environment

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# External Services
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=your_stripe_key
SENTRY_DSN=your_sentry_dsn
```

### 4. Initialize Systems

```typescript
// app/_layout.tsx
import { RateLimiter } from '@/.examples/enterprise/api/rate-limiting/RateLimiter'
import { APIVersionManager } from '@/.examples/enterprise/api/versioning/APIVersion'
import { WhiteLabelProvider } from '@/.examples/enterprise/white-label/ThemeCustomization'
import { FeatureFlagProvider } from '@/.examples/enterprise/feature-flags/FeatureFlagContext'
import { healthMonitor } from '@/.examples/enterprise/infrastructure/HealthCheck'

export default function RootLayout() {
  useEffect(() => {
    // Start health monitoring
    healthMonitor.start(60000)

    return () => healthMonitor.stop()
  }, [])

  return (
    <WhiteLabelProvider organizationId={currentOrg?.id}>
      <FeatureFlagProvider>
        <Stack />
      </FeatureFlagProvider>
    </WhiteLabelProvider>
  )
}
```

## System Integration

### Rate Limiting + API Versioning

```typescript
import { RateLimiter } from './rate-limiting/RateLimiter'
import { APIVersionManager } from './versioning/APIVersion'

const limiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 })
const versionManager = new APIVersionManager()

export async function handleAPIRequest(request: any) {
  // 1. Check rate limit
  await limiter.checkAndThrow(request.userId, request.endpoint)

  // 2. Route to correct version
  const response = await versionManager.handleRequest({
    version: request.version,
    endpoint: request.endpoint,
    method: request.method,
    params: request.params,
  })

  return response
}
```

### Feature Flags + White-Labeling

```typescript
import { useFeatureFlag } from './feature-flags/FeatureFlagContext'
import { useTheme } from './white-label/ThemeCustomization'

function MyComponent() {
  const theme = useTheme()
  const newUIEnabled = useFeatureFlag('new-ui')

  return (
    <View style={{ backgroundColor: theme.colors.primary }}>
      {newUIEnabled ? <NewUI /> : <OldUI />}
    </View>
  )
}
```

### Health Monitoring + Alerting

```typescript
import { healthChecker } from './infrastructure/HealthCheck'

setInterval(async () => {
  const health = await healthChecker.getSystemHealth()

  if (health.overall !== 'healthy') {
    await sendAlert({
      severity: health.overall === 'degraded' ? 'warning' : 'critical',
      message: `System health: ${health.overall}`,
      services: health.services.filter(s => s.status !== 'healthy'),
    })
  }
}, 60000)
```

## Scalability Considerations

### Rate Limiting

**Problem**: In-memory rate limiting doesn't work across multiple servers

**Solution**: Use Redis for distributed rate limiting

```typescript
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export class DistributedRateLimiter {
  async checkLimit(key: string, max: number, window: number) {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, window)
    }
    return count <= max
  }
}
```

### Feature Flags

**Problem**: Database query on every flag check

**Solution**: Cache flags locally and sync periodically

```typescript
// Cached for 5 minutes
const flagCache = new Map<string, { value: boolean; expires: number }>()

export function getCachedFlag(key: string): boolean | null {
  const cached = flagCache.get(key)
  if (cached && cached.expires > Date.now()) {
    return cached.value
  }
  return null
}
```

### Health Monitoring

**Problem**: Health checks add latency to requests

**Solution**: Run health checks in background

```typescript
// Don't block requests
healthMonitor.start(60000) // Check every minute

// Expose cached health status
export function getLastHealthCheck() {
  return cachedHealth
}
```

## Performance Optimization

### Database Indexes

```sql
-- Rate limiting
CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_end);

-- Feature flags
CREATE INDEX idx_feature_flags_key ON feature_flags(key);

-- Health checks
CREATE INDEX idx_health_checks_timestamp ON health_checks(timestamp DESC);
```

### Query Optimization

```typescript
// Bad - N+1 queries
for (const endpoint of endpoints) {
  await checkRateLimit(userId, endpoint)
}

// Good - Single query
await checkRateLimitBatch(userId, endpoints)
```

### Caching Strategy

1. **Rate Limits**: In-memory cache per request
2. **Feature Flags**: Local cache, 5-minute TTL
3. **White-Label Config**: Local cache, refresh on org change
4. **Health Status**: In-memory cache, 1-minute TTL

## Security Considerations

### Rate Limiting

- Use API keys for external access
- Implement per-IP rate limiting for unauthenticated endpoints
- Add CAPTCHA after multiple violations
- Log and alert on suspicious patterns

### API Versioning

- Never expose internal version numbers
- Validate all version inputs
- Sunset old versions with advance notice
- Audit API usage by version

### Feature Flags

- Restrict flag management to admins
- Audit flag changes
- Validate targeting criteria
- Don't expose flag logic to clients

### Monitoring

- Secure health check endpoints
- Don't expose sensitive data in responses
- Rate limit health check endpoint
- Require authentication for detailed checks

## Testing

### Unit Tests

```typescript
describe('Rate Limiter', () => {
  it('allows requests under limit', async () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 })
    for (let i = 0; i < 5; i++) {
      const result = await limiter.checkLimit('user-1', 'test')
      expect(result.allowed).toBe(true)
    }
  })
})

describe('API Versioning', () => {
  it('routes to correct version handler', async () => {
    const manager = new APIVersionManager()
    const response = await manager.handleRequest({
      version: 'v2',
      endpoint: 'tasks',
      method: 'GET',
    })
    expect(response.data).toBeDefined()
  })
})
```

### Integration Tests

```typescript
describe('System Integration', () => {
  it('enforces rate limits across API versions', async () => {
    // Make requests to v1 and v2
    // Verify total rate limit is enforced
  })

  it('respects feature flags per organization', async () => {
    // Enable flag for org A
    // Verify org B doesn't see it
  })
})
```

### Load Tests

```bash
# Apache Bench
ab -n 10000 -c 100 http://localhost:3000/api/v3/tasks

# k6
k6 run load-test.js
```

## Monitoring & Observability

### Metrics to Track

1. **Rate Limiting**
   - Requests per minute
   - Rate limit violations
   - Top violators

2. **API Versions**
   - Usage per version
   - Deprecation warnings sent
   - Migration progress

3. **Feature Flags**
   - Enabled users per flag
   - Flag evaluation time
   - Flag toggle frequency

4. **Health**
   - Uptime percentage
   - Service latencies
   - Error rates

### Dashboards

Create dashboards for:
- Real-time system health
- API usage by version
- Rate limit violations
- Feature flag rollout progress
- Uptime statistics

### Alerts

Set up alerts for:
- System becomes unhealthy
- Rate limit violations spike
- Deprecated API version usage increases
- Feature flag evaluation fails
- High latency detected

## Troubleshooting

### Rate Limiting Issues

**Problem**: Users hitting rate limits unexpectedly

**Solution**:
1. Check violation logs
2. Review rate limit configs
3. Consider increasing limits
4. Add exemptions for power users

### API Versioning Issues

**Problem**: Breaking changes not caught before deployment

**Solution**:
1. Run automated API diff tool
2. Review breaking changes in PR
3. Test with client SDKs
4. Communicate changes early

### Feature Flag Issues

**Problem**: Flag not enabling for target users

**Solution**:
1. Check flag configuration
2. Verify user/org targeting
3. Review evaluation logs
4. Clear flag cache

### Health Check Issues

**Problem**: False positive health alerts

**Solution**:
1. Adjust latency thresholds
2. Add retry logic
3. Review alert conditions
4. Test health checks regularly

## Production Checklist

- [ ] Rate limiting configured per endpoint
- [ ] API versioning enabled
- [ ] Old versions deprecated with timeline
- [ ] White-label configs loaded
- [ ] Feature flags tested
- [ ] Health monitoring running
- [ ] Alerts configured
- [ ] Metrics tracked
- [ ] Documentation updated
- [ ] Load tested
- [ ] Disaster recovery plan documented

## Contributing

When adding new features:
1. Add rate limiting configuration
2. Consider API versioning impact
3. Add feature flag for gradual rollout
4. Update health checks if adding dependencies
5. Document in README
6. Add tests
7. Update dashboards

## Resources

- [Rate Limiting Best Practices](./rate-limiting/README.md)
- [API Versioning Guide](./versioning/README.md)
- [White-Labeling Documentation](../white-label/README.md)
- [Feature Flags Lifecycle](../feature-flags/README.md)
- [Monitoring Setup](../infrastructure/README.md)

## Support

For questions or issues:
1. Check system documentation
2. Review troubleshooting guide
3. Check health dashboard
4. Contact DevOps team

## License

MIT
