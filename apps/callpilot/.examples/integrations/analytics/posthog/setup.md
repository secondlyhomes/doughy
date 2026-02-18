# PostHog Integration Setup

Complete guide for integrating PostHog analytics and feature flags.

## Overview

PostHog provides:
- Product analytics
- Session recording
- Feature flags
- A/B testing
- Self-hosted or cloud options
- Privacy-friendly analytics

## Prerequisites

- PostHog account (https://posthog.com) or self-hosted instance
- React Native app with Expo

## Installation

```bash
# Install PostHog SDK
npm install posthog-react-native

# Required peer dependencies
npx expo install expo-application expo-device expo-localization expo-file-system
```

## Environment Variables

Add to `.env`:

```env
# PostHog Configuration
EXPO_PUBLIC_POSTHOG_API_KEY=phc_xxx
EXPO_PUBLIC_POSTHOG_HOST=https://app.posthog.com # or your self-hosted URL
```

## Project Structure

```
src/
├── services/
│   └── analytics/
│       ├── posthog.ts            # PostHog client
│       ├── events.ts             # Event definitions
│       └── featureFlags.ts       # Feature flag helpers
├── contexts/
│   └── AnalyticsContext.tsx      # Analytics provider
└── hooks/
    ├── useAnalytics.ts           # Analytics hook
    └── useFeatureFlag.ts         # Feature flag hook
```

## Configuration

### 1. Initialize PostHog

```typescript
// services/analytics/posthog.ts
import PostHog from 'posthog-react-native';

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

if (!POSTHOG_API_KEY) {
  throw new Error('Missing EXPO_PUBLIC_POSTHOG_API_KEY');
}

export const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  // Capture configuration
  captureApplicationLifecycleEvents: true, // App opened, closed
  captureDeepLinks: true, // Deep link tracking
  recordScreenViews: true, // Auto screen tracking
  flushInterval: 30, // Flush events every 30 seconds
});

export async function initializePostHog(userId?: string) {
  if (userId) {
    await posthog.identify(userId);
  }

  if (__DEV__) {
    console.log('PostHog initialized');
  }
}
```

### 2. Create Analytics Context

```typescript
// contexts/AnalyticsContext.tsx
import React, { createContext, useContext, useEffect } from 'react';
import { posthog, initializePostHog } from '@/services/analytics/posthog';
import { useAuth } from '@/contexts/AuthContext';

interface AnalyticsContextValue {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  screen: (name: string, properties?: Record<string, any>) => void;
  reset: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    initializePostHog(user?.id);
  }, [user?.id]);

  const value: AnalyticsContextValue = {
    track: (event, properties) => {
      posthog.capture(event, properties);
    },
    identify: (userId, traits) => {
      posthog.identify(userId, traits);
    },
    screen: (name, properties) => {
      posthog.screen(name, properties);
    },
    reset: () => {
      posthog.reset();
    },
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}
```

## Event Tracking

### Define Events

```typescript
// services/analytics/events.ts
export const EVENTS = {
  // Authentication
  SIGN_UP: 'sign_up',
  SIGN_IN: 'sign_in',
  SIGN_OUT: 'sign_out',

  // User Actions
  PROFILE_UPDATED: 'profile_updated',
  SETTINGS_CHANGED: 'settings_changed',

  // Feature Usage
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  TASK_DELETED: 'task_deleted',

  // Monetization
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  PURCHASE_COMPLETED: 'purchase_completed',

  // Engagement
  SCREEN_VIEWED: 'screen_viewed',
  BUTTON_CLICKED: 'button_clicked',
  FEATURE_DISCOVERED: 'feature_discovered',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];
```

### Track Events

```typescript
// Example usage in a component
import { useAnalytics } from '@/contexts/AnalyticsContext';
import { EVENTS } from '@/services/analytics/events';

function TaskScreen() {
  const { track } = useAnalytics();

  const handleCreateTask = async (task: Task) => {
    await createTask(task);

    // Track event
    track(EVENTS.TASK_CREATED, {
      taskId: task.id,
      category: task.category,
      hasAttachment: !!task.attachment,
    });
  };

  return (
    // UI
  );
}
```

## Feature Flags

### Check Feature Flags

```typescript
// hooks/useFeatureFlag.ts
import { useState, useEffect } from 'react';
import { posthog } from '@/services/analytics/posthog';

export function useFeatureFlag(flagKey: string): boolean | undefined {
  const [isEnabled, setIsEnabled] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Check initial flag value
    const checkFlag = async () => {
      const enabled = await posthog.isFeatureEnabled(flagKey);
      setIsEnabled(enabled);
    };

    checkFlag();

    // Listen for flag changes
    const unsubscribe = posthog.onFeatureFlags(() => {
      checkFlag();
    });

    return () => {
      unsubscribe?.();
    };
  }, [flagKey]);

  return isEnabled;
}
```

### Use Feature Flags

```typescript
// Example: Conditional feature rendering
function ProfileScreen() {
  const isNewUIEnabled = useFeatureFlag('new-profile-ui');

  if (isNewUIEnabled === undefined) {
    return <LoadingSpinner />;
  }

  return isNewUIEnabled ? <NewProfileUI /> : <LegacyProfileUI />;
}
```

## A/B Testing

```typescript
// Example: A/B test with variants
function PaywallScreen() {
  const variant = useFeatureFlag('paywall-variant');
  const { track } = useAnalytics();

  useEffect(() => {
    track(EVENTS.SCREEN_VIEWED, {
      screen: 'paywall',
      variant,
    });
  }, [variant]);

  switch (variant) {
    case 'variant-a':
      return <PaywallVariantA />;
    case 'variant-b':
      return <PaywallVariantB />;
    default:
      return <PaywallControl />;
  }
}
```

## User Properties

```typescript
// Set user properties
import { posthog } from '@/services/analytics/posthog';

// When user signs up
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  plan: 'free',
  signupDate: new Date().toISOString(),
});

// Update properties
posthog.setPersonProperties({
  plan: 'premium',
  lastPurchase: new Date().toISOString(),
});

// Set properties once
posthog.setPersonPropertiesForFlags({
  hasCompletedOnboarding: true,
  firstLoginDate: new Date().toISOString(),
});
```

## Privacy & GDPR Compliance

```typescript
// Opt-out of tracking
posthog.optOut();

// Opt back in
posthog.optIn();

// Check opt-out status
const hasOptedOut = posthog.hasOptedOut();

// Reset user data (for GDPR delete request)
posthog.reset();
```

## Session Recording

```typescript
// Enable session recording for specific users
if (user.isAdmin || user.hasOptedInToRecording) {
  posthog.startSessionRecording();
}

// Stop recording
posthog.stopSessionRecording();
```

## Group Analytics

```typescript
// Track company/team level analytics
posthog.group('company', companyId, {
  name: company.name,
  plan: company.plan,
  employeeCount: company.employeeCount,
});

// Track events with group
posthog.capture('feature_used', {
  feature: 'advanced_reporting',
  $groups: { company: companyId },
});
```

## Performance Tips

1. **Batch Events** - PostHog automatically batches events
2. **Use Feature Flags Wisely** - Cache flag values when possible
3. **Avoid Tracking PII** - Don't send sensitive data
4. **Use Super Properties** - Set properties once for all events
5. **Lazy Load** - Initialize PostHog after app is ready

## Testing

```typescript
// Mock PostHog in tests
jest.mock('posthog-react-native', () => ({
  default: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    screen: jest.fn(),
    reset: jest.fn(),
    isFeatureEnabled: jest.fn().mockResolvedValue(true),
  })),
}));
```

## Common Events to Track

```typescript
// User lifecycle
- sign_up
- sign_in
- sign_out
- account_deleted

// Feature usage
- feature_viewed
- feature_used
- feature_completed

// Monetization
- paywall_viewed
- subscription_started
- purchase_completed
- trial_started

// Engagement
- screen_viewed
- button_clicked
- search_performed
- filter_applied

// Content
- content_created
- content_updated
- content_deleted
- content_shared

// Social
- profile_viewed
- user_followed
- message_sent
```

## Dashboard Configuration

### Recommended Insights

1. **Daily Active Users (DAU)**
2. **Weekly Active Users (WAU)**
3. **Monthly Active Users (MAU)**
4. **Feature Adoption Rate**
5. **Conversion Funnel**
6. **Retention Cohorts**
7. **User Paths**
8. **Session Duration**

### Recommended Funnels

```
Sign Up Funnel:
1. Viewed sign up screen
2. Started sign up
3. Completed sign up
4. Verified email

Purchase Funnel:
1. Viewed paywall
2. Started checkout
3. Added payment method
4. Completed purchase
```

## Next Steps

1. Review example code in this directory
2. Set up PostHog account or self-hosted instance
3. Configure feature flags in PostHog dashboard
4. Implement event tracking across app
5. Set up dashboards and insights
6. Review PostHog documentation: https://posthog.com/docs

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [React Native SDK](https://posthog.com/docs/libraries/react-native)
- [Feature Flags](https://posthog.com/docs/feature-flags)
- [Session Recording](https://posthog.com/docs/session-replay)
- [Privacy Guide](https://posthog.com/docs/privacy)
