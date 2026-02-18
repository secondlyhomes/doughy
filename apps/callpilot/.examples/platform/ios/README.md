# iOS Platform Features Guide

Comprehensive guide for implementing iOS-specific features in your React Native + Expo app.

## Table of Contents

- [Overview](#overview)
- [Feature Matrix](#feature-matrix)
- [Setup Requirements](#setup-requirements)
- [Features](#features)
  - [Home Screen Widgets](#home-screen-widgets)
  - [Siri Shortcuts](#siri-shortcuts)
  - [Face ID / Touch ID](#face-id--touch-id)
  - [App Clips](#app-clips)
  - [Live Activities](#live-activities)
  - [Focus Filters](#focus-filters)
  - [Handoff](#handoff)
  - [Context Menus](#context-menus)
  - [Share Extensions](#share-extensions)
- [App Store Requirements](#app-store-requirements)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Overview

iOS offers rich platform features that can significantly enhance your app's user experience. This guide covers implementation of key iOS features using React Native and Expo.

### Why Use iOS-Specific Features?

- **Better Integration**: Feel native to iOS users
- **Improved Discoverability**: Widgets, Siri, Spotlight
- **Enhanced UX**: Face ID, Handoff, Context Menus
- **User Engagement**: Live Activities, Notifications
- **App Store Optimization**: Apple values platform integration

## Feature Matrix

| Feature | Min iOS | Device | Complexity | Priority |
|---------|---------|--------|------------|----------|
| Home Screen Widgets | 14.0 | All | Medium | High |
| Siri Shortcuts | 12.0 | All | Medium | High |
| Face ID / Touch ID | 11.0 / 8.0 | All | Low | High |
| App Clips | 14.0 | All | High | Medium |
| Live Activities | 16.1 | All | Medium | Medium |
| Lock Screen Widgets | 16.0 | All | Medium | Medium |
| Interactive Widgets | 17.0 | All | High | Low |
| Focus Filters | 16.0 | All | Low | Low |
| Handoff | 8.0 | All | Low | Low |
| Context Menus | 13.0 | All | Low | Medium |
| Share Extensions | 8.0 | All | Medium | Medium |

## Setup Requirements

### 1. Development Environment

```bash
# Xcode 14.0 or later
xcode-select --install

# CocoaPods
sudo gem install cocoapods

# Install dependencies
npm install expo-local-authentication
npm install expo-secure-store
npm install @react-native-async-storage/async-storage
```

### 2. Xcode Project Configuration

**Required Capabilities:**
1. Open `ios/YourApp.xcworkspace` in Xcode
2. Select your app target
3. Go to "Signing & Capabilities"
4. Add capabilities:
   - App Groups (for widgets)
   - Background Modes (for Live Activities)
   - Siri (for Siri Shortcuts)
   - Push Notifications (for remote updates)

### 3. Info.plist Configuration

```xml
<!-- Face ID -->
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to quickly and securely access your account</string>

<!-- Siri -->
<key>NSSiriUsageDescription</key>
<string>Use Siri to manage your tasks with voice commands</string>

<!-- Live Activities -->
<key>NSSupportsLiveActivities</key>
<true/>

<!-- Background Modes -->
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>processing</string>
    <string>remote-notification</string>
</array>

<!-- URL Schemes for Deep Linking -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>yourapp</string>
        </array>
    </dict>
</array>
```

## Features

### Home Screen Widgets

Display app content directly on the home screen.

**Documentation**: [widgets/README.md](./widgets/README.md)

**Quick Start:**

```typescript
import { WidgetService } from './services/widgetService';

// Update widget when data changes
await WidgetService.updateWidget(tasks);
```

**Key Files:**
- `widgets/TaskWidget.tsx` - Widget UI components
- `widgets/widgetConfig.ts` - Configuration and data management
- `widgets/README.md` - Complete setup guide

**Sizes Available:**
- Small (2x2): Quick stats
- Medium (4x2): Task list with 3-4 items
- Large (4x4): Detailed task list with 7-8 items

### Siri Shortcuts

Let users perform actions with Siri voice commands.

**Documentation**: [siri/README.md](./siri/README.md)

**Quick Start:**

```typescript
import { SiriShortcuts } from './platform/ios/siri/shortcuts';

// Donate shortcut when user creates task
await SiriShortcuts.donateCreateTask('Buy groceries');

// Setup suggested shortcuts on app launch
await SiriShortcuts.setupSuggestedShortcuts();
```

**Key Files:**
- `siri/shortcuts.ts` - Shortcut donation and management
- `siri/IntentHandler.tsx` - Handle Siri requests
- `siri/README.md` - Complete setup guide

**Common Shortcuts:**
- "Show my tasks"
- "Add a task"
- "Complete my tasks"
- "Mark [task name] as done"

### Face ID / Touch ID

Secure biometric authentication.

**Documentation**: [biometrics/README.md](./biometrics/README.md)

**Quick Start:**

```typescript
import { useBiometricAuth } from './platform/ios/biometrics/BiometricAuth';

function LoginScreen() {
  const { isAvailable, biometricType, authenticate } = useBiometricAuth();

  const handleBiometricLogin = async () => {
    const result = await authenticate({
      promptMessage: 'Log in to your account',
    });

    if (result.success) {
      // User authenticated
      navigateToHome();
    }
  };

  if (isAvailable) {
    return (
      <button onClick={handleBiometricLogin}>
        Login with {biometricType === 'faceId' ? 'Face ID' : 'Touch ID'}
      </button>
    );
  }

  return <PasswordLogin />;
}
```

**Key Files:**
- `biometrics/BiometricAuth.tsx` - Biometric authentication
- `biometrics/SecureStorage.ts` - Secure keychain storage
- `biometrics/README.md` - Complete setup guide

**Use Cases:**
- Login authentication
- Secure data access
- Payment confirmation
- Settings protection

### App Clips

Lightweight app experiences accessible without full installation.

**Documentation**: [app-clips/README.md](./app-clips/README.md)

**Key Features:**
- Under 15MB size limit
- Instant launch from NFC, QR codes, or Safari
- Upgrade to full app seamlessly
- Access location, camera, Apple Pay

**Use Cases:**
- Quick actions (order, book, pay)
- Event check-in
- Product information
- Trial experiences

### Live Activities

Real-time updates on Lock Screen and Dynamic Island.

**Documentation**: [live-activities/README.md](./live-activities/README.md)

**Quick Start:**

```typescript
import { TaskLiveActivity } from './platform/ios/live-activities/TaskLiveActivity';

// Start Live Activity
const activityId = await TaskLiveActivity.start(
  taskId,
  'Complete project documentation',
  5 // total steps
);

// Update progress
await TaskLiveActivity.updateProgress(activityId, 3, 5);

// Complete
await TaskLiveActivity.complete(activityId);
```

**Key Files:**
- `live-activities/TaskLiveActivity.tsx` - Live Activity manager
- `live-activities/README.md` - Complete setup guide

**Requirements:**
- iOS 16.1+ for basic Live Activities
- iOS 16.2+ for push updates
- iOS 17+ for interactive widgets
- iPhone 14 Pro+ for Dynamic Island

### Focus Filters

Filter app content based on user's Focus mode.

**Documentation**: [focus/README.md](./focus/README.md)

**Quick Start:**

```typescript
import { FocusFilter } from './platform/ios/focus/FocusFilter';

// Check current Focus mode
const focusMode = await FocusFilter.getCurrentFocus();

// Filter tasks based on Focus
const filteredTasks = tasks.filter(task => {
  if (focusMode === 'Work') {
    return task.category === 'work';
  }
  if (focusMode === 'Personal') {
    return task.category === 'personal';
  }
  return true;
});
```

**Key Files:**
- `focus/FocusFilter.tsx` - Focus mode detection
- `focus/README.md` - Complete setup guide

### Handoff

Continue activities across Apple devices.

**Documentation**: [features/Handoff.tsx](./features/Handoff.tsx)

**Quick Start:**

```typescript
import { HandoffManager } from './platform/ios/features/Handoff';

// Start Handoff activity
await HandoffManager.startActivity({
  activityType: 'com.yourapp.viewTask',
  title: 'Viewing Task',
  userInfo: { taskId: '123' },
  webpageURL: 'https://yourapp.com/tasks/123',
});
```

**Use Cases:**
- Continue reading on another device
- Transfer editing session
- Resume video playback
- Maintain browsing context

### Context Menus

3D Touch / Haptic Touch menus for quick actions.

**Documentation**: [features/ContextMenu.tsx](./features/ContextMenu.tsx)

**Quick Start:**

```typescript
import { ContextMenu } from 'react-native-context-menu-view';

<ContextMenu
  actions={[
    { title: 'Complete', systemIcon: 'checkmark' },
    { title: 'Edit', systemIcon: 'pencil' },
    { title: 'Delete', systemIcon: 'trash', destructive: true },
  ]}
  onPress={(e) => {
    if (e.nativeEvent.index === 0) completeTask();
    if (e.nativeEvent.index === 1) editTask();
    if (e.nativeEvent.index === 2) deleteTask();
  }}
>
  <TaskCard task={task} />
</ContextMenu>
```

### Share Extensions

Share content to and from your app.

**Documentation**: [features/ShareSheet.tsx](./features/ShareSheet.tsx)

**Quick Start:**

```typescript
import { Share } from 'react-native';

const shareTask = async (task) => {
  try {
    await Share.share({
      message: `Check out this task: ${task.title}`,
      url: `https://yourapp.com/tasks/${task.id}`,
      title: task.title,
    });
  } catch (error) {
    console.error('Share failed:', error);
  }
};
```

## App Store Requirements

### Privacy Manifest (iOS 17+)

Required for apps using certain APIs:

```xml
<!-- PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

### Required Privacy Strings

All in `Info.plist`:

```xml
<!-- Biometrics -->
<key>NSFaceIDUsageDescription</key>
<string>Use Face ID to securely access your account</string>

<!-- Camera (if using) -->
<key>NSCameraUsageDescription</key>
<string>Take photos for task attachments</string>

<!-- Location (if using) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Show nearby tasks and locations</string>

<!-- Photo Library -->
<key>NSPhotoLibraryUsageDescription</key>
<string>Attach photos to your tasks</string>

<!-- Siri -->
<key>NSSiriUsageDescription</key>
<string>Use Siri to manage tasks with voice commands</string>
```

### Human Interface Guidelines

Follow Apple's design guidelines:

1. **Navigation**: Use native navigation patterns
2. **Typography**: Use SF Pro font system
3. **Colors**: Support Dark Mode
4. **Spacing**: Use 8pt grid system
5. **Icons**: Use SF Symbols when possible
6. **Accessibility**: Support Dynamic Type, VoiceOver
7. **Haptics**: Use appropriate feedback

### App Review Guidelines

Common rejection reasons:

1. **Missing Privacy Strings**: Add all required descriptions
2. **Incomplete Features**: Test all advertised features
3. **Poor Performance**: Optimize launch time, memory usage
4. **Broken Links**: Test all deep links and web links
5. **Crashes**: Fix all crash logs
6. **Design Issues**: Follow HIG consistently

## Best Practices

### 1. Performance

```typescript
// ✅ Good: Lazy load iOS features
const BiometricAuth = Platform.OS === 'ios'
  ? require('./BiometricAuth').BiometricAuth
  : null;

// ✅ Good: Check availability before using
if (Platform.OS === 'ios' && Platform.Version >= 14) {
  await WidgetService.updateWidget(data);
}

// ❌ Bad: Import without checking
import { WidgetService } from './WidgetService'; // May fail on Android
```

### 2. Graceful Degradation

```typescript
// ✅ Good: Provide fallback
const { isAvailable, authenticate } = useBiometricAuth();

if (isAvailable) {
  return <BiometricButton onSuccess={handleLogin} />;
} else {
  return <PasswordInput onSubmit={handleLogin} />;
}

// ❌ Bad: Assume feature is available
return <BiometricButton onSuccess={handleLogin} />; // Crashes if not available
```

### 3. User Education

```typescript
// ✅ Good: Explain before requesting
<Onboarding>
  <Step>
    <Icon name="face-id" />
    <Title>Enable Face ID</Title>
    <Description>
      Quickly and securely access your account with Face ID
    </Description>
    <Button onPress={enableBiometrics}>Enable</Button>
    <Link onPress={skip}>Skip for now</Link>
  </Step>
</Onboarding>

// ❌ Bad: Request without explanation
await authenticate(); // User confused why Face ID appeared
```

### 4. Error Handling

```typescript
// ✅ Good: Handle all error cases
try {
  const result = await authenticate();
  if (result.success) {
    handleSuccess();
  } else {
    if (result.error === 'user_cancel') {
      // User cancelled, show alternative
      showPasswordLogin();
    } else {
      // Other error, show message
      showError(result.error);
    }
  }
} catch (error) {
  // Unexpected error
  console.error('Authentication failed:', error);
  showFallbackLogin();
}

// ❌ Bad: Assume success
const result = await authenticate();
handleSuccess(); // Crashes if authentication failed
```

## Testing

### 1. Simulator Testing

```bash
# Test on multiple iOS versions
xcrun simctl list devices

# Test widgets
# Add widget to simulator home screen
# Long press home screen → "+" → Search for your app

# Test Siri Shortcuts
xcrun simctl openurl booted "yourapp://tasks"

# Test Face ID (simulator)
# Features → Face ID → Enrolled
# Features → Face ID → Matching Face

# Test deep links
xcrun simctl openurl booted "yourapp://task/123"
```

### 2. Physical Device Testing

Required for:
- Face ID / Touch ID (actual biometric sensors)
- Live Activities on Dynamic Island
- Haptic feedback
- Performance testing
- App Clips
- Handoff (requires multiple devices)

### 3. TestFlight Beta Testing

```bash
# Archive and upload to TestFlight
1. Product → Archive in Xcode
2. Distribute App → App Store Connect
3. Upload
4. Add testers in App Store Connect
5. Collect feedback on iOS features
```

### 4. Feature Testing Checklist

- [ ] Home Screen Widgets
  - [ ] Small widget displays correctly
  - [ ] Medium widget displays correctly
  - [ ] Large widget displays correctly
  - [ ] Widget updates when app changes data
  - [ ] Deep links from widget work
  - [ ] Dark mode supported

- [ ] Siri Shortcuts
  - [ ] Shortcuts appear in Shortcuts app
  - [ ] Voice commands work
  - [ ] App launches correctly from Siri
  - [ ] Parameters passed correctly
  - [ ] Background execution works

- [ ] Biometrics
  - [ ] Face ID prompts correctly
  - [ ] Touch ID prompts correctly
  - [ ] Fallback to passcode works
  - [ ] Error handling works
  - [ ] Keychain storage works

- [ ] Live Activities
  - [ ] Activity starts correctly
  - [ ] Updates appear in real-time
  - [ ] Dynamic Island integration works
  - [ ] Lock screen appearance correct
  - [ ] Completion dismisses properly

## Troubleshooting

### Widgets Not Updating

**Problem**: Widget shows old data

**Solutions**:
1. Check App Groups configuration
2. Verify data is being written to shared container
3. Force reload widget: `WidgetKit.reloadAllTimelines()`
4. Check update budget: ~40-70 updates per day

### Siri Shortcuts Not Appearing

**Problem**: Shortcuts don't show in Shortcuts app

**Solutions**:
1. Verify NSUserActivity donation
2. Check `isEligibleForPrediction` and `isEligibleForSearch`
3. Wait 15-30 minutes for indexing
4. Delete and reinstall app
5. Check Siri permission in Settings

### Face ID Not Working

**Problem**: Face ID prompt doesn't appear

**Solutions**:
1. Add `NSFaceIDUsageDescription` to Info.plist
2. Check device enrollment: Settings → Face ID & Passcode
3. Verify permission granted: Settings → Your App
4. Use physical device (simulator may fail)

### Live Activities Not Starting

**Problem**: Live Activity doesn't appear

**Solutions**:
1. Add `NSSupportsLiveActivities` to Info.plist
2. Check iOS version (16.1+)
3. Verify activity isn't already started
4. Check device Focus mode settings
5. Restart device

### Deep Links Not Working

**Problem**: Widget/Siri links don't open app

**Solutions**:
1. Verify URL scheme in Info.plist: `CFBundleURLSchemes`
2. Add universal links in entitlements
3. Test URL scheme: `xcrun simctl openurl booted "yourapp://test"`
4. Check link handling in AppDelegate

### Build Errors

**Problem**: Xcode build fails with widget/extension errors

**Solutions**:
1. Clean build folder: Product → Clean Build Folder
2. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Update CocoaPods: `cd ios && pod install`
4. Check target deployment versions match
5. Verify all targets have same App Group

## Resources

### Apple Documentation

- [WidgetKit](https://developer.apple.com/documentation/widgetkit)
- [Siri Shortcuts](https://developer.apple.com/documentation/sirikit)
- [Local Authentication](https://developer.apple.com/documentation/localauthentication)
- [App Clips](https://developer.apple.com/documentation/app_clips)
- [Live Activities](https://developer.apple.com/documentation/activitykit)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)

### Expo Documentation

- [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [App Extensions](https://docs.expo.dev/guides/app-extensions/)

### Sample Projects

- [Apple Developer Samples](https://developer.apple.com/sample-code/)
- [React Native Widget Example](https://github.com/topics/react-native-widget)

## Next Steps

1. **Start Simple**: Implement Face ID authentication first
2. **Add Widgets**: Create home screen widget for key data
3. **Siri Integration**: Donate shortcuts for common actions
4. **Live Activities**: Add for long-running tasks
5. **Polish**: Add context menus, share, handoff
6. **Test**: TestFlight beta with iOS feature focus
7. **Monitor**: Track adoption of iOS features
8. **Iterate**: Improve based on user feedback
