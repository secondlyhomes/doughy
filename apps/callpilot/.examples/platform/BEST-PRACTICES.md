# Cross-Platform Best Practices

Comprehensive guide to building high-quality, maintainable cross-platform React Native + Expo apps.

## Table of Contents

- [Design Principles](#design-principles)
- [Platform Conventions](#platform-conventions)
- [Common Pitfalls](#common-pitfalls)
- [Performance Considerations](#performance-considerations)
- [Testing Strategy](#testing-strategy)
- [Maintenance Guidelines](#maintenance-guidelines)
- [Code Quality](#code-quality)
- [Accessibility](#accessibility)
- [Security](#security)
- [Deployment](#deployment)

---

## Design Principles

### 1. Respect Platform Conventions

**DO: Follow platform guidelines**

```typescript
// iOS: Tabs at bottom, back button at top left
// Android: Bottom navigation, back button at top left OR hardware back

const TabBar = Platform.select({
  ios: {
    position: 'bottom',
    style: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 0.5,
      borderTopColor: '#E5E5EA',
    },
  },
  android: {
    position: 'bottom',
    style: {
      backgroundColor: '#FFFFFF',
      elevation: 8,
    },
  },
})
```

**DON'T: Force iOS design on Android (or vice versa)**

```typescript
// ❌ Bad: iOS-style tabs on Android
<Tab.Navigator
  screenOptions={{
    tabBarStyle: {
      borderTopWidth: 0.5, // iOS-specific
      borderTopColor: '#E5E5EA',
    },
  }}
/>

// ✅ Good: Platform-appropriate styling
<Tab.Navigator
  screenOptions={{
    tabBarStyle: Platform.select({
      ios: {
        borderTopWidth: 0.5,
        borderTopColor: '#E5E5EA',
      },
      android: {
        elevation: 8,
      },
    }),
  }}
/>
```

### 2. Design for Both Platforms First

**DO: Consider both platforms from the start**

```typescript
// Design phase: "How will this work on iOS AND Android?"
// - iOS: Uses swipe gesture to go back
// - Android: Uses hardware/software back button
// - Solution: Support both

function DetailScreen() {
  const navigation = useNavigation()

  useEffect(() => {
    // Android: Handle hardware back button
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          navigation.goBack()
          return true
        }
      )
      return () => backHandler.remove()
    }
  }, [navigation])

  // iOS: Swipe gesture automatically handled by React Navigation
  return <View>{/* Content */}</View>
}
```

**DON'T: Design for one platform, then retrofit**

```typescript
// ❌ Bad: "Let's build for iOS first, we'll add Android later"
// This leads to iOS-centric design that feels foreign on Android
```

### 3. Progressive Enhancement

**DO: Use platform-specific features when available**

```typescript
// Best available option with fallbacks
async function showLiveUpdate(order: Order) {
  // iOS 16.1+: Live Activities
  if (PlatformUtils.supportsLiveActivities()) {
    await startLiveActivity(order)
    return
  }

  // Android: Ongoing notification
  if (Platform.OS === 'android') {
    await showOngoingNotification(order)
    return
  }

  // Fallback: Regular notification
  await sendNotification(order)
}
```

**DON'T: Limit features to lowest common denominator**

```typescript
// ❌ Bad: Not using Live Activities because Android doesn't have it
// ❌ Bad: Not using Material You because iOS doesn't have it

// ✅ Good: Use platform features where available, provide alternatives
```

### 4. Consistency Within Platform

**DO: Be consistent with platform patterns**

```typescript
// iOS: Centered header, "Back" text, blue tint
const iosHeaderConfig = {
  headerTitleAlign: 'center',
  headerBackTitle: 'Back',
  headerTintColor: '#007AFF',
}

// Android: Left-aligned header, back arrow only, dark tint
const androidHeaderConfig = {
  headerTitleAlign: 'left',
  headerBackTitle: undefined,
  headerTintColor: '#000000',
}
```

**DON'T: Mix platform conventions**

```typescript
// ❌ Bad: iOS-style centered header on Android
// ❌ Bad: Android-style left-aligned header on iOS
```

---

## Platform Conventions

### iOS Human Interface Guidelines

**Navigation:**
- Tabs at bottom
- Navigation bar at top
- Swipe from left edge to go back
- Large titles when appropriate
- Centered titles

**UI Elements:**
- Rounded corners (typically 8-12px)
- Shadows for depth
- SF Symbols for icons
- Blue (#007AFF) for interactive elements
- System fonts: SF Pro

**Gestures:**
- Swipe back from left edge
- Pull to refresh
- Long press for context menu
- Haptic feedback for interactions

**Spacing:**
- Margins: 16-20px
- Padding: 12-16px
- Safe area insets (notch, home indicator)

### Android Material Design

**Navigation:**
- Bottom navigation (3-5 items)
- App bar at top
- Back button (hardware or software)
- Left-aligned titles
- Floating Action Button (FAB) for primary action

**UI Elements:**
- Subtle rounded corners (typically 4-8px)
- Elevation for depth
- Material icons
- Theme color for interactive elements
- System fonts: Roboto

**Gestures:**
- Swipe to dismiss
- Pull to refresh
- Long press for context menu
- Ripple effect for interactions

**Spacing:**
- Margins: 16dp
- Padding: 8-16dp
- 8dp grid system

### Implementation

```typescript
// Platform-appropriate button
const buttonStyles = Platform.select({
  ios: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    elevation: 2,
  },
})

// Platform-appropriate colors
const colors = Platform.select({
  ios: {
    primary: '#007AFF',
    secondary: '#8E8E93',
    success: '#34C759',
    danger: '#FF3B30',
  },
  android: {
    primary: '#1976D2',
    secondary: '#757575',
    success: '#4CAF50',
    danger: '#F44336',
  },
})
```

---

## Common Pitfalls

### Pitfall 1: Forgetting Web Platform

**Problem:**
```typescript
// ❌ Forgot about web
const fontSize = Platform.select({
  ios: 16,
  android: 14,
  // Missing: default or web
})
```

**Solution:**
```typescript
// ✅ Always include default or web
const fontSize = Platform.select({
  ios: 16,
  android: 14,
  web: 14,
  default: 14,
})
```

### Pitfall 2: Hardcoding Platform-Specific Values

**Problem:**
```typescript
// ❌ Hardcoded values scattered everywhere
<View style={{ height: Platform.OS === 'ios' ? 44 : 56 }} />
<View style={{ height: Platform.OS === 'ios' ? 44 : 56 }} />
<View style={{ height: Platform.OS === 'ios' ? 44 : 56 }} />
```

**Solution:**
```typescript
// ✅ Use constants
const HEADER_HEIGHT = Platform.select({
  ios: 44,
  android: 56,
  default: 48,
})

<View style={{ height: HEADER_HEIGHT }} />
```

### Pitfall 3: Not Testing on Physical Devices

**Problem:**
```typescript
// Works perfectly in iOS Simulator
// Crashes on real iPhone due to memory constraints

// Works perfectly in Android Emulator
// Laggy on real Android device due to performance
```

**Solution:**
```typescript
// Test on physical devices:
// - iPhone (latest and oldest supported)
// - Android phone (latest and oldest supported)
// - iPad (if supporting tablets)
// - Android tablet (if supporting tablets)
```

### Pitfall 4: Ignoring Safe Areas

**Problem:**
```typescript
// ❌ Content hidden behind notch or home indicator
<View style={{ flex: 1 }}>
  <Header /> {/* Hidden behind status bar/notch */}
  <Content />
  <Footer /> {/* Hidden behind home indicator */}
</View>
```

**Solution:**
```typescript
// ✅ Use SafeAreaView
import { SafeAreaView } from 'react-native-safe-area-context'

<SafeAreaView style={{ flex: 1 }}>
  <Header />
  <Content />
  <Footer />
</SafeAreaView>
```

### Pitfall 5: Over-Using Platform Checks

**Problem:**
```typescript
// ❌ Too many platform checks
const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios' ? '#F8F9FA' : '#FAFAFA',
    padding: Platform.OS === 'ios' ? 16 : 14,
    borderRadius: Platform.OS === 'ios' ? 10 : 4,
    shadowColor: Platform.OS === 'ios' ? '#000' : undefined,
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 2 } : undefined,
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
    elevation: Platform.OS === 'android' ? 2 : undefined,
  },
})
```

**Solution:**
```typescript
// ✅ Use Platform.select once
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        backgroundColor: '#FAFAFA',
        padding: 14,
        borderRadius: 4,
        elevation: 2,
      },
    }),
  },
})
```

### Pitfall 6: Not Handling Null Platform Versions

**Problem:**
```typescript
// ❌ TypeScript error: iOSVersion might be null
if (PlatformUtils.iOSVersion >= 16) {
  // Error: Object is possibly 'null'
}
```

**Solution:**
```typescript
// ✅ Check platform first
if (Platform.OS === 'ios' && PlatformUtils.iOSVersion! >= 16) {
  // Safe: We know it's iOS, so version won't be null
}

// Or use optional chaining
if (PlatformUtils.iOSVersion && PlatformUtils.iOSVersion >= 16) {
  // Safe: Checked for null first
}
```

### Pitfall 7: Assuming Feature Availability

**Problem:**
```typescript
// ❌ Assuming Face ID is available on all iOS devices
if (Platform.OS === 'ios') {
  await LocalAuthentication.authenticateAsync()
  // Crashes on devices without biometrics
}
```

**Solution:**
```typescript
// ✅ Check feature availability
const hasHardware = await LocalAuthentication.hasHardwareAsync()
const isEnrolled = await LocalAuthentication.isEnrolledAsync()

if (hasHardware && isEnrolled) {
  await LocalAuthentication.authenticateAsync()
} else {
  // Fallback to password
}
```

---

## Performance Considerations

### iOS-Specific Performance

**1. Use Hermes JavaScript Engine**
```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

**2. Minimize Bridge Calls**
```typescript
// ❌ Bad: Multiple bridge calls
for (let i = 0; i < 1000; i++) {
  await AsyncStorage.setItem(`key${i}`, `value${i}`)
}

// ✅ Good: Batch operations
const pairs = Array.from({ length: 1000 }, (_, i) => [`key${i}`, `value${i}`])
await AsyncStorage.multiSet(pairs)
```

**3. Use Native Driver for Animations**
```typescript
// ✅ Use native driver when possible
Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Runs on native thread
}).start()
```

**4. Optimize List Rendering**
```typescript
// ✅ Use FlatList with proper optimization
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={21}
/>
```

### Android-Specific Performance

**1. Enable ProGuard/R8 for Release**
```gradle
// android/app/build.gradle
buildTypes {
    release {
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

**2. Use Multidex for Large Apps**
```gradle
// android/app/build.gradle
android {
    defaultConfig {
        multiDexEnabled true
    }
}
```

**3. Optimize Images**
```typescript
// ✅ Use appropriate image formats
// - PNG for transparency
// - JPEG for photos
// - WebP for best compression

// ✅ Provide multiple densities
// images/
//   icon.png      (mdpi - 48x48)
//   icon@1.5x.png (hdpi - 72x72)
//   icon@2x.png   (xhdpi - 96x96)
//   icon@3x.png   (xxhdpi - 144x144)
//   icon@4x.png   (xxxhdpi - 192x192)
```

**4. Avoid Memory Leaks**
```typescript
// ✅ Clean up listeners
useEffect(() => {
  const subscription = eventEmitter.addListener('event', handler)

  return () => {
    subscription.remove()
  }
}, [])
```

### Cross-Platform Performance

**1. Memoization**
```typescript
// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data)
}, [data])

// ✅ Memoize callbacks
const handlePress = useCallback(() => {
  doSomething()
}, [])
```

**2. Code Splitting**
```typescript
// ✅ Lazy load screens
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'))

// Usage
<Suspense fallback={<Loading />}>
  <ProfileScreen />
</Suspense>
```

**3. Image Optimization**
```typescript
// ✅ Use expo-image for better performance
import { Image } from 'expo-image'

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
/>
```

**4. Reduce Bundle Size**
```typescript
// ✅ Import only what you need
import { debounce } from 'lodash/debounce' // Better
import { debounce } from 'lodash'          // Worse (imports entire library)

// ✅ Use platform-specific imports
const LargeComponent = Platform.select({
  ios: () => require('./LargeComponent.ios'),
  android: () => require('./LargeComponent.android'),
})()
```

---

## Testing Strategy

### Unit Testing

```typescript
import { Platform } from 'react-native'
import { render } from '@testing-library/react-native'
import { PlatformUtils } from '@/utils/platform'

describe('Platform-specific functionality', () => {
  describe('iOS', () => {
    beforeEach(() => {
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios')
      jest.spyOn(Platform, 'Version', 'get').mockReturnValue('16')
    })

    it('should use iOS implementation', () => {
      expect(PlatformUtils.isIOS).toBe(true)
      expect(PlatformUtils.supportsLiveActivities()).toBe(true)
    })

    it('should render iOS component', () => {
      const { getByTestId } = render(<MyComponent />)
      expect(getByTestId('ios-element')).toBeTruthy()
    })
  })

  describe('Android', () => {
    beforeEach(() => {
      jest.spyOn(Platform, 'OS', 'get').mockReturnValue('android')
      jest.spyOn(Platform, 'Version', 'get').mockReturnValue(31)
    })

    it('should use Android implementation', () => {
      expect(PlatformUtils.isAndroid).toBe(true)
      expect(PlatformUtils.supportsMaterialYou()).toBe(true)
    })

    it('should render Android component', () => {
      const { getByTestId } = render(<MyComponent />)
      expect(getByTestId('android-element')).toBeTruthy()
    })
  })
})
```

### Integration Testing

```typescript
import { fireEvent, waitFor } from '@testing-library/react-native'

describe('Cross-platform navigation', () => {
  it('should navigate using platform-appropriate method', async () => {
    const { getByTestId } = render(<NavigationFlow />)

    // Tap to navigate forward
    fireEvent.press(getByTestId('next-button'))
    await waitFor(() => {
      expect(getByTestId('next-screen')).toBeTruthy()
    })

    if (Platform.OS === 'ios') {
      // iOS: Swipe back
      fireEvent(getByTestId('next-screen'), 'swipeRight')
    } else {
      // Android: Back button
      fireEvent.press(getByTestId('back-button'))
    }

    await waitFor(() => {
      expect(getByTestId('first-screen')).toBeTruthy()
    })
  })
})
```

### E2E Testing with Detox

```typescript
// e2e/firstTest.e2e.ts
describe('Platform-specific E2E', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should show platform-specific UI', async () => {
    if (device.getPlatform() === 'ios') {
      await expect(element(by.id('ios-tab-bar'))).toBeVisible()
      await expect(element(by.id('ios-back-button'))).toBeVisible()
    } else {
      await expect(element(by.id('android-bottom-nav'))).toBeVisible()
      await expect(element(by.id('android-back-button'))).toBeVisible()
    }
  })

  it('should handle platform-specific gestures', async () => {
    await element(by.id('detail-screen-button')).tap()
    await expect(element(by.id('detail-screen'))).toBeVisible()

    if (device.getPlatform() === 'ios') {
      // iOS: Swipe from left edge
      await element(by.id('detail-screen')).swipe('right', 'slow', 0.1)
    } else {
      // Android: Back button
      await device.pressBack()
    }

    await expect(element(by.id('home-screen'))).toBeVisible()
  })

  it('should work with platform-specific features', async () => {
    if (device.getPlatform() === 'ios') {
      // Test iOS-specific feature
      await element(by.id('enable-live-activity')).tap()
      // Verify Live Activity appeared
    } else {
      // Test Android-specific feature
      await element(by.id('enable-material-you')).tap()
      // Verify Material You colors applied
    }
  })
})
```

### Testing Checklist

**Pre-release Testing:**
- [ ] Unit tests pass on both platforms
- [ ] Integration tests pass on both platforms
- [ ] E2E tests pass on both platforms
- [ ] Manual testing on physical iOS device
- [ ] Manual testing on physical Android device
- [ ] Tested on oldest supported OS version
- [ ] Tested on latest OS version
- [ ] Tested on different screen sizes
- [ ] Tested in light and dark mode
- [ ] Tested with accessibility features enabled
- [ ] Performance profiling done
- [ ] Memory leak check done
- [ ] Battery usage acceptable

---

## Maintenance Guidelines

### Version Support Strategy

**iOS:**
```typescript
// Support last 2-3 major versions
const MIN_IOS_VERSION = 13 // iOS 13-17 (as of 2024)

if (Platform.OS === 'ios' && PlatformUtils.iOSVersion! < MIN_IOS_VERSION) {
  // Show update prompt
  Alert.alert(
    'Update Required',
    'Please update to iOS 13 or later to use this app.',
    [{ text: 'OK' }]
  )
}
```

**Android:**
```typescript
// Support API 26+ (Android 8.0+, ~95% market share)
const MIN_ANDROID_API = 26

if (Platform.OS === 'android' && PlatformUtils.androidVersion! < MIN_ANDROID_API) {
  // Show update prompt
  Alert.alert(
    'Update Required',
    'Please update to Android 8.0 or later to use this app.',
    [{ text: 'OK' }]
  )
}
```

### Platform Update Cadence

**iOS:**
- Major update: September annually
- Beta testing: June-September (WWDC to release)
- Adoption rate: ~80% on latest within 3 months

**Action items:**
- Test beta versions in June
- Prepare for new features by August
- Release update day 1 of new iOS

**Android:**
- Major update: August/September annually
- Beta testing: February-August
- Adoption rate: Slower, fragmented (30-40% on latest after 1 year)

**Action items:**
- Test beta versions in February
- Prepare for new features by July
- Support older versions longer than iOS

### Documentation

**What to document:**

1. **Why code is platform-specific**
```typescript
/**
 * Uses Live Activities on iOS 16.1+ for real-time updates
 * Falls back to ongoing notifications on Android
 * Falls back to regular notifications on older iOS versions
 *
 * @platform iOS 16.1+ - Live Activities
 * @platform Android - Ongoing notification
 * @platform iOS < 16.1 - Regular notification
 */
```

2. **Minimum supported versions**
```typescript
/**
 * Biometric authentication
 *
 * @requires iOS 11+ (Face ID requires iOS 11)
 * @requires Android API 23+ (Fingerprint API added in API 23)
 *
 * @throws Error if biometric hardware not available
 */
```

3. **Fallback behavior**
```typescript
/**
 * Haptic feedback
 *
 * iOS: Uses Haptic Engine (iPhone 6s+)
 * Android: Uses Vibration API (API 26+)
 * Fallback: No feedback on unsupported devices
 *
 * @param intensity - 'light' | 'medium' | 'heavy'
 */
```

4. **Testing instructions**
```typescript
/**
 * Testing:
 * - iOS: Test on physical device (haptics don't work in simulator)
 * - Android: Test on API 26+ device
 * - Verify fallback on unsupported devices
 */
```

5. **Known limitations**
```typescript
/**
 * Known limitations:
 * - iOS background tasks limited to 30 seconds
 * - Android background execution varies by manufacturer (Samsung, Xiaomi, etc.)
 * - iOS background location requires "Always" permission
 * - Android background location requires separate permission (API 29+)
 */
```

---

## Code Quality

### TypeScript Best Practices

```typescript
// ✅ Use strict types
interface PlatformButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

// ✅ Type platform-specific values
type PlatformValue<T> = {
  ios?: T
  android?: T
  web?: T
  default?: T
}

// ✅ Use discriminated unions for platform checks
type PlatformConfig =
  | { platform: 'ios'; hapticIntensity: number }
  | { platform: 'android'; vibrationDuration: number }
  | { platform: 'web'; feedback: 'none' }
```

### ESLint Rules

```json
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off", // Using TypeScript
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Code Review Checklist

- [ ] Platform-specific code is documented
- [ ] All platforms have fallbacks
- [ ] Tests cover both iOS and Android
- [ ] No hardcoded platform values
- [ ] Safe areas handled correctly
- [ ] Performance optimized
- [ ] Accessibility considered
- [ ] TypeScript types are strict
- [ ] No console.log statements
- [ ] Error handling implemented

---

## Accessibility

### Platform-Specific Accessibility

**iOS:**
```typescript
// VoiceOver support
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Submit button"
  accessibilityHint="Double tap to submit the form"
  accessibilityRole="button"
  onPress={handleSubmit}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

**Android:**
```typescript
// TalkBack support
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Submit button"
  accessibilityHint="Double tap to submit the form"
  accessibilityRole="button"
  importantForAccessibility="yes"
  onPress={handleSubmit}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

### Cross-Platform Accessibility

```typescript
// ✅ Use semantic HTML-like roles
<View accessibilityRole="header">
  <Text>Page Title</Text>
</View>

<View accessibilityRole="main">
  <Text>Content</Text>
</View>

<TouchableOpacity accessibilityRole="button">
  <Text>Action</Text>
</TouchableOpacity>
```

---

## Security

### Platform-Specific Security

**iOS:**
```typescript
// Keychain for secure storage
import * as SecureStore from 'expo-secure-store'

await SecureStore.setItemAsync('authToken', token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
})
```

**Android:**
```typescript
// Keystore for secure storage
await SecureStore.setItemAsync('authToken', token, {
  keychainAccessible: SecureStore.WHEN_UNLOCKED,
})
```

### Cross-Platform Security

```typescript
// ✅ Use HTTPS only
// ✅ Certificate pinning for API calls
// ✅ Encrypt sensitive data
// ✅ Use SecureStore for tokens
// ✅ Implement biometric authentication
// ✅ Clear sensitive data on logout
```

---

## Deployment

### iOS Deployment

```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

**Checklist:**
- [ ] App Store Connect configured
- [ ] Screenshots for all device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] App Store review notes
- [ ] Test on TestFlight

### Android Deployment

```bash
# Build for Android
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android
```

**Checklist:**
- [ ] Google Play Console configured
- [ ] Screenshots for phone and tablet
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Test on internal track

---

## Summary

**Key Takeaways:**

1. **Respect platform conventions** - iOS HIG and Material Design exist for a reason
2. **Test on physical devices** - Simulators/emulators don't catch everything
3. **Document platform differences** - Future you will thank you
4. **Provide fallbacks** - Always have a plan B
5. **Performance matters** - Optimize for both platforms
6. **Accessibility is not optional** - Support VoiceOver and TalkBack
7. **Security first** - Protect user data
8. **Keep learning** - Platforms evolve, stay updated

**Remember:** Building cross-platform apps is about finding the right balance between code reuse and platform-specific excellence. Don't sacrifice user experience for code sharing, but don't duplicate code unnecessarily either.
