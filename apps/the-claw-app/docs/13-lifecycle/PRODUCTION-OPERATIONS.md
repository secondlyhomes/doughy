# Production Operations Guide

## Overview

This comprehensive guide covers all aspects of operating a React Native + Expo + Supabase application in production. It includes monitoring, logging, error handling, backup procedures, disaster recovery, scaling strategies, and incident response.

## Table of Contents

1. [Monitoring and Alerting](#monitoring-and-alerting)
2. [Logging Strategy](#logging-strategy)
3. [Error Handling](#error-handling)
4. [Backup and Disaster Recovery](#backup-and-disaster-recovery)
5. [Scaling Strategies](#scaling-strategies)
6. [Performance Optimization](#performance-optimization)
7. [Security Operations](#security-operations)
8. [Incident Response](#incident-response)
9. [Maintenance Windows](#maintenance-windows)
10. [Capacity Planning](#capacity-planning)

---

## Monitoring and Alerting

### Application Performance Monitoring (APM)

#### Sentry Configuration

```typescript
// src/services/monitoring.ts
import * as Sentry from '@sentry/react-native';
import { SENTRY_DSN, ENVIRONMENT } from '@env';

export function initializeMonitoring() {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Performance monitoring
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Release tracking
    release: `${Application.applicationId}@${Application.nativeApplicationVersion}`,
    dist: Application.nativeBuildVersion,

    // Network breadcrumbs
    integrations: [
      new Sentry.ReactNativeTracing({
        tracingOrigins: ['api.yourdomain.com', 'supabase.co'],
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
      }),
    ],

    // Filter before sending
    beforeSend(event, hint) {
      // Don't send in development
      if (__DEV__) {
        console.log('Sentry event (dev):', event);
        return null;
      }

      // Filter out expected errors
      const error = hint.originalException;
      if (error?.message?.includes('Network request failed')) {
        // Don't report network errors to reduce noise
        return null;
      }

      // Add custom context
      event.contexts = {
        ...event.contexts,
        app: {
          version: Application.nativeApplicationVersion,
          build: Application.nativeBuildVersion,
        },
      };

      return event;
    },
  });
}
```

#### Key Metrics to Monitor

**App Health Metrics:**

| Metric | Normal Range | Alert Threshold | Severity |
|--------|--------------|-----------------|----------|
| Crash-free rate | > 99.5% | < 98% | High |
| ANR (Android) | < 0.1% | > 0.5% | High |
| App launch time | < 2s | > 4s | Medium |
| Screen render time | < 100ms | > 500ms | Medium |
| Memory usage | < 150MB | > 300MB | Medium |

**API Performance:**

| Metric | Normal Range | Alert Threshold | Severity |
|--------|--------------|-----------------|----------|
| API response time (p50) | < 200ms | > 500ms | Medium |
| API response time (p95) | < 500ms | > 2s | High |
| API error rate | < 0.1% | > 1% | High |
| Supabase connection errors | 0 | > 5/min | Critical |

**User Engagement:**

| Metric | Normal Range | Alert Threshold | Severity |
|--------|--------------|-----------------|----------|
| Daily Active Users (DAU) | Baseline | -20% | High |
| Session duration | > 5 min | < 2 min | Medium |
| Feature adoption | > 30% | < 10% | Low |

### Custom Monitoring Dashboard

```typescript
// src/services/analytics.ts
import * as Analytics from 'expo-firebase-analytics';

export class AppMonitoring {
  /**
   * Track custom metrics
   */
  static async trackMetric(
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await Analytics.logEvent(name, {
      value,
      ...metadata,
      timestamp: Date.now(),
    });
  }

  /**
   * Track app launch time
   */
  static async trackAppLaunch(duration: number): Promise<void> {
    await this.trackMetric('app_launch_time', duration, {
      platform: Platform.OS,
      version: Application.nativeApplicationVersion,
    });

    // Alert if slow
    if (duration > 4000) {
      logger.warn('Slow app launch', { duration });
    }
  }

  /**
   * Track screen render time
   */
  static async trackScreenRender(
    screenName: string,
    duration: number
  ): Promise<void> {
    await this.trackMetric('screen_render_time', duration, {
      screen: screenName,
    });

    if (duration > 500) {
      logger.warn('Slow screen render', { screenName, duration });
    }
  }

  /**
   * Track API call performance
   */
  static async trackAPICall(
    endpoint: string,
    duration: number,
    status: number
  ): Promise<void> {
    await this.trackMetric('api_call_duration', duration, {
      endpoint,
      status,
      success: status >= 200 && status < 300,
    });

    if (duration > 2000) {
      logger.warn('Slow API call', { endpoint, duration, status });
    }
  }

  /**
   * Track feature usage
   */
  static async trackFeatureUsage(featureName: string): Promise<void> {
    await Analytics.logEvent('feature_used', {
      feature: featureName,
      timestamp: Date.now(),
    });
  }
}
```

### Alert Configuration

**Sentry Alerts:**

```yaml
# .sentry/alerts.yaml
alerts:
  - name: High Error Rate
    conditions:
      - type: event_frequency
        value: 100
        interval: 1h
    actions:
      - type: slack
        channel: '#alerts-production'
      - type: pagerduty
        service: 'mobile-app'

  - name: Crash Rate Spike
    conditions:
      - type: crash_free_sessions
        value: 98
        comparison: '<'
    actions:
      - type: slack
        channel: '#alerts-critical'
      - type: pagerduty
        service: 'mobile-app'

  - name: Slow API Calls
    conditions:
      - type: transaction_duration
        value: 2000
        percentile: 95
    actions:
      - type: slack
        channel: '#alerts-performance'
```

### Health Checks

```typescript
// src/services/health.ts
export class HealthChecker {
  /**
   * Perform app health check
   */
  static async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkSupabaseConnection(),
      this.checkAPIAvailability(),
      this.checkStorageAccess(),
      this.checkNetworkConnectivity(),
    ]);

    const results = checks.map((result, index) => ({
      name: ['supabase', 'api', 'storage', 'network'][index],
      healthy: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason : undefined,
    }));

    const allHealthy = results.every((r) => r.healthy);

    return {
      healthy: allHealthy,
      checks: results,
      timestamp: Date.now(),
    };
  }

  private static async checkSupabaseConnection(): Promise<void> {
    const { error } = await supabase.from('health_check').select('id').limit(1);
    if (error) throw error;
  }

  private static async checkAPIAvailability(): Promise<void> {
    const response = await fetch('https://api.yourdomain.com/health');
    if (!response.ok) throw new Error('API unhealthy');
  }

  private static async checkStorageAccess(): Promise<void> {
    await AsyncStorage.setItem('health_check', 'ok');
    await AsyncStorage.removeItem('health_check');
  }

  private static async checkNetworkConnectivity(): Promise<void> {
    const state = await NetInfo.fetch();
    if (!state.isConnected) throw new Error('No network');
  }
}
```

---

## Logging Strategy

### Production Logging Setup

See [Logging Guide](../../.examples/production/logging/README.md) for detailed implementation.

**Key Points:**

1. **Structured Logging**: Always use structured JSON logs
2. **Log Levels**: Use appropriate levels (INFO, WARN, ERROR, FATAL)
3. **Context Enrichment**: Include user ID, session ID, device info
4. **PII Filtering**: Automatically redact sensitive information
5. **Log Aggregation**: Send logs to centralized service (DataDog, LogRocket)

```typescript
import { logger, StructuredLogger } from '@examples/production/logging/Logger';

// Initialize in App.tsx
useEffect(() => {
  logger.setUserId(user?.id);

  return () => {
    logger.destroy();
  };
}, [user]);

// Log important events
StructuredLogger.userAction('task_created', {
  taskId: task.id,
  timestamp: Date.now(),
});

// Log errors with context
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    context: 'task_creation',
    userId: user.id,
  });
}
```

### Log Retention Policy

**Development:**
- Console only, no persistence
- All levels enabled
- No sampling

**Staging:**
- 7 days retention
- DEBUG and above
- No sampling
- Send to staging log service

**Production:**
- 30 days retention
- INFO and above
- 10% sampling for INFO/WARN
- 100% sampling for ERROR/FATAL
- Send to production log service

### Log Rotation

```typescript
// Automatic log rotation (handled by Logger)
const logger = Logger.getInstance({
  maxFileSize: 5 * 1024 * 1024, // 5MB per file
  maxFiles: 3, // Keep 3 rotated files
});
```

---

## Error Handling

### Global Error Boundary

See [Error Handling Guide](../../.examples/production/error-handling/README.md) for implementation.

```tsx
import { ErrorBoundary } from '@examples/production/error-handling/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Report to monitoring service
        Sentry.captureException(error, {
          contexts: { react: { componentStack: errorInfo.componentStack } },
        });
      }}
    >
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
```

### Error Classification

**User-Facing Errors** (Show user-friendly message):
- Validation errors
- Business rule violations
- Permission errors

**Technical Errors** (Show generic error, log details):
- Network errors
- Database errors
- Unexpected exceptions

**Silent Errors** (Log but don't show):
- Analytics failures
- Non-critical background tasks

### Error Recovery Strategies

```typescript
import { ErrorRecovery } from '@examples/production/error-handling/ErrorBoundary';

// Automatic retry with fallback
const data = await ErrorRecovery.attemptRecovery(
  // Primary operation
  () => fetchFromAPI(),

  // Fallback strategies
  [
    () => fetchFromCache(),
    () => fetchMinimalData(),
  ],

  {
    maxRetries: 3,
    retryDelay: 1000,
  }
);
```

---

## Backup and Disaster Recovery

### Database Backup

**Automated Daily Backups:**

```bash
#!/bin/bash
# scripts/backup/backup-database.sh

# Supabase automatically backs up your database
# Additional backup to external storage:

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/supabase"
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Export schema and data
pg_dump \
  --host=db.your-project.supabase.co \
  --port=5432 \
  --username=postgres \
  --format=custom \
  --file="$BACKUP_FILE" \
  your_database

# Compress
gzip "$BACKUP_FILE"

# Upload to S3
aws s3 cp "$BACKUP_FILE.gz" "s3://your-backup-bucket/database/$DATE.sql.gz"

# Clean up local file
rm "$BACKUP_FILE.gz"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Backup Verification:**

```bash
#!/bin/bash
# scripts/backup/verify-backup.sh

LATEST_BACKUP=$(aws s3 ls s3://your-backup-bucket/database/ | sort | tail -n 1 | awk '{print $4}')

if [ -z "$LATEST_BACKUP" ]; then
  echo "ERROR: No backup found"
  exit 1
fi

# Download latest backup
aws s3 cp "s3://your-backup-bucket/database/$LATEST_BACKUP" /tmp/latest_backup.sql.gz

# Decompress
gunzip /tmp/latest_backup.sql.gz

# Verify it's a valid SQL file
if pg_restore --list /tmp/latest_backup.sql > /dev/null 2>&1; then
  echo "SUCCESS: Backup is valid"
  rm /tmp/latest_backup.sql
  exit 0
else
  echo "ERROR: Backup is corrupt"
  rm /tmp/latest_backup.sql
  exit 1
fi
```

### Data Restore Procedure

**Emergency Restore:**

```bash
#!/bin/bash
# scripts/backup/restore-database.sh

# WARNING: This will overwrite the current database
# Only use in emergency situations

read -p "Are you sure you want to restore? (yes/no) " -n 3 -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
  exit 1
fi

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore-database.sh <backup-file>"
  exit 1
fi

# Download backup from S3
aws s3 cp "s3://your-backup-bucket/database/$BACKUP_FILE" /tmp/restore.sql.gz

# Decompress
gunzip /tmp/restore.sql.gz

# Create new database for restore
createdb restore_temp

# Restore to temp database
pg_restore \
  --host=db.your-project.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=restore_temp \
  --clean \
  --if-exists \
  /tmp/restore.sql

# Verify restore
psql -h db.your-project.supabase.co -U postgres -d restore_temp -c "SELECT COUNT(*) FROM users;"

# Swap databases (requires downtime)
read -p "Verification successful. Swap databases? (yes/no) " -n 3 -r
echo
if [[ $REPLY =~ ^yes$ ]]; then
  # Terminate existing connections
  psql -h db.your-project.supabase.co -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'production';"

  # Rename databases
  psql -h db.your-project.supabase.co -U postgres -c "ALTER DATABASE production RENAME TO production_old;"
  psql -h db.your-project.supabase.co -U postgres -c "ALTER DATABASE restore_temp RENAME TO production;"

  echo "Database restored successfully"
else
  echo "Restore cancelled"
fi

# Cleanup
rm /tmp/restore.sql
```

### Disaster Recovery Plan

**RPO (Recovery Point Objective):** 24 hours (daily backups)
**RTO (Recovery Time Objective):** 4 hours

**Recovery Scenarios:**

1. **Database Corruption**
   - Restore from latest backup (automated daily)
   - Expected downtime: 1-2 hours
   - Data loss: Up to 24 hours

2. **Complete Infrastructure Failure**
   - Provision new Supabase project
   - Restore database from S3 backup
   - Update app configuration
   - Expected downtime: 4 hours
   - Data loss: Up to 24 hours

3. **Data Breach**
   - Isolate affected systems
   - Rotate all credentials
   - Restore from clean backup
   - Audit all access logs
   - Notify affected users
   - Expected downtime: 8+ hours

**Recovery Runbook:**

```markdown
## Disaster Recovery Steps

1. **Assess Situation** (0-15 min)
   - [ ] Identify scope of failure
   - [ ] Determine data loss window
   - [ ] Notify stakeholders
   - [ ] Create incident channel

2. **Isolate Problem** (15-30 min)
   - [ ] Stop affected services
   - [ ] Prevent further data loss
   - [ ] Document current state

3. **Prepare Recovery** (30-60 min)
   - [ ] Identify latest valid backup
   - [ ] Verify backup integrity
   - [ ] Provision recovery environment
   - [ ] Test recovery process (if time permits)

4. **Execute Recovery** (1-3 hours)
   - [ ] Restore database
   - [ ] Verify data integrity
   - [ ] Update application configuration
   - [ ] Run smoke tests

5. **Validate and Monitor** (3-4 hours)
   - [ ] Comprehensive testing
   - [ ] Monitor error rates
   - [ ] Check user reports
   - [ ] Document recovery process

6. **Post-Recovery** (4+ hours)
   - [ ] Analyze root cause
   - [ ] Update runbooks
   - [ ] Schedule post-mortem
   - [ ] Implement preventive measures
```

---

## Scaling Strategies

### Horizontal Scaling

**Supabase Scaling:**

Supabase automatically handles scaling for most needs. For high traffic:

1. **Connection Pooling**
   ```typescript
   // Use Supabase connection pooler for high concurrency
   const supabase = createClient(
     'https://your-project.supabase.co',
     'your-anon-key',
     {
       db: {
         pooler: true, // Use connection pooler
       },
     }
   );
   ```

2. **Read Replicas**
   ```typescript
   // Route read queries to replicas
   const readOnlyClient = createClient(
     'https://read-replica.supabase.co',
     'your-anon-key'
   );

   // Use for read-heavy operations
   const { data } = await readOnlyClient.from('tasks').select('*');
   ```

3. **Caching Layer**
   ```typescript
   // Implement Redis cache for frequently accessed data
   const cache = new RedisCache({
     host: 'redis.example.com',
     ttl: 300, // 5 minutes
   });

   async function getTasks() {
     const cacheKey = 'tasks:all';

     // Try cache first
     const cached = await cache.get(cacheKey);
     if (cached) return JSON.parse(cached);

     // Fetch from database
     const { data } = await supabase.from('tasks').select('*');

     // Cache result
     await cache.set(cacheKey, JSON.stringify(data));

     return data;
   }
   ```

### Vertical Scaling

**Upgrade Supabase Plan:**

| Tier | Connections | Storage | Bandwidth | Price |
|------|-------------|---------|-----------|-------|
| Free | 60 | 500MB | 2GB | $0 |
| Pro | 200 | 8GB | 50GB | $25/mo |
| Team | 400 | 100GB | 250GB | $599/mo |
| Enterprise | Custom | Custom | Custom | Custom |

### API Rate Limiting

```typescript
// Implement client-side rate limiting
class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async throttle(): Promise<void> {
    const now = Date.now();

    // Remove old requests
    this.requests = this.requests.filter(
      (time) => now - time < this.windowMs
    );

    if (this.requests.length >= this.maxRequests) {
      // Calculate wait time
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      logger.warn('Rate limit hit, throttling', { waitTime });
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.requests.push(now);
  }
}

// Usage
const apiLimiter = new RateLimiter(100, 60000); // 100 requests per minute

async function callAPI() {
  await apiLimiter.throttle();
  return await fetch('/api/data');
}
```

### CDN for Static Assets

```typescript
// Use CDN for images and static files
const CDN_URL = 'https://cdn.yourdomain.com';

function getImageUrl(path: string): string {
  return `${CDN_URL}/${path}`;
}

// In component
<Image source={{ uri: getImageUrl('images/logo.png') }} />
```

---

## Performance Optimization

### App Performance

**Optimize Bundle Size:**

```bash
# Analyze bundle
npx expo-updates:assets:verify

# Tree shaking - remove unused code
# Enable in metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
};
```

**Code Splitting:**

```typescript
// Lazy load heavy screens
const HeavyScreen = React.lazy(() => import('./screens/HeavyScreen'));

function Navigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Heavy">
        {() => (
          <Suspense fallback={<LoadingScreen />}>
            <HeavyScreen />
          </Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
```

**Image Optimization:**

```typescript
// Use optimized image formats
import { Image } from 'expo-image';

function OptimizedImage({ source }) {
  return (
    <Image
      source={source}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk" // Cache aggressively
    />
  );
}
```

### Database Performance

**Query Optimization:**

```typescript
// Bad: N+1 query
const tasks = await supabase.from('tasks').select('*');
for (const task of tasks) {
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', task.user_id);
}

// Good: Single query with join
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    *,
    users (
      id,
      name,
      email
    )
  `);
```

**Pagination:**

```typescript
// Implement cursor-based pagination for large datasets
async function getTasks(cursor?: string, limit = 20) {
  let query = supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data } = await query;

  return {
    tasks: data,
    nextCursor: data.length === limit ? data[data.length - 1].created_at : null,
  };
}
```

**Indexing:**

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);

-- Composite index for common query patterns
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
```

---

## Security Operations

### Credential Rotation

**Monthly Rotation Schedule:**

```bash
#!/bin/bash
# scripts/security/rotate-credentials.sh

# 1. Generate new API keys
NEW_KEY=$(openssl rand -hex 32)

# 2. Update Supabase anon key (via dashboard)
# Manual step - update in Supabase dashboard

# 3. Update environment variables
echo "SUPABASE_ANON_KEY=$NEW_KEY" >> .env.production

# 4. Deploy new version
eas build --platform all --profile production
eas submit --platform all

# 5. Monitor for errors
# Wait 24 hours before removing old key

# 6. Revoke old key (via dashboard)
# Manual step - revoke in Supabase dashboard
```

### Security Audits

**Quarterly Security Checklist:**

- [ ] Review RLS policies
- [ ] Audit user permissions
- [ ] Check for exposed secrets
- [ ] Update dependencies
- [ ] Scan for vulnerabilities
- [ ] Review access logs
- [ ] Test auth flows
- [ ] Verify encryption
- [ ] Check SSL certificates
- [ ] Review third-party integrations

**Automated Security Scanning:**

```bash
# npm audit
npm audit --production

# Check for known vulnerabilities
npx snyk test

# Analyze bundle for security issues
npx expo-security-audit
```

---

## Incident Response

See [INCIDENT-RESPONSE.md](./INCIDENT-RESPONSE.md) for detailed runbooks.

**Quick Reference:**

| Severity | Response Time | Actions |
|----------|---------------|---------|
| P0 (Critical) | < 5 min | Immediate page, all hands |
| P1 (High) | < 1 hour | Assign IC, create channel |
| P2 (Medium) | < 4 hours | Create ticket, assign owner |
| P3 (Low) | < 24 hours | Add to backlog |

---

## Maintenance Windows

### Scheduled Maintenance

**Typical Schedule:**
- **Day**: Sunday 2:00 AM - 4:00 AM PST
- **Frequency**: Monthly (first Sunday)
- **Duration**: Up to 2 hours
- **Notification**: 72 hours advance notice

**Maintenance Checklist:**

```markdown
## Pre-Maintenance (T-72 hours)
- [ ] Notify users via in-app banner
- [ ] Send email to all users
- [ ] Update status page
- [ ] Create deployment plan
- [ ] Prepare rollback plan

## During Maintenance (T-0)
- [ ] Enable maintenance mode
- [ ] Create database backup
- [ ] Deploy new version
- [ ] Run database migrations
- [ ] Verify deployment
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Disable maintenance mode

## Post-Maintenance (T+1 hour)
- [ ] Monitor metrics (4 hours)
- [ ] Check error reports
- [ ] Review user feedback
- [ ] Update status page
- [ ] Send completion email
- [ ] Document issues
```

### Emergency Maintenance

**When Required:**
- Critical security vulnerability
- Data corruption risk
- Service outage

**Process:**
1. Assess severity (< 15 min)
2. Notify stakeholders (< 30 min)
3. Update status page immediately
4. Execute fix (< 2 hours)
5. Verify and monitor (< 4 hours)
6. Post-mortem (< 48 hours)

---

## Capacity Planning

### User Growth Projections

**Monthly Capacity Review:**

```typescript
// Calculate current capacity utilization
const capacityMetrics = {
  databaseConnections: {
    current: 150,
    max: 200,
    utilization: 0.75,
    growthRate: 0.05, // 5% monthly
    monthsUntilLimit: 5,
  },
  storageUsage: {
    current: 5000, // MB
    max: 8000,
    utilization: 0.625,
    growthRate: 0.08,
    monthsUntilLimit: 4,
  },
  apiRequests: {
    current: 50000000, // per month
    max: 100000000,
    utilization: 0.5,
    growthRate: 0.1,
    monthsUntilLimit: 5,
  },
};

function calculateCapacityForecast(
  current: number,
  growthRate: number,
  max: number,
  months: number
): number {
  let projected = current;
  for (let i = 0; i < months; i++) {
    projected *= (1 + growthRate);
  }
  return projected / max;
}

// Alert if utilization > 80% within 3 months
const forecast = calculateCapacityForecast(
  capacityMetrics.databaseConnections.current,
  capacityMetrics.databaseConnections.growthRate,
  capacityMetrics.databaseConnections.max,
  3
);

if (forecast > 0.8) {
  logger.warn('Capacity limit approaching', {
    resource: 'database_connections',
    currentUtilization: capacityMetrics.databaseConnections.utilization,
    projectedUtilization: forecast,
    monthsToLimit: 3,
  });
}
```

### Scaling Triggers

**Automatic Scaling Rules:**

| Metric | Threshold | Action | Timeline |
|--------|-----------|--------|----------|
| DB Connections | > 80% | Upgrade Supabase tier | Within 1 week |
| Storage | > 75% | Add storage | Within 2 weeks |
| API Requests | > 80% | Add caching layer | Within 1 week |
| Error Rate | > 1% | Investigate immediately | < 1 hour |
| Response Time | p95 > 2s | Optimize queries | Within 3 days |

---

## Runbooks

See [RUNBOOK.md](./RUNBOOK.md) for detailed operational procedures.

**Quick Links:**

- [Database Backup](./RUNBOOK.md#database-backup)
- [Restore Procedure](./RUNBOOK.md#restore-procedure)
- [Deploy New Version](./RUNBOOK.md#deploy-new-version)
- [Rollback Deployment](./RUNBOOK.md#rollback-deployment)
- [Clear App Cache](./RUNBOOK.md#clear-app-cache)
- [Reset User Password](./RUNBOOK.md#reset-user-password)
- [Delete User Data](./RUNBOOK.md#delete-user-data)

---

## Appendix

### Useful Commands

```bash
# Check app health
curl https://api.yourdomain.com/health

# View recent logs
tail -f /var/log/app.log

# Database connection count
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';"

# Check disk usage
df -h

# Monitor real-time metrics
watch -n 1 'curl -s https://api.yourdomain.com/metrics'
```

### Contact Information

**On-Call Rotation:**
- Primary: See PagerDuty schedule
- Secondary: See PagerDuty schedule
- Escalation: CTO

**External Services:**
- Supabase Support: support@supabase.com
- Expo Support: support@expo.dev
- Sentry Support: support@sentry.io

**Emergency Contacts:**
- Security Incident: security@yourdomain.com
- Legal: legal@yourdomain.com
- PR/Communications: pr@yourdomain.com

---

## Related Documentation

- [Incident Response](./INCIDENT-RESPONSE.md)
- [Runbook](./RUNBOOK.md)
- [Error Handling](../../.examples/production/error-handling/README.md)
- [Logging Guide](../../.examples/production/logging/README.md)
- [Security Checklist](../09-security/SECURITY-CHECKLIST.md)
- [Deployment Guide](../11-deployment/DEPLOYMENT-GUIDE.md)
