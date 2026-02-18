# Feature Parity Matrix

Complete comparison of iOS vs Android feature availability, implementation strategies, and platform-specific alternatives.

## Table of Contents

- [Core Features](#core-features)
- [Platform-Exclusive Features](#platform-exclusive-features)
- [UI Components](#ui-components)
- [System Integration](#system-integration)
- [Notifications](#notifications)
- [Background Tasks](#background-tasks)
- [Storage & Files](#storage--files)
- [Security & Authentication](#security--authentication)
- [Media & Camera](#media--camera)
- [Location & Maps](#location--maps)
- [Networking](#networking)
- [Platform APIs](#platform-apis)
- [Implementation Strategies](#implementation-strategies)
- [Decision Trees](#decision-trees)
- [Testing Checklist](#testing-checklist)

---

## Core Features

Features available on both iOS and Android, but implemented differently.

| Feature | iOS | Android | Implementation Difficulty | Notes |
|---------|-----|---------|---------------------------|-------|
| Home Screen Widgets | ✅ iOS 14+ | ✅ Android 8+ (API 26) | Medium | Different APIs, similar UX |
| Push Notifications | ✅ All versions | ✅ All versions | Low | APNs vs FCM |
| Deep Linking | ✅ iOS 9+ (Universal Links) | ✅ API 23+ (App Links) | Medium | Different setup processes |
| Biometric Auth | ✅ All (Face ID, Touch ID) | ✅ API 23+ (Fingerprint, Face) | Low | Unified API in Expo |
| Local Notifications | ✅ All versions | ✅ All versions | Low | Similar APIs |
| Background Fetch | ✅ iOS 7+ (limited) | ✅ All (more flexible) | High | iOS has strict limitations |
| Share Extension | ✅ iOS 8+ | ✅ All versions | Medium | Different integration |
| In-App Purchases | ✅ All versions | ✅ All versions | High | StoreKit vs Google Play Billing |
| Camera & Photos | ✅ All versions | ✅ All versions | Low | Expo Camera, ImagePicker |
| Location Services | ✅ All versions | ✅ All versions | Medium | Different permission models |
| Contacts | ✅ All versions | ✅ All versions | Low | Expo Contacts |
| Calendar | ✅ All versions | ✅ All versions | Low | Expo Calendar |
| Haptic Feedback | ✅ iOS 10+ | ✅ API 26+ | Low | Different intensities |
| App Badging | ✅ All versions | ✅ API 26+ | Low | Different behaviors |
| Clipboard | ✅ All versions | ✅ All versions | Low | Expo Clipboard |
| Speech Recognition | ✅ iOS 10+ | ✅ API 23+ | Medium | Different APIs |
| Text-to-Speech | ✅ All versions | ✅ All versions | Low | Expo Speech |
| Barcode Scanning | ✅ All versions | ✅ All versions | Low | Expo BarCodeScanner |
| QR Code Generation | ✅ All versions | ✅ All versions | Low | Third-party libraries |
| PDF Generation | ✅ All versions | ✅ All versions | Medium | expo-print |
| File System Access | ✅ All versions | ✅ All versions | Low | Expo FileSystem |

### Home Screen Widgets

**iOS Implementation:**
```typescript
// iOS: WidgetKit (iOS 14+)
// Requires separate Swift code in Xcode
// Configured via Intent Definitions
// Timeline updates every 15 minutes minimum

Minimum Version: iOS 14
API: WidgetKit
Update Frequency: 15 minutes minimum
Sizes: Small, Medium, Large (Extra Large on iPad)
```

**Android Implementation:**
```typescript
// Android: App Widgets (API 26+)
// XML layout + AppWidgetProvider
// Update frequency configurable
// More flexible than iOS

Minimum Version: Android 8.0 (API 26)
API: AppWidgetManager
Update Frequency: Configurable (30 minutes default)
Sizes: 1x1, 2x2, 3x3, 4x4, etc. (grid-based)
```

**Implementation Strategy:**
- Use expo-widget-kit or native code for each platform
- Share business logic, separate UI
- Test widget updates on both platforms
- Document different size constraints

### Push Notifications

**iOS Implementation:**
```typescript
// iOS: Apple Push Notification Service (APNs)
// Requires Apple Developer account
// P8 key or certificate for backend

Features:
- Silent notifications (content-available)
- Notification service extensions (modify content)
- Critical alerts (bypass Do Not Disturb)
- Provisional authorization (quiet notifications)
```

**Android Implementation:**
```typescript
// Android: Firebase Cloud Messaging (FCM)
// Requires Firebase project
// Notification channels (API 26+)

Features:
- Data messages (background delivery)
- Notification channels (user control)
- Custom sounds per channel
- High priority messages
```

**Shared Implementation:**
```typescript
import * as Notifications from 'expo-notifications'

// Works on both platforms
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})
```

### Deep Linking

**iOS Universal Links:**
```typescript
// iOS: Universal Links (iOS 9+)
// Requires:
// 1. apple-app-site-association file on domain
// 2. Associated Domains capability in Xcode
// 3. HTTPS domain

Example: https://example.com/product/123
Fallback: Opens website if app not installed
```

**Android App Links:**
```typescript
// Android: App Links (API 23+)
// Requires:
// 1. assetlinks.json file on domain
// 2. Intent filter in AndroidManifest.xml
// 3. HTTPS domain

Example: https://example.com/product/123
Fallback: Shows app chooser or opens browser
```

**Shared Implementation:**
```typescript
import * as Linking from 'expo-linking'

// Handle deep links on both platforms
Linking.addEventListener('url', (event) => {
  const { url } = event
  // Parse and navigate
})
```

---

## Platform-Exclusive Features

Features available on only one platform.

### iOS-Only Features

| Feature | Min Version | Implementation Difficulty | Alternative on Android |
|---------|-------------|---------------------------|------------------------|
| Live Activities | iOS 16.1+ | Medium | Ongoing notifications |
| Dynamic Island | iOS 16+ (Pro models) | Medium | N/A (hardware) |
| App Clips | iOS 14+ | High | Instant Apps (deprecated) |
| Siri Shortcuts | iOS 12+ | Medium | Google Assistant Actions |
| Focus Filters | iOS 16+ | Low | N/A |
| Handoff | iOS 8+ | Medium | N/A |
| AirDrop | All versions | N/A (native only) | Nearby Share |
| 3D Touch / Haptic Touch | iOS 10+ | Low | Long press |
| Face ID | iPhone X+ | Low (via biometrics) | Face unlock |
| Touch ID | iPhone 5s+ | Low (via biometrics) | Fingerprint |
| Apple Pay | iOS 8.1+ | Medium | Google Pay |
| iCloud | All versions | Medium | Google Drive, Dropbox |
| CarPlay | iOS 7.1+ | High | Android Auto |
| HealthKit | iOS 8+ | Medium | Google Fit |
| HomeKit | iOS 8+ | Medium | Google Home |
| ARKit | iOS 11+ | High | ARCore |
| CoreML | iOS 11+ | High | TensorFlow Lite |
| Sign in with Apple | iOS 13+ | Low | Google Sign-In |

#### Live Activities

**What it is:** Real-time, glanceable updates on the Lock Screen and Dynamic Island.

**Use cases:**
- Sports scores
- Ride-sharing ETAs
- Food delivery tracking
- Timer/workout tracking

**Implementation:**
```swift
// Requires native Swift code in Xcode
import ActivityKit

struct DeliveryAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var status: String
        var estimatedTime: Date
    }

    var orderId: String
}

// Start activity
let activity = try Activity.request(
    attributes: DeliveryAttributes(orderId: "123"),
    contentState: DeliveryAttributes.ContentState(
        status: "On the way",
        estimatedTime: Date().addingTimeInterval(900)
    )
)

// Update activity
await activity.update(
    using: DeliveryAttributes.ContentState(
        status: "Arriving soon",
        estimatedTime: Date().addingTimeInterval(300)
    )
)
```

**Android Alternative:**
```kotlin
// Use ongoing notification with updates
val notification = NotificationCompat.Builder(context, CHANNEL_ID)
    .setContentTitle("Delivery Status")
    .setContentText("On the way - ETA 15 min")
    .setSmallIcon(R.drawable.ic_delivery)
    .setOngoing(true) // Keeps notification persistent
    .setPriority(NotificationCompat.PRIORITY_HIGH)
    .build()

notificationManager.notify(NOTIFICATION_ID, notification)
```

#### Dynamic Island

**What it is:** Interactive notification area on iPhone 14 Pro and later.

**Use cases:**
- Music playback
- Timer/stopwatch
- Live Activities
- Ongoing calls

**Implementation:**
- Automatically uses Live Activities
- No additional code required beyond Live Activities
- Only available on iPhone 14 Pro/Pro Max and later

**Android Alternative:**
- No direct equivalent
- Use ongoing notification with media controls
- Consider heads-up notification for important updates

#### App Clips

**What it is:** Lightweight app experiences (< 10MB) without full install.

**Use cases:**
- Restaurant ordering
- Bike rentals
- Parking meters
- Event tickets

**Implementation:**
```swift
// Requires separate App Clip target in Xcode
// app-clip-site-association file on domain
// NFC tags or QR codes for discovery

// Share code between main app and App Clip
#if APPCLIP
    // App Clip specific code
#else
    // Main app code
#endif
```

**Android Alternative:**
- Android Instant Apps (deprecated as of 2021)
- Use Progressive Web App (PWA)
- Consider deep link to lightweight onboarding

#### Siri Shortcuts

**What it is:** Voice commands to trigger app actions.

**Use cases:**
- "Start workout"
- "Check balance"
- "Order usual"
- Custom automation

**Implementation:**
```swift
import Intents

// 1. Define intent in Intents.intentdefinition file
// 2. Donate shortcut when action occurs
let intent = OrderCoffeeIntent()
intent.size = "Medium"
intent.drink = "Latte"

let interaction = INInteraction(intent: intent, response: nil)
interaction.donate { error in
    if let error = error {
        print("Failed to donate: \(error)")
    }
}

// 3. Handle intent
class IntentHandler: INExtension, OrderCoffeeIntentHandling {
    func handle(intent: OrderCoffeeIntent, completion: @escaping (OrderCoffeeIntentResponse) -> Void) {
        // Handle order
    }
}
```

**Android Alternative:**
```kotlin
// Use Google Assistant Actions
// actions.xml in res/xml/

<actions>
    <action intentName="actions.intent.ORDER_COFFEE">
        <fulfillment urlTemplate="myapp://order{?size,drink}">
            <parameter name="size" />
            <parameter name="drink" />
        </fulfillment>
    </action>
</actions>
```

### Android-Only Features

| Feature | Min Version | Implementation Difficulty | Alternative on iOS |
|---------|-------------|---------------------------|-------------------|
| Material You | API 31 (Android 12+) | Low | Custom theming |
| Quick Settings Tiles | API 24 (Android 7+) | Low | Control Center (limited) |
| Picture-in-Picture | API 26 (Android 8+) | Medium | iOS 14+ (similar) |
| Predictive Back | API 33 (Android 13+) | Medium | Swipe back (standard) |
| Bubbles | API 30 (Android 11+) | High | N/A |
| Direct Share | API 29 (Android 10+) | Medium | Share Extensions |
| App Shortcuts | API 25 (Android 7.1+) | Low | Quick Actions |
| Adaptive Icons | API 26 (Android 8+) | Low | N/A (standard icons) |
| Notification Channels | API 26 (Android 8+) | Low | N/A (app-level control) |
| Split Screen | API 24 (Android 7+) | Low | iPad only |
| File Provider | All versions | Medium | Document Picker |
| Widgets on Lock Screen | API 17+ | Medium | iOS 16+ |
| Always-On Display | Device-specific | N/A (hardware) | iOS 17+ (Pro models) |
| Back Button | All versions | N/A (hardware) | Swipe gesture |

#### Material You

**What it is:** Dynamic theming system based on wallpaper colors.

**Use cases:**
- App-wide dynamic colors
- System color harmony
- Personalized experience

**Implementation:**
```kotlin
// Android 12+ automatically provides dynamic colors
// Access via @android:color/system_accent1_500

// In React Native:
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper'
import { useMaterial3Theme } from '@pchmn/expo-material3-theme'

export function ThemedApp() {
  const { theme } = useMaterial3Theme()

  const paperTheme = useColorScheme() === 'dark'
    ? { ...MD3DarkTheme, colors: theme.dark }
    : { ...MD3LightTheme, colors: theme.light }

  return (
    <PaperProvider theme={paperTheme}>
      <App />
    </PaperProvider>
  )
}
```

**iOS Alternative:**
```typescript
// Custom theming based on user selection
const theme = {
  light: {
    primary: '#007AFF',
    background: '#FFFFFF',
    // ...
  },
  dark: {
    primary: '#0A84FF',
    background: '#000000',
    // ...
  },
}
```

#### Quick Settings Tiles

**What it is:** Custom toggles in Quick Settings panel.

**Use cases:**
- Toggle VPN
- Start timer
- Enable feature
- Quick actions

**Implementation:**
```kotlin
// TileService in native code
class MyTileService : TileService() {
    override fun onClick() {
        val tile = qsTile
        tile.state = if (tile.state == Tile.STATE_ACTIVE) {
            Tile.STATE_INACTIVE
        } else {
            Tile.STATE_ACTIVE
        }
        tile.updateTile()
    }
}

// AndroidManifest.xml
<service
    android:name=".MyTileService"
    android:icon="@drawable/ic_tile"
    android:label="@string/tile_name"
    android:permission="android.permission.BIND_QUICK_SETTINGS_TILE">
    <intent-filter>
        <action android:name="android.service.quicksettings.action.QS_TILE"/>
    </intent-filter>
</service>
```

**iOS Alternative:**
- No direct equivalent
- iOS Control Center is not extensible by third-party apps
- Use widgets for quick access

#### Predictive Back

**What it is:** Gesture preview before completing back navigation.

**Use cases:**
- Show where back gesture will go
- Smooth navigation transitions
- Better UX for multi-step flows

**Implementation:**
```kotlin
// Android 13+ (API 33)
// Enable predictive back in AndroidManifest.xml
<application
    android:enableOnBackInvokedCallback="true">
</application>

// Handle in React Native Navigation
import { useNavigation } from '@react-navigation/native'

function MyScreen() {
  const navigation = useNavigation()

  useEffect(() => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      // Predictive back gesture automatically handled by React Navigation
    }
  }, [])
}
```

**iOS Alternative:**
- iOS has swipe-from-left gesture by default
- Similar UX, different implementation
- Automatically handled by React Navigation

#### Bubbles

**What it is:** Floating chat heads for messaging apps.

**Use cases:**
- Messaging apps
- Video calls
- Ongoing conversations

**Implementation:**
```kotlin
// Android 11+ (API 30)
// Create bubble from notification
val person = Person.Builder()
    .setName("John")
    .setIcon(icon)
    .build()

val bubbleMetadata = NotificationCompat.BubbleMetadata.Builder(
    pendingIntent,
    Icon.createWithResource(context, R.drawable.ic_bubble)
)
    .setDesiredHeight(600)
    .build()

val notification = NotificationCompat.Builder(context, CHANNEL_ID)
    .setContentTitle("New message")
    .setSmallIcon(R.drawable.ic_notification)
    .setBubbleMetadata(bubbleMetadata)
    .addPerson(person)
    .build()
```

**iOS Alternative:**
- No direct equivalent
- Use CallKit for calls
- Use standard notifications for messages

---

## UI Components

Platform-specific UI component comparison.

| Component | iOS | Android | Cross-Platform Solution |
|-----------|-----|---------|-------------------------|
| Navigation Bar | ✅ UINavigationBar | ✅ ActionBar / Toolbar | React Navigation |
| Tab Bar | ✅ UITabBar | ✅ BottomNavigationView | React Navigation Bottom Tabs |
| Action Sheet | ✅ UIActionSheet | ✅ BottomSheet | @gorhom/bottom-sheet |
| Date Picker | ✅ UIDatePicker | ✅ DatePicker | @react-native-community/datetimepicker |
| Switch | ✅ UISwitch | ✅ Switch | React Native Switch |
| Slider | ✅ UISlider | ✅ SeekBar | @react-native-community/slider |
| Progress Bar | ✅ UIProgressView | ✅ ProgressBar | React Native ActivityIndicator |
| Segmented Control | ✅ UISegmentedControl | ❌ | @react-native-segmented-control/segmented-control |
| Stepper | ✅ UIStepper | ❌ | Custom component |
| Picker | ✅ UIPickerView | ✅ Spinner | @react-native-picker/picker |
| Search Bar | ✅ UISearchBar | ✅ SearchView | Custom component |
| Refresh Control | ✅ UIRefreshControl | ✅ SwipeRefreshLayout | React Native RefreshControl |
| Alert | ✅ UIAlertController | ✅ AlertDialog | React Native Alert |
| Modal | ✅ UIViewController | ✅ Dialog | React Native Modal |
| Context Menu | ✅ UIContextMenu | ✅ PopupMenu | react-native-context-menu-view |

### Navigation Bar Height

```typescript
const HEADER_HEIGHT = Platform.select({
  ios: 44,      // Standard iOS navigation bar
  android: 56,  // Material Design app bar
  default: 48,
})

const LARGE_HEADER_HEIGHT = Platform.select({
  ios: 96,      // iOS large title
  android: 56,  // Android doesn't have large titles
  default: 56,
})
```

### Tab Bar Position & Style

```typescript
// iOS: Bottom tabs with icons
const iosTabBarStyle = {
  position: 'bottom',
  height: 64, // Includes safe area
  backgroundColor: '#FFFFFF',
  borderTopWidth: 0.5,
  borderTopColor: '#E5E5EA',
  paddingBottom: 8,
}

// Android: Bottom navigation (Material Design)
const androidTabBarStyle = {
  position: 'bottom',
  height: 56,
  backgroundColor: '#FFFFFF',
  elevation: 8,
}
```

### Buttons

```typescript
// iOS: Rounded with shadow
const iosButtonStyle = {
  backgroundColor: '#007AFF',
  borderRadius: 10,
  paddingVertical: 12,
  paddingHorizontal: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
}

// Android: Rectangular with elevation
const androidButtonStyle = {
  backgroundColor: '#1976D2',
  borderRadius: 4,
  paddingVertical: 10,
  paddingHorizontal: 14,
  elevation: 2,
}
```

---

## System Integration

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| Share Sheet | ✅ UIActivityViewController | ✅ ShareSheet | React Native Share |
| Document Picker | ✅ UIDocumentPickerViewController | ✅ Intent.ACTION_OPEN_DOCUMENT | expo-document-picker |
| Image Picker | ✅ UIImagePickerController | ✅ Intent.ACTION_PICK | expo-image-picker |
| Contacts | ✅ CNContactStore | ✅ ContactsContract | expo-contacts |
| Calendar | ✅ EventKit | ✅ CalendarContract | expo-calendar |
| Phone Calls | ✅ tel: URL | ✅ Intent.ACTION_DIAL | Linking.openURL |
| SMS | ✅ MFMessageComposeViewController | ✅ Intent.ACTION_SENDTO | expo-sms |
| Email | ✅ MFMailComposeViewController | ✅ Intent.ACTION_SEND | expo-mail-composer |
| Maps | ✅ Apple Maps | ✅ Google Maps | react-native-maps |
| Browser | ✅ SFSafariViewController | ✅ Chrome Custom Tabs | expo-web-browser |

---

## Notifications

| Feature | iOS | Android | Implementation |
|---------|-----|---------|----------------|
| Local Notifications | ✅ All | ✅ All | expo-notifications |
| Push Notifications | ✅ APNs | ✅ FCM | expo-notifications |
| Rich Notifications | ✅ iOS 10+ | ✅ API 23+ | expo-notifications |
| Notification Actions | ✅ iOS 10+ | ✅ API 23+ | expo-notifications |
| Notification Categories | ✅ iOS 10+ | ✅ Channels (API 26+) | expo-notifications |
| Badge Count | ✅ All | ✅ API 26+ | expo-notifications |
| Silent Notifications | ✅ content-available | ✅ data messages | expo-notifications |
| Critical Alerts | ✅ iOS 12+ | ❌ | N/A |
| Provisional Authorization | ✅ iOS 12+ | ❌ | N/A |
| Notification Grouping | ✅ iOS 12+ | ✅ API 24+ | expo-notifications |

### Notification Channels (Android)

```typescript
// Android requires notification channels (API 26+)
import * as Notifications from 'expo-notifications'

if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
  })

  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'message_sound.wav',
  })
}
```

### Critical Alerts (iOS Only)

```typescript
// iOS 12+ only - bypasses Do Not Disturb
if (Platform.OS === 'ios' && PlatformUtils.iOSVersion! >= 12) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Critical Alert',
      body: 'This bypasses Do Not Disturb',
      sound: 'default',
      criticalAlert: true, // iOS only
      criticalAlertVolume: 1.0,
    },
    trigger: null,
  })
}
```

---

## Background Tasks

| Feature | iOS | Android | Difficulty |
|---------|-----|---------|------------|
| Background Fetch | ✅ iOS 7+ (15 min min) | ✅ All (flexible) | Medium |
| Background Geolocation | ✅ iOS 8+ (restricted) | ✅ All (more flexible) | High |
| Background Audio | ✅ All | ✅ All | Medium |
| Background Upload | ✅ iOS 7+ | ✅ All | Medium |
| Background Download | ✅ iOS 7+ | ✅ All | Medium |
| Periodic Tasks | ✅ iOS 13+ | ✅ All | Medium |
| Background Processing | ✅ iOS 13+ | ✅ All | High |

### iOS Background Limitations

```typescript
// iOS has strict background limitations
// Background fetch: 15-30 minute minimum interval
// Location: Requires "Always" permission
// Processing: Only when device is idle and charging

import * as BackgroundFetch from 'expo-background-fetch'
import * as TaskManager from 'expo-task-manager'

const BACKGROUND_FETCH_TASK = 'background-fetch'

// Define task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = Date.now()

  // iOS: Must complete quickly (30 seconds max)
  // Android: More flexible

  try {
    // Sync data
    await syncData()

    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

// Register task
await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
  minimumInterval: Platform.select({
    ios: 15 * 60,    // 15 minutes minimum
    android: 5 * 60,  // Can be shorter
  }),
  stopOnTerminate: false,
  startOnBoot: true,
})
```

### Android Background Flexibility

```kotlin
// Android allows more flexible background tasks
// WorkManager for guaranteed execution
// JobScheduler for flexible scheduling

// In React Native:
import * as BackgroundFetch from 'expo-background-fetch'

if (Platform.OS === 'android') {
  // Can configure more aggressive scheduling
  await BackgroundFetch.registerTaskAsync('sync-task', {
    minimumInterval: 5 * 60, // 5 minutes
    stopOnTerminate: false,
    startOnBoot: true,
    requiresNetworkConnectivity: true,
    requiresCharging: false,
    requiresBatteryNotLow: false,
    requiresStorageNotLow: false,
    requiresDeviceIdle: false,
  })
}
```

---

## Storage & Files

| Feature | iOS | Android | Implementation |
|---------|-----|---------|----------------|
| AsyncStorage | ✅ All | ✅ All | @react-native-async-storage/async-storage |
| SecureStore | ✅ Keychain | ✅ Keystore | expo-secure-store |
| FileSystem | ✅ All | ✅ All | expo-file-system |
| SQLite | ✅ All | ✅ All | expo-sqlite |
| MMKV | ✅ All | ✅ All | react-native-mmkv |
| Document Picker | ✅ iOS 11+ | ✅ All | expo-document-picker |
| File Sharing | ✅ Share Extensions | ✅ Content Providers | react-native-share |

### Storage Limits

```typescript
// iOS: No hard limit, but be reasonable
// Android: No hard limit, but be reasonable

// AsyncStorage: Good for < 6MB
// SecureStore: Good for small secrets (< 2KB per item)
// FileSystem: Unlimited (user's available storage)
// SQLite: Unlimited (user's available storage)
```

### Secure Storage

```typescript
import * as SecureStore from 'expo-secure-store'

// iOS: Stored in Keychain
// Android: Stored in Keystore

// Both platforms provide biometric protection
await SecureStore.setItemAsync('authToken', token, {
  requireAuthentication: Platform.select({
    ios: true,  // Requires Face ID / Touch ID
    android: true, // Requires Fingerprint / Face
  }),
})
```

---

## Security & Authentication

| Feature | iOS | Android | Implementation |
|---------|-----|---------|----------------|
| Face ID | ✅ iPhone X+ | ❌ | expo-local-authentication |
| Touch ID | ✅ iPhone 5s+ | ❌ | expo-local-authentication |
| Face Unlock | ❌ | ✅ Device-specific | expo-local-authentication |
| Fingerprint | ❌ | ✅ API 23+ | expo-local-authentication |
| Biometric | ✅ All | ✅ API 23+ | expo-local-authentication |
| Keychain | ✅ All | ❌ | expo-secure-store |
| Keystore | ❌ | ✅ All | expo-secure-store |
| Sign in with Apple | ✅ iOS 13+ | ✅ (web) | expo-apple-authentication |
| Google Sign-In | ✅ All | ✅ All | @react-native-google-signin/google-signin |
| SSL Pinning | ✅ All | ✅ All | Custom native code |

---

## Media & Camera

| Feature | iOS | Android | Implementation |
|---------|-----|---------|----------------|
| Camera | ✅ All | ✅ All | expo-camera |
| Photo Library | ✅ All | ✅ All | expo-media-library |
| Image Picker | ✅ All | ✅ All | expo-image-picker |
| Video Player | ✅ All | ✅ All | expo-av |
| Audio Recording | ✅ All | ✅ All | expo-av |
| Audio Playback | ✅ All | ✅ All | expo-av |
| Live Photos | ✅ iOS 9+ | ❌ | N/A |
| Portrait Mode | ✅ Dual camera devices | ✅ Device-specific | expo-camera |
| ARKit | ✅ iOS 11+ | ❌ | N/A |
| ARCore | ❌ | ✅ API 24+ | N/A |

---

## Location & Maps

| Feature | iOS | Android | Implementation |
|---------|-----|---------|----------------|
| GPS Location | ✅ All | ✅ All | expo-location |
| Background Location | ✅ iOS 8+ | ✅ All | expo-location |
| Geofencing | ✅ iOS 4+ | ✅ All | expo-location |
| Map View | ✅ MapKit | ✅ Google Maps | react-native-maps |
| Directions | ✅ MapKit | ✅ Google Maps | @react-native-community/google-maps-directions |

### Location Permissions

```typescript
// iOS: Requires different permissions for different uses
// - When In Use: Only while app is open
// - Always: Background location

// Android: Requires different permissions
// - Coarse: Approximate location
// - Fine: Precise location
// - Background: API 29+ requires separate permission

import * as Location from 'expo-location'

// Request permission
const { status } = await Location.requestForegroundPermissionsAsync()

if (Platform.OS === 'android' && status === 'granted') {
  // Android: Request background permission separately
  const bgStatus = await Location.requestBackgroundPermissionsAsync()
}

if (Platform.OS === 'ios' && status === 'granted') {
  // iOS: Request "Always" permission for background
  const alwaysStatus = await Location.requestBackgroundPermissionsAsync()
}
```

---

## Networking

| Feature | iOS | Android | Implementation |
|---------|-----|---------|----------------|
| HTTP/HTTPS | ✅ All | ✅ All | fetch / axios |
| WebSocket | ✅ All | ✅ All | Native WebSocket |
| Network Info | ✅ All | ✅ All | @react-native-community/netinfo |
| mDNS | ✅ Bonjour | ✅ NSD | Custom native code |
| ATS | ✅ iOS 9+ | ❌ | N/A |

### App Transport Security (iOS)

```typescript
// iOS 9+ requires HTTPS by default
// To allow HTTP (not recommended):

// Info.plist
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>

// Better: Allow specific domains
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSExceptionDomains</key>
    <dict>
        <key>example.com</key>
        <dict>
            <key>NSExceptionAllowsInsecureHTTPLoads</key>
            <true/>
        </dict>
    </dict>
</dict>
```

---

## Platform APIs

### iOS APIs

```typescript
// Siri Shortcuts
import * as IntentsUI from 'expo-intents-ui' // Hypothetical

// HealthKit
import HealthKit from 'react-native-health' // iOS only

// HomeKit
import HomeKit from 'react-native-homekit' // iOS only

// CarPlay
// Requires native Swift code

// Sign in with Apple
import * as AppleAuthentication from 'expo-apple-authentication'

if (Platform.OS === 'ios') {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  })
}
```

### Android APIs

```typescript
// Material You Dynamic Colors
import { useMaterial3Theme } from '@pchmn/expo-material3-theme'

if (Platform.OS === 'android' && Platform.Version >= 31) {
  const { theme } = useMaterial3Theme()
  // Use dynamic colors
}

// Quick Settings Tile
// Requires native Kotlin code

// Bubbles
// Requires native Kotlin code

// App Shortcuts
// Configured in AndroidManifest.xml
```

---

## Implementation Strategies

### Strategy 1: Platform Parity

**Goal:** Implement equivalent features on both platforms.

**When to use:**
- Core features that all users expect
- Features possible on both platforms
- Critical to app functionality

**Examples:**
- Push notifications (APNs + FCM)
- Biometric auth (Face ID + Fingerprint)
- Widgets (iOS WidgetKit + Android App Widgets)

**Approach:**
```typescript
// Shared interface
interface NotificationService {
  send(title: string, body: string): Promise<void>
  schedule(date: Date, title: string, body: string): Promise<void>
}

// Platform-specific implementations
class IOSNotificationService implements NotificationService {
  async send(title: string, body: string) {
    // APNs implementation
  }
}

class AndroidNotificationService implements NotificationService {
  async send(title: string, body: string) {
    // FCM implementation
  }
}

// Factory
const notificationService = Platform.select({
  ios: new IOSNotificationService(),
  android: new AndroidNotificationService(),
})
```

### Strategy 2: Platform-Specific Excellence

**Goal:** Embrace platform differences for best UX.

**When to use:**
- Platform-exclusive features
- Features that work better on one platform
- Enhance platform-specific experience

**Examples:**
- iOS: Live Activities for real-time updates
- Android: Material You for dynamic theming
- iOS: Siri Shortcuts for voice commands
- Android: Quick Settings Tiles for toggles

**Approach:**
```typescript
// iOS: Live Activities
if (PlatformUtils.supportsLiveActivities()) {
  await startLiveActivity({
    orderId: '123',
    status: 'In transit',
    eta: new Date(),
  })
}

// Android: Ongoing notification with updates
if (Platform.OS === 'android') {
  await showOngoingNotification({
    title: 'Order In Transit',
    body: `ETA: ${eta}`,
    ongoing: true,
  })
}
```

### Strategy 3: Graceful Degradation

**Goal:** Always provide fallbacks for missing features.

**When to use:**
- Nice-to-have features
- Platform-specific enhancements
- Optional functionality

**Examples:**
- Widgets → Push notifications
- Biometrics → PIN/password
- Live Activities → Regular notifications

**Approach:**
```typescript
// Attempt best available option
async function updateUserOnOrderStatus(order: Order) {
  // First choice: Live Activities (iOS 16.1+)
  if (PlatformUtils.supportsLiveActivities()) {
    await updateLiveActivity(order)
    return
  }

  // Second choice: Ongoing notification (Android)
  if (Platform.OS === 'android') {
    await updateOngoingNotification(order)
    return
  }

  // Fallback: Regular push notification
  await sendPushNotification(order)
}
```

### Strategy 4: Web Fallback

**Goal:** Provide web-based alternative when native not available.

**When to use:**
- Complex features not critical to app
- Third-party integrations
- Platform limitations

**Examples:**
- Payment processing (web view)
- OAuth flows (web browser)
- Rich content (web view)

**Approach:**
```typescript
import * as WebBrowser from 'expo-web-browser'

async function handleOAuthLogin() {
  if (Platform.OS === 'ios' && PlatformUtils.iOSVersion! >= 13) {
    // Use Sign in with Apple
    return await AppleAuthentication.signInAsync()
  }

  // Fallback to web-based OAuth
  const result = await WebBrowser.openAuthSessionAsync(
    'https://provider.com/oauth/authorize',
    'myapp://oauth-callback'
  )

  if (result.type === 'success') {
    return result.url
  }
}
```

---

## Decision Trees

### Should I Use Platform-Specific Code?

```
Is the feature available on both platforms?
├─ Yes
│  ├─ Are the implementations similar?
│  │  ├─ Yes → Use shared cross-platform code
│  │  └─ No → Use platform-specific implementations with shared interface
│  └─ Are platform conventions different?
│     ├─ Yes → Respect platform conventions (e.g., iOS tabs at bottom, Android nav)
│     └─ No → Use shared code
└─ No
   ├─ Is the feature critical to app functionality?
   │  ├─ Yes → Implement alternative on other platform
   │  └─ No → Use platform-specific code with clear messaging
   └─ Can users live without it on other platform?
      ├─ Yes → Platform-specific feature
      └─ No → Reconsider feature or find alternative
```

### Widget Implementation Decision

```
Do you need widgets?
├─ Yes
│  ├─ Is real-time data important?
│  │  ├─ Yes (iOS 16.1+)
│  │  │  ├─ Use Live Activities on iOS
│  │  │  └─ Use ongoing notifications on Android
│  │  └─ No
│  │     ├─ Implement widgets on both platforms
│  │     └─ Update periodically (15 min iOS, configurable Android)
│  └─ Test widget updates on both platforms
└─ No
   └─ Skip widgets, focus on core app experience
```

### Notification Strategy Decision

```
What type of notification do you need?
├─ Time-sensitive
│  ├─ iOS → Critical alerts (bypasses DND)
│  └─ Android → High priority notification
├─ Interactive
│  ├─ iOS → Notification with actions
│  └─ Android → Notification with actions
├─ Ongoing
│  ├─ iOS 16.1+ → Live Activities
│  ├─ iOS < 16.1 → Regular notifications
│  └─ Android → Ongoing notification
└─ Standard
   ├─ iOS → APNs
   └─ Android → FCM
```

---

## Testing Checklist

### Cross-Platform Testing

- [ ] Test on physical iOS device (not just simulator)
- [ ] Test on physical Android device (not just emulator)
- [ ] Test on oldest supported version (iOS 13, Android 8)
- [ ] Test on latest version (iOS 17, Android 14)
- [ ] Test on different screen sizes
- [ ] Test on tablet (iPad, Android tablet)
- [ ] Test landscape and portrait orientations
- [ ] Test with different system fonts/sizes (accessibility)
- [ ] Test in light mode and dark mode

### Platform-Specific Features

#### iOS

- [ ] Live Activities work on iOS 16.1+ (if implemented)
- [ ] Widgets update correctly (15 min minimum)
- [ ] Push notifications work via APNs
- [ ] Face ID / Touch ID work for biometrics
- [ ] Deep links work (Universal Links)
- [ ] Siri Shortcuts work (if implemented)
- [ ] App Clips work (if implemented)
- [ ] Share Extensions work
- [ ] Background fetch respects 15 min minimum
- [ ] Safe area insets handled correctly (notch, home indicator)

#### Android

- [ ] Material You dynamic colors work on Android 12+ (if implemented)
- [ ] Widgets update correctly
- [ ] Push notifications work via FCM
- [ ] Fingerprint / Face unlock work for biometrics
- [ ] Deep links work (App Links)
- [ ] Quick Settings Tiles work (if implemented)
- [ ] Notification channels configured correctly
- [ ] Bubbles work on Android 11+ (if implemented)
- [ ] Back button navigation works correctly
- [ ] Predictive back works on Android 13+ (if implemented)

### UI/UX

- [ ] iOS follows Human Interface Guidelines
- [ ] Android follows Material Design
- [ ] Navigation feels native on each platform
- [ ] Gestures work as expected (swipe back on iOS, back button on Android)
- [ ] Transitions match platform conventions
- [ ] Typography matches platform standards
- [ ] Colors match platform themes
- [ ] Spacing and sizing appropriate per platform

### Performance

- [ ] App launches quickly on both platforms
- [ ] Animations smooth (60fps target)
- [ ] No jank during scrolling
- [ ] Images load efficiently
- [ ] Network requests optimized
- [ ] Battery usage acceptable
- [ ] Memory usage acceptable
- [ ] App size reasonable (< 50MB ideal)

### Edge Cases

- [ ] Works offline (or shows appropriate message)
- [ ] Handles permission denials gracefully
- [ ] Works with poor network connection
- [ ] Handles device rotation
- [ ] Handles interruptions (phone calls, notifications)
- [ ] Handles app backgrounding/foregrounding
- [ ] Handles low memory situations
- [ ] Handles different locales/languages

---

## Summary

### Key Takeaways

1. **Most features available on both platforms** - but often implemented differently
2. **Respect platform conventions** - iOS HIG vs Material Design
3. **Provide fallbacks** - Always have plan B for platform-specific features
4. **Test extensively** - Physical devices, multiple OS versions
5. **Document differences** - Make it clear why code is platform-specific
6. **Progressive enhancement** - Use platform features when available, degrade gracefully

### Platform Philosophy

**iOS:**
- Emphasis on polish and consistency
- Strict background limitations
- Curated ecosystem
- Strong privacy focus
- Closed platform (requires Apple Developer account)

**Android:**
- Emphasis on flexibility and customization
- More lenient background tasks
- Open ecosystem
- Varied device landscape
- More open platform

### Recommended Approach

1. **Start with cross-platform** - Use React Native + Expo for maximum code sharing
2. **Identify platform differences** - Use this matrix to understand what differs
3. **Implement platform-specific** - Only when necessary for UX or features
4. **Test thoroughly** - On both platforms, multiple devices, multiple OS versions
5. **Document everything** - Make platform differences clear to future developers
6. **Iterate** - Refine based on user feedback and analytics

### Resources

- iOS Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Android Material Design: https://m3.material.io/
- React Native Platform-specific code: https://reactnative.dev/docs/platform-specific-code
- Expo documentation: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-06
**Platforms Covered:** iOS 13-17, Android 8-14 (API 26-34)
