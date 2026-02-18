# Platform-Specific Issues

Troubleshooting guide for iOS and Android-specific problems.

## Table of Contents

1. [iOS Issues](#ios-issues)
2. [Android Issues](#android-issues)
3. [Platform Detection](#platform-detection)
4. [Cross-Platform Compatibility](#cross-platform-compatibility)

---

## iOS Issues

### Simulator Not Opening

**Symptoms:**
- Simulator doesn't launch when pressing 'i'
- Error: "Unable to boot simulator"

**Solutions:**

1. **Ensure Xcode is installed:**
```bash
xcode-select --install
```

2. **Open Simulator directly:**
```bash
open -a Simulator
```

3. **Reset Simulator:**
   - Simulator → Device → Erase All Content and Settings

4. **Check available simulators:**
```bash
xcrun simctl list devices
```

---

### App Crashes on Startup (iOS)

**Common Causes:**

1. **Missing Info.plist permissions:**

Add to `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "This app uses the camera to...",
      "NSPhotoLibraryUsageDescription": "This app uses photos to...",
      "NSLocationWhenInUseUsageDescription": "This app uses location to..."
    }
  }
}
```

2. **Check crash logs:**
   - Xcode → Window → Devices and Simulators
   - Select device → View Device Logs

---

### Signing Issues

**Error: "No code signing identities found"**

**Solutions:**

1. **In Xcode:**
   - Open `.xcworkspace` file
   - Select project → Signing & Capabilities
   - Check "Automatically manage signing"
   - Select your team

2. **Or use EAS:**
```bash
eas build --platform ios
# EAS handles signing automatically
```

---

### Pod Install Errors

**Error: "CocoaPods could not find compatible versions"**

**Solutions:**

1. **Update CocoaPods:**
```bash
sudo gem install cocoapods
```

2. **Update pod repo:**
```bash
cd ios
pod repo update
pod install
cd ..
```

3. **Clear pod cache:**
```bash
cd ios
rm -rf Pods Podfile.lock
rm -rf ~/Library/Caches/CocoaPods
pod install
cd ..
```

4. **Check Ruby version:**
```bash
ruby --version
# Should be 2.6+
```

---

### Push Notifications Not Working (iOS)

**Checklist:**

- [ ] Capabilities enabled in Xcode
- [ ] APNs certificate configured
- [ ] Device registered for push
- [ ] Testing on physical device (not simulator)
- [ ] Notification permissions granted

**Solutions:**

1. **Enable push in app.json:**
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"]
    }
  },
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/notification-icon.png"
      }
    ]
  ]
}
```

2. **Request permissions:**
```typescript
import * as Notifications from 'expo-notifications'

const { status } = await Notifications.requestPermissionsAsync()
if (status !== 'granted') {
  Alert.alert('Push notifications permission denied')
}
```

---

### App Store Rejection

**Common reasons:**

1. **Incomplete metadata:**
   - Missing screenshots
   - Missing description
   - Missing privacy policy

2. **Guideline violations:**
   - App doesn't match description
   - Missing features
   - Poor user experience

3. **Technical issues:**
   - Crashes during review
   - Broken links
   - Missing permissions explanations

**How to fix:**
- Read rejection reason carefully
- Address ALL issues mentioned
- Test thoroughly
- Resubmit with clear resolution description

---

### Safari WebView Issues

**Error: "Cannot read property of undefined in WebView"**

**Solutions:**

1. **Inject JavaScript after load:**
```typescript
<WebView
  source={{ uri: 'https://example.com' }}
  onLoad={() => {
    webViewRef.current?.injectJavaScript(yourScript)
  }}
/>
```

2. **Handle errors:**
```typescript
<WebView
  onError={(syntheticEvent) => {
    const { nativeEvent } = syntheticEvent
    console.warn('WebView error:', nativeEvent)
  }}
/>
```

---

## Android Issues

### Emulator Not Starting

**Symptoms:**
- Emulator doesn't launch when pressing 'a'
- Error: "No emulators available"

**Solutions:**

1. **Check AVD exists:**
```bash
emulator -list-avds
```

2. **Create new AVD:**
   - Open Android Studio
   - Tools → AVD Manager
   - Create Virtual Device
   - Choose Pixel 6, Android 13 (API 33)

3. **Start manually:**
```bash
emulator -avd Pixel_6_API_33
```

4. **Check ANDROID_HOME:**
```bash
echo $ANDROID_HOME
# Should point to Android SDK
```

---

### Gradle Build Fails

**Error: "Execution failed for task ':app:mergeDebugResources'"**

**Solutions:**

1. **Clean build:**
```bash
cd android
./gradlew clean
cd ..
```

2. **Clear Gradle cache:**
```bash
rm -rf android/.gradle
rm -rf android/app/build
rm -rf ~/.gradle/caches
```

3. **Check Java version:**
```bash
java -version
# Should be Java 11 or 17
```

4. **Update Gradle:**
Edit `android/gradle/wrapper/gradle-wrapper.properties`:
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-all.zip
```

---

### App Crashes on Startup (Android)

**Common Causes:**

1. **Missing permissions in AndroidManifest.xml:**

Add to `app.json`:
```json
{
  "android": {
    "permissions": [
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE"
    ]
  }
}
```

2. **Check logcat:**
```bash
adb logcat | grep -i "error\|exception"
```

3. **MultiDex issue:**
Add to `android/app/build.gradle`:
```gradle
android {
  defaultConfig {
    multiDexEnabled true
  }
}
```

---

### Cleartext HTTP Not Permitted

**Error: "Cleartext HTTP traffic to ... not permitted"**

**Cause:** Android blocks HTTP by default (requires HTTPS)

**Solutions:**

1. **For development only:**
Add to `app.json`:
```json
{
  "android": {
    "usesCleartextTraffic": true
  }
}
```

**WARNING:** Remove this in production!

2. **Proper fix:** Use HTTPS for all API calls

---

### Push Notifications Not Working (Android)

**Checklist:**

- [ ] Google Play Services installed (emulator)
- [ ] FCM configured
- [ ] Notification channel created (Android 8+)
- [ ] Permissions granted

**Solutions:**

1. **Create notification channel:**
```typescript
import * as Notifications from 'expo-notifications'

await Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF231F7C',
})
```

2. **Check FCM setup:**
   - Verify `google-services.json` in `android/app/`
   - Verify package name matches Firebase console

---

### Back Button Not Working

**Issue:** Hardware back button doesn't work as expected

**Solutions:**

1. **Handle back button:**
```typescript
import { BackHandler } from 'react-native'

useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      // Handle back press
      return true // Prevent default
    }
  )

  return () => backHandler.remove()
}, [])
```

2. **Or use navigation:**
```typescript
navigation.addListener('beforeRemove', (e) => {
  e.preventDefault()
  // Show confirmation dialog
})
```

---

### Google Play Rejection

**Common reasons:**

1. **Content rating not set:**
   - Complete content rating questionnaire
   - Provide age-appropriate rating

2. **Privacy policy missing:**
   - Add privacy policy URL
   - Ensure it's accessible

3. **Target API level:**
   - Must target recent Android API level
   - Update in `app.json`:
```json
{
  "android": {
    "targetSdkVersion": 34
  }
}
```

4. **Permissions explanation:**
   - Explain why each permission is needed
   - Remove unused permissions

---

### Release APK Much Larger Than Debug

**Cause:** Release builds include all ABIs

**Solutions:**

1. **Use App Bundle (.aab):**
```bash
eas build --platform android --profile production
```
Google Play will generate optimized APKs for each device.

2. **Or split APKs manually:**
```gradle
// android/app/build.gradle
splits {
  abi {
    enable true
    reset()
    include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
    universalApk false
  }
}
```

---

## Platform Detection

### Checking Current Platform

```typescript
import { Platform } from 'react-native'

// Simple check
if (Platform.OS === 'ios') {
  // iOS specific code
}

// With select
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
})

// Platform version
if (Platform.Version >= 14) {
  // iOS 14+ or Android API 14+
}
```

---

### Platform-Specific Files

Create separate files for platform-specific code:

```
components/
├── Button.tsx         # Shared code
├── Button.ios.tsx     # iOS-specific
└── Button.android.tsx # Android-specific
```

Import normally:
```typescript
import { Button } from './components/Button'
// Automatically uses correct platform file
```

---

## Cross-Platform Compatibility

### Safe Area Handling

**iOS has notches, Android doesn't:**

```typescript
import { SafeAreaView } from 'react-native-safe-area-context'

<SafeAreaView style={{ flex: 1 }}>
  {/* Content */}
</SafeAreaView>
```

---

### Shadows

**Different on iOS and Android:**

```typescript
const styles = StyleSheet.create({
  card: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
})
```

---

### Keyboard Behavior

**Different keyboard handling:**

```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  {/* Content */}
</KeyboardAvoidingView>
```

---

### Permissions

**Request differently:**

```typescript
import { Platform, PermissionsAndroid } from 'react-native'

async function requestCameraPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    )
    return granted === PermissionsAndroid.RESULTS.GRANTED
  }
  // iOS handled via Info.plist
  return true
}
```

---

### Status Bar

**Different default appearance:**

```typescript
<StatusBar
  barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
  backgroundColor={Platform.OS === 'android' ? '#000' : undefined}
/>
```

---

### Haptics

**Different engines:**

```typescript
import * as Haptics from 'expo-haptics'

// Works on both platforms
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
```

---

### Date/Time Pickers

**Native implementations differ:**

Use `@react-native-community/datetimepicker`:
```typescript
<DateTimePicker
  value={date}
  mode="date"
  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
  onChange={handleChange}
/>
```

---

## Testing on Both Platforms

### Best Practices

1. **Test on both platforms regularly**
   - Don't wait until the end
   - UI looks different on each platform

2. **Use real devices when possible**
   - Simulators/emulators don't catch everything
   - Performance differs on real hardware

3. **Test different screen sizes**
   - iOS: iPhone SE, iPhone 15 Pro Max, iPad
   - Android: Small phone, large phone, tablet

4. **Test different OS versions**
   - iOS: Current and previous major version
   - Android: API 29 (Android 10) through current

5. **Use platform-specific design guidelines**
   - iOS: Human Interface Guidelines
   - Android: Material Design

---

## Platform-Specific Resources

### iOS

- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Xcode Documentation](https://developer.apple.com/documentation/xcode)

### Android

- [Material Design](https://material.io/design)
- [Play Store Policies](https://support.google.com/googleplay/android-developer/answer/9888077)
- [Android Developer Guide](https://developer.android.com/guide)

---

**More Help:**
- [Common Errors](./COMMON-ERRORS.md)
- [Performance Issues](./PERFORMANCE-ISSUES.md)
- [Integration Issues](./INTEGRATION-ISSUES.md)
