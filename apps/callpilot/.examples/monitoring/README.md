# Monitoring & Analytics Guide

Complete monitoring and analytics suite for React Native + Expo applications.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Components](#components)
- [Tool Comparison](#tool-comparison)
- [Free Tier Limits](#free-tier-limits)
- [Privacy & Compliance](#privacy--compliance)
- [Cost Optimization](#cost-optimization)
- [Alert Configuration](#alert-configuration)
- [Best Practices](#best-practices)
- [Integration Examples](#integration-examples)
- [Troubleshooting](#troubleshooting)

## Overview

This monitoring suite provides comprehensive observability for your React Native application.

### What's Included

1. **Error Tracking** (Sentry)
   - Crash reporting
   - Error grouping
   - Release tracking
   - Source maps

2. **Analytics** (PostHog)
   - Event tracking
   - Feature flags
   - A/B testing
   - Funnel analysis

3. **Performance Monitoring**
   - FPS tracking
   - Memory monitoring
   - Screen load times
   - API latency

4. **Custom Metrics**
   - Business metrics
   - User behavior
   - Performance budgets
   - Real-time dashboards

## Quick Start

### 1. Install Dependencies

```bash
# Sentry
npx expo install @sentry/react-native

# PostHog
npm install posthog-react-native expo-file-system expo-application expo-localization

# Async Storage (for metrics)
npm install @react-native-async-storage/async-storage

# Supabase (for metrics storage)
npx expo install @supabase/supabase-js
```

### 2. Set Environment Variables

Add to your `.env` file:

```bash
# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id

# PostHog
EXPO_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Supabase (for metrics)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Setup Database

Run the SQL schema in `.examples/monitoring/metrics/database/schema.sql` in Supabase.

### 4. Initialize in App

In your `App.tsx`:

```typescript
import { initSentry } from './.examples/monitoring/sentry/sentryConfig';
import { ErrorBoundary } from './.examples/monitoring/sentry/ErrorBoundary';
import { AnalyticsProvider } from './.examples/monitoring/analytics/components/AnalyticsProvider';
import { PerformanceMonitor } from './.examples/monitoring/performance/PerformanceMonitor';
import { metricsService } from './.examples/monitoring/performance/services/metricsService';

// Initialize Sentry
initSentry({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
});

export default function App() {
  return (
    <ErrorBoundary>
      <AnalyticsProvider>
        <PerformanceMonitor
          onMetric={(metric) => {
            metricsService.record(
              metric.name,
              metric.value,
              metric.tags,
              metric.unit
            );
          }}
        />
        <YourApp />
      </AnalyticsProvider>
    </ErrorBoundary>
  );
}
```

## Components

### Error Tracking

See [sentry/README.md](./sentry/README.md) for detailed documentation.

**Quick Example:**

```typescript
import { captureException } from './sentry/sentryConfig';

try {
  await riskyOperation();
} catch (error) {
  captureException(error as Error, {
    tags: { operation: 'risky' },
    extra: { userId: user.id },
  });
}
```

### Analytics

See [analytics/README.md](./analytics/README.md) for detailed documentation.

**Quick Example:**

```typescript
import { useAnalytics } from './analytics/hooks/useAnalytics';
import { Events } from './analytics/events';

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent(Events.BUTTON_CLICKED, {
      buttonId: 'submit',
      screen: 'login',
    });
  };
}
```

### Performance Monitoring

See [performance/README.md](./performance/README.md) for detailed documentation.

**Quick Example:**

```typescript
import { usePerformanceTracker } from './performance/hooks/usePerformanceTracker';

function MyComponent() {
  const { trackOperation } = usePerformanceTracker();

  const loadData = async () => {
    await trackOperation('load_data', async () => {
      await fetchData();
    });
  };
}
```

### Custom Metrics

**Record Metrics:**

```typescript
import { metricsService } from './performance/services/metricsService';

metricsService.record('user_action', 1, {
  action: 'purchase',
  value: 99.99,
});
```

**View Dashboard:**

```typescript
import { MetricsDashboard } from './metrics/components/MetricsDashboard';

function AdminScreen() {
  return <MetricsDashboard days={7} />;
}
```

## Tool Comparison

### Error Tracking

| Tool | Free Tier | Pricing | Pros | Cons |
|------|-----------|---------|------|------|
| **Sentry** | 5K events/mo | $26/mo for 50K | Best-in-class error tracking | Can get expensive |
| Bugsnag | 7.5K events/mo | $59/mo for 20K | Good mobile support | Higher cost |
| Rollbar | 5K events/mo | $25/mo for 25K | Similar to Sentry | Less popular |

**Recommendation:** Sentry (industry standard, excellent docs)

### Analytics

| Tool | Free Tier | Pricing | Pros | Cons |
|------|-----------|---------|------|------|
| **PostHog** | 1M events/mo | $0.00031/event | Open-source, self-hostable | Newer product |
| Mixpanel | 100K users/mo | $28/mo | Mature product | Less generous free tier |
| Amplitude | 10M events/mo | $49/mo | Great for product analytics | Complex pricing |

**Recommendation:** PostHog (generous free tier, feature flags included)

### Performance Monitoring

| Tool | Free Tier | Pricing | Pros | Cons |
|------|-----------|---------|------|------|
| **Custom (Supabase)** | 500MB storage | $25/mo | Full control, cheap | DIY setup |
| Sentry Performance | 10K txns/mo | $26/mo | Integrated with errors | Limited free tier |
| New Relic | 100GB/mo | $99/mo | Comprehensive | Expensive |

**Recommendation:** Custom metrics + Supabase (most cost-effective)

## Free Tier Limits

### Stay Within Free Tiers

**Sentry (5,000 events/month):**

```typescript
// Sample non-critical errors
beforeSend(event) {
  if (event.level !== 'error' && event.level !== 'fatal') {
    if (Math.random() > 0.1) return null; // 10% sampling
  }
  return event;
}
```

**PostHog (1M events/month):**

```typescript
// Don't track in development
if (__DEV__) {
  // Use disabled analytics provider
}

// Sample non-critical events
const trackSampledEvent = (event: string, props: any, rate = 0.1) => {
  if (Math.random() < rate) {
    trackEvent(event, props);
  }
};
```

**Custom Metrics:**

```typescript
// Batch and flush periodically
metricsService.record('event', value); // Auto-flushes at 100 metrics
```

### Monitor Usage

1. **Sentry**: Settings → Usage & Billing
2. **PostHog**: Settings → Billing
3. **Supabase**: Settings → Usage

Set up alerts for 80% quota usage.

## Privacy & Compliance

### GDPR Compliance

**1. PII Filtering:**

```typescript
// Automatically filters emails, phone numbers, SSN, credit cards
initSentry({ dsn: '...' }); // PII filtering enabled by default
```

**2. User Consent:**

```typescript
import { optOut, optIn } from './analytics/posthogConfig';

function PrivacySettings() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleToggle = (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    enabled ? optIn() : optOut();
  };
}
```

**3. Data Deletion:**

```typescript
// Sentry: Settings → Data & Privacy → Data Deletion
// PostHog: Settings → Project Settings → Data Management
// Supabase: DELETE FROM app_metrics WHERE user_id = ?
```

### CCPA Compliance

```typescript
// Don't track California users unless opt-in
if (user.state === 'CA' && !user.hasOptedIn) {
  optOut();
}
```

### Data Retention

- **Sentry**: 30 days (free), 90 days (paid)
- **PostHog**: 1 year (free), unlimited (paid)
- **Custom Metrics**: Configure yourself (recommend 90 days)

```sql
-- Auto-cleanup old metrics
SELECT cleanup_old_metrics(90); -- Delete after 90 days
```

## Cost Optimization

### 1. Sampling Strategies

**Critical vs Non-Critical:**

```typescript
const SAMPLE_RATES = {
  critical: 1.0,    // 100% (errors, purchases)
  important: 0.5,   // 50% (user actions)
  normal: 0.1,      // 10% (page views)
  low: 0.01,        // 1% (scroll events)
};

trackEvent('scroll', properties, SAMPLE_RATES.low);
```

**Environment-Based:**

```typescript
const sampleRate = __DEV__ ? 1.0 : 0.2; // 100% dev, 20% prod
```

**Time-Based:**

```typescript
// Sample more during business hours
const hour = new Date().getHours();
const sampleRate = hour >= 9 && hour <= 17 ? 1.0 : 0.1;
```

### 2. Event Batching

```typescript
// Batch events before sending
const eventQueue: Event[] = [];

function queueEvent(event: Event) {
  eventQueue.push(event);

  if (eventQueue.length >= 10) {
    flushEvents();
  }
}
```

### 3. Smart Filtering

```typescript
// Don't track development events
if (!__DEV__) {
  trackEvent(event, properties);
}

// Filter noisy events
const noisyEvents = ['mousemove', 'scroll', 'resize'];
if (!noisyEvents.includes(eventName)) {
  trackEvent(eventName, properties);
}
```

### 4. Deduplication

```typescript
// Track unique events only
const trackedEvents = new Set<string>();

function trackOnce(eventId: string, event: string, properties: any) {
  if (!trackedEvents.has(eventId)) {
    trackEvent(event, properties);
    trackedEvents.add(eventId);
  }
}
```

## Alert Configuration

### Performance Alerts

```typescript
// Alert when P95 exceeds budget
const checkBudget = async () => {
  const stats = await metricsService.getMetricStats('screen_load');

  if (stats && stats.p95 > BUDGET) {
    sendAlert({
      title: 'Performance Degradation',
      message: `P95 screen load: ${stats.p95}ms (budget: ${BUDGET}ms)`,
    });
  }
};
```

### Error Rate Alerts

```typescript
// Alert when error rate > 5%
const errorRate = errorCount / totalRequests;

if (errorRate > 0.05) {
  sendAlert({
    title: 'High Error Rate',
    message: `Error rate: ${(errorRate * 100).toFixed(2)}%`,
  });
}
```

### Quota Alerts

```typescript
// Alert at 80% quota usage
const usage = currentEvents / monthlyQuota;

if (usage > 0.8) {
  sendAlert({
    title: 'Approaching Quota Limit',
    message: `${(usage * 100).toFixed(0)}% of monthly quota used`,
  });
}
```

## Best Practices

### 1. Initialize Early

```typescript
// Initialize before React renders
initSentry({ dsn: '...' });
initPostHog({ apiKey: '...' });

// Then render app
ReactDOM.render(<App />, root);
```

### 2. Set User Context

```typescript
// On login
function handleLogin(user: User) {
  setUserContext({ id: user.id, email: user.email });
  identifyUser(user.id, { email: user.email });
}

// On logout
function handleLogout() {
  clearUserContext();
  resetUser();
}
```

### 3. Use Breadcrumbs

```typescript
// Add context for debugging
addBreadcrumb('User navigated to checkout');
addBreadcrumb('Payment method selected: card');
addBreadcrumb('Payment submitted');
// Error occurs
// Sentry shows full breadcrumb trail
```

### 4. Tag Everything

```typescript
// Add tags for filtering
trackEvent('purchase', {
  // What
  product_id: '123',
  price: 99.99,

  // When
  timestamp: new Date().toISOString(),

  // Where
  screen: 'checkout',
  platform: Platform.OS,

  // Who
  user_plan: 'premium',

  // How
  payment_method: 'card',
});
```

### 5. Monitor Key Metrics

```typescript
// Core Web Vitals equivalent for mobile
const KEY_METRICS = {
  // Time to Interactive
  TTI: 2000, // ms

  // Screen Load Time
  screenLoad: 1500, // ms

  // API Response Time
  apiLatency: 500, // ms

  // Frames Per Second
  fps: 55, // fps

  // Memory Usage
  memory: 200, // MB
};
```

### 6. Create Dashboards

```sql
-- Screen performance dashboard
SELECT
  tags->>'screen' as screen,
  ROUND(AVG(metric_value)::numeric, 2) as avg_load_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY metric_value) as p95
FROM app_metrics
WHERE metric_name = 'screen_load'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY tags->>'screen'
ORDER BY avg_load_time DESC;
```

### 7. Test Monitoring

```typescript
// Add test events in development
if (__DEV__) {
  // Test error tracking
  const testError = () => {
    captureException(new Error('Test error'));
  };

  // Test analytics
  const testAnalytics = () => {
    trackEvent('test_event', { test: true });
  };

  // Test performance
  const testPerformance = () => {
    metricsService.record('test_metric', 100);
  };
}
```

## Integration Examples

### Complete Setup

```typescript
// App.tsx
import { initSentry } from './.examples/monitoring/sentry/sentryConfig';
import { ErrorBoundary } from './.examples/monitoring/sentry/ErrorBoundary';
import { AnalyticsProvider } from './.examples/monitoring/analytics/components/AnalyticsProvider';
import { PerformanceMonitor } from './.examples/monitoring/performance/PerformanceMonitor';
import { metricsService } from './.examples/monitoring/performance/services/metricsService';

// 1. Initialize Sentry
initSentry({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
  environment: __DEV__ ? 'development' : 'production',
});

// 2. App Component
export default function App() {
  return (
    <ErrorBoundary>
      <AnalyticsProvider
        apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY}
        autoTrackScreenViews={true}
      >
        <PerformanceMonitor
          onMetric={(metric) => {
            metricsService.record(
              metric.name,
              metric.value,
              metric.tags,
              metric.unit
            );
          }}
          thresholds={{
            minFPS: 55,
            maxMemoryMB: 200,
            maxScreenLoadTime: 2000,
          }}
        />
        <NavigationContainer>
          <YourApp />
        </NavigationContainer>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
}
```

### Screen Example

```typescript
import { useAnalytics } from './analytics/hooks/useAnalytics';
import { usePerformanceTracker } from './performance/hooks/usePerformanceTracker';
import { Events } from './analytics/events';

function DashboardScreen() {
  const { trackEvent, trackScreen } = useAnalytics();
  const { trackOperation } = usePerformanceTracker();

  useEffect(() => {
    // Track screen view
    trackScreen('Dashboard');

    // Track data load
    trackOperation('load_dashboard', async () => {
      const data = await fetchDashboardData();
      return data;
    }).then(() => {
      trackEvent(Events.CONTENT_VIEWED, {
        content_type: 'dashboard',
      });
    });
  }, []);

  return <View>{/* Dashboard UI */}</View>;
}
```

## Troubleshooting

### Events Not Appearing

1. **Check environment variables**: Verify all keys are set
2. **Check network**: Look for API calls in debugger
3. **Check sampling**: Ensure you're not sampling too aggressively
4. **Check filters**: Verify beforeSend isn't filtering everything

### High Costs

1. **Review sampling rates**: Increase sampling for non-critical events
2. **Check event volume**: Look for events firing too frequently
3. **Enable batching**: Batch events before sending
4. **Filter development**: Don't track in development

### Poor Performance

1. **Optimize monitoring code**: Keep tracking code fast
2. **Batch operations**: Don't flush on every event
3. **Use async operations**: Don't block UI thread
4. **Limit breadcrumbs**: Set reasonable maxBreadcrumbs

## Resources

- [Sentry Docs](https://docs.sentry.io/)
- [PostHog Docs](https://posthog.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [React Native Performance](https://reactnative.dev/docs/performance)

## Next Steps

1. [x] Install dependencies
2. [x] Set environment variables
3. [x] Initialize monitoring tools
4. [ ] Test error tracking
5. [ ] Test analytics
6. [ ] Test performance monitoring
7. [ ] Create custom dashboards
8. [ ] Set up alerts
9. [ ] Monitor usage
10. [ ] Optimize costs

For detailed guides on each component:
- [Error Tracking (Sentry)](./sentry/README.md)
- [Analytics (PostHog)](./analytics/README.md)
- [Performance Monitoring](./performance/README.md)
