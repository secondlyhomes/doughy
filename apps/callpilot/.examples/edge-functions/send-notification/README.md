# Send Notification Edge Function

Supabase Edge Function for sending push notifications via Expo Push API.

## Features

- Send to single or multiple users
- Batch sending (handles Expo's 100-notification limit)
- Automatic token validation
- Error handling and retry logic
- Delivery tracking
- Token cleanup (marks invalid tokens as inactive)

## Deployment

### 1. Deploy Function

```bash
supabase functions deploy send-notification
```

### 2. Set Environment Variables

In Supabase Dashboard → Edge Functions → Configuration:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Test Function

```bash
curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/send-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "message": {
      "to": "ExponentPushToken[xxx]",
      "title": "Test",
      "body": "Hello World"
    }
  }'
```

## Usage

### Send to Single User

```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    message: {
      to: 'ExponentPushToken[xxx]',
      title: 'Hello',
      body: 'World',
      data: { type: 'test' },
    },
    userId: 'user-uuid',
  },
});
```

### Send to Multiple Users (Batch)

```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    message: {
      to: [
        'ExponentPushToken[aaa]',
        'ExponentPushToken[bbb]',
        'ExponentPushToken[ccc]',
      ],
      title: 'Announcement',
      body: 'Check out our new feature!',
    },
    userIds: ['user-1', 'user-2', 'user-3'],
  },
});
```

### Schedule Notification (Optional)

```typescript
const { data, error } = await supabase.functions.invoke('send-notification', {
  body: {
    message: {
      to: 'ExponentPushToken[xxx]',
      title: 'Reminder',
      body: 'Your meeting starts in 5 minutes',
    },
    userId: 'user-uuid',
    scheduledFor: '2024-12-25T10:00:00Z', // ISO timestamp
  },
});
```

## Request Format

```typescript
{
  message: {
    to: string | string[];           // Expo push token(s)
    title?: string;
    subtitle?: string;
    body?: string;
    data?: Record<string, any>;      // Custom data
    sound?: string | null;           // Sound file name or null
    badge?: number;                  // Badge count
    channelId?: string;              // Android channel
    categoryId?: string;             // iOS category
    priority?: 'default' | 'normal' | 'high';
    ttl?: number;                    // Time to live in seconds
  };
  userId?: string;                   // Single user ID
  userIds?: string[];                // Multiple user IDs
  scheduledFor?: string;             // ISO timestamp (optional)
}
```

## Response Format

### Success

```json
{
  "success": true,
  "totalSent": 3,
  "tickets": [
    { "status": "ok", "id": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" },
    { "status": "ok", "id": "YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY" },
    { "status": "ok", "id": "ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ" }
  ]
}
```

### Error

```json
{
  "error": "Internal server error",
  "message": "Failed to send notification"
}
```

## Error Handling

The function automatically handles common errors:

### DeviceNotRegistered
- Marks token as inactive in database
- Token won't receive future notifications

### MessageTooBig
- Notification payload exceeds 4KB limit
- Reduce data payload size

### MessageRateExceeded
- Sending too many notifications too quickly
- Implement rate limiting in your app

### InvalidCredentials
- Push token is malformed or invalid
- Re-register user for push notifications

## Monitoring

### View Logs

Supabase Dashboard → Edge Functions → send-notification → Logs

### Query Notification History

```sql
SELECT * FROM notifications
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Check Token Status

```sql
SELECT
  status,
  COUNT(*) as count
FROM push_tokens
GROUP BY status;
```

## Rate Limits

Expo Push API limits:
- **100 notifications per request** (automatically batched)
- **600 requests per second** per IP
- **No daily limit**

## Best Practices

1. **Batch notifications** when sending to multiple users
2. **Handle errors gracefully** and mark invalid tokens
3. **Monitor delivery** via receipts (optional)
4. **Set appropriate TTL** for time-sensitive notifications
5. **Use channels** (Android) and categories (iOS) for organization

## Advanced: Receipt Checking

To verify notification delivery, implement receipt checking:

```typescript
// Store ticket IDs when sending
const { tickets } = response.data;

// Later, check receipts
const receipts = await checkReceipts(tickets.map(t => t.id));
```

See `index.ts` for `checkReceipts()` implementation.

## Local Development

```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve send-notification

# Test locally
curl http://localhost:54321/functions/v1/send-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message":{"to":"ExponentPushToken[xxx]","title":"Test","body":"Local test"}}'
```

## Security

- Uses **service role key** for database access
- Validates user authentication
- Implements RLS policies
- Only inserts to `notifications` table with service role

## Troubleshooting

### Function not found
```bash
supabase functions deploy send-notification
```

### Environment variables not set
Set in Supabase Dashboard → Edge Functions → Configuration

### CORS errors
CORS headers are included in the function response

### Timeout errors
- Reduce batch size
- Implement queuing for large batches

## Resources

- [Expo Push API Docs](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/manual)
