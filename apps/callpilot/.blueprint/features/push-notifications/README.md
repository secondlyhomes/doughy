# Push Notifications Setup Guide

**Last Updated:** 2026-02-05
**Expo SDK:** 55+ (React Native 0.83+)
**Library:** expo-notifications (official)
**Priority:** iOS APNS First, then Android FCM

---

## Overview

This guide sets up native push notifications for iOS and Android using `expo-notifications` and the latest 2026 best practices.

**2026 Requirements:**
- ✅ `expo-notifications` package (official Expo)
- ✅ FCM V1 API for Android (V0 deprecated)
- ✅ Physical device REQUIRED for testing (simulators don't support push)
- ✅ Development builds required (Expo Go has limitations)
- ✅ EAS project required for push tokens

**Two Approaches:**
1. **Expo Push Service** (recommended) - Easier, managed by Expo
2. **Direct FCM/APNs** - More control, requires Firebase/Apple setup

---

## Prerequisites

### For iOS (APNS)

- **Apple Developer Account** ($99/year required)
- **Physical iPhone** (iOS 13.4+) - Simulator doesn't support push
- **EAS CLI** installed: `npm install -g eas-cli`
- **Expo account**: https://expo.dev/signup

### For Android (FCM)

- **Firebase Project** (free)
- **Physical Android device** (Android 5.0+) - Emulator works but unreliable
- **Google Services JSON** file from Firebase

---

## Quick Start (Expo Push Service)

**Fastest path - uses Expo's push service:**

1. **Install package:**
   ```bash
   npm install expo-notifications
   ```

2. **Configure app.json:**
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-notifications",
           {
             "icon": "./assets/notification-icon.png",
             "color": "#ffffff",
             "sounds": ["./assets/notification-sound.wav"]
           }
         ]
       ]
     }
   }
   ```

3. **Request permissions and get token:**
   ```typescript
   import * as Notifications from 'expo-notifications';

   // Request permission
   const { status } = await Notifications.requestPermissionsAsync();

   // Get Expo Push Token
   const token = await Notifications.getExpoPushTokenAsync({
     projectId: 'your-project-id' // From app.json
   });
   ```

4. **Send test notification:**
   - Go to: https://expo.dev/notifications
   - Paste your token
   - Send test notification

---

## iOS APNS Setup (Detailed)

### Step 1: Apple Developer Account Setup

1. **Go to Apple Developer Portal:**
   - https://developer.apple.com/account

2. **Create App ID:**
   - Certificates, IDs & Profiles → Identifiers
   - Click "+" to add new
   - Select "App IDs" → "App"
   - Bundle ID: `com.yourcompany.yourapp` (must match app.json)
   - Enable "Push Notifications" capability
   - Click "Continue" → "Register"

3. **Create APNs Key:**
   - Certificates, IDs & Profiles → Keys
   - Click "+" to add new key
   - Name: "Push Notifications Key"
   - Enable "Apple Push Notifications service (APNs)"
   - Click "Continue" → "Register"
   - Download .p8 file (SAVE THIS - can't download again!)
   - Note Key ID (e.g., ABC123DEF4)
   - Note Team ID (in top right of portal)

### Step 2: Configure EAS for iOS Push

1. **Add credentials to EAS:**
   ```bash
   eas credentials
   # Select iOS → Production → Push Notifications
   # Upload .p8 file
   # Enter Key ID and Team ID
   ```

2. **Update app.json with iOS config:**
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.yourapp",
         "supportsTablet": true
       }
     }
   }
   ```

### Step 3: Build Development Build

**Important:** Expo Go doesn't fully support push notifications. You need a development build.

```bash
# Build for iOS device
eas build --profile development --platform ios

# Install on your iPhone
# Scan QR code when build completes
```

### Step 4: Test on Physical iPhone

```typescript
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permission
const { status } = await Notifications.requestPermissionsAsync();
if (status !== 'granted') {
  alert('Permission not granted!');
  return;
}

// Get token
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-project-id', // From app.json
});
console.log('Push Token:', token.data);

// Schedule local notification (for testing)
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Test Notification",
    body: 'This is a test!',
  },
  trigger: { seconds: 2 },
});
```

### Step 5: Send Remote Notification

**Option A: Expo Push Tool (Quick Testing)**
1. Go to: https://expo.dev/notifications
2. Paste your Expo Push Token
3. Enter title and body
4. Click "Send a Notification"

**Option B: Your Server**
```bash
curl -H "Content-Type: application/json" \
  -X POST https://exp.host/--/api/v2/push/send \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN]",
    "title": "Hello",
    "body": "This is a test notification"
  }'
```

**iOS Permissions Dialog:**
- Appears on first `requestPermissionsAsync()` call
- User can "Allow" or "Don't Allow"
- If denied, show settings prompt to re-enable

---

## Android FCM Setup (Detailed)

### Step 1: Firebase Project Setup

1. **Go to Firebase Console:**
   - https://console.firebase.google.com/

2. **Create project:**
   - Click "Add project"
   - Name: "YourApp"
   - Enable Google Analytics (optional)
   - Click "Create project"

3. **Add Android app:**
   - Click Android icon
   - Package name: `com.yourcompany.yourapp` (must match app.json)
   - App nickname: "YourApp Android"
   - Click "Register app"
   - Download `google-services.json`
   - Save to project root

4. **Enable FCM V1 API:**
   - Go to Project Settings → Cloud Messaging
   - Click "Manage Service Accounts"
   - Create service account or use existing
   - Generate new JSON key
   - Save key file (for server-side sending)

### Step 2: Configure app.json for Android

```json
{
  "expo": {
    "android": {
      "package": "com.yourcompany.yourapp",
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "NOTIFICATIONS",
        "VIBRATE"
      ]
    }
  }
}
```

### Step 3: Build Development Build

```bash
# Build for Android device
eas build --profile development --platform android

# Install on your Android device
# Download .apk and install
```

### Step 4: Test on Physical Android Device

Same code as iOS:

```typescript
import * as Notifications from 'expo-notifications';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request permission
const { status } = await Notifications.requestPermissionsAsync();

// Get token
const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-project-id',
});
console.log('Push Token:', token.data);
```

### Step 5: Notification Channels (Android 8+)

**Required for Android 8.0+:**

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}
```

---

## Code Templates

### useNotifications Hook

See `useNotifications.ts.template` for a complete React hook that handles:
- Permission requests
- Token registration
- Notification listeners
- Background notifications
- Notification tap handling

### Notification Service

See `notificationService.ts.template` for a service layer that handles:
- Sending notifications (server-side)
- Token management
- Notification scheduling
- Deep linking from notifications

---

## Implementation Checklist

### iOS APNS

- [ ] Apple Developer account active ($99/year)
- [ ] App ID created with push enabled
- [ ] APNs key (.p8) downloaded and saved
- [ ] EAS credentials configured
- [ ] Development build installed on physical iPhone
- [ ] Permission requested and granted
- [ ] Expo Push Token obtained
- [ ] Test notification sent and received
- [ ] Background notifications work
- [ ] Notification tap navigates correctly

### Android FCM

- [ ] Firebase project created
- [ ] Android app registered in Firebase
- [ ] `google-services.json` downloaded
- [ ] FCM V1 API enabled (not V0!)
- [ ] app.json configured with googleServicesFile
- [ ] Development build installed on physical Android device
- [ ] Permission requested and granted
- [ ] Expo Push Token obtained
- [ ] Notification channels created (Android 8+)
- [ ] Test notification sent and received
- [ ] Background notifications work
- [ ] Notification tap navigates correctly

---

## Sending Notifications

### From Your Server (Recommended)

**Using Expo Push Service:**

```javascript
// Node.js example
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

const messages = [{
  to: 'ExponentPushToken[YOUR_TOKEN]',
  sound: 'default',
  title: 'New Message',
  body: 'You have a new message!',
  data: { screen: 'Messages', messageId: '123' },
}];

const chunks = expo.chunkPushNotifications(messages);

for (const chunk of chunks) {
  try {
    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    console.log(ticketChunk);
  } catch (error) {
    console.error(error);
  }
}
```

### Using Direct FCM/APNs

**For more control, send directly:**

```typescript
// Get device push token (not Expo token)
const deviceToken = await Notifications.getDevicePushTokenAsync();

// Send to FCM V1 API or APNs directly
// (Requires server-side implementation)
```

**FCM V1 API Example (server-side):**

```javascript
const { google } = require('googleapis');

// Authenticate with service account
const auth = new google.auth.GoogleAuth({
  keyFile: './service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
});

const accessToken = await auth.getAccessToken();

// Send to FCM V1
await fetch(
  `https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        token: deviceToken,
        notification: {
          title: 'Hello',
          body: 'World',
        },
      },
    }),
  }
);
```

---

## Background Notifications

### iOS Background Modes

**Add to app.json:**

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification"
        ]
      }
    }
  }
}
```

### Background Notification Handler

```typescript
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data, error }) => {
    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      const notification = data as any;
      console.log('Background notification:', notification);

      // Handle background notification
      // Update badge, save data, etc.
    }
  }
);

// Register background task
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
```

---

## Notification Tap Handling

### Navigate on Tap

```typescript
import { useEffect, useRef } from 'react';
import { Subscription } from 'expo-modules-core';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

export function useNotificationNavigation() {
  const navigation = useNavigation();
  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  useEffect(() => {
    // Foreground notification received
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

    // Notification tapped
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;

        // Navigate based on notification data
        if (data.screen) {
          navigation.navigate(data.screen as never, data.params as never);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [navigation]);
}
```

---

## Background Processing & Tasks

### Overview

When your app is not in focus (background or killed), you may need to:
- Handle incoming notifications
- Sync data periodically
- Track location in background
- Process background jobs
- Play audio in background

**2026 Best Practices:**
- ✅ Use `expo-task-manager` for background tasks
- ✅ Use `expo-background-fetch` for periodic data sync
- ✅ Use `expo-location` for background location tracking
- ✅ Configure iOS background modes in app.json
- ✅ Handle Android background restrictions (Android 8+)

### Background Notification Handling

Already covered in "Background Notifications" section above. Handles notifications when app is:
- **Foreground:** App is open and visible
- **Background:** App is minimized but running
- **Killed:** App is completely closed

### Background Tasks (General)

**Install dependencies:**
```bash
npm install expo-task-manager expo-background-fetch
```

**Example: Background Data Sync**

```typescript
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_FETCH_TASK = 'background-fetch-task';

// Define task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Fetch new data from server
    const data = await fetchDataFromServer();

    // Save to local storage
    await saveToLocalStorage(data);

    // Update badge count if needed
    await Notifications.setBadgeCountAsync(data.unreadCount);

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register task
async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 15, // 15 minutes (minimum allowed)
    stopOnTerminate: false, // Continue after app is killed
    startOnBoot: true, // Start after device reboot
  });
}
```

### Background Location Tracking

**Install dependency:**
```bash
npm install expo-location
```

**Configure app.json:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["location"],
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location for [reason]",
        "NSLocationWhenInUseUsageDescription": "We need your location when using the app"
      }
    },
    "android": {
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION"
      ]
    }
  }
}
```

**Example: Track location in background**

```typescript
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

// Define task
TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    console.log('Received new locations:', locations);

    // Send to server
    sendLocationsToServer(locations);
  }
});

// Start tracking
async function startBackgroundLocationTracking() {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

  if (foregroundStatus !== 'granted') {
    return;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

  if (backgroundStatus !== 'granted') {
    return;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 60000, // 1 minute
    distanceInterval: 100, // 100 meters
    foregroundService: {
      notificationTitle: 'Location Tracking',
      notificationBody: 'Tracking your location in background',
    },
  });
}
```

### Background Audio Playback

**Install dependency:**
```bash
npm install expo-av
```

**Configure app.json:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["audio"]
      }
    }
  }
}
```

**Example: Play audio in background**

```typescript
import { Audio } from 'expo-av';

async function setupBackgroundAudio() {
  await Audio.setAudioModeAsync({
    staysActiveInBackground: true,
    playsInSilentModeIOS: true,
    shouldDuckAndroid: true,
  });

  const { sound } = await Audio.Sound.createAsync(
    require('./assets/audio.mp3'),
    { shouldPlay: true }
  );

  // Audio continues playing when app is backgrounded
}
```

### iOS Background Modes

**Available background modes for app.json:**

| Mode | Use Case | Configuration |
|------|----------|---------------|
| `remote-notification` | Push notifications | Default for expo-notifications |
| `location` | Background location tracking | Required for location updates |
| `audio` | Background audio playback | Required for music/podcast apps |
| `fetch` | Background data fetch | Periodic data sync |
| `processing` | Background processing tasks | Long-running operations |

**Example app.json:**
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification",
          "location",
          "audio",
          "fetch",
          "processing"
        ]
      }
    }
  }
}
```

### Android Background Restrictions

**Android 8.0+ (API 26):**
- Background execution limits
- Apps can't run in background unless:
  - Visible notification showing
  - Foreground service running
  - High priority push notification received

**Foreground Service (Required for Android):**

```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// Register with foreground service
await BackgroundFetch.registerTaskAsync(TASK_NAME, {
  minimumInterval: 60 * 15,
  stopOnTerminate: false,
  startOnBoot: true,
  // Android-specific
  requiredNetworkType: BackgroundFetch.NetworkType.ANY,
  requiresCharging: false,
  requiresDeviceIdle: false,
  requiresBatteryNotLow: false,
  requiresStorageNotLow: false,
});
```

### Background Processing Best Practices

1. **Request permission appropriately:**
   - Explain WHY you need background access
   - Request after user sees value in your app
   - Provide settings to disable background processing

2. **Respect battery life:**
   - Use minimum interval (15 minutes for background fetch)
   - Don't run CPU-intensive tasks
   - Batch network requests
   - Use efficient data structures

3. **Handle failures gracefully:**
   - Background tasks can be killed by OS
   - Network may not be available
   - Store state to resume later
   - Don't assume task will complete

4. **Test thoroughly:**
   - Test with app in background
   - Test with app killed
   - Test with low battery mode
   - Test with no network connection
   - Test on both iOS and Android

5. **Monitor battery impact:**
   - Use Xcode Energy Organizer (iOS)
   - Use Android Battery Historian
   - Optimize based on real usage data

### Common Background Processing Use Cases

| Use Case | Solution | Notes |
|----------|----------|-------|
| **Sync data periodically** | expo-background-fetch | Minimum 15 min interval |
| **Track location** | expo-location | Requires foreground service (Android) |
| **Handle notifications** | expo-task-manager | Already covered above |
| **Play audio** | expo-av | Requires audio background mode |
| **Download large files** | expo-file-system | Use background download API |
| **Process images/video** | expo-task-manager | May be killed on low memory |
| **Real-time updates** | WebSocket + foreground service | Keep connection alive |

### Debugging Background Tasks

**iOS:**
```bash
# Simulate background fetch
xcrun simctl spawn booted log stream --predicate 'subsystem contains "expo"'

# Trigger background fetch manually (Xcode)
# Debug → Simulate Background Fetch
```

**Android:**
```bash
# Check running services
adb shell dumpsys activity services

# Monitor logcat
adb logcat | grep "TaskManager"

# Simulate background restrictions
adb shell cmd appops set <package> RUN_IN_BACKGROUND ignore
```

### Limitations

**iOS:**
- Background tasks have ~30 seconds to complete
- Background fetch minimum interval: 15 minutes
- OS decides when to wake app (not guaranteed)
- Low power mode disables background activity

**Android:**
- Background execution limits (Android 8+)
- Doze mode delays background tasks
- Battery optimization can kill background tasks
- Requires foreground service for reliable background work

### Alternative: Server-Side Processing

For tasks that don't need to run on device, consider server-side:
- Scheduled jobs (cron, cloud functions)
- Webhooks and event-driven processing
- Push notifications to wake app when needed
- Server handles heavy processing, sends results to app

**Example: Server sends push when data ready**
```typescript
// Server-side (after processing data)
await sendPushNotification({
  to: userToken,
  title: 'Data Ready',
  body: 'Your report is ready to view',
  data: { screen: 'Report', reportId: '123' },
});

// Client-side: App wakes up, downloads data
Notifications.addNotificationResponseReceivedListener((response) => {
  const { reportId } = response.notification.request.content.data;
  downloadAndShowReport(reportId);
});
```

### Resources

- [Expo Background Fetch](https://docs.expo.dev/versions/latest/sdk/background-fetch/)
- [Expo Task Manager](https://docs.expo.dev/versions/latest/sdk/task-manager/)
- [Expo Location](https://docs.expo.dev/versions/latest/sdk/location/)
- [iOS Background Execution](https://developer.apple.com/documentation/backgroundtasks)
- [Android Background Work](https://developer.android.com/guide/background)

---

## Troubleshooting

### iOS Issues

**Problem:** "You do not have permission to send push notifications"
- Solution: Ensure APNs key is uploaded to EAS credentials
- Check Team ID and Key ID are correct

**Problem:** Notifications not received on device
- Solution: Must use physical device (simulator doesn't support push)
- Check device has internet connection
- Verify token is correct Expo Push Token format

**Problem:** "APNs device token not set"
- Solution: Rebuild app with EAS Build (not Expo Go)
- Ensure development build is installed

### Android Issues

**Problem:** "MismatchSenderId" error
- Solution: Using FCM V0 - upgrade to FCM V1 API
- Regenerate `google-services.json` from Firebase

**Problem:** Notifications not appearing
- Solution: Check notification channels created (Android 8+)
- Verify app is not in battery optimization (kills background)

**Problem:** Token registration fails
- Solution: Check `google-services.json` is in project root
- Verify package name matches in app.json and Firebase

### General Issues

**Problem:** "ProjectId missing"
- Solution: Add projectId to app.json: `"extra": { "eas": { "projectId": "..." } }`

**Problem:** Notifications work in foreground but not background
- Solution: Configure background modes (iOS) and notification channels (Android)
- Check battery optimization settings

---

## Best Practices

### Token Management

- **Store tokens server-side** mapped to user ID
- **Refresh tokens periodically** (they can change)
- **Remove tokens on logout** to avoid sending to wrong user
- **Handle token expiration** gracefully

### Notification Content

- **Keep titles short** (max 40 characters)
- **Body text clear and actionable** (max 150 characters)
- **Include relevant data** for deep linking
- **Use appropriate priority** (normal vs high)

### User Experience

- **Request permission at appropriate time** (not on app launch)
- **Explain why** notifications are useful before requesting
- **Provide settings** to customize notification types
- **Respect user preferences** (quiet hours, frequency)

### Testing

- **Test on physical devices** (both iOS and Android)
- **Test all states**: foreground, background, killed
- **Test notification tap** navigation
- **Test with poor network** conditions
- **Test permission denied** scenarios

---

## Resources

### Official Documentation
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Push Notifications Setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Sending Notifications](https://docs.expo.dev/push-notifications/sending-notifications/)

### Firebase
- [Firebase Console](https://console.firebase.google.com/)
- [FCM V1 API](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

### Apple
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)
- [APNs Key](https://developer.apple.com/account/resources/authkeys/list)

### Tools
- [Expo Push Tool](https://expo.dev/notifications)
- [expo-server-sdk](https://github.com/expo/expo-server-sdk-node)

---

## Summary

**iOS Setup:**
1. Apple Developer account + APNs key
2. EAS credentials configured
3. Development build on physical iPhone
4. Request permission + get Expo Push Token
5. Send test notification

**Android Setup:**
1. Firebase project + google-services.json
2. FCM V1 API enabled
3. Development build on physical Android device
4. Create notification channels (Android 8+)
5. Request permission + get Expo Push Token
6. Send test notification

**Remember:**
- Physical devices required (not simulators/emulators)
- Development builds required (not Expo Go)
- FCM V1 API required (not V0)
- Test foreground, background, and killed states

