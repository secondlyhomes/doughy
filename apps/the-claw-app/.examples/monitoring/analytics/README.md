# PostHog Analytics Integration Guide

Complete guide for integrating PostHog analytics, feature flags, and A/B testing in your React Native + Expo application.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Event Tracking](#event-tracking)
- [Screen Tracking](#screen-tracking)
- [User Identification](#user-identification)
- [Feature Flags](#feature-flags)
- [A/B Testing](#ab-testing)
- [Funnel Analysis](#funnel-analysis)
- [Retention Cohorts](#retention-cohorts)
- [Privacy Compliance](#privacy-compliance)
- [Free Tier Limits](#free-tier-limits)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

PostHog is an open-source product analytics platform that provides:

### Features

- **Event Tracking**: Track user actions and behaviors
- **Screen Analytics**: Monitor page views and user flows
- **Feature Flags**: Control feature rollouts dynamically
- **A/B Testing**: Test variations and measure impact
- **Session Recording**: Replay user sessions (opt-in)
- **Funnel Analysis**: Analyze conversion funnels
- **Retention Cohorts**: Track user retention over time

### Free Tier

- **1M events/month**
- **Unlimited feature flags**
- **Unlimited team members**
- **1 year data retention**
- **Self-hosted option available**

## Installation

### 1. Install PostHog SDK

```bash
npm install posthog-react-native expo-file-system expo-application expo-localization
```

### 2. Install Dependencies

```bash
npx expo install expo-file-system expo-application expo-localization
```

### 3. Configure Environment

Add to your `.env` file:

```bash
EXPO_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Basic Setup

### 1. Create PostHog Project

1. Sign up at [posthog.com](https://posthog.com) or self-host
2. Create a new project
3. Copy your API key from Project Settings

### 2. Initialize PostHog

In your `App.tsx`:

```typescript
import { AnalyticsProvider } from './.examples/monitoring/analytics/components/AnalyticsProvider';

export default function App() {
  return (
    <AnalyticsProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY}
      autoTrackScreenViews={true}
      autoTrackLifecycle={true}
    >
      <YourApp />
    </AnalyticsProvider>
  );
}
```

### 3. Verify Setup

Check PostHog dashboard for events:
1. Go to your project
2. Check "Events" tab
3. Look for `app_launched` event

## Event Tracking

### Basic Event Tracking

```typescript
import { useAnalytics } from './.examples/monitoring/analytics/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('button_clicked', {
      buttonId: 'submit',
      screen: 'login',
    });
  };

  return <Button onPress={handleClick}>Click Me</Button>;
}
```

### Type-Safe Events

```typescript
import { Events, trackEvent } from './.examples/monitoring/analytics/events';

// Type-safe event tracking
trackEvent(Events.USER_SIGNED_UP, {
  method: 'email',
  referrer: 'google',
});

trackEvent(Events.PRODUCT_VIEWED, {
  product_id: '123',
  product_name: 'Premium Plan',
  price: 29.99,
  currency: 'USD',
});
```

### Auto-Track Component Impressions

```typescript
import { useImpression } from './.examples/monitoring/analytics/hooks/useAnalytics';

function ProductCard({ product }) {
  useImpression('product_impression', {
    product_id: product.id,
    product_name: product.name,
  });

  return <View>{/* Product card UI */}</View>;
}
```

### Track Timed Events

```typescript
import { useTimedEvent } from './.examples/monitoring/analytics/hooks/useAnalytics';

function DataLoader() {
  const { startTimer, endTimer } = useTimedEvent('data_load');

  useEffect(() => {
    startTimer({ source: 'api' });

    fetchData()
      .then(data => {
        endTimer({ recordCount: data.length, success: true });
      })
      .catch(error => {
        endTimer({ success: false, error: error.message });
      });
  }, []);
}
```

## Screen Tracking

### Auto-Track Screens

```typescript
import { useScreenTracking } from './.examples/monitoring/analytics/hooks/useAnalytics';

function DashboardScreen() {
  useScreenTracking('Dashboard', {
    category: 'main',
  });

  return <View>{/* Screen content */}</View>;
}
```

### Track with React Navigation

```typescript
import { useAnalyticsContext } from './.examples/monitoring/analytics/AnalyticsContext';
import { NavigationContainer } from '@react-navigation/native';

function App() {
  const { trackScreen } = useAnalyticsContext();
  const navigationRef = useRef();

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={() => {
        const currentRoute = navigationRef.current?.getCurrentRoute();
        if (currentRoute) {
          trackScreen(currentRoute.name);
        }
      }}
    >
      {/* Your navigation */}
    </NavigationContainer>
  );
}
```

## User Identification

### Identify User on Login

```typescript
import { useAnalyticsContext } from './.examples/monitoring/analytics/AnalyticsContext';

function useAuth() {
  const { identify, reset } = useAnalyticsContext();

  const login = async (email: string, password: string) => {
    const user = await authService.login(email, password);

    // Identify user with PostHog
    identify(user.id, {
      email: user.email,
      name: user.name,
      plan: user.subscriptionPlan,
      signup_date: user.createdAt,
    });

    return user;
  };

  const logout = async () => {
    await authService.logout();

    // Reset analytics user
    reset();
  };

  return { login, logout };
}
```

### Set User Properties

```typescript
import { useAnalyticsContext } from './.examples/monitoring/analytics/AnalyticsContext';

function ProfileScreen() {
  const { setUserProperties } = useAnalyticsContext();

  const updateProfile = async (data: ProfileData) => {
    await profileService.update(data);

    // Update user properties
    setUserProperties({
      name: data.name,
      avatar_url: data.avatarUrl,
      preferences: data.preferences,
    });
  };
}
```

### Set Properties Once

```typescript
import { setUserPropertiesOnce } from './.examples/monitoring/analytics/posthogConfig';

// Set properties that should never change
setUserPropertiesOnce({
  signup_date: new Date().toISOString(),
  initial_referrer: 'google',
  initial_utm_source: 'email',
});
```

## Feature Flags

### Create Feature Flag

1. Go to PostHog → Feature Flags
2. Click "New Feature Flag"
3. Set key (e.g., `new-dashboard`)
4. Configure rollout percentage or targeting rules
5. Save

### Use Feature Flag

```typescript
import { useFeatureFlags } from './.examples/monitoring/analytics/hooks/useAnalytics';

function DashboardScreen() {
  const { flags, isLoading } = useFeatureFlags(['new-dashboard']);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return flags['new-dashboard'] ? <NewDashboard /> : <OldDashboard />;
}
```

### Check Single Flag

```typescript
import { useAnalyticsContext } from './.examples/monitoring/analytics/AnalyticsContext';

function MyComponent() {
  const { isFeatureFlagEnabled } = useAnalyticsContext();
  const [showNewUI, setShowNewUI] = useState(false);

  useEffect(() => {
    isFeatureFlagEnabled('new-ui').then(setShowNewUI);
  }, []);

  return showNewUI ? <NewUI /> : <OldUI />;
}
```

### Targeting Rules

Target specific users or properties:

```javascript
// In PostHog dashboard
{
  "properties": [
    {
      "key": "plan",
      "value": "premium",
      "operator": "exact"
    }
  ]
}
```

### Gradual Rollouts

Roll out feature gradually:

1. Start at 5% of users
2. Monitor metrics
3. Increase to 25%
4. Monitor again
5. Increase to 100%

## A/B Testing

### Create A/B Test

```typescript
import { useABTest } from './.examples/monitoring/analytics/hooks/useAnalytics';

function OnboardingScreen() {
  const variant = useABTest('onboarding-flow', 'control');

  return variant === 'test' ? (
    <NewOnboardingFlow />
  ) : (
    <OldOnboardingFlow />
  );
}
```

### Multivariate Testing

```typescript
const variant = useABTest('button-color', 'blue');

const buttonColor = {
  blue: '#2196F3',
  green: '#4CAF50',
  red: '#F44336',
}[variant];

return <Button backgroundColor={buttonColor}>Sign Up</Button>;
```

### Track Conversion

```typescript
import { useAnalytics } from './.examples/monitoring/analytics/hooks/useAnalytics';

function CheckoutScreen() {
  const variant = useABTest('checkout-flow', 'control');
  const { trackEvent } = useAnalytics();

  const handlePurchase = async () => {
    await completePurchase();

    // Track conversion
    trackEvent('purchase_completed', {
      ab_test: 'checkout-flow',
      variant,
      value: totalAmount,
    });
  };
}
```

### Analyze Results

In PostHog dashboard:

1. Go to Insights → Trends
2. Filter by event `purchase_completed`
3. Break down by `variant` property
4. Compare conversion rates

## Funnel Analysis

### Create Funnel

In PostHog dashboard:

1. Go to Insights → Funnels
2. Add steps:
   - `screen_viewed` (screen_name = "Product")
   - `product_added_to_cart`
   - `checkout_started`
   - `purchase_completed`
3. Analyze drop-off rates

### Track Funnel Events

```typescript
import { Events, trackEvent } from './.examples/monitoring/analytics/events';

// Step 1: View product
trackEvent(Events.PRODUCT_VIEWED, {
  product_id: '123',
  product_name: 'Premium Plan',
  price: 29.99,
  currency: 'USD',
});

// Step 2: Add to cart
trackEvent(Events.PRODUCT_ADDED_TO_CART, {
  product_id: '123',
  product_name: 'Premium Plan',
  quantity: 1,
  price: 29.99,
  currency: 'USD',
});

// Step 3: Start checkout
trackEvent(Events.CHECKOUT_STARTED, {
  cart_total: 29.99,
  items_count: 1,
  currency: 'USD',
});

// Step 4: Complete purchase
trackEvent(Events.PURCHASE_COMPLETED, {
  transaction_id: 'txn_123',
  total: 29.99,
  currency: 'USD',
  items_count: 1,
  payment_method: 'card',
});
```

## Retention Cohorts

### Track Activation Event

```typescript
import { Events, trackEvent } from './.examples/monitoring/analytics/events';

// Track when user completes onboarding
trackEvent(Events.ONBOARDING_COMPLETED, {
  duration_ms: onboardingDuration,
  steps_completed: totalSteps,
});
```

### Create Retention Analysis

In PostHog dashboard:

1. Go to Insights → Retention
2. Set cohort event: `user_signed_up`
3. Set return event: `app_launched`
4. View retention by week/month

## Privacy Compliance

### GDPR Compliance

```typescript
import { useAnalyticsContext } from './.examples/monitoring/analytics/AnalyticsContext';

function PrivacySettings() {
  const { optOut, optIn } = useAnalyticsContext();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  const handleToggle = (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    if (enabled) {
      optIn();
    } else {
      optOut();
    }
  };

  return (
    <Switch value={analyticsEnabled} onValueChange={handleToggle} />
  );
}
```

### CCPA Compliance

```typescript
// Don't track California users unless they opt-in
import { optOut } from './.examples/monitoring/analytics/posthogConfig';

if (user.state === 'CA' && !user.hasOptedInToAnalytics) {
  optOut();
}
```

### Data Deletion

Request data deletion via PostHog API:

```bash
curl -X POST https://app.posthog.com/api/person/{person_id}/delete \
  -H "Authorization: Bearer YOUR_PERSONAL_API_KEY"
```

## Free Tier Limits

### Event Limits: 1M/month

**Stay within limits:**

1. **Sample non-critical events**:

```typescript
function trackSampledEvent(eventName: string, properties?: any, sampleRate = 0.1) {
  if (Math.random() < sampleRate) {
    trackEvent(eventName, properties);
  }
}
```

2. **Filter development events**:

```typescript
import { initPostHog } from './posthogConfig';

initPostHog({
  apiKey: process.env.EXPO_PUBLIC_POSTHOG_KEY!,
  // Only track in production
  debug: __DEV__ ? false : undefined,
});

// Don't track in development
if (!__DEV__) {
  trackEvent('button_clicked', { buttonId: 'submit' });
}
```

3. **Batch less important events**:

```typescript
const eventQueue: Array<{ name: string; properties: any }> = [];

function queueEvent(name: string, properties: any) {
  eventQueue.push({ name, properties });

  // Flush every 10 events
  if (eventQueue.length >= 10) {
    flushEvents();
  }
}

function flushEvents() {
  eventQueue.forEach(({ name, properties }) => {
    trackEvent(name, properties);
  });
  eventQueue.length = 0;
}
```

### Monitor Usage

1. Go to Settings → Billing
2. Check current usage
3. Set up alerts for quota limits

## Best Practices

### 1. Centralize Event Definitions

```typescript
// events.ts
export const Events = {
  USER_SIGNED_UP: 'user_signed_up',
  BUTTON_CLICKED: 'button_clicked',
  // ... more events
};

// Use consistently throughout app
trackEvent(Events.USER_SIGNED_UP, { method: 'email' });
```

### 2. Add Context to Events

```typescript
trackEvent('purchase_completed', {
  // What
  transaction_id: 'txn_123',
  total: 29.99,

  // When
  timestamp: new Date().toISOString(),

  // Where
  screen: 'checkout',

  // How
  payment_method: 'card',

  // Why (if applicable)
  discount_code: 'SAVE10',
});
```

### 3. Track User Journey

```typescript
// Track full user flow
trackEvent('signup_started');
trackEvent('signup_email_entered');
trackEvent('signup_password_entered');
trackEvent('signup_completed');

// Track drop-offs
trackEvent('signup_abandoned', {
  last_step: 'email_entered',
  reason: 'error',
});
```

### 4. Use Super Properties

```typescript
import { registerSuperProperties } from './posthogConfig';
import Constants from 'expo-constants';

// Set properties sent with every event
registerSuperProperties({
  app_version: Constants.expoConfig?.version,
  platform: Platform.OS,
  build_number: Constants.expoConfig?.ios?.buildNumber,
});
```

### 5. Track Errors

```typescript
import { Events, trackEvent } from './events';

try {
  await riskyOperation();
} catch (error) {
  trackEvent(Events.ERROR_OCCURRED, {
    error_message: error.message,
    error_code: error.code,
    screen: 'dashboard',
    operation: 'load_data',
  });
  throw error;
}
```

### 6. Validate Event Properties

```typescript
import { trackValidatedEvent } from './events';

// Only tracks if required properties are present
trackValidatedEvent(Events.PRODUCT_VIEWED, {
  product_id: '123',
  product_name: 'Premium Plan',
  price: 29.99,
  currency: 'USD',
});
```

### 7. Test Events in Development

```typescript
if (__DEV__) {
  // Log events to console in development
  console.log('[Analytics] Event tracked:', eventName, properties);
}
```

## Troubleshooting

### Events Not Appearing

1. **Check API key**: Verify `EXPO_PUBLIC_POSTHOG_KEY` is set
2. **Check network**: Open React Native debugger → Network tab
3. **Check PostHog logs**: Look for API calls to PostHog
4. **Check opt-out status**: Ensure user hasn't opted out

```typescript
import { getPostHog } from './posthogConfig';

const client = getPostHog();
console.log('PostHog initialized:', !!client);
```

### Feature Flags Not Loading

1. **Check user identification**: Flags require identified user
2. **Reload flags**: Call `reloadFeatureFlags()` after identifying user

```typescript
import { identifyUser, reloadFeatureFlags } from './posthogConfig';

identifyUser(user.id, { email: user.email });
await reloadFeatureFlags();
```

3. **Check flag configuration**: Verify flag is active in dashboard

### High Event Volume

1. **Add sampling**: Sample non-critical events

```typescript
const SAMPLE_RATES = {
  critical: 1.0,    // 100%
  normal: 0.5,      // 50%
  low: 0.1,         // 10%
};

trackSampledEvent('scroll_event', properties, SAMPLE_RATES.low);
```

2. **Filter development**: Don't track in development

```typescript
if (!__DEV__) {
  trackEvent('event_name', properties);
}
```

3. **Batch events**: Queue and flush events in batches

### Privacy Concerns

1. **Filter PII**: Don't send sensitive data

```typescript
// Bad
trackEvent('form_submitted', {
  email: user.email,        // PII
  password: user.password,  // Sensitive
});

// Good
trackEvent('form_submitted', {
  form_name: 'login',
  method: 'email',
});
```

2. **Use opt-in/opt-out**:

```typescript
import { optOut, optIn } from './posthogConfig';

if (user.hasOptedOut) {
  optOut();
}
```

## Resources

- [PostHog Docs](https://posthog.com/docs)
- [React Native SDK](https://posthog.com/docs/libraries/react-native)
- [Feature Flags](https://posthog.com/docs/user-guides/feature-flags)
- [A/B Testing](https://posthog.com/docs/user-guides/experimentation)
- [Pricing](https://posthog.com/pricing)

## Next Steps

1. Set up PostHog project at [posthog.com](https://posthog.com)
2. Configure environment variables
3. Initialize analytics in your app
4. Define event schema (use `events.ts`)
5. Track key user events
6. Set up feature flags
7. Create A/B tests
8. Analyze funnels and retention
9. Monitor usage and adjust sampling

For error tracking, see `.examples/monitoring/sentry/README.md`.
For performance monitoring, see `.examples/monitoring/performance/README.md`.
