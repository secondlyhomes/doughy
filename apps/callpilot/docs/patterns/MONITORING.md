# Monitoring & Observability

> Patterns for error tracking, crash reporting, performance monitoring, and analytics in React Native.

## Overview

Comprehensive monitoring helps identify issues before users report them. This guide covers Sentry for error tracking, analytics platforms, and health monitoring patterns.

## Sentry React Native

### Installation

```bash
npx expo install @sentry/react-native
```

### App Configuration

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-org",
          "project": "your-project"
        }
      ]
    ]
  }
}
```

### Initialization

```typescript
// src/services/sentry.ts
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export function initializeSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    release: Constants.expoConfig?.version,
    dist: Constants.expoConfig?.ios?.buildNumber,

    // Session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Performance
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    profilesSampleRate: __DEV__ ? 1.0 : 0.1,

    // Attachments
    attachScreenshot: true,
    attachViewHierarchy: true,

    // Filtering
    beforeSend(event) {
      // Filter out known non-issues
      if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
        return null;
      }
      return event;
    },

    // Integrations
    integrations: [
      Sentry.reactNativeTracingIntegration(),
    ],
  });
}
```

### User Context

```typescript
// src/services/sentry.ts (continued)
export function setUserContext(user: {
  id: string;
  email?: string;
  subscription?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
  });

  Sentry.setTag('subscription_tier', user.subscription ?? 'free');
}

export function clearUserContext() {
  Sentry.setUser(null);
}

// Call on auth state change
export function updateAuthContext(user: User | null) {
  if (user) {
    setUserContext({ id: user.id, email: user.email });
  } else {
    clearUserContext();
  }
}
```

### Breadcrumbs

```typescript
// src/services/sentry.ts (continued)
type BreadcrumbCategory =
  | 'navigation'
  | 'user_action'
  | 'api_call'
  | 'state_change';

export function addBreadcrumb(
  message: string,
  category: BreadcrumbCategory,
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// Usage examples
addBreadcrumb('Navigated to Profile', 'navigation', { from: 'Home' });
addBreadcrumb('Tapped Purchase Button', 'user_action', { product_id: '123' });
addBreadcrumb('API call completed', 'api_call', { endpoint: '/tasks', status: 200 });
```

### Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react-native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.withScope(scope => {
      scope.setExtra('componentStack', errorInfo.componentStack);
      Sentry.captureException(error);
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We've been notified and are working on a fix.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrap with Sentry for automatic error capture
export const SentryErrorBoundary = Sentry.withErrorBoundary(ErrorBoundary, {
  showDialog: false,
});
```

### Screen-Level Error Boundaries

```typescript
// src/components/ScreenErrorBoundary.tsx
import { ErrorBoundary } from './ErrorBoundary';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  screenName: string;
}

export function ScreenErrorBoundary({ children, screenName }: Props) {
  return (
    <ErrorBoundary
      fallback={
        <View style={styles.container}>
          <Text style={styles.text}>
            Unable to load {screenName}. Please try again.
          </Text>
        </View>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
import * as Sentry from '@sentry/react-native';

export function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan({ name, op: 'function' }, async () => {
    return operation();
  });
}

// Usage
const tasks = await measureAsync('fetchTasks', () =>
  supabase.from('tasks').select('*')
);
```

### Custom Metrics

```typescript
// src/services/metrics.ts
import * as Sentry from '@sentry/react-native';

export function trackMetric(name: string, value: number, unit: string) {
  Sentry.metrics.distribution(name, value, { unit });
}

// Usage
trackMetric('api_response_time', 250, 'millisecond');
trackMetric('list_items_count', 42, 'none');
```

## Analytics Platforms

### Unified Analytics Service

```typescript
// src/services/analytics.ts
import { Mixpanel } from 'mixpanel-react-native';

type EventProperties = Record<string, string | number | boolean | undefined>;

interface AnalyticsService {
  init(): Promise<void>;
  identify(userId: string, traits?: EventProperties): void;
  track(event: string, properties?: EventProperties): void;
  screen(name: string, properties?: EventProperties): void;
  reset(): void;
}

class MixpanelAnalytics implements AnalyticsService {
  private mixpanel: Mixpanel;

  constructor() {
    this.mixpanel = new Mixpanel(
      process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!,
      true
    );
  }

  async init() {
    await this.mixpanel.init();
  }

  identify(userId: string, traits?: EventProperties) {
    this.mixpanel.identify(userId);
    if (traits) {
      this.mixpanel.getPeople().set(traits);
    }
  }

  track(event: string, properties?: EventProperties) {
    this.mixpanel.track(event, properties);
  }

  screen(name: string, properties?: EventProperties) {
    this.track('Screen Viewed', { screen_name: name, ...properties });
  }

  reset() {
    this.mixpanel.reset();
  }
}

export const analytics: AnalyticsService = new MixpanelAnalytics();
```

### PostHog Alternative

```typescript
// src/services/analytics-posthog.ts
import PostHog from 'posthog-react-native';

class PostHogAnalytics implements AnalyticsService {
  private posthog: PostHog;

  constructor() {
    this.posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
      host: 'https://app.posthog.com',
    });
  }

  async init() {
    // PostHog initializes automatically
  }

  identify(userId: string, traits?: EventProperties) {
    this.posthog.identify(userId, traits);
  }

  track(event: string, properties?: EventProperties) {
    this.posthog.capture(event, properties);
  }

  screen(name: string, properties?: EventProperties) {
    this.posthog.screen(name, properties);
  }

  reset() {
    this.posthog.reset();
  }
}
```

### Analytics Hook

```typescript
// src/hooks/useAnalytics.ts
import { useCallback, useEffect } from 'react';
import { analytics } from '@/services/analytics';
import { addBreadcrumb } from '@/services/sentry';

export function useAnalytics() {
  const track = useCallback((
    event: string,
    properties?: Record<string, unknown>
  ) => {
    analytics.track(event, properties);
    addBreadcrumb(`Event: ${event}`, 'user_action', properties);
  }, []);

  return { track };
}

// Screen tracking hook
export function useScreenTracking(screenName: string) {
  useEffect(() => {
    analytics.screen(screenName);
    addBreadcrumb(`Screen: ${screenName}`, 'navigation');
  }, [screenName]);
}
```

## Health Checks

### App Health Monitor

```typescript
// src/services/health.ts
import NetInfo from '@react-native-community/netinfo';
import * as Sentry from '@sentry/react-native';
import { supabase } from './supabase';

interface HealthStatus {
  network: boolean;
  api: boolean;
  database: boolean;
  latency: number;
}

export async function checkHealth(): Promise<HealthStatus> {
  const start = Date.now();

  // Check network
  const netInfo = await NetInfo.fetch();
  const network = netInfo.isConnected ?? false;

  if (!network) {
    return { network: false, api: false, database: false, latency: 0 };
  }

  // Check API/Database
  let api = false;
  let database = false;

  try {
    const { error } = await supabase.from('health_check').select('id').limit(1);
    database = !error;
    api = true;
  } catch {
    // API unreachable
  }

  const latency = Date.now() - start;

  const status = { network, api, database, latency };

  // Report unhealthy state
  if (!api || !database) {
    Sentry.captureMessage('Health check failed', {
      level: 'warning',
      extra: status,
    });
  }

  return status;
}
```

### Periodic Health Monitoring

```typescript
// src/hooks/useHealthMonitor.ts
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { checkHealth, HealthStatus } from '@/services/health';

export function useHealthMonitor(intervalMs = 60000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const runCheck = async () => {
      const status = await checkHealth();
      setHealth(status);
    };

    // Initial check
    runCheck();

    // Periodic checks when app is active
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        runCheck();
        intervalRef.current = setInterval(runCheck, intervalMs);
      } else {
        clearInterval(intervalRef.current);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    intervalRef.current = setInterval(runCheck, intervalMs);

    return () => {
      subscription.remove();
      clearInterval(intervalRef.current);
    };
  }, [intervalMs]);

  return health;
}
```

## Alerting Patterns

### Critical Error Detection

```typescript
// src/services/alerts.ts
import * as Sentry from '@sentry/react-native';

type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

interface AlertContext {
  userId?: string;
  screen?: string;
  action?: string;
}

export function alertError(
  error: Error,
  severity: AlertSeverity,
  context?: AlertContext
) {
  Sentry.withScope(scope => {
    scope.setLevel(severityToLevel(severity));
    scope.setTag('alert_severity', severity);

    if (context) {
      scope.setExtras(context);
    }

    Sentry.captureException(error);
  });
}

function severityToLevel(severity: AlertSeverity): Sentry.SeverityLevel {
  switch (severity) {
    case 'critical': return 'fatal';
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'info';
  }
}

// Usage
try {
  await processPayment();
} catch (error) {
  alertError(error as Error, 'critical', {
    userId: user.id,
    action: 'payment_processing',
  });
  throw error;
}
```

## Monitoring Checklist

### Setup

- [ ] Sentry DSN configured
- [ ] Analytics token configured
- [ ] Source maps uploaded for production builds
- [ ] User context set on auth
- [ ] Error boundaries wrapping screens

### Events to Track

- [ ] Screen views
- [ ] Authentication events (login, logout, signup)
- [ ] Purchase events (started, completed, failed)
- [ ] Feature usage
- [ ] Error occurrences

### Alerts to Configure (Sentry Dashboard)

- [ ] Crash-free rate drops below 99%
- [ ] New error types detected
- [ ] Error spike (2x baseline)
- [ ] Performance regression

## Environment Variables

```bash
# .env.local
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
EXPO_PUBLIC_MIXPANEL_TOKEN=xxx
EXPO_PUBLIC_POSTHOG_KEY=phc_xxx
```

## Related Docs

- Integrations: `INTEGRATIONS.md`
- Security: `../09-security/SECURITY-CHECKLIST.md`
- Production Operations: `../13-lifecycle/PRODUCTION-OPERATIONS.md`
