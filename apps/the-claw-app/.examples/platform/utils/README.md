# Platform Detection & Selection Utilities

Comprehensive utilities for detecting platform capabilities and selecting platform-specific implementations in React Native + Expo apps.

## Table of Contents

- [Platform Detection](#platform-detection)
- [Platform Selection](#platform-selection)
- [Feature Detection](#feature-detection)
- [Version Checking](#version-checking)
- [Device Characteristics](#device-characteristics)
- [Testing Platform-Specific Code](#testing-platform-specific-code)
- [Best Practices](#best-practices)

## Platform Detection

### Basic Detection

```typescript
import { PlatformUtils } from './platformDetection'

// Platform type
console.log(PlatformUtils.isIOS)      // true on iOS
console.log(PlatformUtils.isAndroid)  // true on Android
console.log(PlatformUtils.isWeb)      // true on web

// Device type
console.log(PlatformUtils.isPhone)    // true on phones
console.log(PlatformUtils.isTablet)   // true on tablets
console.log(PlatformUtils.isDesktop)  // true on desktop web

// Version detection
console.log(PlatformUtils.iOSVersion)      // 17 (or null on Android)
console.log(PlatformUtils.androidVersion)  // 33 (or null on iOS)
```

### Comprehensive Capabilities

```typescript
import { getDeviceCapabilities } from './platformDetection'

const capabilities = getDeviceCapabilities()
console.log(capabilities)
// {
//   platform: 'ios',
//   platformVersion: 17,
//   deviceType: 'phone',
//   screenCategory: 'medium',
//   pixelDensity: 'xxhdpi',
//   hasNotch: true,
//   hasHomeIndicator: true,
//   supportsHaptics: true,
//   supportsBiometrics: true,
//   supportsWidgets: true,
//   supportsLiveActivities: true,
//   supportsMaterialYou: false,
// }
```

## Platform Selection

### Select Values

```typescript
import { platformSelect } from './platformSelect'

// Simple value selection
const headerHeight = platformSelect({
  ios: 44,
  android: 56,
  default: 48,
})

// Style selection
const shadowStyle = platformSelect({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  android: {
    elevation: 5,
  },
  default: {},
})

// Native-specific selection (both iOS and Android)
const hapticIntensity = platformSelect({
  native: 'medium',  // Applied to both iOS and Android
  web: 'none',
  default: 'light',
})
```

### Select Components

```typescript
import { platformComponent } from './platformSelect'

// Platform-specific components
const DatePicker = platformComponent({
  ios: IOSDatePicker,
  android: AndroidDatePicker,
  default: WebDatePicker,
})

// Usage
function MyComponent() {
  return (
    <DatePicker
      value={date}
      onChange={setDate}
    />
  )
}
```

### Select Hooks

```typescript
import { platformHook } from './platformSelect'

// Platform-specific hooks
export function useNotifications() {
  return platformHook({
    ios: useIOSNotifications,
    android: useAndroidNotifications,
    default: useWebNotifications,
  })
}

// Usage
function MyComponent() {
  const notifications = useNotifications()
  // ...
}
```

### Select Functions

```typescript
import { platformFunction, platformAsyncFunction } from './platformSelect'

// Synchronous function
const vibrate = platformFunction({
  ios: vibrateIOS,
  android: vibrateAndroid,
  default: () => console.warn('Vibration not supported'),
})

vibrate()

// Asynchronous function
const saveFile = platformAsyncFunction({
  ios: saveFileIOS,
  android: saveFileAndroid,
  web: saveFileWeb,
  default: async () => ({ success: false }),
})

await saveFile(data, 'filename.txt')
```

## Feature Detection

### Check Feature Availability

```typescript
import { PlatformUtils } from './platformDetection'

// Haptic feedback
if (PlatformUtils.supportsHaptics()) {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
}

// Live Activities (iOS 16.1+)
if (PlatformUtils.supportsLiveActivities()) {
  await startLiveActivity()
} else if (PlatformUtils.isAndroid) {
  // Use ongoing notification instead
  await showOngoingNotification()
}

// Material You (Android 12+)
if (PlatformUtils.supportsMaterialYou()) {
  // Use Material You dynamic colors
  const colors = await getDynamicColors()
}

// Widgets
if (PlatformUtils.supportsWidgets()) {
  await updateWidget()
}

// Biometric authentication
if (PlatformUtils.supportsBiometrics()) {
  const result = await LocalAuthentication.authenticateAsync()
}
```

### Feature Checker with Reasons

```typescript
import { FeatureChecker } from './platformDetection'

const features = new FeatureChecker()

// Check if feature is available
if (features.check('liveActivities')) {
  await startLiveActivity()
} else {
  // Get reason why not available
  console.log('Reason:', features.getReason('liveActivities'))
  // "Requires iOS 16.1 or later" or "Live Activities are iOS-only"
}

// Check with reason
const result = features.checkWithReason('materialYou')
if (result.available) {
  enableMaterialYou()
} else {
  console.log(result.reason)
  // "Material You is Android-only" or "Requires Android 12 (API 31) or later"
}

// Available features to check
type FeatureName =
  | 'haptics'
  | 'biometrics'
  | 'widgets'
  | 'liveActivities'
  | 'materialYou'
  | 'predictiveBack'
  | 'pictureInPicture'
  | 'appClips'
  | 'siriShortcuts'
  | 'backgroundLocation'
```

## Version Checking

### iOS Version Checks

```typescript
import { PlatformUtils } from './platformDetection'

// Check iOS version
if (PlatformUtils.isIOS && PlatformUtils.iOSVersion! >= 16) {
  // Use iOS 16+ features
  enableFocusFilters()
}

if (PlatformUtils.isIOS && PlatformUtils.iOSVersion! >= 16.1) {
  // Use iOS 16.1+ features (Live Activities)
  startLiveActivity()
}

// iOS-specific features by version
// iOS 8+: Handoff
// iOS 9+: Universal Links, iPad PiP
// iOS 10+: Basic Haptics
// iOS 12+: Siri Shortcuts
// iOS 14+: Widgets, App Clips, iPhone PiP
// iOS 16+: Live Activities (16.1+), Focus Filters, Dynamic Island
```

### Android Version Checks

```typescript
import { PlatformUtils } from './platformDetection'

// Check Android version
if (PlatformUtils.isAndroid && PlatformUtils.androidVersion! >= 31) {
  // Use Android 12+ features (Material You)
  enableMaterialYou()
}

if (PlatformUtils.isAndroid && PlatformUtils.androidVersion! >= 33) {
  // Use Android 13+ features (Predictive Back)
  enablePredictiveBack()
}

// Android-specific features by API level
// API 23 (Android 6): App Links, Fingerprint
// API 24 (Android 7): Quick Settings Tiles
// API 26 (Android 8): Widgets, Haptics, PiP
// API 29 (Android 10): Direct Share
// API 30 (Android 11): Bubbles
// API 31 (Android 12): Material You
// API 33 (Android 13): Predictive Back
```

### Minimum Version Enforcement

```typescript
import { PlatformUtils } from './platformDetection'

function requireMinimumVersion(platform: 'ios' | 'android', minVersion: number) {
  if (platform === 'ios' && PlatformUtils.iOSVersion! < minVersion) {
    throw new Error(`Requires iOS ${minVersion} or later`)
  }
  if (platform === 'android' && PlatformUtils.androidVersion! < minVersion) {
    throw new Error(`Requires Android API ${minVersion} or later`)
  }
}

// Usage
function enableLiveActivities() {
  requireMinimumVersion('ios', 16.1)
  // Safe to use Live Activities here
}
```

## Device Characteristics

### Screen Size Detection

```typescript
import { PlatformUtils } from './platformDetection'

// Get screen category
const screenCategory = PlatformUtils.getScreenCategory()
// 'small' | 'medium' | 'large' | 'xlarge'

// Adjust UI based on screen size
const fontSize = {
  small: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
}[screenCategory]

// Categories:
// - small: < 360dp (older phones)
// - medium: 360-599dp (modern phones)
// - large: 600-899dp (phablets, small tablets)
// - xlarge: 900dp+ (tablets, foldables)
```

### Pixel Density Detection

```typescript
import { PlatformUtils } from './platformDetection'

// Get pixel density category
const density = PlatformUtils.getPixelDensityCategory()
// 'ldpi' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi'

// Load appropriate image
const imageSrc = `image@${density}.png`

// Density categories:
// - mdpi: scale <= 1 (baseline)
// - hdpi: scale <= 1.5 (1.5x)
// - xhdpi: scale <= 2 (2x)
// - xxhdpi: scale <= 3 (3x)
// - xxxhdpi: scale > 3 (4x)
```

### Safe Area Detection

```typescript
import { PlatformUtils } from './platformDetection'

// Check for notch and home indicator
const safeAreaInfo = PlatformUtils.getSafeAreaInfo()

if (safeAreaInfo.hasNotch) {
  // Adjust UI for notch
  style.paddingTop = 44
}

if (safeAreaInfo.hasHomeIndicator) {
  // Adjust UI for home indicator
  style.paddingBottom = 34
}

// Always use SafeAreaView or useSafeAreaInsets()
import { SafeAreaView } from 'react-native-safe-area-context'

function MyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Content */}
    </SafeAreaView>
  )
}
```

### Orientation Detection

```typescript
import { PlatformUtils } from './platformDetection'

// Check current orientation
const isLandscape = PlatformUtils.isLandscape()
const isPortrait = PlatformUtils.isPortrait()

// Listen for orientation changes
import { Dimensions } from 'react-native'

useEffect(() => {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    const isLandscape = window.width > window.height
    console.log('Orientation changed:', isLandscape ? 'landscape' : 'portrait')
  })

  return () => subscription?.remove()
}, [])
```

### Device Model Detection

```typescript
import { PlatformUtils } from './platformDetection'

// Get device information
const platformConstants = PlatformUtils.getPlatformConstants()

if (platformConstants.platform === 'ios') {
  console.log('iOS version:', platformConstants.version)
  console.log('Is iPad:', platformConstants.isPad)
}

if (platformConstants.platform === 'android') {
  console.log('Android version:', platformConstants.version)
  console.log('Brand:', platformConstants.brandName)        // 'Samsung', 'Google', etc.
  console.log('Manufacturer:', platformConstants.manufacturerName)
}

// Device name and model
console.log('Device name:', PlatformUtils.deviceName)    // "John's iPhone"
console.log('Model name:', PlatformUtils.modelName)      // "iPhone 14 Pro"
console.log('Model ID:', PlatformUtils.modelId)          // "iPhone15,2"
```

## Testing Platform-Specific Code

### Unit Testing

```typescript
import { Platform } from 'react-native'
import { PlatformUtils } from './platformDetection'

describe('Platform-specific functionality', () => {
  it('should use iOS implementation on iOS', () => {
    // Mock Platform.OS
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios')
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue('16')

    // Test
    expect(PlatformUtils.isIOS).toBe(true)
    expect(PlatformUtils.supportsLiveActivities()).toBe(true)
  })

  it('should use Android implementation on Android', () => {
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android')
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(31)

    expect(PlatformUtils.isAndroid).toBe(true)
    expect(PlatformUtils.supportsMaterialYou()).toBe(true)
  })
})
```

### Integration Testing

```typescript
import { render } from '@testing-library/react-native'
import { platformComponent } from './platformSelect'

describe('Platform-specific components', () => {
  it('should render iOS component on iOS', () => {
    const TestComponent = platformComponent({
      ios: () => <Text>iOS Component</Text>,
      android: () => <Text>Android Component</Text>,
    })

    const { getByText } = render(<TestComponent />)

    // This will pass on iOS, fail on Android
    expect(getByText('iOS Component')).toBeTruthy()
  })
})
```

### E2E Testing

```typescript
// Detox example
describe('Platform-specific E2E', () => {
  it('should show iOS-specific UI on iOS', async () => {
    if (device.getPlatform() === 'ios') {
      await expect(element(by.id('ios-tab-bar'))).toBeVisible()
    } else {
      await expect(element(by.id('android-bottom-nav'))).toBeVisible()
    }
  })
})
```

## Best Practices

### 1. Use Type-Safe Selection

```typescript
// Good: Type-safe with platformSelect
const value = platformSelect({
  ios: 44,
  android: 56,
  default: 48,
})

// Avoid: Manual Platform.select without types
const value = Platform.select({
  ios: 44,
  android: 56,
})
```

### 2. Always Provide Defaults

```typescript
// Good: Always provide default fallback
const fontSize = platformSelect({
  ios: 16,
  android: 14,
  default: 14, // Fallback for web or other platforms
})

// Avoid: Missing default
const fontSize = platformSelect({
  ios: 16,
  android: 14,
  // What happens on web?
})
```

### 3. Document Platform Differences

```typescript
/**
 * Get header height
 *
 * iOS: 44pt (standard navigation bar height)
 * Android: 56dp (Material Design app bar height)
 * Web: 48px (compromise between platforms)
 */
const HEADER_HEIGHT = platformSelect({
  ios: 44,
  android: 56,
  default: 48,
})
```

### 4. Check Versions Before Using Features

```typescript
// Good: Check version before using feature
if (PlatformUtils.isIOS && PlatformUtils.iOSVersion! >= 16.1) {
  await startLiveActivity()
} else {
  // Fallback for older iOS versions or other platforms
  await showNotification()
}

// Avoid: Assuming feature availability
if (PlatformUtils.isIOS) {
  await startLiveActivity() // Crashes on iOS < 16.1
}
```

### 5. Use Feature Detection, Not Version Detection

```typescript
// Good: Check feature availability
if (PlatformUtils.supportsLiveActivities()) {
  await startLiveActivity()
}

// Less good: Manual version check
if (PlatformUtils.isIOS && PlatformUtils.iOSVersion! >= 16.1) {
  await startLiveActivity()
}
```

### 6. Provide Platform-Appropriate Alternatives

```typescript
// Good: Platform-appropriate implementations
if (PlatformUtils.supportsLiveActivities()) {
  // iOS 16.1+: Use Live Activities
  await startLiveActivity()
} else if (PlatformUtils.isAndroid) {
  // Android: Use ongoing notification
  await showOngoingNotification()
} else {
  // Older iOS or other platforms: Regular notification
  await showNotification()
}

// Avoid: Only implementing for one platform
if (PlatformUtils.supportsLiveActivities()) {
  await startLiveActivity()
}
// Android users get nothing
```

### 7. Test on Both Platforms

```typescript
// Always test platform-specific code on both platforms
describe('Notifications', () => {
  it('should work on iOS', async () => {
    // Test iOS implementation
  })

  it('should work on Android', async () => {
    // Test Android implementation
  })

  it('should fall back gracefully on unsupported platforms', async () => {
    // Test fallback behavior
  })
})
```

### 8. Use Conditional Imports for Large Platform-Specific Code

```typescript
// Good: Conditional imports reduce bundle size
const NotificationService = Platform.select({
  ios: () => require('./NotificationService.ios').NotificationService,
  android: () => require('./NotificationService.android').NotificationService,
  default: () => require('./NotificationService.web').NotificationService,
})()

// Avoid: Importing both implementations
import { IOSNotificationService } from './NotificationService.ios'
import { AndroidNotificationService } from './NotificationService.android'
```

### 9. Handle Missing Features Gracefully

```typescript
// Good: Graceful degradation
export function useHapticFeedback() {
  return useCallback((intensity: 'light' | 'medium' | 'heavy') => {
    if (!PlatformUtils.supportsHaptics()) {
      console.log('Haptics not supported, skipping')
      return
    }

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(getIOSIntensity(intensity))
    } else if (Platform.OS === 'android') {
      Vibration.vibrate(getAndroidDuration(intensity))
    }
  }, [])
}

// Avoid: Throwing errors for missing features
export function useHapticFeedback() {
  if (!PlatformUtils.supportsHaptics()) {
    throw new Error('Haptics not supported') // Bad user experience
  }
  // ...
}
```

### 10. Keep Platform Logic Centralized

```typescript
// Good: Centralized platform logic
// utils/haptics.ts
export const haptics = {
  impact: (intensity: 'light' | 'medium' | 'heavy') => {
    if (!PlatformUtils.supportsHaptics()) return

    platformEffect({
      ios: () => Haptics.impactAsync(getIOSIntensity(intensity)),
      android: () => Vibration.vibrate(getAndroidDuration(intensity)),
    })
  },
}

// Usage throughout app
haptics.impact('medium')

// Avoid: Scattered platform checks
if (Platform.OS === 'ios') {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
} else if (Platform.OS === 'android') {
  Vibration.vibrate(50)
}
```

## Common Pitfalls

### 1. Forgetting Web Platform

```typescript
// Bad: Only considering iOS and Android
const config = platformSelect({
  ios: iosConfig,
  android: androidConfig,
  // Missing: default or web
})

// Good: Always consider web
const config = platformSelect({
  ios: iosConfig,
  android: androidConfig,
  web: webConfig,
  default: defaultConfig,
})
```

### 2. Hardcoding Version Numbers

```typescript
// Bad: Hardcoded version check
if (Platform.Version === 16) {
  // Only works on exactly iOS 16
}

// Good: Use >= for version checks
if (PlatformUtils.iOSVersion! >= 16) {
  // Works on iOS 16 and later
}
```

### 3. Not Handling Null Versions

```typescript
// Bad: Not handling null
const version = PlatformUtils.iOSVersion
if (version >= 16) { // TypeScript error: version might be null
  // ...
}

// Good: Handle null with null assertion or check
if (PlatformUtils.isIOS && PlatformUtils.iOSVersion! >= 16) {
  // Safe because we checked isIOS first
}
```

### 4. Over-Using Platform Checks

```typescript
// Bad: Platform check for every style property
const styles = StyleSheet.create({
  button: {
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#0066CC',
    borderRadius: Platform.OS === 'ios' ? 10 : 4,
    padding: Platform.OS === 'ios' ? 16 : 12,
    fontSize: Platform.OS === 'ios' ? 16 : 14,
  },
})

// Good: Use Platform.select once
const styles = StyleSheet.create({
  button: {
    ...Platform.select({
      ios: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        padding: 16,
        fontSize: 16,
      },
      android: {
        backgroundColor: '#0066CC',
        borderRadius: 4,
        padding: 12,
        fontSize: 14,
      },
    }),
  },
})
```

## Summary

- Use `PlatformUtils` for platform and feature detection
- Use `platformSelect` and related utilities for type-safe platform-specific code
- Always check feature availability before using platform-specific APIs
- Provide defaults and fallbacks for unsupported platforms
- Test on both iOS and Android (and web if applicable)
- Document why code is platform-specific
- Keep platform logic centralized and maintainable
