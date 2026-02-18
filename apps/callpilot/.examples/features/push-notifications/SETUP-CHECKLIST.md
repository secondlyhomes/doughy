# Push Notifications Setup Checklist

Complete checklist for implementing push notifications. Check off items as you complete them.

## Prerequisites

- [ ] Expo SDK 50+ installed
- [ ] Supabase project created
- [ ] Physical iOS or Android device (push notifications don't work in simulators)
- [ ] Expo account created
- [ ] Expo project ID obtained

## Installation

### 1. Dependencies

- [ ] Install `expo-notifications`
- [ ] Install `expo-device`
- [ ] Install `expo-constants`

```bash
npx expo install expo-notifications expo-device expo-constants
```

### 2. Files

- [ ] Copy `PushNotificationsContext.tsx` to `src/features/push-notifications/`
- [ ] Copy `notificationService.ts` to `src/features/push-notifications/`
- [ ] Copy `types.ts` to `src/features/push-notifications/`
- [ ] Copy `index.ts` to `src/features/push-notifications/`
- [ ] Copy `notificationTemplates.ts` (optional)
- [ ] Copy `android-channels.ts` (optional)
- [ ] Copy `testing-utils.ts` (development only)

## Configuration

### 3. App Configuration (app.json)

- [ ] Add `expo-notifications` plugin
- [ ] Set notification icon path
- [ ] Set notification color
- [ ] Configure iOS `UIBackgroundModes`
- [ ] Add Android permissions
- [ ] Set Expo project ID in `extra`

```json
{
  "expo": {
    "plugins": [["expo-notifications", { /* config */ }]],
    "extra": {
      "projectId": "your-expo-project-id"
    }
  }
}
```

### 4. Environment Variables

- [ ] Create `.env` file
- [ ] Add `EXPO_PUBLIC_PROJECT_ID`
- [ ] Add Supabase URL
- [ ] Add Supabase anon key

## Database Setup

### 5. Run SQL Migration

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy contents of `database-schema.sql`
- [ ] Run migration
- [ ] Verify tables created:
  - [ ] `push_tokens`
  - [ ] `notifications`
  - [ ] `scheduled_notifications`
- [ ] Verify RLS enabled on all tables
- [ ] Test inserting a row into `push_tokens` (should work for authenticated user)

### 6. Edge Function Deployment

- [ ] Create `supabase/functions/send-notification/` directory
- [ ] Copy `index.ts` from `.examples/edge-functions/send-notification/`
- [ ] Deploy function: `supabase functions deploy send-notification`
- [ ] Set environment variables in Supabase Dashboard:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SECRET_KEY`
- [ ] Test function with cURL
- [ ] Verify function appears in Supabase Dashboard → Edge Functions

## App Integration

### 7. Provider Setup

- [ ] Import `PushNotificationsProvider` in `App.tsx`
- [ ] Wrap app with `PushNotificationsProvider`
- [ ] Configure `onNotificationReceived` handler
- [ ] Configure `onNotificationTapped` handler
- [ ] Set `autoRegister` (optional)

```typescript
<PushNotificationsProvider
  autoRegister={true}
  onNotificationReceived={(notification) => { /* handle */ }}
  onNotificationTapped={(response) => { /* navigate */ }}
>
  {/* Your app */}
</PushNotificationsProvider>
```

### 8. Android Channels (Android Only)

- [ ] Import `setupNotificationChannels`
- [ ] Call in app initialization
- [ ] Verify channels created in Android settings

```typescript
import { setupNotificationChannels } from '@/features/push-notifications';

// In App.tsx useEffect
useEffect(() => {
  setupNotificationChannels();
}, []);
```

### 9. Settings Screen

- [ ] Create notifications settings screen
- [ ] Add permission request button
- [ ] Display current permission status
- [ ] Add toggle to enable/disable notifications
- [ ] Add badge management controls

## Permission Flow

### 10. iOS Permissions

- [ ] Request permissions on first launch (optional)
- [ ] Show explanation before requesting
- [ ] Handle "denied" status gracefully
- [ ] Provide link to iOS Settings if denied
- [ ] Test on physical iOS device

### 11. Android Permissions

- [ ] Test on Android 13+ (runtime permission)
- [ ] Verify permission prompt appears
- [ ] Test on Android <13 (no prompt required)
- [ ] Verify notifications appear

## Testing

### 12. Local Notifications

- [ ] Send immediate test notification
- [ ] Schedule notification for 5 seconds
- [ ] Test daily notification
- [ ] Test weekly notification
- [ ] Test custom trigger
- [ ] Verify badge updates
- [ ] Test sound/vibration

### 13. Remote Notifications

- [ ] Get push token from device
- [ ] Test with Expo push tool: `npx expo-push-tool TOKEN`
- [ ] Test with cURL
- [ ] Send via app code
- [ ] Verify token stored in database
- [ ] Check notification appears in `notifications` table

### 14. Action Buttons (iOS)

- [ ] Test "message" category (Reply, View)
- [ ] Test "task" category (Complete, View)
- [ ] Test "social" category (Like, View)
- [ ] Test "reminder" category (Dismiss, View)
- [ ] Verify action handlers work

### 15. Deep Linking

- [ ] Send notification with deep link data
- [ ] Tap notification
- [ ] Verify navigation to correct screen
- [ ] Verify params passed correctly
- [ ] Test while app is closed
- [ ] Test while app is backgrounded
- [ ] Test while app is foregrounded

## Production Readiness

### 16. Error Handling

- [ ] Handle permission denied gracefully
- [ ] Handle token registration failures
- [ ] Handle send failures
- [ ] Log errors to monitoring service
- [ ] Show user-friendly error messages

### 17. User Experience

- [ ] Don't request permissions immediately
- [ ] Explain value before requesting
- [ ] Allow users to disable notifications
- [ ] Provide notification preferences
- [ ] Respect quiet hours (optional)
- [ ] Allow frequency control (optional)

### 18. Performance

- [ ] Batch notifications when possible
- [ ] Implement rate limiting
- [ ] Clean up expired tokens (cron job)
- [ ] Monitor database size
- [ ] Optimize notification queries

### 19. Security

- [ ] Verify RLS policies enabled
- [ ] Never use service role key on client
- [ ] Validate user permissions before sending
- [ ] Sanitize notification data
- [ ] Don't send sensitive data in notifications

### 20. Monitoring

- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor Edge Function logs
- [ ] Track delivery rates
- [ ] Monitor token registration rate
- [ ] Set up alerts for failures

## Platform-Specific

### 21. iOS

- [ ] Configure App ID in Apple Developer Portal
- [ ] Enable Push Notifications capability
- [ ] Test on physical device
- [ ] Verify notification banner appears
- [ ] Test notification center
- [ ] Test lock screen notifications
- [ ] Verify badge updates
- [ ] Test notification categories

### 22. Android

- [ ] Configure Firebase Cloud Messaging (if needed)
- [ ] Add `google-services.json` (if using FCM)
- [ ] Test on physical device
- [ ] Verify notification shade
- [ ] Test notification channels
- [ ] Verify channel settings editable
- [ ] Test notification importance levels

## Optional Features

### 23. Rich Notifications

- [ ] Test image attachments
- [ ] Test video thumbnails
- [ ] Verify media loads correctly
- [ ] Test on slow network

### 24. Scheduled Notifications

- [ ] Implement scheduling UI
- [ ] Store scheduled notifications
- [ ] Allow cancellation
- [ ] Show list of scheduled notifications
- [ ] Test repeating notifications

### 25. Notification History

- [ ] Create history screen
- [ ] Display sent notifications
- [ ] Show delivery status
- [ ] Mark as read functionality
- [ ] Delete old notifications

### 26. Preferences

- [ ] Create preferences UI
- [ ] Save preferences to database
- [ ] Honor user preferences when sending
- [ ] Allow notification types to be toggled
- [ ] Allow sound/vibration preferences

## Documentation

### 27. Team Documentation

- [ ] Document setup process
- [ ] Document sending notifications
- [ ] Document templates
- [ ] Document testing procedure
- [ ] Create troubleshooting guide

### 28. User Documentation

- [ ] Add notification settings to help docs
- [ ] Explain how to enable notifications
- [ ] Explain how to customize preferences
- [ ] Document troubleshooting steps

## Launch Preparation

### 29. Pre-Launch Testing

- [ ] Test on multiple iOS versions
- [ ] Test on multiple Android versions
- [ ] Test on various device sizes
- [ ] Test notification tapping while app in all states
- [ ] Test with poor network conditions
- [ ] Verify all deep links work
- [ ] Test with large payloads

### 30. Launch Checklist

- [ ] Remove test code
- [ ] Remove debug logging
- [ ] Verify production credentials
- [ ] Set up monitoring
- [ ] Prepare rollback plan
- [ ] Document known issues

## Post-Launch

### 31. Monitoring

- [ ] Monitor delivery rates
- [ ] Track opt-in rates
- [ ] Monitor error rates
- [ ] Track engagement (taps)
- [ ] Monitor database growth

### 32. Optimization

- [ ] Analyze which notifications get engaged with
- [ ] Remove low-value notifications
- [ ] Optimize send times
- [ ] Personalize notifications
- [ ] A/B test notification copy

## Common Issues Checklist

Use this when troubleshooting:

- [ ] Is this a physical device? (Simulators don't work)
- [ ] Are permissions granted?
- [ ] Is the push token registered in database?
- [ ] Is the Edge Function deployed?
- [ ] Are environment variables set?
- [ ] Is RLS enabled but blocking the request?
- [ ] Is the notification payload too large (<4KB)?
- [ ] Is the user authenticated?
- [ ] Is the app in foreground? (Behavior differs)
- [ ] Are notification categories set up? (iOS)
- [ ] Are notification channels set up? (Android)

## Resources

- [ ] Bookmark [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [ ] Bookmark [Expo Push API Docs](https://docs.expo.dev/push-notifications/sending-notifications/)
- [ ] Bookmark [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [ ] Join Expo Discord for support
- [ ] Review full README.md

---

## Completion Status

**Total Items:** 32 sections, ~160 individual tasks

Mark completion percentage:
- [ ] 0-25% - Getting started
- [ ] 25-50% - Configuration complete
- [ ] 50-75% - Testing complete
- [ ] 75-100% - Production ready
- [ ] 100% - Launched and monitored

**Last Updated:** [Date]
**Completed By:** [Name]
