# Integration Issues

Troubleshooting guide for third-party service and library integrations.

## Table of Contents

1. [Supabase Integration](#supabase-integration)
2. [Authentication Providers](#authentication-providers)
3. [Payment Services](#payment-services)
4. [Analytics & Tracking](#analytics--tracking)
5. [Push Notifications](#push-notifications)
6. [Maps & Location](#maps--location)
7. [File Storage](#file-storage)
8. [AI Services](#ai-services)

---

## Supabase Integration

### Connection Issues

**Error: "Failed to fetch"**

**Solutions:**

1. **Check environment variables:**
```typescript
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL)
console.log('Anon key exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
```

2. **Verify Supabase client initialization:**
```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'

if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL')
}

if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)
```

3. **Test connection:**
```typescript
const { data, error } = await supabase.from('profiles').select('count')
console.log('Connection test:', { data, error })
```

---

### Real-time Subscriptions Not Working

**Symptoms:**
- Changes not reflecting in real-time
- Subscription not receiving events

**Solutions:**

1. **Enable real-time in Supabase Dashboard:**
   - Database → Replication → Enable for table

2. **Check subscription setup:**
```typescript
useEffect(() => {
  const channel = supabase
    .channel('tasks-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
      },
      (payload) => {
        console.log('Change received!', payload)
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status)
    })

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

3. **Check RLS policies allow SELECT:**
```sql
-- Users must be able to SELECT to receive real-time updates
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);
```

---

### Storage Upload Failures

**Error: "Row Level Security policy violation"**

**Solutions:**

1. **Enable RLS on storage.objects:**
```sql
-- In Supabase SQL Editor
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

2. **Upload with proper path:**
```typescript
const userId = user.id
const filePath = `${userId}/avatar.jpg`

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, {
    upsert: true
  })
```

---

## Authentication Providers

### Google OAuth Not Working

**Symptoms:**
- Redirects but doesn't complete sign in
- "Invalid redirect URI" error

**Solutions:**

1. **Configure authorized redirect URIs in Google Cloud Console:**
```
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

2. **Enable Google provider in Supabase:**
   - Authentication → Providers → Google
   - Add Client ID and Secret

3. **Implement sign in:**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'myapp://auth/callback',
  },
})
```

4. **Handle deep link:**
```typescript
// app.json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

---

### Apple Sign In Not Working (iOS)

**Symptoms:**
- Sign in button doesn't work
- "Invalid client" error

**Solutions:**

1. **Configure in Apple Developer:**
   - Certificates, IDs & Profiles
   - Identifiers → Your App ID
   - Enable "Sign in with Apple"

2. **Enable in Supabase:**
   - Authentication → Providers → Apple
   - Add Service ID and Key

3. **Implement:**
```typescript
import * as AppleAuthentication from 'expo-apple-authentication'

try {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  })

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  })
} catch (e) {
  if (e.code === 'ERR_CANCELED') {
    // User canceled
  }
}
```

---

## Payment Services

### RevenueCat Integration Issues

**Error: "There is no singleton instance"**

**Solutions:**

1. **Configure RevenueCat properly:**
```typescript
import Purchases from 'react-native-purchases'

// In App.tsx, before any purchases code
useEffect(() => {
  Purchases.setDebugLogsEnabled(true)

  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY })
  } else {
    Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY })
  }
}, [])
```

2. **Test mode on iOS:**
   - Use sandbox Apple ID
   - Sign out of App Store in Settings

3. **Test mode on Android:**
   - Use test account in Play Console
   - Use license testing

---

### Stripe Payment Not Completing

**Symptoms:**
- Payment sheet opens but doesn't complete
- "No payment method" error

**Solutions:**

1. **Initialize Stripe properly:**
```typescript
import { StripeProvider } from '@stripe/stripe-react-native'

<StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}>
  <App />
</StripeProvider>
```

2. **Create payment intent on server:**
```typescript
// Don't create payment intents on client!
// Use Supabase Edge Function

const { data } = await supabase.functions.invoke('create-payment-intent', {
  body: { amount: 1000, currency: 'usd' }
})

const { error } = await initPaymentSheet({
  paymentIntentClientSecret: data.clientSecret,
})
```

---

## Analytics & Tracking

### PostHog Events Not Sending

**Symptoms:**
- Events don't appear in PostHog dashboard
- No errors in console

**Solutions:**

1. **Verify initialization:**
```typescript
import PostHog from 'posthog-react-native'

await PostHog.setup(process.env.EXPO_PUBLIC_POSTHOG_API_KEY, {
  host: 'https://app.posthog.com',
  captureApplicationLifecycleEvents: true,
})
```

2. **Check event format:**
```typescript
PostHog.capture('task_created', {
  task_id: task.id,
  task_title: task.title,
})
```

3. **Flush events (for testing):**
```typescript
await PostHog.flush()
```

---

### Sentry Crashes Not Reporting

**Symptoms:**
- Crashes happen but don't appear in Sentry
- Missing source maps

**Solutions:**

1. **Wrap app in Sentry:**
```typescript
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enableInExpoDevelopment: false,
  debug: __DEV__,
})

export default Sentry.wrap(App)
```

2. **Upload source maps:**
```bash
# After build
eas build --platform ios --profile production
npx sentry-expo-upload-sourcemaps dist
```

3. **Test crash reporting:**
```typescript
Sentry.nativeCrash() // Test only!
```

---

## Push Notifications

### iOS Push Not Receiving

**Checklist:**
- [ ] Testing on physical device (not simulator)
- [ ] Push notifications capability enabled in Xcode
- [ ] APNs key configured in Expo
- [ ] User granted permissions
- [ ] App in background (foreground notifications require configuration)

**Solutions:**

1. **Request permissions:**
```typescript
import * as Notifications from 'expo-notifications'

const { status } = await Notifications.requestPermissionsAsync()
if (status !== 'granted') {
  Alert.alert('Push notifications permission denied')
}
```

2. **Get push token:**
```typescript
const token = await Notifications.getExpoPushTokenAsync({
  projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
})
console.log('Push token:', token)
```

3. **Configure notification handler:**
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})
```

---

### Android Push Not Receiving

**Checklist:**
- [ ] Google Play Services installed (emulator)
- [ ] FCM configured
- [ ] Notification channel created (Android 8+)
- [ ] User granted permissions

**Solutions:**

1. **Add google-services.json:**
```bash
# Download from Firebase Console
# Place in android/app/google-services.json
```

2. **Create notification channel:**
```typescript
await Notifications.setNotificationChannelAsync('default', {
  name: 'Default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
})
```

---

## Maps & Location

### Maps Not Rendering

**Solutions:**

1. **iOS: Enable Maps in Info.plist:**
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "This app uses location to show nearby places"
    }
  }
}
```

2. **Android: Add Google Maps API key:**
```json
{
  "android": {
    "config": {
      "googleMaps": {
        "apiKey": "YOUR_API_KEY"
      }
    }
  }
}
```

3. **Use react-native-maps:**
```typescript
import MapView, { Marker } from 'react-native-maps'

<MapView
  style={{ flex: 1 }}
  initialRegion={{
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
>
  <Marker coordinate={{ latitude: 37.78825, longitude: -122.4324 }} />
</MapView>
```

---

### Location Permission Denied

**Solutions:**

1. **Request permissions:**
```typescript
import * as Location from 'expo-location'

const { status } = await Location.requestForegroundPermissionsAsync()
if (status !== 'granted') {
  Alert.alert('Location permission denied')
  return
}

const location = await Location.getCurrentPositionAsync({})
```

2. **iOS: Add usage descriptions:**
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "We need your location to...",
      "NSLocationAlwaysUsageDescription": "We need your location to..."
    }
  }
}
```

3. **Android: Add permissions:**
```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION"
    ]
  }
}
```

---

## File Storage

### Image Upload Fails

**Solutions:**

1. **Get proper file URI:**
```typescript
import * as ImagePicker from 'expo-image-picker'

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  quality: 0.8,
})

if (!result.canceled) {
  const uri = result.assets[0].uri
  // Upload uri
}
```

2. **Upload to Supabase Storage:**
```typescript
import { decode } from 'base64-arraybuffer'
import * as FileSystem from 'expo-file-system'

const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,
})

const { data, error } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, decode(base64), {
    contentType: 'image/jpeg',
    upsert: true,
  })
```

3. **Handle large files:**
```typescript
// Compress before upload
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'

const compressed = await manipulateAsync(
  uri,
  [{ resize: { width: 800 } }],
  { compress: 0.7, format: SaveFormat.JPEG }
)

// Upload compressed.uri
```

---

## AI Services

### OpenAI API Errors

**Error: "Rate limit exceeded"**

**Solutions:**

1. **Implement rate limiting:**
```typescript
import pLimit from 'p-limit'

const limit = pLimit(5) // Max 5 concurrent requests

const results = await Promise.all(
  items.map(item => limit(() => callOpenAI(item)))
)
```

2. **Use server-side proxy:**
```typescript
// Don't call OpenAI from client!
// Use Supabase Edge Function

const { data } = await supabase.functions.invoke('ai-chat', {
  body: { prompt: 'Hello' }
})
```

3. **Handle errors gracefully:**
```typescript
try {
  const response = await openai.createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  })
} catch (error) {
  if (error.status === 429) {
    // Rate limited - retry with exponential backoff
    await delay(1000)
    // Retry
  } else if (error.status === 500) {
    // Server error - retry
  } else {
    // Other error - show to user
    Alert.alert('AI Error', error.message)
  }
}
```

---

### Anthropic Claude API Issues

**Error: "Invalid API key"**

**Solutions:**

1. **Store API key securely:**
```typescript
// NEVER in client code!
// Use Supabase Edge Function

// supabase/functions/claude-chat/index.ts
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  },
  body: JSON.stringify({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  }),
})
```

2. **Call from client:**
```typescript
const { data, error } = await supabase.functions.invoke('claude-chat', {
  body: { prompt: 'Hello' }
})
```

---

## Quick Reference

| Service | Common Issue | Quick Fix |
|---------|--------------|-----------|
| Supabase | Connection failed | Check env vars, restart Metro |
| Google OAuth | Invalid redirect | Add callback URL in Google Console |
| RevenueCat | No singleton | Call configure() before use |
| Stripe | Payment fails | Create intent on server, not client |
| PostHog | Events missing | Verify API key, call flush() |
| Sentry | Crashes missing | Upload source maps |
| Push (iOS) | Not receiving | Test on device, enable capability |
| Push (Android) | Not receiving | Add google-services.json, create channel |
| Maps | Not rendering | Add API key |
| OpenAI | Rate limited | Use server-side, implement rate limiting |

---

**Related Docs:**
- [Common Errors](./COMMON-ERRORS.md)
- [Platform Issues](./PLATFORM-ISSUES.md)
- [Performance Issues](./PERFORMANCE-ISSUES.md)
