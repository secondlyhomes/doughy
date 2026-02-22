# RevenueCat Integration Guide

> Step-by-step setup for in-app purchases on iOS and Android.

## Prerequisites

- RevenueCat account ([revenuecat.com](https://revenuecat.com))
- Apple Developer account (for iOS)
- Google Play Developer account (for Android)
- Expo project with EAS Build configured

## Step 1: RevenueCat Dashboard Setup

### Create App

1. Go to RevenueCat dashboard
2. Click "Create New Project"
3. Add platforms:
   - iOS: Enter App Store Connect App ID
   - Android: Enter Play Console package name

### Configure App Store Connect (iOS)

1. In App Store Connect → My Apps → Your App → App Information
2. Copy the **App Store Connect App ID** (numeric ID)
3. In RevenueCat → iOS App → paste App ID
4. Generate **App-Specific Shared Secret**:
   - App Store Connect → Your App → App Information → App-Specific Shared Secret
   - Click "Manage" → Generate
   - Copy to RevenueCat

### Configure Play Console (Android)

1. Create Service Account:
   - Google Cloud Console → IAM → Service Accounts
   - Create account with Pub/Sub permissions
   - Download JSON key file
2. In Play Console → Setup → API access
   - Link Cloud project
   - Grant service account access
3. In RevenueCat → Android App:
   - Upload service account JSON
   - Enter package name

## Step 2: Create Products

### iOS (App Store Connect)

1. Go to App Store Connect → Your App → In-App Purchases
2. Click "+" to create:

```
Product ID: com.yourapp.premium.monthly
Type: Auto-Renewable Subscription
Reference Name: Premium Monthly
Price: $9.99/month

Product ID: com.yourapp.premium.yearly
Type: Auto-Renewable Subscription
Reference Name: Premium Yearly
Price: $79.99/year (save 33%)
```

3. Create Subscription Group (e.g., "Premium")
4. Submit products for review

### Android (Play Console)

1. Go to Play Console → Your App → Monetization → Products → Subscriptions
2. Create subscriptions:

```
Product ID: premium_monthly
Name: Premium Monthly
Price: $9.99/month

Product ID: premium_yearly
Name: Premium Yearly
Price: $79.99/year
```

3. Activate products

### RevenueCat Products

1. In RevenueCat → Products → New Product
2. Add identifiers for each platform
3. Create Entitlement (e.g., "premium")
4. Map products to entitlements
5. Create Offering with packages:
   - Monthly: $monthly identifier
   - Yearly: $yearly identifier (mark as "Best Value")

## Step 3: Install SDK

```bash
npx expo install react-native-purchases
```

### Configure app.json

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-purchases",
        {
          "ios": {
            "stripeSKAdNetwork": true
          }
        }
      ]
    ]
  }
}
```

### Get API Keys

1. RevenueCat → Project Settings → API Keys
2. Copy:
   - iOS Public API Key
   - Android Public API Key

### Environment Variables

```bash
# .env
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxx
```

## Step 4: Initialize SDK

```typescript
// src/services/purchases.ts
import Purchases, {
  LOG_LEVEL,
  PurchasesOffering,
  CustomerInfo,
} from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
})!;

let isConfigured = false;

export async function configurePurchases(userId?: string): Promise<void> {
  if (isConfigured) return;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({
    apiKey: API_KEY,
    appUserID: userId, // Use Supabase user ID for cross-platform sync
  });

  isConfigured = true;
}

// Call when user logs in
export async function identifyUser(userId: string): Promise<void> {
  await Purchases.logIn(userId);
}

// Call when user logs out
export async function logoutPurchases(): Promise<void> {
  await Purchases.logOut();
}
```

### Initialize on App Start

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { configurePurchases, identifyUser } from '@/services/purchases';
import { useAuth } from '@/contexts/AuthContext';

export default function RootLayout() {
  const { user } = useAuth();

  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    if (user) {
      identifyUser(user.id);
    }
  }, [user]);

  return (/* ... */);
}
```

## Step 5: Display Products

### Fetch Offerings

```typescript
// src/services/purchases.ts
export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
}
```

### Paywall Screen

```typescript
// src/screens/paywall-screen.tsx
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { getOfferings, purchasePackage } from '@/services/purchases';

export function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  async function loadOfferings() {
    const offering = await getOfferings();
    if (offering) {
      setPackages(offering.availablePackages);
    }
    setIsLoading(false);
  }

  async function handlePurchase(pkg: PurchasesPackage) {
    setIsPurchasing(true);
    try {
      const { customerInfo } = await purchasePackage(pkg);

      if (customerInfo.entitlements.active['premium']) {
        Alert.alert('Success!', 'Welcome to Premium!');
        // Navigate to app
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  }

  if (isLoading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Unlock Premium</Text>

      {packages.map((pkg) => (
        <TouchableOpacity
          key={pkg.identifier}
          style={styles.packageCard}
          onPress={() => handlePurchase(pkg)}
          disabled={isPurchasing}
        >
          <Text style={styles.packageTitle}>
            {pkg.product.title}
          </Text>
          <Text style={styles.packagePrice}>
            {pkg.product.priceString}
            {pkg.packageType === 'ANNUAL' && '/year'}
            {pkg.packageType === 'MONTHLY' && '/month'}
          </Text>
          {pkg.packageType === 'ANNUAL' && (
            <Text style={styles.savings}>Save 33%</Text>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
      >
        <Text>Restore Purchases</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Step 6: Make Purchases

```typescript
// src/services/purchases.ts
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';

export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo };
  } catch (error: any) {
    if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      error.userCancelled = true;
    }
    throw error;
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}
```

## Step 7: Check Subscription Status

### Get Customer Info

```typescript
// src/services/purchases.ts
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return await Purchases.getCustomerInfo();
}

export async function isPremium(): Promise<boolean> {
  const customerInfo = await getCustomerInfo();
  return customerInfo.entitlements.active['premium'] !== undefined;
}
```

### React Hook

```typescript
// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

export function useSubscription() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    Purchases.getCustomerInfo().then((info) => {
      setCustomerInfo(info);
      setIsLoading(false);
    });

    // Listen for changes
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
    });

    return () => listener.remove();
  }, []);

  const isPremium = customerInfo?.entitlements.active['premium'] !== undefined;
  const hasUnlimitedAI = customerInfo?.entitlements.active['ai_unlimited'] !== undefined;

  return {
    customerInfo,
    isLoading,
    isPremium,
    hasUnlimitedAI,
    expirationDate: customerInfo?.entitlements.active['premium']?.expirationDate,
  };
}
```

### Usage

```typescript
function PremiumFeature() {
  const { isPremium, isLoading } = useSubscription();

  if (isLoading) return <ActivityIndicator />;

  if (!isPremium) {
    return <UpgradePrompt />;
  }

  return <PremiumContent />;
}
```

## Step 8: Configure Webhooks

### Create Webhook Endpoint

See [Payment Architecture](./PAYMENT-ARCHITECTURE.md) for the full webhook handler.

### Configure in RevenueCat

1. RevenueCat → Project Settings → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/revenuecat-webhook`
3. Select events:
   - Initial Purchase
   - Renewal
   - Cancellation
   - Expiration
   - Billing Issue
4. Copy webhook secret for verification

## Step 9: Testing

### iOS Sandbox

1. App Store Connect → Users and Access → Sandbox Testers
2. Create test account
3. On device: Settings → App Store → sign out
4. In app, purchase will prompt for sandbox account

### Android Testing

1. Play Console → Setup → License testing
2. Add tester email addresses
3. Testers can make purchases without being charged

### RevenueCat Sandbox Mode

```typescript
// Auto-enabled in debug builds
if (__DEV__) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
}
```

## Troubleshooting

### "Product not found"

- Ensure product IDs match exactly
- iOS: Products must be approved and app must be in TestFlight
- Android: Products must be active and app published to testing track

### "Cannot connect to iTunes Store"

- Sign out of App Store on device
- Sign in with sandbox account
- Try on physical device (not simulator)

### Purchases not syncing

- Verify user ID is consistent across platforms
- Check webhook logs in RevenueCat
- Ensure webhook endpoint is deployed and accessible

## Checklist

- [ ] RevenueCat account created
- [ ] iOS app configured with shared secret
- [ ] Android app configured with service account
- [ ] Products created in App Store Connect
- [ ] Products created in Play Console
- [ ] Products/entitlements configured in RevenueCat
- [ ] SDK installed and configured
- [ ] User identification working
- [ ] Offerings displayed correctly
- [ ] Purchase flow working (sandbox)
- [ ] Restore purchases working
- [ ] Webhook endpoint deployed
- [ ] Subscription status reflected in app
- [ ] Tested on physical devices

## Related Docs

- [Payment Architecture](./PAYMENT-ARCHITECTURE.md) - Overall payment system design
- [Entitlements System](./ENTITLEMENTS-SYSTEM.md) - Feature gating patterns
- [Stripe Web Billing](./STRIPE-WEB-BILLING.md) - Web payment integration
