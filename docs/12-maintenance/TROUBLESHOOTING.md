# Troubleshooting Guide

Quick fixes for common issues.

## Metro / Build Issues

### "Unable to resolve module"

```bash
# Clear Metro cache
npx expo start --clear

# Or manually
rm -rf node_modules/.cache
watchman watch-del-all
```

### "Package version mismatch"

```bash
# Let Expo fix versions
npx expo install --fix

# Check for issues
npx expo-doctor
```

### iOS Pod Issues

```bash
# Reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod install --repo-update
cd ..
```

### Android Build Fails

```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Clear everything
rm -rf android/.gradle
rm -rf android/app/build
```

## Runtime Errors

### "Invariant Violation"

Usually a component rendering issue:
- Check for null/undefined values
- Wrap conditional renders properly
- Check import/export matches

```typescript
// BAD
{items && items.map(...)} // Can fail if items is null

// GOOD
{(items ?? []).map(...)}
```

### "Cannot read property of undefined"

Add null checks:

```typescript
// BAD
const name = user.profile.name;

// GOOD
const name = user?.profile?.name ?? 'Default';
```

### "Hook called outside component"

Hooks must be called:
- Inside function components
- At the top level (not in conditions)
- In the same order every render

```typescript
// BAD
if (condition) {
  const [value, setValue] = useState();
}

// GOOD
const [value, setValue] = useState();
if (condition) {
  // use value
}
```

## Supabase Issues

### "JWT expired"

Session expired, refresh it:

```typescript
const { error } = await supabase.auth.refreshSession();
if (error) {
  // Redirect to login
  await supabase.auth.signOut();
}
```

### "Row level security policy violation"

Check your RLS policies:
- Is RLS enabled on the table?
- Does the policy match the operation (SELECT/INSERT/UPDATE/DELETE)?
- Is `auth.uid()` matching the user_id column?

### "Function not found" (Edge Functions)

```bash
# Deploy functions
supabase functions deploy function-name

# Check logs
supabase functions logs function-name
```

## iOS Specific

### "Signing certificate not found"

1. Open Xcode
2. Go to Signing & Capabilities
3. Select your team
4. Let Xcode manage signing

### "App crashes on launch"

Check for:
- Missing permissions in `Info.plist`
- Native module not linked
- Incorrect bundle ID

View crash logs:
```bash
# From Xcode
Window > Devices and Simulators > View Device Logs
```

### Bluetooth Not Working

```xml
<!-- Add to Info.plist -->
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth to connect to printers</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app uses Bluetooth to connect to printers</string>
```

## Android Specific

### "Cleartext HTTP traffic not permitted"

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application
  android:usesCleartextTraffic="true"
  ...>
```

### "Duplicate class" error

Add to `android/gradle.properties`:

```properties
android.enableJetifier=true
```

### Permissions Not Working

Check runtime permissions:

```typescript
import { PermissionsAndroid } from 'react-native';

const granted = await PermissionsAndroid.request(
  PermissionsAndroid.PERMISSIONS.CAMERA
);
```

## Performance Issues

### Slow List Rendering

Use FlatList with optimization:

```typescript
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={renderItem}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Memory Leaks

Check for:
- Missing useEffect cleanup
- Unsubscribed listeners
- Large images not released

```typescript
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe(); // Cleanup!
}, []);
```

### Slow Animations

Use native driver:

```typescript
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Required for 60fps
}).start();
```

## Quick Reference

| Issue | Command |
|-------|---------|
| Clear cache | `npx expo start --clear` |
| Fix versions | `npx expo install --fix` |
| Check health | `npx expo-doctor` |
| iOS pods | `cd ios && pod install` |
| Android clean | `cd android && ./gradlew clean` |
| Type check | `npx tsc --noEmit` |
| Run tests | `npm test` |
