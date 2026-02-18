# Third-Party Integrations

> React Native SDK integration patterns for payments, analytics, error tracking, and notifications.

## Overview

This guide covers integrating essential third-party services using their native React Native SDKs. Always prefer React Native SDKs over web SDKs for better performance and native features.

## Stripe (Payments)

### Installation

```bash
npm install @stripe/stripe-react-native
npx expo install expo-build-properties
```

### Configuration

```typescript
// app.json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.yourapp",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

### Provider Setup

```typescript
// src/providers/StripeProvider.tsx
import { StripeProvider as StripeSDKProvider } from '@stripe/stripe-react-native';

interface Props {
  children: React.ReactNode;
}

export function StripeProvider({ children }: Props) {
  return (
    <StripeSDKProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      merchantIdentifier="merchant.com.yourapp"
      urlScheme="yourapp"
    >
      {children}
    </StripeSDKProvider>
  );
}
```

### Payment Sheet Usage

```typescript
// src/hooks/usePayment.ts
import { useStripe } from '@stripe/stripe-react-native';
import { supabase } from '@/services/supabase';

export function usePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const checkout = async (amount: number) => {
    // 1. Create payment intent on server (via Edge Function)
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { amount },
    });

    if (error) throw error;

    // 2. Initialize payment sheet
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: data.clientSecret,
      merchantDisplayName: 'Your App',
      applePay: { merchantCountryCode: 'US' },
      googlePay: { merchantCountryCode: 'US', testEnv: __DEV__ },
    });

    if (initError) throw initError;

    // 3. Present payment sheet
    const { error: paymentError } = await presentPaymentSheet();

    if (paymentError) {
      if (paymentError.code === 'Canceled') return { canceled: true };
      throw paymentError;
    }

    return { success: true };
  };

  return { checkout };
}
```

## RevenueCat (Subscriptions)

### Installation

```bash
npm install react-native-purchases
```

### Configuration

```typescript
// src/services/purchases.ts
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

export async function initializePurchases(userId?: string) {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  const apiKey = Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  });

  await Purchases.configure({ apiKey: apiKey! });

  if (userId) {
    await Purchases.logIn(userId);
  }
}
```

### Subscription Hook

```typescript
// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesPackage
} from 'react-native-purchases';

export function useSubscription() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionData();

    const listener = Purchases.addCustomerInfoUpdateListener(setCustomerInfo);
    return () => listener.remove();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const [info, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      setCustomerInfo(info);
      setPackages(offerings.current?.availablePackages ?? []);
    } finally {
      setLoading(false);
    }
  };

  const purchase = async (pkg: PurchasesPackage) => {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    setCustomerInfo(customerInfo);
    return customerInfo;
  };

  const restore = async () => {
    const info = await Purchases.restorePurchases();
    setCustomerInfo(info);
    return info;
  };

  const isPro = customerInfo?.entitlements.active['pro'] !== undefined;

  return { customerInfo, packages, loading, purchase, restore, isPro };
}
```

## Sentry (Error Tracking)

### Installation

```bash
npx expo install @sentry/react-native
```

### Configuration

```typescript
// src/services/sentry.ts
import * as Sentry from '@sentry/react-native';

export function initializeSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? 'development' : 'production',
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    attachScreenshot: true,
    attachViewHierarchy: true,
  });
}

export function setUserContext(user: { id: string; email?: string }) {
  Sentry.setUser({ id: user.id, email: user.email });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function addBreadcrumb(message: string, data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({ message, data, level: 'info' });
}

export { Sentry };
```

See `MONITORING.md` for detailed Sentry patterns including error boundaries and performance monitoring.

## Analytics

### Mixpanel

```bash
npm install mixpanel-react-native
```

```typescript
// src/services/analytics.ts
import { Mixpanel } from 'mixpanel-react-native';

const mixpanel = new Mixpanel(process.env.EXPO_PUBLIC_MIXPANEL_TOKEN!, true);

export async function initializeAnalytics() {
  await mixpanel.init();
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  mixpanel.identify(userId);
  if (traits) {
    mixpanel.getPeople().set(traits);
  }
}

export function track(event: string, properties?: Record<string, unknown>) {
  mixpanel.track(event, properties);
}

export function reset() {
  mixpanel.reset();
}
```

### Analytics Hook

```typescript
// src/hooks/useAnalytics.ts
import { useCallback } from 'react';
import * as analytics from '@/services/analytics';

type EventName =
  | 'screen_viewed'
  | 'button_tapped'
  | 'purchase_started'
  | 'purchase_completed'
  | 'error_occurred';

export function useAnalytics() {
  const trackEvent = useCallback((
    event: EventName,
    properties?: Record<string, unknown>
  ) => {
    analytics.track(event, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const trackScreen = useCallback((screenName: string) => {
    trackEvent('screen_viewed', { screen_name: screenName });
  }, [trackEvent]);

  return { trackEvent, trackScreen };
}
```

## Push Notifications (Expo)

### Installation

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Notification Service

```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  return token.data;
}

export async function savePushToken(userId: string, token: string) {
  await supabase.from('push_tokens').upsert({
    user_id: userId,
    token,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
  });
}
```

### Notification Hook

```typescript
// src/hooks/useNotifications.ts
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@/contexts/AuthContext';
import { registerForPushNotifications, savePushToken } from '@/services/notifications';

export function useNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) {
        setExpoPushToken(token);
        if (user) {
          savePushToken(user.id, token);
        }
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data;
        handleNotificationResponse(data);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

  return { expoPushToken };
}

function handleNotificationResponse(data: Record<string, unknown>) {
  // Handle deep linking based on notification data
  if (data.screen) {
    // Navigate to screen
  }
}
```

## Integration Checklist

### Before Production

- [ ] All API keys in environment variables
- [ ] Test mode disabled for payments
- [ ] Error tracking verified in Sentry dashboard
- [ ] Analytics events documented
- [ ] Push notification permissions handled gracefully
- [ ] Offline behavior tested

### Environment Variables

```bash
# .env.local
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
EXPO_PUBLIC_MIXPANEL_TOKEN=xxx
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

## Related Docs

- Payment Architecture: `../08-payments/PAYMENT-ARCHITECTURE.md`
- Monitoring Patterns: `MONITORING.md`
- Security Checklist: `../09-security/SECURITY-CHECKLIST.md`
