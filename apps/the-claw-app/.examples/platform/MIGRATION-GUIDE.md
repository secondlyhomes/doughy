# Platform Migration Guide

Guide for migrating between platforms: iOS-only to cross-platform, Android-only to cross-platform, or adding platform-specific features to existing apps.

## Table of Contents

- [iOS-Only App to Cross-Platform](#ios-only-app-to-cross-platform)
- [Android-Only App to Cross-Platform](#android-only-app-to-cross-platform)
- [Adding Platform-Specific Features](#adding-platform-specific-features)
- [Migration Checklist](#migration-checklist)
- [Common Migration Challenges](#common-migration-challenges)

---

## iOS-Only App to Cross-Platform

### Phase 1: Assessment (Week 1)

#### 1.1 Audit iOS-Specific Dependencies

```typescript
// Identify iOS-specific code
// Examples of iOS-only dependencies:

// ❌ iOS-only (native Swift/Objective-C)
import HealthKit from 'react-native-health'
import HomeKit from 'react-native-homekit'
import { ApplePayButton } from '@stripe/stripe-react-native'

// ✅ Find cross-platform alternatives
import GoogleFit from 'react-native-google-fit'  // For Android
import { GooglePay } from '@stripe/stripe-react-native'  // For Android
```

**Create inventory:**
```typescript
// migration-inventory.md

## iOS-Specific Features
1. Apple Pay - Replace with: Google Pay on Android
2. HealthKit - Replace with: Google Fit on Android
3. Siri Shortcuts - Replace with: Google Assistant Actions on Android
4. Face ID/Touch ID - Replace with: Biometric API (cross-platform)
5. Sign in with Apple - Add: Google Sign-In for Android

## iOS-Specific UI
1. Tab bar (bottom) - Keep bottom on Android too (Material Design supports it)
2. Navigation bar (top) - Adapt to Material Design on Android
3. SF Symbols - Replace with: Material Icons on Android
4. iOS-specific colors - Create platform-specific theme
```

#### 1.2 Identify UI/UX Patterns

```typescript
// iOS-specific UI patterns to adapt

// Navigation
// iOS: Swipe from left edge to go back
// Android: Hardware back button + optional swipe

// Tabs
// iOS: Tabs at bottom with icons
// Android: Bottom navigation (similar) or Navigation drawer

// Header
// iOS: Centered title, "Back" text
// Android: Left-aligned title, back arrow only

// Action sheets
// iOS: Bottom sheet with blur
// Android: Bottom sheet with Material Design
```

### Phase 2: Setup React Native Environment (Week 1)

#### 2.1 Create New React Native Project

```bash
# Initialize Expo project
npx create-expo-app my-app --template bare-workflow

cd my-app

# Install cross-platform dependencies
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install expo-secure-store
```

#### 2.2 Configure Android

```bash
# Generate Android project
npx expo prebuild --platform android

# Update Android SDK versions
# android/build.gradle
buildscript {
    ext {
        buildToolsVersion = "33.0.0"
        minSdkVersion = 26
        compileSdkVersion = 34
        targetSdkVersion = 33
    }
}

# Run Android
npm run android
```

### Phase 3: Migrate Core Logic (Weeks 2-3)

#### 3.1 Extract Business Logic

```typescript
// Before: iOS-specific code mixed with logic
class TaskService {
  async fetchTasks(): Promise<Task[]> {
    // iOS-specific API call
    const response = await fetch('https://api.example.com/tasks', {
      headers: {
        'User-Agent': 'MyApp-iOS/1.0',
      },
    })
    return response.json()
  }
}

// After: Platform-agnostic logic
// services/taskService.ts
export class TaskService {
  async fetchTasks(): Promise<Task[]> {
    const response = await fetch('https://api.example.com/tasks', {
      headers: {
        'User-Agent': `MyApp-${Platform.OS}/1.0`,
      },
    })
    return response.json()
  }
}
```

#### 3.2 Create Platform-Specific Implementations

```typescript
// Before: Single iOS implementation
// components/BiometricAuth.tsx
export function BiometricAuth() {
  const handleAuth = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate with Face ID or Touch ID',
    })
    return result
  }

  return (
    <Button title="Use Face ID / Touch ID" onPress={handleAuth} />
  )
}

// After: Platform-specific UI, shared logic
// components/BiometricAuth.tsx
export interface BiometricAuthProps {
  onSuccess: () => void
  onError: (error: Error) => void
}

export { BiometricAuth } from './BiometricAuth.native'

// components/BiometricAuth.ios.tsx
export function BiometricAuth({ onSuccess, onError }: BiometricAuthProps) {
  const handleAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with Face ID or Touch ID',
      })
      if (result.success) {
        onSuccess()
      }
    } catch (error) {
      onError(error as Error)
    }
  }

  return (
    <Button title="Use Face ID / Touch ID" onPress={handleAuth} />
  )
}

// components/BiometricAuth.android.tsx
export function BiometricAuth({ onSuccess, onError }: BiometricAuthProps) {
  const handleAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with Fingerprint or Face',
      })
      if (result.success) {
        onSuccess()
      }
    } catch (error) {
      onError(error as Error)
    }
  }

  return (
    <Button title="Use Fingerprint / Face" onPress={handleAuth} />
  )
}
```

### Phase 4: Adapt UI Components (Weeks 3-4)

#### 4.1 Create Platform-Specific Themes

```typescript
// Before: iOS-only theme
// theme/colors.ts
export const colors = {
  primary: '#007AFF',
  secondary: '#8E8E93',
  success: '#34C759',
  danger: '#FF3B30',
  background: '#F8F9FA',
}

// After: Platform-specific themes
// theme/colors.ts
import { Platform } from 'react-native'

export const colors = Platform.select({
  ios: {
    primary: '#007AFF',
    secondary: '#8E8E93',
    success: '#34C759',
    danger: '#FF3B30',
    background: '#F8F9FA',
  },
  android: {
    primary: '#1976D2',
    secondary: '#757575',
    success: '#4CAF50',
    danger: '#F44336',
    background: '#FAFAFA',
  },
  default: {
    primary: '#0066CC',
    secondary: '#666666',
    success: '#28A745',
    danger: '#DC3545',
    background: '#FFFFFF',
  },
})
```

#### 4.2 Adapt Navigation

```typescript
// Before: iOS-only navigation
// navigation/Navigation.tsx
<Stack.Navigator
  screenOptions={{
    headerStyle: {
      backgroundColor: '#F8F9FA',
    },
    headerTitleAlign: 'center',
    headerBackTitle: 'Back',
    headerTintColor: '#007AFF',
  }}
>
  {/* Screens */}
</Stack.Navigator>

// After: Platform-specific navigation
// navigation/Navigation.tsx
import { Platform } from 'react-native'

const headerConfig = Platform.select({
  ios: {
    headerStyle: {
      backgroundColor: '#F8F9FA',
      borderBottomWidth: 0,
    },
    headerTitleAlign: 'center' as const,
    headerBackTitle: 'Back',
    headerTintColor: '#007AFF',
  },
  android: {
    headerStyle: {
      backgroundColor: '#FFFFFF',
      elevation: 4,
    },
    headerTitleAlign: 'left' as const,
    headerBackTitle: undefined,
    headerTintColor: '#000000',
  },
})

<Stack.Navigator screenOptions={headerConfig}>
  {/* Screens */}
</Stack.Navigator>
```

#### 4.3 Replace iOS-Specific Icons

```typescript
// Before: SF Symbols (iOS only)
import { SFSymbol } from 'react-native-sfsymbols'

<SFSymbol name="house.fill" size={24} color="#007AFF" />

// After: Platform-specific icons
import { Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const HomeIcon = Platform.select({
  ios: 'home',      // iOS-style icon
  android: 'home-outline',  // Material Design icon
})

<Ionicons name={HomeIcon} size={24} color={colors.primary} />
```

### Phase 5: Testing & Validation (Week 5)

#### 5.1 Android-Specific Testing

```typescript
// Test Android-specific features
// __tests__/android/notifications.test.ts

describe('Android Notifications', () => {
  beforeEach(() => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android')
  })

  it('should create notification channel on Android', async () => {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default notifications',
      importance: Notifications.AndroidImportance.HIGH,
    })

    // Verify channel created
  })

  it('should show notification with Android-specific options', async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test',
        body: 'Test notification',
        android: {
          channelId: 'default',
          color: '#1976D2',
        },
      },
      trigger: null,
    })
  })
})
```

#### 5.2 Physical Device Testing

```bash
# Test on physical Android devices
# - Pixel (pure Android)
# - Samsung (manufacturer UI)
# - Older device (minimum API level)

# Verify:
# - Navigation works (back button)
# - Notifications appear correctly
# - Permissions requested properly
# - UI matches Material Design
# - Performance acceptable
```

### Phase 6: Platform-Specific Features (Week 6)

#### 6.1 Add Android-Specific Features

```typescript
// Add Material You support (Android 12+)
import { useMaterial3Theme } from '@pchmn/expo-material3-theme'

if (Platform.OS === 'android' && PlatformUtils.androidVersion! >= 31) {
  const { theme } = useMaterial3Theme()
  // Use dynamic colors
}

// Add Android widgets
// Create android/app/src/main/java/.../MyAppWidget.kt

// Add Quick Settings Tile (optional)
// Create android/app/src/main/java/.../MyTileService.kt
```

---

## Android-Only App to Cross-Platform

### Phase 1: Assessment (Week 1)

#### 1.1 Audit Android-Specific Dependencies

```typescript
// Identify Android-specific code
// Examples of Android-only dependencies:

// ❌ Android-only
import { NativeModules } from 'react-native'
const { MyAndroidModule } = NativeModules

// Material You (Android 12+)
import { MD3DarkTheme } from 'react-native-paper'

// ✅ Find iOS alternatives or make cross-platform
// For Material You: Create iOS theme
// For native modules: Wrap in platform check
```

#### 1.2 Identify Material Design Patterns

```typescript
// Android Material Design patterns to adapt for iOS

// Floating Action Button (FAB)
// Android: FAB for primary action
// iOS: Tab bar item or header button

// Navigation Drawer
// Android: Drawer from left
// iOS: Tab bar or modal

// Snackbar
// Android: Material Design snackbar
// iOS: System toast or custom alert

// Bottom Sheet
// Android: Material Design bottom sheet
// iOS: Action sheet or modal
```

### Phase 2: Setup iOS Environment (Week 1)

#### 2.1 Configure iOS

```bash
# Generate iOS project
npx expo prebuild --platform ios

# Install CocoaPods dependencies
cd ios
pod install
cd ..

# Run iOS
npm run ios
```

#### 2.2 Update iOS Configuration

```typescript
// app.json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.mycompany.myapp",
      "buildNumber": "1.0.0",
      "supportsTablet": true,
      "minimumOsVersion": "14.0",
      "infoPlist": {
        "NSCameraUsageDescription": "Allow access to camera",
        "NSPhotoLibraryUsageDescription": "Allow access to photo library"
      }
    }
  }
}
```

### Phase 3: Adapt Material Design to iOS (Weeks 2-3)

#### 3.1 Convert FAB to iOS Pattern

```typescript
// Before: Android FAB
// screens/HomeScreen.android.tsx
<FAB
  icon="plus"
  onPress={handleCreate}
  style={styles.fab}
/>

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
})

// After: iOS tab bar or header button
// screens/HomeScreen.ios.tsx
// Add to navigation options
navigation.setOptions({
  headerRight: () => (
    <TouchableOpacity onPress={handleCreate}>
      <Ionicons name="add" size={24} color="#007AFF" />
    </TouchableOpacity>
  ),
})
```

#### 3.2 Convert Drawer to iOS Tabs

```typescript
// Before: Android drawer navigation
<Drawer.Navigator>
  <Drawer.Screen name="Home" component={HomeScreen} />
  <Drawer.Screen name="Profile" component={ProfileScreen} />
  <Drawer.Screen name="Settings" component={SettingsScreen} />
</Drawer.Navigator>

// After: Platform-specific navigation
// iOS: Bottom tabs
// Android: Keep drawer (Material Design pattern)

const Navigation = Platform.select({
  ios: () => (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  ),
  android: () => (
    <Drawer.Navigator>
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  ),
})()
```

#### 3.3 Adapt Material Colors to iOS

```typescript
// Before: Material Design colors
const colors = {
  primary: '#1976D2',
  primaryVariant: '#1565C0',
  secondary: '#FFC107',
  secondaryVariant: '#FFA000',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  error: '#F44336',
}

// After: Platform-specific colors
const colors = Platform.select({
  ios: {
    primary: '#007AFF',
    secondary: '#8E8E93',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    error: '#FF3B30',
  },
  android: {
    primary: '#1976D2',
    primaryVariant: '#1565C0',
    secondary: '#FFC107',
    secondaryVariant: '#FFA000',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    error: '#F44336',
  },
})
```

### Phase 4: Add iOS-Specific Features (Week 4)

#### 4.1 Add Sign in with Apple

```typescript
// Required for iOS apps with social login
import * as AppleAuthentication from 'expo-apple-authentication'

if (Platform.OS === 'ios' && PlatformUtils.iOSVersion! >= 13) {
  <AppleAuthentication.AppleAuthenticationButton
    buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
    cornerRadius={5}
    style={styles.appleButton}
    onPress={async () => {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      // Handle credential
    }}
  />
}
```

#### 4.2 Add iOS Widgets (Optional)

```swift
// ios/MyAppWidget/MyAppWidget.swift
import WidgetKit
import SwiftUI

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []

        let currentDate = Date()
        for hourOffset in 0 ..< 5 {
            let entryDate = Calendar.current.date(byAdding: .hour, value: hourOffset, to: currentDate)!
            let entry = SimpleEntry(date: entryDate)
            entries.append(entry)
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
}

struct MyAppWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        Text(entry.date, style: .time)
    }
}

@main
struct MyAppWidget: Widget {
    let kind: String = "MyAppWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            MyAppWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("My Widget")
        .description("This is an example widget.")
    }
}
```

---

## Adding Platform-Specific Features

### Adding Live Activities (iOS 16.1+)

#### 1. Check Compatibility

```typescript
import { PlatformUtils } from '@/utils/platform'

if (PlatformUtils.supportsLiveActivities()) {
  // Implement Live Activities
} else if (Platform.OS === 'android') {
  // Use ongoing notification as alternative
} else {
  // Fallback to regular notification
}
```

#### 2. Implement iOS Live Activity

```swift
// ios/LiveActivity/LiveActivityAttributes.swift
import ActivityKit

struct DeliveryActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var status: String
        var estimatedTime: Date
    }

    var orderId: String
}
```

#### 3. Implement Android Alternative

```typescript
// services/notifications.android.ts
export async function showOngoingNotification(order: Order) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Order ${order.id}`,
      body: `Status: ${order.status} - ETA: ${order.estimatedTime}`,
      android: {
        channelId: 'ongoing',
        ongoing: true,
        autoCancel: false,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
    },
    trigger: null,
  })
}
```

### Adding Material You (Android 12+)

#### 1. Check Compatibility

```typescript
if (PlatformUtils.supportsMaterialYou()) {
  // Use dynamic colors
} else {
  // Use static theme
}
```

#### 2. Implement Dynamic Colors

```typescript
import { useMaterial3Theme } from '@pchmn/expo-material3-theme'
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper'

export function useTheme() {
  const { theme } = useMaterial3Theme()
  const colorScheme = useColorScheme()

  if (Platform.OS === 'android' && PlatformUtils.androidVersion! >= 31) {
    // Use Material You dynamic colors
    return colorScheme === 'dark'
      ? { ...MD3DarkTheme, colors: theme.dark }
      : { ...MD3LightTheme, colors: theme.light }
  }

  // Use static theme for iOS or older Android
  return colorScheme === 'dark' ? darkTheme : lightTheme
}
```

---

## Migration Checklist

### Pre-Migration

- [ ] Audit current codebase for platform-specific code
- [ ] Identify third-party dependencies that need replacements
- [ ] Create migration plan with timeline
- [ ] Set up version control branch for migration
- [ ] Create backup of current working app

### Core Migration

- [ ] Set up React Native environment
- [ ] Configure target platform (iOS or Android)
- [ ] Extract business logic from UI code
- [ ] Create platform-agnostic services layer
- [ ] Migrate database/storage code
- [ ] Migrate networking code
- [ ] Set up analytics for both platforms

### UI Migration

- [ ] Create platform-specific themes
- [ ] Adapt navigation patterns
- [ ] Replace platform-specific icons
- [ ] Adapt UI components to platform conventions
- [ ] Handle safe area insets
- [ ] Test on multiple screen sizes

### Platform Features

- [ ] Implement cross-platform authentication
- [ ] Set up push notifications (APNs + FCM)
- [ ] Configure deep linking (both platforms)
- [ ] Add biometric authentication
- [ ] Implement platform-specific features
- [ ] Add platform-appropriate alternatives

### Testing

- [ ] Write unit tests for both platforms
- [ ] Write integration tests
- [ ] Set up E2E tests (Detox/Maestro)
- [ ] Test on physical devices
- [ ] Test on oldest supported OS version
- [ ] Test on latest OS version
- [ ] Performance testing
- [ ] Memory leak testing

### Deployment

- [ ] Configure iOS build (Xcode, certificates)
- [ ] Configure Android build (Gradle, signing)
- [ ] Set up CI/CD for both platforms
- [ ] Configure app store metadata
- [ ] Submit to App Store
- [ ] Submit to Google Play

### Post-Migration

- [ ] Monitor crash reports
- [ ] Monitor analytics
- [ ] Gather user feedback
- [ ] Fix platform-specific bugs
- [ ] Optimize performance
- [ ] Update documentation

---

## Common Migration Challenges

### Challenge 1: Different Navigation Patterns

**Problem:**
```typescript
// iOS app uses tab bar navigation
// Android app uses drawer navigation
// How to handle this difference?
```

**Solution:**
```typescript
// Option 1: Use bottom tabs on both (Material Design supports it)
// Option 2: Platform-specific navigation

const AppNavigator = Platform.select({
  ios: TabNavigator,
  android: DrawerNavigator,
})
```

### Challenge 2: Platform-Specific Dependencies

**Problem:**
```typescript
// iOS app uses HealthKit
// Android doesn't have HealthKit
// What to do?
```

**Solution:**
```typescript
// Use platform checks and alternatives
if (Platform.OS === 'ios') {
  // Use HealthKit
  import AppleHealthKit from 'react-native-health'
} else if (Platform.OS === 'android') {
  // Use Google Fit
  import GoogleFit from 'react-native-google-fit'
}

// Or create abstraction layer
interface HealthService {
  getSteps(): Promise<number>
}

class IOSHealthService implements HealthService {
  async getSteps() {
    // Use HealthKit
  }
}

class AndroidHealthService implements HealthService {
  async getSteps() {
    // Use Google Fit
  }
}

const healthService = Platform.select({
  ios: new IOSHealthService(),
  android: new AndroidHealthService(),
})
```

### Challenge 3: UI Consistency vs Platform Conventions

**Problem:**
```typescript
// Should the app look identical on both platforms?
// Or should it follow platform conventions?
```

**Solution:**
```typescript
// Follow platform conventions for:
// - Navigation patterns
// - System controls (date pickers, switches)
// - Typography
// - Icons

// Maintain brand consistency for:
// - Brand colors (adapt brightness/saturation)
// - Logo
// - Content
// - Core functionality
```

---

## Summary

**Migration Timeline:**
- **iOS to Cross-Platform:** 4-6 weeks
- **Android to Cross-Platform:** 4-6 weeks
- **Adding Platform Features:** 1-2 weeks per feature

**Key Success Factors:**
1. Thorough planning and assessment
2. Gradual migration (phase by phase)
3. Extensive testing on both platforms
4. Following platform conventions
5. Good documentation

**Remember:** Migration is an opportunity to improve architecture, not just add a platform. Take time to refactor and improve code quality.
