# Push Notifications Edge Function

Send push notifications via Expo Push Service with support for single/batch sending, scheduling, and receipt tracking.

## Features

- **Single & batch sending** - Send to one user or thousands
- **Scheduled notifications** - Send at a specific time
- **Platform-specific** - iOS (APNs) and Android (FCM) support
- **Receipt tracking** - Track delivery status
- **Error handling** - Graceful handling of invalid tokens
- **Logging** - Track all sent notifications

## Setup

### 1. Create Database Tables

```sql
-- Push tokens table (stores user device tokens)
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Notification logs (track sent notifications)
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  status TEXT NOT NULL, -- 'ok' | 'error'
  push_ticket_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Scheduled notifications
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_ids UUID[], -- For batch notifications
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  sound TEXT,
  badge INT,
  priority TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own notification logs"
  ON notification_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users view own scheduled notifications"
  ON scheduled_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access to tokens"
  ON push_tokens FOR ALL
  WITH CHECK (true);

CREATE POLICY "Service role full access to logs"
  ON notification_logs FOR ALL
  WITH CHECK (true);

CREATE POLICY "Service role full access to scheduled"
  ON scheduled_notifications FOR ALL
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_push_tokens_user ON push_tokens(user_id);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id, sent_at DESC);
CREATE INDEX idx_scheduled_notifications_time ON scheduled_notifications(scheduled_for) WHERE status = 'pending';
```

### 2. Deploy Edge Function

```bash
supabase functions deploy notifications
```

### 3. Configure Expo Push Notifications

Follow the [Push Notifications Guide](../../../docs/06-native-features/PUSH-NOTIFICATIONS.md) to:
- Set up APNs keys (iOS)
- Set up FCM keys (Android)
- Register push tokens in your app

## Usage

### Send Single Notification

```typescript
// src/services/notificationService.ts
import { supabase } from './supabase';

export async function sendNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const { data: result, error } = await supabase.functions.invoke('notifications', {
    body: {
      userId,
      title,
      body,
      data,
      sound: 'default',
      badge: 1,
    },
  });

  if (error) throw error;
  return result;
}

// Usage
await sendNotification(
  'user-uuid',
  'New Message',
  'You have a new message from John',
  { screen: '/messages', messageId: '123' }
);
```

### Send Batch Notifications

```typescript
// Send to multiple users at once
export async function sendBatchNotification(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const { data: result, error } = await supabase.functions.invoke('notifications', {
    body: {
      userIds,
      title,
      body,
      data,
    },
  });

  if (error) throw error;
  return result;
}

// Usage - send to all team members
await sendBatchNotification(
  ['user-1', 'user-2', 'user-3'],
  'Team Update',
  'New project assigned to your team'
);
```

### Schedule Notification

```typescript
// Send notification at a specific time
export async function scheduleNotification(
  userId: string,
  title: string,
  body: string,
  scheduledTime: Date,
  data?: Record<string, any>
) {
  const { data: result, error } = await supabase.functions.invoke('notifications', {
    body: {
      userId,
      title,
      body,
      data,
      scheduledTime: scheduledTime.toISOString(),
    },
  });

  if (error) throw error;
  return result;
}

// Usage - send reminder 30 minutes before event
const eventTime = new Date('2024-01-15T14:00:00');
const reminderTime = new Date(eventTime.getTime() - 30 * 60 * 1000);

await scheduleNotification(
  'user-uuid',
  'Event Reminder',
  'Your meeting starts in 30 minutes',
  reminderTime,
  { screen: '/calendar', eventId: '456' }
);
```

### Platform-Specific Options

```typescript
// iOS-specific
await sendNotification('user-uuid', 'Title', 'Body', {
  categoryId: 'message', // iOS notification category
  sound: 'custom-sound.wav', // Custom sound file
  badge: 5, // Badge count
});

// Android-specific
await sendNotification('user-uuid', 'Title', 'Body', {
  channelId: 'high-priority', // Android notification channel
  priority: 'high', // 'default' | 'normal' | 'high'
});
```

## Scheduled Notifications Processor

Create a cron job to process scheduled notifications:

```typescript
// supabase/functions/process-scheduled-notifications/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get pending notifications that should be sent
  const { data: pending, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .limit(100);

  if (error || !pending || pending.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }));
  }

  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    try {
      // Send via notifications function
      await supabase.functions.invoke('notifications', {
        body: {
          userId: notification.user_id,
          userIds: notification.user_ids,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: notification.sound,
          badge: notification.badge,
          priority: notification.priority,
        },
      });

      // Mark as sent
      await supabase
        .from('scheduled_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', notification.id);

      sent++;
    } catch (error) {
      console.error('Failed to send notification:', error);

      // Mark as failed
      await supabase
        .from('scheduled_notifications')
        .update({ status: 'failed' })
        .eq('id', notification.id);

      failed++;
    }
  }

  return new Response(
    JSON.stringify({
      processed: pending.length,
      sent,
      failed,
    })
  );
});
```

**Set up cron job (Supabase Dashboard → Edge Functions → Crons):**

```
# Run every minute
* * * * * process-scheduled-notifications
```

## Database Triggers

Automatically send notifications on database changes:

```sql
-- Function to send notification on new task assignment
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function via pg_net extension
  PERFORM net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'userId', NEW.assigned_to,
      'title', 'New Task Assigned',
      'body', NEW.title,
      'data', jsonb_build_object(
        'taskId', NEW.id,
        'screen', '/tasks'
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on task insert
CREATE TRIGGER trigger_task_assigned
  AFTER INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION notify_task_assigned();
```

## Receipt Tracking

Track notification delivery status:

```typescript
// supabase/functions/check-receipts/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

const EXPO_RECEIPT_URL = 'https://exp.host/--/api/v2/push/getReceipts';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get notifications with ticket IDs but no receipt
  const { data: notifications } = await supabase
    .from('notification_logs')
    .select('id, push_ticket_id')
    .not('push_ticket_id', 'is', null)
    .is('delivery_status', null)
    .limit(100);

  if (!notifications || notifications.length === 0) {
    return new Response(JSON.stringify({ checked: 0 }));
  }

  const ticketIds = notifications.map((n) => n.push_ticket_id);

  // Fetch receipts from Expo
  const response = await fetch(EXPO_RECEIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: ticketIds }),
  });

  const { data: receipts } = await response.json();

  // Update delivery status
  for (const notification of notifications) {
    const receipt = receipts[notification.push_ticket_id];
    if (receipt) {
      await supabase
        .from('notification_logs')
        .update({
          delivery_status: receipt.status,
          delivery_error: receipt.message,
        })
        .eq('id', notification.id);
    }
  }

  return new Response(
    JSON.stringify({
      checked: notifications.length,
    })
  );
});
```

## Testing

### Local Testing

```bash
# Start Edge Function locally
supabase functions serve notifications

# Test with curl
curl -X POST http://localhost:54321/functions/v1/notifications \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid",
    "title": "Test Notification",
    "body": "This is a test",
    "data": {"test": true}
  }'
```

### Test Push Tokens

Use Expo's push notification tool:
1. Go to https://expo.dev/notifications
2. Enter your push token
3. Send test notification

### Mock Push Tokens

For development, insert test tokens:

```sql
INSERT INTO push_tokens (user_id, token, platform, device_name)
VALUES (
  'your-user-id',
  'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  'ios',
  'Test Device'
);
```

## Monitoring

### View Notification Stats

```sql
-- Daily notification count
SELECT
  DATE(sent_at) as date,
  status,
  COUNT(*) as count
FROM notification_logs
WHERE sent_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at), status
ORDER BY date DESC;

-- Failed notifications
SELECT
  user_id,
  title,
  error_message,
  sent_at
FROM notification_logs
WHERE status = 'error'
ORDER BY sent_at DESC
LIMIT 50;

-- Top users by notification count
SELECT
  user_id,
  COUNT(*) as notification_count
FROM notification_logs
WHERE sent_at >= NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY notification_count DESC
LIMIT 10;
```

### Clean Up Old Tokens

Remove expired or invalid tokens:

```sql
-- Remove tokens not used in 90 days
DELETE FROM push_tokens
WHERE last_used_at < NOW() - INTERVAL '90 days';

-- Remove tokens with repeated failures
DELETE FROM push_tokens
WHERE token IN (
  SELECT DISTINCT token
  FROM notification_logs
  WHERE status = 'error'
    AND error_message LIKE '%DeviceNotRegistered%'
);
```

## Best Practices

- ✅ **Batch requests** - Send up to 100 notifications per request
- ✅ **Handle errors** - Invalid tokens should be removed from database
- ✅ **Rate limit** - Don't spam users with notifications
- ✅ **Test on devices** - Simulators don't support push notifications
- ✅ **Use data payload** - Include navigation info for deep linking
- ✅ **Track receipts** - Monitor delivery status
- ✅ **Respect preferences** - Let users opt out of notification types

## Troubleshooting

### "No push tokens found"

Users haven't registered for notifications yet. Ensure your app:
1. Requests notification permission
2. Gets push token from Expo
3. Stores token in `push_tokens` table

### "DeviceNotRegistered" error

Token is no longer valid (app uninstalled, token expired). Remove from database:

```sql
DELETE FROM push_tokens WHERE token = 'invalid-token-here';
```

### Notifications not received

1. Check token is valid in Expo's tool
2. Verify APNs/FCM credentials in Expo dashboard
3. Check device notification settings
4. Test with physical device (not simulator)

## Related Documentation

- [Push Notifications Guide](../../../docs/06-native-features/PUSH-NOTIFICATIONS.md)
- [Permissions Handling](../../../docs/06-native-features/PERMISSIONS-HANDLING.md)
