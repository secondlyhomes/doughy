# Infrastructure Monitoring

Comprehensive health checking and monitoring system for production infrastructure.

## Quick Start

```typescript
import { healthChecker, healthMonitor } from './HealthCheck'

// Single health check
const health = await healthChecker.getSystemHealth()
console.log(health.overall) // 'healthy' | 'degraded' | 'unhealthy'

// Continuous monitoring
healthMonitor.start(60000) // Check every minute
```

## Features

- **Database Health**: Check Supabase connection and latency
- **Storage Health**: Verify storage bucket access
- **External APIs**: Monitor OpenAI, Stripe, Sentry
- **Overall Status**: Aggregate health from all services
- **History Tracking**: Store health checks over time
- **Alerting**: Send alerts when services degrade
- **Uptime Stats**: Calculate uptime percentage

## Health Statuses

| Status | Meaning | HTTP Code |
|--------|---------|-----------|
| healthy | All systems operational | 200 |
| degraded | Some services slow/down | 207 |
| unhealthy | Critical services down | 503 |

## Database Schema

```sql
CREATE TABLE health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_status TEXT NOT NULL,
  services JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_health_checks_timestamp ON health_checks(timestamp);
```

## API Endpoint

```typescript
// app.get('/health')
import { healthChecker, createHealthCheckResponse } from './HealthCheck'

export async function handleHealthCheck(req, res) {
  const health = await healthChecker.getSystemHealth()
  const response = createHealthCheckResponse(health)
  
  res.status(response.statusCode).json(response.body)
}
```

## Monitoring Dashboard

```typescript
// Get uptime for last 24 hours
const stats = await getUptimeStats(24)
console.log(`Uptime: ${stats.uptime.toFixed(2)}%`)

// Get recent health checks
const history = await getHealthCheckHistory(100)
```

## Alerting

Configure alerts for:
- Any critical service (database, storage) becomes unhealthy
- More than 2 services become unhealthy
- System is degraded for more than 5 minutes
- Latency exceeds thresholds

## Best Practices

1. **Check Frequently**: Every 30-60 seconds
2. **Store History**: Keep 30 days of health checks
3. **Alert Quickly**: Send alerts within 1 minute
4. **Test Regularly**: Verify health checks work
5. **Document Thresholds**: Clear latency/error thresholds

## Latency Thresholds

- **Database**: < 100ms healthy, < 1s degraded, > 1s unhealthy
- **Storage**: < 500ms healthy, < 2s degraded, > 2s unhealthy
- **External APIs**: < 1s healthy, < 2s degraded, > 2s unhealthy

## Integration

### Status Page

Create a public status page showing system health:

```typescript
// status.example.com
const health = await healthChecker.getSystemHealth()
const stats = await getUptimeStats(24)

return {
  status: health.overall,
  uptime: stats.uptime,
  services: health.services.map(s => ({
    name: s.service,
    status: s.status,
  })),
}
```

### Incident Response

When health degrades:
1. Health check fails
2. Alert sent to on-call engineer
3. Engineer investigates using health history
4. Issue resolved
5. Post-mortem created

