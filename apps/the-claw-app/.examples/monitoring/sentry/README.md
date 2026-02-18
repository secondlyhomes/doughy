# Sentry Integration Guide

Complete guide for integrating Sentry error tracking and performance monitoring in your React Native + Expo application.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Configuration](#configuration)
- [Error Tracking](#error-tracking)
- [Performance Monitoring](#performance-monitoring)
- [Privacy & PII Filtering](#privacy--pii-filtering)
- [Release Tracking](#release-tracking)
- [Source Maps](#source-maps)
- [User Feedback](#user-feedback)
- [Testing](#testing)
- [Free Tier Limits](#free-tier-limits)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Sentry provides real-time error tracking and performance monitoring for React Native applications.

### Features

- **Error Tracking**: Capture and track JavaScript errors
- **Performance Monitoring**: Monitor app performance and identify bottlenecks
- **Breadcrumbs**: Debug context leading up to errors
- **Release Health**: Track crash-free sessions and adoption
- **User Feedback**: Collect feedback directly from error screens
- **Source Maps**: View original source code in stack traces

### Free Tier

- **5,000 errors/month**
- **10,000 performance transactions/month**
- **Unlimited projects**
- **30-day retention**

Upgrade to paid plans for higher limits and advanced features.

## Installation

### 1. Install Sentry SDK

```bash
npx expo install @sentry/react-native
```

### 2. Install Expo Plugins

```bash
npx expo install expo-constants
```

### 3. Configure app.json

Add Sentry plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-org-slug",
          "project": "your-project-slug",
          "url": "https://sentry.io/"
        }
      ]
    ]
  }
}
```

### 4. Rebuild Development Client

After adding the plugin, rebuild your development client:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

## Basic Setup

### 1. Create Sentry Project

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project
3. Select "React Native" as platform
4. Copy your DSN

### 2. Set Environment Variables

Add to your `.env` file:

```bash
EXPO_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
EXPO_PUBLIC_SENTRY_ORG=your-org-slug
EXPO_PUBLIC_SENTRY_PROJECT=your-project-slug
```

### 3. Initialize Sentry

In your `App.tsx`:

```typescript
import { initSentry } from './.examples/monitoring/sentry/sentryConfig';
import { ErrorBoundary } from './.examples/monitoring/sentry/ErrorBoundary';

// Initialize Sentry before rendering
initSentry({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
});

export default function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Configuration

### Environment-Specific Config

```typescript
import { initSentry } from './sentryConfig';

initSentry({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
  environment: __DEV__ ? 'development' : 'production',

  // Sample rates (adjust based on traffic)
  tracesSampleRate: __DEV__ ? 1.0 : 0.2, // 100% dev, 20% prod

  // Don't send events in Expo development
  enableInExpoDevelopment: false,

  // Debug logging in development
  debug: __DEV__,
});
```

### Sampling Strategies

To stay within free tier limits, use sampling:

```typescript
// Option 1: Simple percentage
tracesSampleRate: 0.1, // 10% of transactions

// Option 2: Conditional sampling
tracesSampler: (samplingContext) => {
  // Sample 100% of critical operations
  if (samplingContext.transactionContext.name === 'payment') {
    return 1.0;
  }

  // Sample 10% of everything else
  return 0.1;
},
```

### Custom Integrations

```typescript
import * as Sentry from '@sentry/react-native';

initSentry({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
  integrations: [
    new Sentry.ReactNativeTracing({
      // Trace navigation
      routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),

      // Trace network requests
      traceFetch: true,
      traceXHR: true,

      // Enable auto performance tracing
      enableAutoPerformanceTracing: true,
    }),
  ],
});
```

## Error Tracking

### Automatic Error Capture

Sentry automatically captures:
- Unhandled exceptions
- Unhandled promise rejections
- React component errors (with ErrorBoundary)

### Manual Error Capture

```typescript
import { captureException, captureMessage } from './sentryConfig';

// Capture exception
try {
  await riskyOperation();
} catch (error) {
  captureException(error as Error, {
    tags: { operation: 'risky' },
    extra: { userId: user.id },
    level: 'error',
  });
  throw error;
}

// Capture message
captureMessage('Payment processed successfully', {
  level: 'info',
  tags: { operation: 'payment' },
});
```

### Error Boundary

Wrap components with error boundary:

```typescript
import { ErrorBoundary } from './ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}

// Or use HOC
import { withErrorBoundary } from './ErrorBoundary';

const SafeScreen = withErrorBoundary(MyScreen, {
  errorMessage: 'Failed to load screen',
});
```

### Custom Error Boundary

```typescript
<ErrorBoundary
  fallback={(error, resetError) => (
    <View>
      <Text>Custom Error UI</Text>
      <Button onPress={resetError}>Try Again</Button>
    </View>
  )}
  onError={(error, errorInfo) => {
    console.log('Error caught:', error);
  }}
  showDetails={__DEV__}
  enableFeedback={true}
>
  <YourComponent />
</ErrorBoundary>
```

### Breadcrumbs

Add context leading to errors:

```typescript
import { useSentryScope } from './hooks/useSentryScope';

function MyComponent() {
  const { addBreadcrumb } = useSentryScope();

  const handleSubmit = () => {
    addBreadcrumb('User submitted form', {
      category: 'user.action',
      level: 'info',
      data: { formId: 'login' },
    });

    // ... submit logic
  };
}
```

### Tags and Context

```typescript
import { useSentryScope } from './hooks/useSentryScope';

function MyComponent() {
  const { setTag, setContext, setExtra } = useSentryScope();

  useEffect(() => {
    // Add tags for filtering
    setTag('screen', 'dashboard');
    setTag('feature', 'analytics');

    // Add structured context
    setContext('user', {
      id: user.id,
      plan: user.subscriptionPlan,
    });

    // Add extra data
    setExtra('lastAction', 'viewed-dashboard');
  }, []);
}
```

## Performance Monitoring

### Transaction Tracking

```typescript
import { startTransaction, measureOperation } from './sentryConfig';

// Manual transaction
const transaction = startTransaction('load-dashboard');
try {
  await loadDashboardData();
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}

// Or use helper
await measureOperation('fetch-user-data', async () => {
  return await fetchUserData();
});
```

### Navigation Tracking

```typescript
import { NavigationContainer } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

function App() {
  const navigationRef = useRef();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routingInstrumentation.registerNavigationContainer(navigationRef);
      }}
    >
      {/* Your navigation */}
    </NavigationContainer>
  );
}
```

### Custom Spans

```typescript
const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();

if (transaction) {
  const span = transaction.startChild({
    op: 'db.query',
    description: 'Fetch user data',
  });

  try {
    await fetchUserData();
    span.setStatus('ok');
  } catch (error) {
    span.setStatus('internal_error');
    throw error;
  } finally {
    span.finish();
  }
}
```

## Privacy & PII Filtering

### Automatic PII Filtering

The configuration automatically filters:
- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- Sensitive keys (password, token, apiKey, etc.)

### Custom PII Filtering

Add to `beforeSend` hook in `sentryConfig.ts`:

```typescript
beforeSend(event, hint) {
  // Filter custom patterns
  if (event.message) {
    event.message = event.message.replace(/customPattern/g, '[REDACTED]');
  }

  // Remove sensitive request headers
  if (event.request?.headers) {
    delete event.request.headers['X-API-Key'];
    delete event.request.headers['Authorization'];
  }

  return event;
},
```

### User Consent

```typescript
import * as Sentry from '@sentry/react-native';

// Disable Sentry until consent
function requestConsent() {
  const consent = await askUserForConsent();

  if (consent) {
    initSentry({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN! });
  }
}

// Opt-out existing user
function disableSentry() {
  Sentry.close();
}
```

## Release Tracking

### Configure Releases

In `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "SENTRY_ORG": "your-org-slug",
        "SENTRY_PROJECT": "your-project-slug",
        "SENTRY_AUTH_TOKEN": "your-auth-token"
      }
    }
  }
}
```

### Set Release in Code

```typescript
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

Sentry.setRelease(`${Constants.expoConfig?.version}+${Constants.expoConfig?.ios?.buildNumber}`);
```

### Track Deployment

```bash
# Create release
npx sentry-cli releases new "1.0.0+100"

# Associate commits
npx sentry-cli releases set-commits "1.0.0+100" --auto

# Finalize release
npx sentry-cli releases finalize "1.0.0+100"

# Deploy release
npx sentry-cli releases deploys "1.0.0+100" new -e production
```

## Source Maps

### Automatic Upload (Recommended)

With Expo plugin, source maps upload automatically on build:

```bash
npx eas build --platform ios --profile production
```

### Manual Upload

```bash
# Upload source maps
npx sentry-cli sourcemaps upload \
  --org your-org \
  --project your-project \
  --release 1.0.0+100 \
  ./dist
```

### Verify Source Maps

1. Go to Sentry dashboard
2. Navigate to Settings → Projects → [Your Project] → Source Maps
3. Check if source maps are listed for your release

## User Feedback

### Enable Feedback

In `ErrorBoundary`:

```typescript
<ErrorBoundary enableFeedback={true}>
  <YourApp />
</ErrorBoundary>
```

### Custom Feedback Form

```typescript
import * as Sentry from '@sentry/react-native';

function submitFeedback(eventId: string, feedback: string) {
  Sentry.captureUserFeedback({
    event_id: eventId,
    name: user.name,
    email: user.email,
    comments: feedback,
  });
}
```

### Feedback Widget

```typescript
import { useState } from 'react';
import { TextInput, Button } from 'react-native';
import * as Sentry from '@sentry/react-native';

function FeedbackWidget({ eventId }: { eventId: string }) {
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    Sentry.captureUserFeedback({
      event_id: eventId,
      comments: feedback,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return <Text>Thank you for your feedback!</Text>;
  }

  return (
    <>
      <TextInput
        value={feedback}
        onChangeText={setFeedback}
        placeholder="What happened?"
        multiline
      />
      <Button onPress={handleSubmit}>Submit</Button>
    </>
  );
}
```

## Testing

### Test Error Capture

```typescript
import { captureException } from './sentryConfig';

// Test button in dev mode
function TestButton() {
  const testError = () => {
    try {
      throw new Error('Test error');
    } catch (error) {
      captureException(error as Error, {
        tags: { test: 'true' },
      });
    }
  };

  if (!__DEV__) return null;

  return <Button onPress={testError}>Test Sentry</Button>;
}
```

### Test Performance

```typescript
import { measureOperation } from './sentryConfig';

async function testPerformance() {
  await measureOperation('test-operation', async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
}
```

### Verify in Dashboard

1. Go to [sentry.io](https://sentry.io)
2. Select your project
3. Check Issues → All Issues
4. Check Performance → Transactions
5. Verify events appear (may take a few seconds)

## Free Tier Limits

### Error Events: 5,000/month

**Stay within limits:**

1. **Filter noise**: Exclude development environments
2. **Sample errors**: Use `beforeSend` to sample non-critical errors
3. **Group similar errors**: Use fingerprinting

```typescript
beforeSend(event, hint) {
  // Don't send in development
  if (__DEV__) return null;

  // Sample non-critical errors (50%)
  if (event.level !== 'error' && event.level !== 'fatal') {
    if (Math.random() > 0.5) return null;
  }

  return event;
}
```

### Performance Transactions: 10,000/month

**Sampling strategies:**

```typescript
// Sample based on environment
tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 10% in production

// Or use conditional sampling
tracesSampler: (samplingContext) => {
  // Always sample critical operations
  const criticalOps = ['payment', 'checkout', 'signup'];
  if (criticalOps.includes(samplingContext.transactionContext.name)) {
    return 1.0;
  }

  // Sample 5% of everything else
  return 0.05;
}
```

### Monitor Usage

1. Go to Settings → Usage & Billing
2. Check current usage
3. Set up alerts for quota limits

## Best Practices

### 1. Initialize Early

```typescript
// Initialize before React renders
initSentry({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN! });

// Then render app
const App = () => {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
};
```

### 2. Set User Context

```typescript
import { setUserContext } from './sentryConfig';

// Set on login
function handleLogin(user: User) {
  setUserContext({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

// Clear on logout
import { clearUserContext } from './sentryConfig';

function handleLogout() {
  clearUserContext();
}
```

### 3. Use Breadcrumbs Extensively

```typescript
// Track navigation
addBreadcrumb('Navigated to dashboard', {
  category: 'navigation',
  level: 'info',
});

// Track user actions
addBreadcrumb('User clicked submit button', {
  category: 'user.action',
  data: { buttonId: 'submit' },
});

// Track API calls
addBreadcrumb('API call started', {
  category: 'api',
  data: { endpoint: '/api/users' },
});
```

### 4. Add Context to Errors

```typescript
captureException(error, {
  tags: {
    screen: 'dashboard',
    feature: 'analytics',
  },
  extra: {
    userId: user.id,
    lastAction: 'viewed-chart',
  },
  level: 'error',
});
```

### 5. Handle Async Errors

```typescript
import { wrapWithErrorTracking } from './sentryConfig';

const fetchData = wrapWithErrorTracking(
  async () => {
    const response = await api.getData();
    return response;
  },
  'fetch-data'
);
```

### 6. Group Similar Errors

```typescript
beforeSend(event, hint) {
  // Custom fingerprinting
  if (event.exception?.values?.[0]?.value?.includes('Network Error')) {
    event.fingerprint = ['network-error'];
  }

  return event;
}
```

### 7. Monitor Performance

```typescript
// Track important operations
await measureOperation('load-dashboard', async () => {
  await loadDashboardData();
});

// Set performance budgets
const transaction = startTransaction('screen-load');
transaction.setData('expectedDuration', 1000); // 1 second
```

## Troubleshooting

### Events Not Appearing

1. **Check DSN**: Verify `EXPO_PUBLIC_SENTRY_DSN` is set
2. **Check environment**: Ensure `enableInExpoDevelopment: true` for testing
3. **Check network**: Look for network requests to `sentry.io`
4. **Check console**: Look for Sentry debug logs

```typescript
initSentry({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
  debug: true, // Enable debug logging
});
```

### Source Maps Not Working

1. **Verify upload**: Check Settings → Source Maps in dashboard
2. **Match release**: Ensure release name matches in code and upload
3. **Check file paths**: Verify file paths match between code and source maps

### High Event Volume

1. **Add sampling**: Reduce `tracesSampleRate`
2. **Filter development**: Set `enableInExpoDevelopment: false`
3. **Group errors**: Use fingerprinting to group similar errors
4. **Add rate limiting**: Use `beforeSend` to filter events

```typescript
let errorCount = 0;
const ERROR_LIMIT = 100;

beforeSend(event) {
  if (errorCount >= ERROR_LIMIT) {
    console.log('Error limit reached, not sending to Sentry');
    return null;
  }

  errorCount++;
  return event;
}
```

### PII Leaking

1. **Check `beforeSend`**: Verify PII filtering is enabled
2. **Add custom filters**: Add patterns for your specific PII
3. **Review events**: Check captured events in dashboard
4. **Use scrubbing**: Enable Sentry's data scrubbing in project settings

## Resources

- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Sentry Expo Guide](https://docs.expo.dev/guides/using-sentry/)
- [Best Practices](https://docs.sentry.io/platforms/react-native/best-practices/)
- [Performance Monitoring](https://docs.sentry.io/platforms/react-native/performance/)
- [Pricing](https://sentry.io/pricing/)

## Next Steps

1. Set up Sentry project at [sentry.io](https://sentry.io)
2. Configure environment variables
3. Initialize Sentry in your app
4. Add ErrorBoundary to your component tree
5. Test error capture
6. Configure sampling for production
7. Set up release tracking
8. Upload source maps
9. Monitor usage and adjust sampling

For analytics tracking, see `.examples/monitoring/analytics/README.md`.
