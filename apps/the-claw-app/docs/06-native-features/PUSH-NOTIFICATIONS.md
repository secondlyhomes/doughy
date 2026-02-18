# Push Notifications Guide

> Setting up push notifications with Expo and Supabase.

## Overview

Push notification architecture:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Your App      │────▶│   Expo Push     │────▶│   APNs / FCM    │
│  (Get token,    │     │   Service       │     │   (Apple/Google │
│   send to API)  │     │                 │     │    servers)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────┐                           ┌─────────────────┐
│   Supabase      │                           │   User Device   │
│  (Store token,  │                           │  (Notification  │
│   send notifs)  │                           │   displayed)    │
└─────────────────┘                           └─────────────────┘
```

## Setup

### Install Dependencies

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Configure app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/sounds/notification.wav"]
        }
      ]
    ],
    "android": {
      "useNextNotificationsApi": true
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    }
  }
}
```

### iOS: Configure APNs

1. Apple Developer Portal → Certificates, Identifiers & Profiles
2. Keys → Create new key → Enable "Apple Push Notifications service (APNs)"
3. Download .p8 file
4. In Expo dashboard (expo.dev):
   - Project Settings → Credentials → iOS
   - Upload APNs Key

### Android: Configure FCM

1. Firebase Console → Project Settings → Cloud Messaging
2. Create Android app with your package name
3. Download `google-services.json`
4. Place in project root
5. In Expo dashboard:
   - Project Settings → Credentials → Android
   - Upload FCM Server Key

## Implementation

### Request Permission

```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  // Android: Create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return true;
}
```

### Get Push Token

```typescript
// src/services/notifications.ts
import Constants from 'expo-constants';

export async function getPushToken(): Promise<string | null> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    return token.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}
```

### Store Token in Supabase

```sql
-- Migration: Create push tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL, -- 'ios' | 'android'
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);
```

```typescript
// src/services/notifications.ts
import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export async function registerPushToken(userId: string): Promise<void> {
  const token = await getPushToken();
  if (!token) return;

  await supabase.from('push_tokens').upsert({
    user_id: userId,
    token,
    platform: Platform.OS,
    device_name: Device.deviceName,
    last_used_at: new Date().toISOString(),
  }, {
    onConflict: 'user_id,token',
  });
}

export async function unregisterPushToken(userId: string): Promise<void> {
  const token = await getPushToken();
  if (!token) return;

  await supabase
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token);
}
```

### Handle Notifications

```typescript
// src/hooks/useNotifications.ts
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

export function useNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Handle notification received while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
        // You can show an in-app alert here
      });

    // Handle notification tap (app was backgrounded or closed)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        // Navigate based on notification data
        if (data.screen) {
          router.push(data.screen as string);
        }
        if (data.taskId) {
          router.push(`/tasks/${data.taskId}`);
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);
}
```

### App Integration

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { registerPushToken } from '@/services/notifications';
import { useAuth } from '@/contexts/AuthContext';

export default function RootLayout() {
  const { user } = useAuth();

  // Set up notification listeners
  useNotifications();

  // Register token when user logs in
  useEffect(() => {
    if (user) {
      registerPushToken(user.id);
    }
  }, [user]);

  return (/* ... */);
}
```

## Sending Notifications

### From Supabase Edge Function

```typescript
// supabase/functions/send-notification/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

Deno.serve(async (req) => {
  const { userId, title, body, data } = await req.json() as NotificationPayload;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get user's push tokens
  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId);

  if (error || !tokens?.length) {
    return new Response(JSON.stringify({ error: 'No tokens found' }), {
      status: 404,
    });
  }

  // Send via Expo Push API
  const messages = tokens.map((t) => ({
    to: t.token,
    title,
    body,
    data,
    sound: 'default',
    badge: 1,
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();

  return new Response(JSON.stringify(result));
});
```

### Trigger from Database Changes

```typescript
// supabase/functions/task-notification-trigger/index.ts
// This can be called by a Supabase webhook on task insert

Deno.serve(async (req) => {
  const { record, old_record } = await req.json();

  // New task assigned
  if (record && !old_record) {
    await sendNotification({
      userId: record.assigned_to,
      title: 'New Task Assigned',
      body: record.title,
      data: { taskId: record.id, screen: '/tasks' },
    });
  }

  // Task completed
  if (record?.completed && !old_record?.completed) {
    await sendNotification({
      userId: record.created_by,
      title: 'Task Completed',
      body: `"${record.title}" has been completed`,
      data: { taskId: record.id },
    });
  }

  return new Response('OK');
});
```

## Local Notifications

For reminders and scheduled notifications:

```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';

export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  dueDate: Date
): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Due Soon',
      body: title,
      data: { taskId, screen: '/tasks' },
      sound: true,
    },
    trigger: {
      date: new Date(dueDate.getTime() - 30 * 60 * 1000), // 30 min before
    },
  });

  return identifier;
}

export async function cancelTaskReminder(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
```

## Notification Settings Screen

```typescript
// src/screens/notification-settings-screen.tsx
import { useState, useEffect } from 'react';
import { View, Switch, Text } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Linking } from 'react-native';

export function NotificationSettingsScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [settings, setSettings] = useState({
    taskReminders: true,
    dailyDigest: true,
    marketing: false,
  });

  useEffect(() => {
    checkPermission();
  }, []);

  async function checkPermission() {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  }

  async function requestPermission() {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);

    if (!granted) {
      // Guide user to settings
      Alert.alert(
        'Notifications Disabled',
        'Please enable notifications in Settings to receive updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text>Push Notifications</Text>
        <Switch
          value={hasPermission}
          onValueChange={(value) => {
            if (value) requestPermission();
            else Linking.openSettings();
          }}
        />
      </View>

      {hasPermission && (
        <>
          <View style={styles.row}>
            <Text>Task Reminders</Text>
            <Switch
              value={settings.taskReminders}
              onValueChange={(value) =>
                setSettings((s) => ({ ...s, taskReminders: value }))
              }
            />
          </View>

          <View style={styles.row}>
            <Text>Daily Digest</Text>
            <Switch
              value={settings.dailyDigest}
              onValueChange={(value) =>
                setSettings((s) => ({ ...s, dailyDigest: value }))
              }
            />
          </View>
        </>
      )}
    </View>
  );
}
```

## Badge Management

```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// Call when app comes to foreground
export async function updateBadgeFromServer(userId: string): Promise<void> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  await setBadgeCount(count ?? 0);
}
```

## Testing

### Development

```typescript
// Test local notification
async function testNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'This is a test!',
    },
    trigger: { seconds: 2 },
  });
}
```

### Production Testing

1. Use Expo's push notification tool: https://expo.dev/notifications
2. Enter push token and send test notification

## Troubleshooting

### "Notifications not received"

1. Check device is physical (not simulator for iOS)
2. Verify push token is valid and saved
3. Check APNs/FCM credentials in Expo dashboard
4. Ensure app has notification permissions
5. Check notification settings on device

### "Token is undefined"

1. Ensure `projectId` is set correctly
2. Check EAS project is linked: `eas project:init`
3. Verify device is not simulator

### "Notifications not tapping through"

1. Ensure data payload includes navigation info
2. Verify notification response listener is set up
3. Check app routing handles the deep link

## Checklist

- [ ] expo-notifications installed
- [ ] APNs key uploaded to Expo dashboard (iOS)
- [ ] FCM key uploaded to Expo dashboard (Android)
- [ ] Android notification channel configured
- [ ] Permission request flow implemented
- [ ] Push token stored in database
- [ ] Token removed on logout
- [ ] Foreground notification handler
- [ ] Notification tap handler with navigation
- [ ] Server-side sending function
- [ ] Local notifications for reminders
- [ ] Notification settings screen
- [ ] Badge count management
- [ ] Tested on physical devices

## Related Docs

- [Permissions Handling](./PERMISSIONS-HANDLING.md) - Permission patterns
- [Supabase Setup](../03-database/SUPABASE-SETUP.md) - Database configuration
- [Auth Setup](../04-authentication/AUTH-SETUP.md) - User authentication
