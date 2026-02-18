# Push Notifications Quick Start

Get push notifications running in 15 minutes.

## 1. Install Dependencies (2 min)

```bash
npx expo install expo-notifications expo-device expo-constants
```

## 2. Copy Files (1 min)

Copy these files to your project:

```
src/features/push-notifications/
├── PushNotificationsContext.tsx
├── notificationService.ts
├── types.ts
└── index.ts
```

## 3. Database Setup (3 min)

Run the SQL migration in Supabase Dashboard → SQL Editor:

```bash
# Copy and paste database-schema.sql
```

Or using Supabase CLI:

```bash
supabase db push
```

## 4. Deploy Edge Function (3 min)

```bash
# Navigate to Supabase functions directory
cd supabase/functions

# Create function
mkdir send-notification

# Copy the function file
cp .examples/edge-functions/send-notification/index.ts ./send-notification/

# Deploy
supabase functions deploy send-notification
```

Set environment variables in Supabase Dashboard → Edge Functions:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

## 5. Configure App (3 min)

### app.json / app.config.js

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "extra": {
      "projectId": "your-expo-project-id"
    }
  }
}
```

### App.tsx

```typescript
import { PushNotificationsProvider } from '@/features/push-notifications';

export default function App() {
  return (
    <PushNotificationsProvider
      autoRegister={true}
      onNotificationTapped={(response) => {
        const deepLink = response.notification.request.content.data?.deepLink;
        if (deepLink) {
          // Navigate to screen
          // navigation.navigate(deepLink.screen, deepLink.params);
        }
      }}
    >
      {/* Your app */}
    </PushNotificationsProvider>
  );
}
```

## 6. Request Permissions (3 min)

### Settings Screen

```typescript
import { usePushNotifications } from '@/features/push-notifications';

function SettingsScreen() {
  const { requestPermissions, registerPushToken, isRegistered } = usePushNotifications();

  const handleEnable = async () => {
    const status = await requestPermissions();
    if (status === 'granted') {
      await registerPushToken();
    }
  };

  return (
    <View>
      {!isRegistered && (
        <Button title="Enable Notifications" onPress={handleEnable} />
      )}
    </View>
  );
}
```

## 7. Send Test Notification

### From Code

```typescript
import { sendNotification } from '@/features/push-notifications';

await sendNotification({
  userId: 'user-uuid',
  notification: {
    title: 'Hello!',
    body: 'Your first push notification',
  },
});
```

### From Terminal

```bash
# Get your push token from device logs
# Then test with Expo tool:
npx expo-push-tool ExponentPushToken[YOUR_TOKEN]
```

## 8. Test on Device

**Important:** Push notifications only work on physical devices, not simulators.

1. Build development build:
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

2. Enable notifications in app

3. Send test notification

4. Verify it appears!

## Common Issues

### "Push token undefined"
- Make sure you set `projectId` in app.config.js
- Use physical device, not simulator

### "Permission denied"
- iOS: Check Settings → [App] → Notifications
- Android: Check Settings → Apps → [App] → Notifications

### "Notification not received"
- Check Edge Function logs in Supabase Dashboard
- Verify token exists in `push_tokens` table
- Check device is online

## Next Steps

- [ ] Set up notification categories (iOS action buttons)
- [ ] Configure Android notification channels
- [ ] Implement deep linking
- [ ] Add notification templates
- [ ] Set up notification preferences

See full [README.md](./README.md) for complete documentation.

## Templates

Use pre-built templates:

```typescript
import {
  welcomeNotification,
  newMessageNotification,
  taskAssignedNotification,
} from '@/features/push-notifications/notificationTemplates';

// Send welcome notification
await sendNotification(welcomeNotification(userId));

// Send message notification
await sendNotification(
  newMessageNotification(userId, 'John', 'Hey there!', 'conv-123')
);
```

## Testing

```typescript
import { sendTestNotificationNow } from '@/features/push-notifications/testing-utils';

// Send test notification immediately
await sendTestNotificationNow({
  title: 'Test',
  body: 'Hello World',
});
```

## Support

- [Full Documentation](./README.md)
- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Troubleshooting Guide](./README.md#troubleshooting)
