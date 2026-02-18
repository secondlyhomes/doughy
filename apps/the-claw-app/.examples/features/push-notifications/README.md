# Push Notifications Implementation Guide

Complete push notifications system using Expo Notifications and Supabase.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Database Setup](#database-setup)
5. [Edge Function Setup](#edge-function-setup)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [Permission Handling](#permission-handling)
9. [Deep Linking](#deep-linking)
10. [Scheduling](#scheduling)
11. [Rich Notifications](#rich-notifications)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)

## Overview

This implementation provides:

- **Push token registration** - Automatic token management with Supabase
- **Permission handling** - iOS/Android permission requests
- **Remote notifications** - Send via Expo Push API
- **Local notifications** - Schedule device-local notifications
- **Deep linking** - Navigate to specific screens on tap
- **Badge management** - Update app icon badge count
- **Rich notifications** - Images, actions, categories
- **Notification history** - Track sent/delivered/read status

## Prerequisites

- Expo SDK 50+ (with `expo-notifications`)
- Supabase project
- Physical device (push notifications don't work in simulator)
- Expo account and project ID

## Installation

### 1. Install Dependencies

```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2. Copy Implementation Files

Copy these files to your project:

```
src/
├── features/
│   └── push-notifications/
│       ├── PushNotificationsContext.tsx
│       ├── notificationService.ts
│       └── types.ts
```

### 3. Configure app.json

```json
{
  "expo": {
    "name": "Your App",
    "slug": "your-app",
    "version": "1.0.0",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"],
          "mode": "production",
          "androidMode": "default",
          "iosDisplayInForeground": true
        }
      ]
    ],
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.RECEIVE_BOOT_COMPLETED"
      ]
    }
  }
}
```

## Database Setup

### 1. Run SQL Migration

Execute the SQL in `database-schema.sql`:

```bash
# Using Supabase CLI
supabase db push

# Or paste into SQL Editor in Supabase Dashboard
```

This creates:
- `push_tokens` - Stores user device tokens
- `notifications` - Logs notification history
- `scheduled_notifications` - Tracks scheduled notifications
- RLS policies for security
- Helper functions for maintenance

### 2. Verify Tables

Check in Supabase Dashboard → Table Editor:
- ✅ `push_tokens` exists
- ✅ `notifications` exists
- ✅ `scheduled_notifications` exists
- ✅ RLS is enabled on all tables

## Edge Function Setup

### 1. Deploy Edge Function

```bash
# Navigate to your Supabase project
cd supabase/functions

# Create function directory
mkdir send-notification

# Copy the Edge Function file
cp .examples/edge-functions/send-notification/index.ts ./send-notification/

# Deploy
supabase functions deploy send-notification
```

### 2. Set Environment Variables

In Supabase Dashboard → Edge Functions → Configuration:

```bash
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Test Edge Function

```bash
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/send-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"message":{"to":"ExponentPushToken[xxx]","title":"Test","body":"Hello World"}}'
```

## Configuration

### 1. Environment Variables

Create `.env` or `app.config.js`:

```typescript
// app.config.js
export default {
  expo: {
    // ... other config
    extra: {
      projectId: 'your-expo-project-id',
    },
  },
};
```

### 2. Setup Context Provider

Wrap your app in `PushNotificationsProvider`:

```typescript
// App.tsx
import { PushNotificationsProvider } from '@/features/push-notifications/PushNotificationsContext';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <PushNotificationsProvider
      autoRegister={true}
      onNotificationReceived={(notification) => {
        console.log('Notification received:', notification);
      }}
      onNotificationTapped={(response) => {
        console.log('Notification tapped:', response);
        // Handle navigation
      }}
    >
      <NavigationContainer>
        {/* Your app */}
      </NavigationContainer>
    </PushNotificationsProvider>
  );
}
```

## Usage

### Basic Implementation

```typescript
import { usePushNotifications } from '@/features/push-notifications/PushNotificationsContext';
import { sendNotification } from '@/features/push-notifications/notificationService';

function SettingsScreen() {
  const {
    permissionStatus,
    isRegistered,
    requestPermissions,
    registerPushToken,
  } = usePushNotifications();

  const handleEnableNotifications = async () => {
    // Request permissions
    const status = await requestPermissions();

    if (status === 'granted') {
      // Register push token
      await registerPushToken();
      console.log('Notifications enabled!');
    } else {
      console.log('Permission denied');
    }
  };

  return (
    <View>
      <Text>Permission: {permissionStatus}</Text>
      <Text>Registered: {isRegistered ? 'Yes' : 'No'}</Text>
      {!isRegistered && (
        <Button title="Enable Notifications" onPress={handleEnableNotifications} />
      )}
    </View>
  );
}
```

### Sending Notifications

```typescript
import { sendNotification } from '@/features/push-notifications/notificationService';

// Send to single user
await sendNotification({
  userId: 'user-uuid',
  notification: {
    title: 'New Message',
    body: 'You have a new message from John',
    data: {
      type: 'message',
      messageId: '123',
      deepLink: {
        screen: 'MessageDetail',
        params: { id: '123' },
      },
    },
    badge: 1,
  },
});

// Send to multiple users
await sendBatchNotifications({
  userIds: ['user-1', 'user-2', 'user-3'],
  notification: {
    title: 'System Update',
    body: 'New features are now available!',
    priority: 'high',
  },
});
```

## Permission Handling

### iOS Permission Flow

```typescript
import { usePushNotifications } from '@/features/push-notifications/PushNotificationsContext';
import { Alert, Linking } from 'react-native';

function NotificationSettings() {
  const { permissionStatus, requestPermissions } = usePushNotifications();

  const handleRequestPermissions = async () => {
    const status = await requestPermissions();

    if (status === 'denied') {
      Alert.alert(
        'Notifications Disabled',
        'To enable notifications, please go to Settings > Notifications and allow notifications for this app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  return (
    <View>
      {permissionStatus === 'undetermined' && (
        <Button title="Enable Notifications" onPress={handleRequestPermissions} />
      )}
      {permissionStatus === 'denied' && (
        <Button title="Open Settings" onPress={() => Linking.openSettings()} />
      )}
      {permissionStatus === 'granted' && (
        <Text>Notifications enabled ✓</Text>
      )}
    </View>
  );
}
```

### Android 13+ Permission

Android 13+ requires runtime permission:

```typescript
// Automatically handled by expo-notifications
// Make sure you have the permission in AndroidManifest.xml
// (already configured in app.json above)
```

## Deep Linking

### Configure Navigation

```typescript
// App.tsx
import { usePushNotifications } from '@/features/push-notifications/PushNotificationsContext';
import { useNavigation } from '@react-navigation/native';

function App() {
  const navigation = useNavigation();

  const handleNotificationTapped = (response) => {
    const deepLink = response.notification.request.content.data?.deepLink;

    if (deepLink) {
      navigation.navigate(deepLink.screen, deepLink.params);
    }
  };

  return (
    <PushNotificationsProvider onNotificationTapped={handleNotificationTapped}>
      {/* Your app */}
    </PushNotificationsProvider>
  );
}
```

### Send with Deep Link

```typescript
await sendNotification({
  userId: 'user-uuid',
  notification: {
    title: 'Task Completed',
    body: 'Your task "Design Review" is complete',
    data: {
      type: 'task',
      id: 'task-123',
      deepLink: {
        screen: 'TaskDetail',
        params: { taskId: 'task-123' },
      },
    },
  },
});
```

## Scheduling

### Schedule Local Notification

```typescript
import { usePushNotifications } from '@/features/push-notifications/PushNotificationsContext';

function ReminderScreen() {
  const { scheduleNotification } = usePushNotifications();

  const scheduleReminder = async () => {
    // Schedule for specific date/time
    const identifier = await scheduleNotification({
      notification: {
        title: 'Meeting Reminder',
        body: 'Team standup in 5 minutes',
        sound: true,
      },
      trigger: {
        type: 'time',
        date: new Date(Date.now() + 60 * 1000), // 1 minute from now
      },
    });

    console.log('Scheduled:', identifier);
  };

  const scheduleDailyReminder = async () => {
    // Daily at 9:00 AM
    await scheduleNotification({
      notification: {
        title: 'Daily Reminder',
        body: 'Time to check your tasks!',
      },
      trigger: {
        type: 'daily',
        hour: 9,
        minute: 0,
      },
    });
  };

  const scheduleWeeklyReminder = async () => {
    // Every Monday at 10:00 AM
    await scheduleNotification({
      notification: {
        title: 'Weekly Planning',
        body: 'Plan your week ahead',
      },
      trigger: {
        type: 'weekly',
        weekday: 1, // 1 = Monday
        hour: 10,
        minute: 0,
      },
    });
  };

  return (
    <View>
      <Button title="Schedule 1-min Reminder" onPress={scheduleReminder} />
      <Button title="Schedule Daily 9 AM" onPress={scheduleDailyReminder} />
      <Button title="Schedule Weekly Monday 10 AM" onPress={scheduleWeeklyReminder} />
    </View>
  );
}
```

### Cancel Scheduled Notifications

```typescript
const { cancelScheduledNotification, cancelAllScheduledNotifications } =
  usePushNotifications();

// Cancel specific notification
await cancelScheduledNotification('notification-identifier');

// Cancel all scheduled notifications
await cancelAllScheduledNotifications();
```

## Rich Notifications

### With Images

```typescript
await sendNotification({
  userId: 'user-uuid',
  notification: {
    title: 'New Photo',
    body: 'John shared a photo with you',
    attachments: [
      {
        url: 'https://example.com/photo.jpg',
        type: 'image',
      },
    ],
    data: {
      type: 'photo',
      photoId: '123',
    },
  },
});
```

### With Action Buttons (iOS)

```typescript
// Action buttons are configured in PushNotificationsContext.tsx
// Categories: message, task, social, reminder

await sendNotification({
  userId: 'user-uuid',
  notification: {
    title: 'New Message',
    body: 'John: Hey, are you free for lunch?',
    categoryId: 'message', // Shows Reply and View buttons
    data: {
      type: 'message',
      conversationId: '123',
    },
  },
});
```

### Handle Action Button Taps

```typescript
const handleNotificationTapped = (response) => {
  const { actionIdentifier, userText } = response;

  switch (actionIdentifier) {
    case 'reply':
      // User tapped Reply and typed a message
      console.log('Reply with text:', userText);
      break;

    case 'complete':
      // User tapped Complete (for task notifications)
      console.log('Mark task as complete');
      break;

    case 'like':
      // User tapped Like (for social notifications)
      console.log('Like post');
      break;

    default:
      // User tapped the notification itself
      console.log('Notification tapped');
  }
};
```

## Testing

### Test Local Notifications

```typescript
// TestScreen.tsx
import { usePushNotifications } from '@/features/push-notifications/PushNotificationsContext';
import { Button, View } from 'react-native';

function TestScreen() {
  const { scheduleNotification } = usePushNotifications();

  const testNotification = async () => {
    await scheduleNotification({
      notification: {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: { test: true },
      },
      trigger: {
        type: 'timeInterval',
        seconds: 5, // 5 seconds from now
      },
    });
  };

  return (
    <View>
      <Button title="Test Notification (5s)" onPress={testNotification} />
    </View>
  );
}
```

### Test Remote Notifications

```bash
# Install Expo CLI tool
npm install -g expo-cli

# Send test notification
npx expo-push-tool ExponentPushToken[YOUR_TOKEN]
```

### Test with cURL

```bash
curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "ExponentPushToken[YOUR_TOKEN]",
  "title":"Hello",
  "body": "World",
  "data": {"test": true}
}'
```

### Debug Mode

```typescript
// Enable detailed logging
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Notification received:', JSON.stringify(notification, null, 2));
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

// Log all notification events
Notifications.addNotificationReceivedListener((notification) => {
  console.log('RECEIVED:', notification);
});

Notifications.addNotificationResponseReceivedListener((response) => {
  console.log('TAPPED:', response);
});
```

## Troubleshooting

### Notifications Not Received

**Problem:** Push notifications not arriving on device

**Solutions:**

1. **Check token registration:**
   ```typescript
   const { expoPushToken, isRegistered } = usePushNotifications();
   console.log('Token:', expoPushToken);
   console.log('Registered:', isRegistered);
   ```

2. **Verify database:**
   ```sql
   SELECT * FROM push_tokens WHERE status = 'active';
   ```

3. **Check Edge Function logs:**
   - Supabase Dashboard → Edge Functions → Logs

4. **Test with Expo tool:**
   ```bash
   npx expo-push-tool YOUR_TOKEN
   ```

### Permission Always Denied

**Problem:** Permission request immediately returns denied

**Solutions:**

1. **iOS:** User previously denied - must enable in Settings
2. **Android 13+:** Check `AndroidManifest.xml` has permission
3. **Simulator:** Won't work - use physical device

### Deep Links Not Working

**Problem:** Tapping notification doesn't navigate

**Solutions:**

1. **Check data payload:**
   ```typescript
   onNotificationTapped={(response) => {
     console.log('Data:', response.notification.request.content.data);
   }}
   ```

2. **Verify navigation setup:**
   ```typescript
   const deepLink = response.notification.request.content.data?.deepLink;
   if (deepLink) {
     navigation.navigate(deepLink.screen, deepLink.params);
   }
   ```

### Scheduled Notifications Not Firing

**Problem:** Scheduled notifications don't appear

**Solutions:**

1. **Check if scheduled:**
   ```typescript
   import * as Notifications from 'expo-notifications';
   const scheduled = await Notifications.getAllScheduledNotificationsAsync();
   console.log('Scheduled:', scheduled);
   ```

2. **Verify trigger:**
   ```typescript
   // Make sure date is in the future
   const futureDate = new Date(Date.now() + 60000); // 1 minute
   ```

3. **iOS background refresh:**
   - Settings → General → Background App Refresh → ON

### Badge Not Updating

**Problem:** App icon badge doesn't show count

**Solutions:**

1. **Check permission:**
   ```typescript
   const { ios } = await Notifications.getPermissionsAsync();
   console.log('Badge allowed:', ios?.allowsBadge);
   ```

2. **Set badge explicitly:**
   ```typescript
   const { setBadgeCount } = usePushNotifications();
   await setBadgeCount(5);
   ```

3. **iOS:** Badge permission must be granted

### Token Registration Fails

**Problem:** registerPushToken() throws error

**Solutions:**

1. **Check Expo project ID:**
   ```typescript
   // app.config.js
   export default {
     expo: {
       extra: {
         projectId: 'your-expo-project-id', // Required!
       },
     },
   };
   ```

2. **Verify Supabase connection:**
   ```typescript
   const { data, error } = await supabase.auth.getUser();
   console.log('User:', data.user);
   ```

3. **Check RLS policies:**
   ```sql
   SELECT * FROM push_tokens; -- Should work for authenticated user
   ```

## Best Practices

1. **Always check permissions before registering:**
   ```typescript
   const status = await requestPermissions();
   if (status === 'granted') {
     await registerPushToken();
   }
   ```

2. **Handle permission denied gracefully:**
   - Show explanation before requesting
   - Provide link to settings if denied

3. **Use categories for actionable notifications:**
   - Messages → Reply button
   - Tasks → Complete button
   - Social → Like button

4. **Include deep link data:**
   - Always include enough data to navigate
   - Test deep links thoroughly

5. **Monitor delivery:**
   - Check notification logs in database
   - Track read/delivered status

6. **Clean up expired tokens:**
   - Run cleanup function periodically
   - Remove inactive tokens after 90 days

7. **Test on physical devices:**
   - Simulators don't support push notifications
   - Test both iOS and Android

8. **Rate limit notifications:**
   - Don't spam users
   - Respect quiet hours
   - Allow users to configure preferences

## Next Steps

- [ ] Add notification preferences UI
- [ ] Implement quiet hours
- [ ] Add notification categories/filtering
- [ ] Set up receipt checking for delivery confirmation
- [ ] Add analytics tracking
- [ ] Implement notification sounds/vibration patterns
- [ ] Add notification grouping (Android)
- [ ] Set up automated testing

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/)
