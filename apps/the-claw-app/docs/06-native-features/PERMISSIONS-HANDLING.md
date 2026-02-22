# Permissions Handling Guide

> Best practices for requesting and managing permissions on iOS and Android.

## Overview

Permissions are critical for:
- **User trust** - Explains why your app needs access
- **App Store approval** - Apple/Google require proper usage descriptions
- **Legal compliance** - GDPR and privacy regulations

**Golden rule:** Request permissions at the point of use, not on app launch.

## Permission Types

### iOS Permissions

| Permission | Info.plist Key | Use Case |
|------------|----------------|----------|
| Camera | `NSCameraUsageDescription` | Photo/video capture |
| Photo Library | `NSPhotoLibraryUsageDescription` | Image picker |
| Add to Photos | `NSPhotoLibraryAddUsageDescription` | Save images |
| Microphone | `NSMicrophoneUsageDescription` | Audio recording |
| Location (When In Use) | `NSLocationWhenInUseUsageDescription` | Maps, nearby |
| Location (Always) | `NSLocationAlwaysUsageDescription` | Background tracking |
| Face ID | `NSFaceIDUsageDescription` | Biometric auth |
| Push Notifications | Requested at runtime | Alerts, reminders |
| Contacts | `NSContactsUsageDescription` | Contact import |
| Calendar | `NSCalendarsUsageDescription` | Event integration |

### Android Permissions

| Permission | Manifest Entry | Use Case |
|------------|---------------|----------|
| Camera | `android.permission.CAMERA` | Photo/video |
| Read Storage | `android.permission.READ_EXTERNAL_STORAGE` | File access |
| Write Storage | `android.permission.WRITE_EXTERNAL_STORAGE` | Save files |
| Location (Fine) | `android.permission.ACCESS_FINE_LOCATION` | GPS |
| Location (Coarse) | `android.permission.ACCESS_COARSE_LOCATION` | Approximate |
| Microphone | `android.permission.RECORD_AUDIO` | Audio |
| Notifications (API 33+) | `android.permission.POST_NOTIFICATIONS` | Push |
| Contacts | `android.permission.READ_CONTACTS` | Contact access |

## Expo Permissions API

### Install Required Packages

```bash
npx expo install expo-image-picker expo-camera expo-location expo-notifications
```

### Check Permission Status

Always check before requesting:

```typescript
import * as ImagePicker from 'expo-image-picker';

async function checkCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  return status === 'granted';
}
```

### Request Permission

```typescript
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

async function requestCameraPermission(): Promise<boolean> {
  // First check if already granted
  const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  // Request permission
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    // Permission denied - guide user to settings
    Alert.alert(
      'Camera Access Required',
      'To take photos, please enable camera access in your device settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  return true;
}
```

### Full Permission Flow Pattern

```typescript
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

interface PermissionResult {
  granted: boolean;
  canAskAgain: boolean;
}

export async function ensureCameraPermission(): Promise<PermissionResult> {
  // Check current status
  const { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();

  if (status === 'granted') {
    return { granted: true, canAskAgain: true };
  }

  if (!canAskAgain) {
    // User previously denied and selected "Don't ask again"
    showSettingsAlert('Camera');
    return { granted: false, canAskAgain: false };
  }

  // Request permission
  const result = await ImagePicker.requestCameraPermissionsAsync();

  if (result.status !== 'granted') {
    if (!result.canAskAgain) {
      showSettingsAlert('Camera');
    }
    return { granted: false, canAskAgain: result.canAskAgain };
  }

  return { granted: true, canAskAgain: true };
}

function showSettingsAlert(permissionName: string) {
  Alert.alert(
    `${permissionName} Access`,
    `${permissionName} access was previously denied. Please enable it in Settings to use this feature.`,
    [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => Linking.openSettings(),
      },
    ]
  );
}
```

## Location Permissions

Location has special handling due to background usage:

```typescript
import * as Location from 'expo-location';

export async function requestLocationPermission(
  background: boolean = false
): Promise<boolean> {
  // First request foreground permission
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== 'granted') {
    Alert.alert(
      'Location Required',
      'This feature requires location access to work properly.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  // If background access needed
  if (background) {
    const { status: backgroundStatus } =
      await Location.requestBackgroundPermissionsAsync();

    if (backgroundStatus !== 'granted') {
      Alert.alert(
        'Background Location',
        'For full functionality, please enable "Always" location access in Settings.',
        [
          { text: 'Continue with Limited', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
  }

  return true;
}
```

## Push Notification Permissions

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestPushPermission(): Promise<string | null> {
  // Check existing status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  // Request if not determined
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    // Don't show alert immediately - user chose not to allow
    return null;
  }

  // Get push token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  return token.data;
}
```

## Custom Permission Hook

```typescript
// src/hooks/usePermission.ts
import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';

type PermissionStatus = 'undetermined' | 'granted' | 'denied';

interface UsePermissionOptions {
  permissionName: string;
  checkPermission: () => Promise<{ status: string; canAskAgain?: boolean }>;
  requestPermission: () => Promise<{ status: string; canAskAgain?: boolean }>;
}

export function usePermission({
  permissionName,
  checkPermission,
  requestPermission,
}: UsePermissionOptions) {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await checkPermission();
      setStatus(result.status === 'granted' ? 'granted' : 'denied');
      return result.status === 'granted';
    } finally {
      setIsChecking(false);
    }
  }, [checkPermission]);

  const request = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await requestPermission();

      if (result.status === 'granted') {
        setStatus('granted');
        return true;
      }

      setStatus('denied');

      if (result.canAskAgain === false) {
        Alert.alert(
          `${permissionName} Access Required`,
          `Please enable ${permissionName.toLowerCase()} access in Settings.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }

      return false;
    } finally {
      setIsChecking(false);
    }
  }, [requestPermission, permissionName]);

  return { status, isChecking, check, request };
}

// Usage
import * as ImagePicker from 'expo-image-picker';

function PhotoButton() {
  const camera = usePermission({
    permissionName: 'Camera',
    checkPermission: ImagePicker.getCameraPermissionsAsync,
    requestPermission: ImagePicker.requestCameraPermissionsAsync,
  });

  const handlePress = async () => {
    const granted = await camera.request();
    if (granted) {
      // Open camera
    }
  };

  return (
    <Button
      onPress={handlePress}
      disabled={camera.isChecking}
      title="Take Photo"
    />
  );
}
```

## Best Practices

### 1. Ask at the Right Time

```typescript
// ❌ BAD: Asking on app launch
function App() {
  useEffect(() => {
    requestAllPermissions(); // User doesn't know why
  }, []);
}

// ✅ GOOD: Asking when feature is used
function PhotoUploadButton() {
  const handlePress = async () => {
    const granted = await requestCameraPermission();
    if (granted) {
      openCamera();
    }
  };
}
```

### 2. Explain Before Asking

```typescript
// Show context before system dialog
function explainThenRequest() {
  Alert.alert(
    'Camera Access',
    'We need camera access to let you take photos of your tasks. Your photos are stored securely and never shared.',
    [
      { text: 'Not Now', style: 'cancel' },
      {
        text: 'Continue',
        onPress: requestCameraPermission,
      },
    ]
  );
}
```

### 3. Graceful Degradation

```typescript
// Provide alternatives when permission denied
function ProfilePhoto({ user }) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  if (hasPermission === false) {
    return (
      <View>
        <Text>Camera access not available</Text>
        <Button
          title="Choose from Library"
          onPress={pickFromLibrary}
        />
        <Button
          title="Enable Camera"
          onPress={() => Linking.openSettings()}
        />
      </View>
    );
  }

  return <CameraView />;
}
```

### 4. Handle iOS 14+ Limited Photo Access

```typescript
import * as ImagePicker from 'expo-image-picker';

async function pickImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  // On iOS 14+, user may grant "Limited" access
  // The picker will only show selected photos
  // This is handled automatically by expo-image-picker

  if (!result.canceled) {
    return result.assets[0];
  }
}
```

### 5. Android 13+ Photo Picker

```typescript
// Android 13+ has a new photo picker that doesn't require permissions
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

async function pickImageCrossPlatform() {
  // On Android 13+, this uses the system photo picker
  // No permission needed for READ_MEDIA_IMAGES
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });

  return result;
}
```

## Platform-Specific Considerations

### iOS

- **Info.plist strings are required** - App will crash without them
- **Strings should be user-friendly** - Apple reviews these
- **"Don't Allow" is permanent** - Must guide to Settings

### Android

- **Runtime permissions (API 23+)** - Must request at runtime
- **POST_NOTIFICATIONS (API 33+)** - New permission for Android 13+
- **Granular media permissions (API 33+)** - READ_MEDIA_IMAGES, READ_MEDIA_VIDEO, READ_MEDIA_AUDIO

## Testing Permissions

### iOS Simulator

```bash
# Reset all permissions for an app
xcrun simctl privacy booted reset all com.yourapp.bundleid

# Reset specific permission
xcrun simctl privacy booted reset camera com.yourapp.bundleid
```

### Android Emulator

```bash
# Revoke permission
adb shell pm revoke com.yourapp.package android.permission.CAMERA

# Grant permission
adb shell pm grant com.yourapp.package android.permission.CAMERA
```

### Manual Testing Checklist

1. Fresh install - permissions undetermined
2. Grant permission - feature works
3. Deny permission - graceful degradation
4. Deny with "Don't ask again" - settings link works
5. Grant in settings - app detects change
6. Revoke in settings - app handles gracefully

## Checklist

- [ ] All permission strings are user-friendly and explain why
- [ ] Permissions requested at point of use, not on launch
- [ ] Denied state handled gracefully with alternatives
- [ ] Settings deep link provided when "Don't ask again"
- [ ] Custom hook abstracts permission logic
- [ ] Tested permission flows on both platforms
- [ ] iOS Info.plist has all required usage descriptions
- [ ] Android manifest has required permissions
- [ ] Limited photo access handled (iOS 14+)
- [ ] POST_NOTIFICATIONS handled (Android 13+)

## Related Docs

- [Push Notifications](./PUSH-NOTIFICATIONS.md)
- [Biometric Auth](./BIOMETRIC-AUTH.md)
- [Auth Setup](../04-authentication/AUTH-SETUP.md)
