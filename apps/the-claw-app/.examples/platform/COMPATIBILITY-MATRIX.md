# Platform Compatibility Matrix

Comprehensive compatibility guide for iOS and Android versions, Expo SDK features, and third-party libraries.

## Table of Contents

- [iOS Version Compatibility](#ios-version-compatibility)
- [Android Version Compatibility](#android-version-compatibility)
- [Expo SDK Feature Support](#expo-sdk-feature-support)
- [Third-Party Library Compatibility](#third-party-library-compatibility)
- [React Native Version Compatibility](#react-native-version-compatibility)
- [Minimum Version Recommendations](#minimum-version-recommendations)

---

## iOS Version Compatibility

### iOS 13 (September 2019)

**Support Status:** Minimum recommended (4-year-old OS)

**Market Share:** ~2-3% (as of 2024)

**Key Features:**
- Dark Mode
- Sign in with Apple
- Improved privacy controls
- SF Symbols

**Limitations:**
- No widgets (requires iOS 14+)
- No App Clips (requires iOS 14+)
- No Live Activities (requires iOS 16.1+)

**React Native Compatibility:**
- ✅ React Native 0.60+
- ✅ Expo SDK 36+
- ✅ Most third-party libraries

---

### iOS 14 (September 2020)

**Support Status:** Recommended minimum

**Market Share:** ~5-8% (as of 2024)

**Key Features:**
- ✅ Home Screen Widgets (WidgetKit)
- ✅ App Clips
- ✅ Picture-in-Picture (iPhone)
- ✅ App Library
- ✅ Compact UI for calls

**New APIs:**
- WidgetKit for home screen widgets
- App Clips for lightweight experiences
- AVPictureInPictureController for PiP

**React Native Compatibility:**
- ✅ React Native 0.63+
- ✅ Expo SDK 39+
- ✅ All major libraries

**Migration Notes:**
- Widgets require native Swift code
- App Clips require separate target in Xcode

---

### iOS 15 (September 2021)

**Support Status:** Widely supported

**Market Share:** ~10-15% (as of 2024)

**Key Features:**
- ✅ Focus modes
- ✅ SharePlay
- ✅ Universal Control (iPad)
- ✅ Improved notifications

**New APIs:**
- SharePlay for synchronized experiences
- Focus filter API
- Enhanced notification summary

**React Native Compatibility:**
- ✅ React Native 0.64+
- ✅ Expo SDK 42+
- ✅ All major libraries

---

### iOS 16 (September 2022)

**Support Status:** Recommended target

**Market Share:** ~30-40% (as of 2024)

**Key Features:**
- ✅ Lock Screen customization
- ✅ Live Activities (16.1+)
- ✅ Dynamic Island (Pro models)
- ✅ Focus Filters
- ✅ Passkeys

**New APIs:**
- ActivityKit for Live Activities (16.1+)
- Lock Screen widgets
- WeatherKit
- PassKeys API

**React Native Compatibility:**
- ✅ React Native 0.70+
- ✅ Expo SDK 46+
- ✅ All major libraries

**Important Notes:**
- Live Activities require iOS 16.1+ (not 16.0)
- Dynamic Island requires iPhone 14 Pro/Pro Max or later
- Requires Xcode 14+

---

### iOS 17 (September 2023)

**Support Status:** Latest stable

**Market Share:** ~40-50% (as of 2024)

**Key Features:**
- ✅ Interactive widgets
- ✅ StandBy mode
- ✅ Contact posters
- ✅ Improved autocorrect
- ✅ NameDrop

**New APIs:**
- Interactive widgets (App Intents)
- StandBy API
- Vision framework improvements
- TipKit for in-app tips

**React Native Compatibility:**
- ✅ React Native 0.72+
- ✅ Expo SDK 49+
- ✅ All major libraries

**Important Notes:**
- Interactive widgets require SwiftUI
- Requires Xcode 15+

---

## Android Version Compatibility

### Android 8.0 Oreo (API 26, August 2017)

**Support Status:** Minimum recommended

**Market Share:** ~5% (as of 2024)

**Key Features:**
- ✅ Notification channels
- ✅ Picture-in-Picture
- ✅ Adaptive icons
- ✅ Background execution limits

**New APIs:**
- NotificationChannel for user control
- PictureInPictureParams for PiP mode
- JobScheduler improvements
- Autofill framework

**React Native Compatibility:**
- ✅ React Native 0.60+
- ✅ Expo SDK 36+
- ✅ Most third-party libraries

**Migration Notes:**
- Must implement notification channels
- Background service limitations

---

### Android 9 Pie (API 28, August 2018)

**Support Status:** Good support

**Market Share:** ~8% (as of 2024)

**Key Features:**
- ✅ Gesture navigation
- ✅ Display cutout support (notches)
- ✅ Multi-camera API
- ✅ ImageDecoder

**New APIs:**
- DisplayCutout for notch handling
- Multi-camera API
- BiometricPrompt API
- Neural Networks API

**React Native Compatibility:**
- ✅ React Native 0.61+
- ✅ Expo SDK 37+
- ✅ All major libraries

---

### Android 10 (API 29, September 2019)

**Support Status:** Recommended minimum

**Market Share:** ~12% (as of 2024)

**Key Features:**
- ✅ Dark theme
- ✅ Scoped storage
- ✅ 5G support
- ✅ Foldable support

**New APIs:**
- Scoped storage (privacy)
- Dark theme API
- Sharing shortcuts (Direct Share)
- Background location permission

**React Native Compatibility:**
- ✅ React Native 0.62+
- ✅ Expo SDK 38+
- ✅ All major libraries

**Migration Notes:**
- Scoped storage requires file access changes
- Background location requires separate permission

---

### Android 11 (API 30, September 2020)

**Support Status:** Widely supported

**Market Share:** ~15% (as of 2024)

**Key Features:**
- ✅ Bubbles for conversations
- ✅ Screen recording
- ✅ One-time permissions
- ✅ Wireless Android Auto

**New APIs:**
- Bubbles API for chat heads
- One-time permissions
- Auto-reset permissions
- Wireless debugging

**React Native Compatibility:**
- ✅ React Native 0.64+
- ✅ Expo SDK 41+
- ✅ All major libraries

**Migration Notes:**
- Permissions auto-reset for unused apps
- Package visibility changes

---

### Android 12 (API 31, October 2021)

**Support Status:** Recommended target

**Market Share:** ~25% (as of 2024)

**Key Features:**
- ✅ Material You (dynamic colors)
- ✅ Privacy dashboard
- ✅ Approximate location
- ✅ Splash screen API

**New APIs:**
- Material You dynamic colors
- Splash screen API (required)
- Privacy dashboard
- Approximate location permission

**React Native Compatibility:**
- ✅ React Native 0.68+
- ✅ Expo SDK 45+
- ✅ All major libraries

**Migration Notes:**
- Must implement new splash screen API
- Dynamic colors require theme support

---

### Android 13 (API 33, August 2022)

**Support Status:** Latest stable

**Market Share:** ~30-35% (as of 2024)

**Key Features:**
- ✅ Predictive back gesture
- ✅ Per-app language preferences
- ✅ Themed app icons
- ✅ Notification runtime permission

**New APIs:**
- Predictive back navigation
- Per-app language API
- Notification permission (required)
- Themed icons

**React Native Compatibility:**
- ✅ React Native 0.71+
- ✅ Expo SDK 48+
- ✅ All major libraries

**Migration Notes:**
- Must request notification permission at runtime
- Predictive back requires opt-in

---

### Android 14 (API 34, October 2023)

**Support Status:** Latest

**Market Share:** ~15-20% (as of 2024)

**Key Features:**
- ✅ Improved battery life
- ✅ Enhanced accessibility
- ✅ Privacy improvements
- ✅ Credential Manager API

**New APIs:**
- Credential Manager for passkeys
- Health Connect improvements
- Ultra HDR for photos
- Grammatical inflection API

**React Native Compatibility:**
- ✅ React Native 0.73+
- ✅ Expo SDK 50+
- ✅ All major libraries

**Important Notes:**
- Requires compileSdkVersion 34
- New photo picker restrictions

---

## Expo SDK Feature Support

### Expo SDK 49 (August 2023)

**React Native:** 0.72.6
**iOS:** 13+
**Android:** API 21+ (5.0)

**Key Features:**
- ✅ Expo Router (file-based routing)
- ✅ Local-first architecture
- ✅ Improved build times
- ✅ Better TypeScript support

**Platform Support:**
| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Camera | ✅ | ✅ | ❌ |
| Notifications | ✅ | ✅ | ⚠️ Limited |
| Location | ✅ | ✅ | ⚠️ Limited |
| Biometrics | ✅ | ✅ | ❌ |
| File System | ✅ | ✅ | ⚠️ Limited |
| Media Library | ✅ | ✅ | ❌ |
| Contacts | ✅ | ✅ | ❌ |
| Calendar | ✅ | ✅ | ❌ |

---

### Expo SDK 50 (January 2024)

**React Native:** 0.73.2
**iOS:** 13.4+
**Android:** API 21+ (5.0)

**Key Features:**
- ✅ Bridgeless mode (New Architecture)
- ✅ Improved performance
- ✅ Better dev tools
- ✅ Enhanced security

**Platform Support:**
| Feature | iOS | Android | Web |
|---------|-----|---------|-----|
| Camera | ✅ | ✅ | ⚠️ Experimental |
| Notifications | ✅ | ✅ | ⚠️ Limited |
| Location | ✅ | ✅ | ✅ |
| Biometrics | ✅ | ✅ | ❌ |
| File System | ✅ | ✅ | ✅ |
| Widgets | ✅ iOS 14+ | ✅ API 26+ | ❌ |

---

### Expo SDK 51 (May 2024, expected)

**React Native:** 0.74+ (expected)
**iOS:** 13.4+
**Android:** API 23+ (6.0)

**Expected Features:**
- ✅ Full New Architecture support
- ✅ Improved expo-router
- ✅ Better monorepo support
- ✅ Enhanced local-first

---

## Third-Party Library Compatibility

### React Navigation

| Version | React Native | iOS | Android | Expo SDK |
|---------|--------------|-----|---------|----------|
| 6.x | 0.63+ | 11+ | API 21+ | 42+ |
| 7.x | 0.72+ | 13+ | API 21+ | 49+ |

**Platform-Specific Features:**
- iOS: Native stack navigator with swipe back
- Android: Native stack with back button support
- Both: Bottom tabs, drawer, modal

---

### React Native Paper (Material Design)

| Version | React Native | Android Target | iOS Support |
|---------|--------------|----------------|-------------|
| 4.x | 0.60+ | API 21+ | ✅ |
| 5.x | 0.65+ | API 21+ | ✅ |

**Material You Support:**
- ✅ Android 12+ (API 31)
- ❌ iOS (uses custom theming)

**Best used for:**
- Android apps (native Material Design)
- Cross-platform apps with Material Design preference

---

### React Native Elements

| Version | React Native | iOS | Android |
|---------|--------------|-----|---------|
| 3.x | 0.62+ | 11+ | API 21+ |
| 4.x | 0.64+ | 11+ | API 21+ |

**Best used for:**
- Cross-platform apps
- Custom design systems
- When you want platform-agnostic components

---

### React Native Reanimated

| Version | React Native | iOS | Android | Web |
|---------|--------------|-----|---------|-----|
| 2.x | 0.62+ | 11+ | API 21+ | ✅ |
| 3.x | 0.68+ | 12+ | API 21+ | ✅ |

**Platform Performance:**
- ✅ iOS: Excellent (60fps animations)
- ✅ Android: Excellent (60fps animations)
- ⚠️ Web: Good (may need fallbacks)

---

### React Native Gesture Handler

| Version | React Native | iOS | Android |
|---------|--------------|-----|---------|
| 2.x | 0.60+ | 11+ | API 21+ |

**Platform Features:**
- ✅ iOS: Native gesture recognition
- ✅ Android: Native gesture recognition
- Works seamlessly with React Native Reanimated

---

### React Native Maps

| Version | React Native | iOS | Android |
|---------|--------------|-----|---------|
| 1.x | 0.60+ | 11+ | API 21+ |

**Map Providers:**
- iOS: Apple Maps (default) or Google Maps
- Android: Google Maps (default)

**Important:**
- Requires Google Maps API key for Android
- Requires Apple Maps authorization for iOS

---

### React Native Firebase

| Version | React Native | iOS | Android |
|---------|--------------|-----|---------|
| 18.x | 0.68+ | 12+ | API 21+ |
| 19.x | 0.72+ | 13+ | API 21+ |

**Services Support:**
- ✅ Analytics: iOS 10+, Android API 16+
- ✅ Cloud Messaging (FCM): Both platforms
- ✅ Crashlytics: Both platforms
- ✅ Firestore: Both platforms
- ✅ Authentication: Both platforms

---

### React Native Vision Camera

| Version | React Native | iOS | Android |
|---------|--------------|-----|---------|
| 3.x | 0.68+ | 12+ | API 24+ |

**Features:**
- ✅ iOS: Full camera API access
- ✅ Android: Camera2 API
- ✅ Both: QR/barcode scanning
- ✅ Both: Photo and video capture

---

## React Native Version Compatibility

### React Native 0.72 (June 2023)

**Recommended for:** Production apps

**Platform Support:**
- iOS: 12.4+
- Android: API 21+ (5.0)

**Key Features:**
- ✅ Hermes engine by default
- ✅ Better TypeScript support
- ✅ Improved Metro bundler
- ✅ Flex gap support

**Expo Compatibility:**
- ✅ Expo SDK 49

---

### React Native 0.73 (December 2023)

**Recommended for:** New projects

**Platform Support:**
- iOS: 13.4+
- Android: API 21+ (5.0)

**Key Features:**
- ✅ New Architecture (opt-in)
- ✅ Better debugging
- ✅ Kotlin 1.8
- ✅ Improved performance

**Expo Compatibility:**
- ✅ Expo SDK 50

---

### React Native 0.74 (Expected Q2 2024)

**Status:** Upcoming

**Expected Platform Support:**
- iOS: 13.4+
- Android: API 23+ (6.0)

**Expected Features:**
- ✅ New Architecture by default
- ✅ Bridgeless mode
- ✅ Better bundler performance
- ✅ Improved developer experience

**Expo Compatibility:**
- Expected: Expo SDK 51

---

## Minimum Version Recommendations

### Conservative (Maximum Compatibility)

```json
{
  "ios": {
    "minimumOsVersion": "13.0",
    "deploymentTarget": "13.0"
  },
  "android": {
    "minSdkVersion": 23,
    "compileSdkVersion": 33,
    "targetSdkVersion": 33
  },
  "react-native": "0.72",
  "expo": "49"
}
```

**Reasoning:**
- iOS 13: Covers 95%+ of devices
- Android API 23: Covers 95%+ of devices
- Mature, stable versions

**Trade-offs:**
- ❌ No Live Activities (iOS 16.1+)
- ❌ No Material You (Android 12+)
- ✅ Maximum device coverage

---

### Balanced (Recommended)

```json
{
  "ios": {
    "minimumOsVersion": "14.0",
    "deploymentTarget": "14.0"
  },
  "android": {
    "minSdkVersion": 26,
    "compileSdkVersion": 34,
    "targetSdkVersion": 33
  },
  "react-native": "0.73",
  "expo": "50"
}
```

**Reasoning:**
- iOS 14: Enables widgets, still covers 90%+ devices
- Android API 26: Enables notification channels, widgets
- Latest stable versions

**Trade-offs:**
- ✅ Widgets on both platforms
- ✅ Modern features
- ⚠️ Drops ~5% of older devices

---

### Modern (Latest Features)

```json
{
  "ios": {
    "minimumOsVersion": "16.0",
    "deploymentTarget": "16.0"
  },
  "android": {
    "minSdkVersion": 31,
    "compileSdkVersion": 34,
    "targetSdkVersion": 34
  },
  "react-native": "0.73",
  "expo": "50"
}
```

**Reasoning:**
- iOS 16: Enables Live Activities (16.1+)
- Android API 31: Enables Material You
- Cutting-edge features

**Trade-offs:**
- ✅ Live Activities (iOS)
- ✅ Material You (Android)
- ❌ Drops ~15-20% of devices

---

## Version Selection Decision Tree

```
What's your priority?

├─ Maximum device coverage
│  └─ Use Conservative approach
│     iOS 13+, Android API 23+
│
├─ Modern features + Good coverage
│  └─ Use Balanced approach (RECOMMENDED)
│     iOS 14+, Android API 26+
│
└─ Latest features
   └─ Use Modern approach
      iOS 16+, Android API 31+

Consider:
- Target audience age (older users = older devices)
- Market (emerging markets = older devices)
- App complexity (complex = newer OS needed)
- Competition (what do competitors support?)
```

---

## Platform-Specific Feature Matrix

| Feature | iOS Min | Android Min | Expo SDK | Notes |
|---------|---------|-------------|----------|-------|
| Dark Mode | iOS 13 | Android 10 (API 29) | 36+ | System-level |
| Widgets | iOS 14 | Android 8 (API 26) | 45+ | Different APIs |
| Live Activities | iOS 16.1 | N/A | 49+ | iOS only |
| Material You | N/A | Android 12 (API 31) | 48+ | Android only |
| Biometric Auth | iOS 11 | Android 6 (API 23) | 36+ | Different APIs |
| Push Notifications | iOS 10+ | All | 36+ | APNs vs FCM |
| Deep Linking | iOS 9 | Android 6 (API 23) | 36+ | Different setup |
| Background Tasks | iOS 13 | All | 40+ | iOS more restricted |
| Picture-in-Picture | iOS 14 | Android 8 (API 26) | 45+ | Different APIs |

---

## Testing Matrix

### Recommended Testing Devices

**iOS:**
- iPhone SE (2022) - iOS 17 (small screen, latest OS)
- iPhone 13 - iOS 16 (standard size, widely used)
- iPhone X - iOS 16 (notch, older but common)
- iPad Air - iPadOS 17 (tablet)

**Android:**
- Pixel 6 - Android 14 (latest, pure Android)
- Samsung Galaxy S21 - Android 13 (popular, manufacturer UI)
- Older device - Android 8 (API 26) (minimum supported)
- Tablet - Android 12+ (tablet layout)

---

## Summary

**Recommended Configuration for New Projects (2024):**

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.mycompany.myapp",
      "buildNumber": "1.0.0",
      "supportsTablet": true,
      "minimumOsVersion": "14.0"
    },
    "android": {
      "package": "com.mycompany.myapp",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "minSdkVersion": 26,
      "compileSdkVersion": 34,
      "targetSdkVersion": 33
    }
  },
  "dependencies": {
    "expo": "~50.0.0",
    "react": "18.2.0",
    "react-native": "0.73.2",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/native-stack": "^6.9.17",
    "react-native-reanimated": "~3.6.0",
    "react-native-gesture-handler": "~2.14.0"
  }
}
```

**Why these versions?**
- iOS 14+: Enables widgets, covers 90%+ devices
- Android API 26+: Enables notification channels, widgets, covers 95%+ devices
- Expo SDK 50: Latest stable with New Architecture support
- React Native 0.73: Latest stable with great performance

**Update schedule:**
- Review annually after iOS/Android major releases (September/October)
- Consider dropping old OS versions when usage < 2%
- Test on physical devices before dropping support
