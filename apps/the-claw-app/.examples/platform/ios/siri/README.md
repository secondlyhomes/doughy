# Siri Shortcuts Integration Guide

Complete guide for implementing Siri Shortcuts in your React Native + Expo app.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Setup](#setup)
- [Shortcut Types](#shortcut-types)
- [Implementation](#implementation)
- [Intent Definition](#intent-definition)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Siri Shortcuts allow users to perform app actions using voice commands or the Shortcuts app. There are two types:

1. **NSUserActivity Shortcuts**: Simple shortcuts donated during app use
2. **Custom Intents**: Complex shortcuts with parameters and custom UI

### Benefits

- **Convenience**: Users can perform actions without opening app
- **Discoverability**: Appears in Siri Suggestions, Spotlight Search
- **Automation**: Users can create multi-step workflows
- **Accessibility**: Voice control for all app features

## Requirements

### iOS Version Support

- **iOS 10+**: Basic Siri integration
- **iOS 12+**: Siri Shortcuts with NSUserActivity
- **iOS 13+**: Parameters and complex intents
- **iOS 14+**: App Clips integration
- **iOS 16+**: App Intents framework (recommended)

### Development Tools

```bash
# Install dependencies
npm install react-native-siri-shortcut
# or
npm install react-native-siri

# iOS-specific setup
cd ios && pod install
```

### Xcode Configuration

1. **Enable Siri Capability**:
   - Open Xcode → Target → Signing & Capabilities
   - Click "+ Capability"
   - Add "Siri"

2. **Add Privacy String** to `Info.plist`:

```xml
<key>NSSiriUsageDescription</key>
<string>Use Siri to manage your tasks with voice commands</string>
```

3. **Add URL Scheme** for deep linking:

```xml
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

## Setup

### Step 1: Request Siri Permission

```typescript
import { NativeModules } from 'react-native';

async function requestSiriPermission() {
  try {
    // Request Siri authorization
    const status = await NativeModules.SiriShortcuts.requestAuthorization();

    if (status === 'authorized') {
      console.log('Siri access granted');
      return true;
    } else {
      console.log('Siri access denied');
      return false;
    }
  } catch (error) {
    console.error('Failed to request Siri permission:', error);
    return false;
  }
}
```

### Step 2: Configure App Delegate

Add to `AppDelegate.m`:

```objc
#import <Intents/Intents.h>

// Handle continued NSUserActivity (from Siri)
- (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
  if ([userActivity.activityType isEqualToString:@"com.yourapp.createTask"]) {
    // Handle create task shortcut
    NSString *taskTitle = userActivity.userInfo[@"taskTitle"];

    // Notify React Native
    [[NSNotificationCenter defaultCenter] postNotificationName:@"SiriShortcutReceived"
                                                        object:nil
                                                      userInfo:@{@"action": @"createTask", @"taskTitle": taskTitle}];
    return YES;
  }

  return NO;
}
```

### Step 3: Native Module Bridge

Create `SiriShortcuts.swift`:

```swift
import Foundation
import Intents

@objc(SiriShortcuts)
class SiriShortcuts: NSObject {

  @objc
  func requestAuthorization(_ resolve: @escaping RCTPromiseResolveBlock,
                           rejecter reject: @escaping RCTPromiseRejectBlock) {
    INPreferences.requestSiriAuthorization { status in
      switch status {
      case .authorized:
        resolve("authorized")
      case .denied:
        resolve("denied")
      case .notDetermined:
        resolve("notDetermined")
      case .restricted:
        resolve("restricted")
      @unknown default:
        resolve("unknown")
      }
    }
  }

  @objc
  func donateShortcut(_ options: NSDictionary,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {

    guard let activityType = options["activityType"] as? String,
          let title = options["title"] as? String else {
      reject("INVALID_PARAMS", "Missing required parameters", nil)
      return
    }

    let userActivity = NSUserActivity(activityType: activityType)
    userActivity.title = title
    userActivity.userInfo = options["userInfo"] as? [String: Any]
    userActivity.isEligibleForSearch = options["isEligibleForSearch"] as? Bool ?? true
    userActivity.isEligibleForPrediction = options["isEligibleForPrediction"] as? Bool ?? true

    if let phrase = options["suggestedInvocationPhrase"] as? String {
      userActivity.suggestedInvocationPhrase = phrase
    }

    if let persistentIdentifier = options["persistentIdentifier"] as? String {
      userActivity.persistentIdentifier = persistentIdentifier
    }

    // Donate the shortcut
    userActivity.becomeCurrent()

    resolve(true)
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
```

Create `SiriShortcuts.m`:

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SiriShortcuts, NSObject)

RCT_EXTERN_METHOD(requestAuthorization:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(donateShortcut:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
```

## Shortcut Types

### 1. NSUserActivity Shortcuts (Simple)

Best for actions without parameters.

```typescript
import { SiriShortcuts } from './platform/ios/siri/shortcuts';

// Donate "View Tasks" shortcut
await SiriShortcuts.donateViewTasks();

// User can now say: "Hey Siri, show my tasks"
```

**Pros**:
- Easy to implement
- No Intents Extension needed
- Quick setup

**Cons**:
- Limited customization
- No parameters
- Basic UI

### 2. Custom Intents (Advanced)

Best for actions with parameters and custom UI.

```typescript
// Create intent definition in Xcode
// Then donate with parameters
await SiriShortcuts.donateCreateTask('Buy groceries', {
  priority: 'high',
  dueDate: '2024-12-25',
});

// User can say: "Hey Siri, create task Buy groceries"
```

**Pros**:
- Support parameters
- Custom Siri UI
- Rich responses

**Cons**:
- Requires Intents Extension
- More complex setup
- Longer development time

## Implementation

### Basic Shortcut Donation

Donate shortcuts when user performs actions:

```typescript
import { SiriShortcuts } from './platform/ios/siri/shortcuts';

// When user creates a task
async function handleTaskCreated(task: Task) {
  // Save task to database
  await saveTask(task);

  // Donate shortcut to Siri
  await SiriShortcuts.donateCreateTask(task.title);

  // User can now say: "Hey Siri, create task [title]"
}

// When user completes a task
async function handleTaskCompleted(task: Task) {
  await markTaskComplete(task.id);

  // Donate shortcut
  await SiriShortcuts.donateCompleteTask(task.id, task.title);
}

// When user views tasks
async function handleViewTasks(filter?: string) {
  // Donate shortcut
  await SiriShortcuts.donateViewTasks(filter);
}
```

### Suggested Shortcuts

Setup suggested shortcuts on app launch:

```typescript
// App.tsx
import { SiriShortcuts } from './platform/ios/siri/shortcuts';

useEffect(() => {
  // Setup suggested shortcuts
  SiriShortcuts.setupSuggestedShortcuts();
}, []);
```

This makes shortcuts appear in:
- Settings → Siri & Search → Your App
- Shortcuts app → Gallery → Your App
- Siri Suggestions

### Handle Shortcut Execution

```typescript
// App.tsx
import { Linking } from 'react-native';
import { WidgetDeepLinkHandler } from './platform/ios/widgets/widgetConfig';

useEffect(() => {
  // Handle initial URL (app opened via Siri)
  Linking.getInitialURL().then(url => {
    if (url) {
      handleSiriShortcut(url);
    }
  });

  // Handle URLs while app is running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleSiriShortcut(url);
  });

  return () => subscription.remove();
}, []);

function handleSiriShortcut(url: string) {
  const handled = WidgetDeepLinkHandler.handleDeepLink(url, navigation);

  if (!handled) {
    console.warn('Unknown Siri shortcut URL:', url);
  }
}
```

## Intent Definition

For advanced shortcuts with parameters, create Intent Definition file in Xcode.

### Step 1: Create Intent Definition

1. In Xcode: File → New → File
2. Select "SiriKit Intent Definition File"
3. Name it "Intents.intentdefinition"
4. Add to both app target and Intents Extension target

### Step 2: Define Intent

```
Intent: CreateTaskIntent
Category: Create
Title: Create Task

Parameters:
- taskTitle (String, required)
  - Display Name: "Task Title"
  - Prompt: "What would you like to call this task?"

- priority (Priority enum, optional)
  - Display Name: "Priority"
  - Options: Low, Medium, High
  - Prompt: "What priority should this task have?"

- dueDate (Date, optional)
  - Display Name: "Due Date"
  - Prompt: "When is this task due?"

Response:
- success (Boolean)
- message (String)
- taskId (String)

Siri Dialog:
Success: "I've created the task '${taskTitle}'"
Failure: "Sorry, I couldn't create the task"
```

### Step 3: Create Intents Extension

1. File → New → Target
2. Select "Intents Extension"
3. Name it "SiriIntents"

Create `IntentHandler.swift`:

```swift
import Intents

class CreateTaskIntentHandler: NSObject, CreateTaskIntentHandling {

  func handle(intent: CreateTaskIntent,
              completion: @escaping (CreateTaskIntentResponse) -> Void) {

    guard let taskTitle = intent.taskTitle else {
      completion(CreateTaskIntentResponse(code: .failure, userActivity: nil))
      return
    }

    // Create task (via API or shared storage)
    let taskId = createTask(
      title: taskTitle,
      priority: intent.priority,
      dueDate: intent.dueDate
    )

    if let taskId = taskId {
      let response = CreateTaskIntentResponse(code: .success, userActivity: nil)
      response.message = "Created task: \(taskTitle)"
      response.taskId = taskId
      completion(response)
    } else {
      completion(CreateTaskIntentResponse(code: .failure, userActivity: nil))
    }
  }

  func confirm(intent: CreateTaskIntent,
               completion: @escaping (CreateTaskIntentResponse) -> Void) {
    // Validate parameters
    if let taskTitle = intent.taskTitle, !taskTitle.isEmpty {
      completion(CreateTaskIntentResponse(code: .ready, userActivity: nil))
    } else {
      completion(CreateTaskIntentResponse(code: .failure, userActivity: nil))
    }
  }
}

class IntentHandler: INExtension {

  override func handler(for intent: INIntent) -> Any {
    if intent is CreateTaskIntent {
      return CreateTaskIntentHandler()
    }

    fatalError("Unhandled intent type: \(intent)")
  }
}
```

## Testing

### 1. Test in Settings

1. Open Settings → Siri & Search
2. Scroll to your app
3. Verify shortcuts appear
4. Tap "+" to add to Siri
5. Record custom phrase
6. Test with Siri

### 2. Test in Shortcuts App

1. Open Shortcuts app
2. Tap "+" to create new shortcut
3. Search for your app
4. Add your shortcut actions
5. Test shortcut

### 3. Test Voice Commands

```
"Hey Siri, [your recorded phrase]"
```

### 4. Test Programmatically

```typescript
// Trigger shortcut via URL (simulator/device)
Linking.openURL('yourapp://createTask?title=Test');
```

### 5. Debug Shortcuts

View logs:

```bash
# In Terminal
log stream --predicate 'subsystem == "com.yourapp"' --level debug

# Or in Xcode
# Window → Devices and Simulators → Open Console
```

## Best Practices

### 1. Donation Timing

```typescript
// ✅ Good: Donate after successful action
async function createTask(title: string) {
  const task = await api.createTask(title);

  // Only donate if successful
  if (task) {
    await SiriShortcuts.donateCreateTask(title);
  }

  return task;
}

// ❌ Bad: Donate before action completes
await SiriShortcuts.donateCreateTask(title);
await api.createTask(title); // Might fail
```

### 2. Invocation Phrases

```typescript
// ✅ Good: Clear, natural phrases
"Show my tasks"
"Create a task"
"Complete today's tasks"

// ❌ Bad: Awkward or ambiguous phrases
"Hey Siri, app tasks show" // Unnatural
"Do the thing" // Ambiguous
"Open the app and show tasks" // Too long
```

**Guidelines**:
- 2-100 characters
- Don't include "Hey Siri" or app name
- Use imperative verbs
- Keep it natural
- Make it unique

### 3. Handle Background Execution

```swift
// IntentHandler.swift
func handle(intent: CreateTaskIntent,
            completion: @escaping (CreateTaskIntentResponse) -> Void) {

  // ✅ Good: Complete quickly (< 10 seconds)
  DispatchQueue.global().async {
    let result = self.quickCreateTask(intent.taskTitle)

    DispatchQueue.main.async {
      completion(result)
    }
  }
}

// ❌ Bad: Long-running operations
// This will timeout and fail
let result = await slowAPICall() // Takes 30+ seconds
completion(result)
```

### 4. Error Handling

```typescript
// ✅ Good: Handle errors gracefully
try {
  await SiriShortcuts.donateCreateTask(taskTitle);
} catch (error) {
  // Log error but don't block user
  console.error('Failed to donate shortcut:', error);
  // Continue with task creation
}

// ❌ Bad: Let errors crash app
await SiriShortcuts.donateCreateTask(taskTitle); // Might throw
```

### 5. Privacy

```typescript
// ✅ Good: Don't donate sensitive data
await SiriShortcuts.donateViewTasks('work'); // Category is okay

// ❌ Bad: Expose sensitive info
await SiriShortcuts.donateViewTask(
  'password123',
  'My secret passwords'
); // This appears in Settings!
```

## Troubleshooting

### Shortcuts Not Appearing

**Problem**: Donated shortcuts don't show in Settings

**Solutions**:
1. Wait 15-30 minutes for indexing
2. Check `isEligibleForPrediction` = true
3. Verify Siri permission granted
4. Delete and reinstall app
5. Restart device

### Shortcut Fails to Execute

**Problem**: Siri says "There was a problem with the app"

**Solutions**:
1. Check URL scheme configured correctly
2. Verify deep link handling code
3. Test URL manually: `Linking.openURL('yourapp://test')`
4. Check Intent Extension if using Custom Intents
5. View logs for errors

### Siri Doesn't Recognize Phrase

**Problem**: Siri says "I don't understand"

**Solutions**:
1. Use clearer, more distinct phrase
2. Avoid similar phrases to other shortcuts
3. Don't use app name in phrase
4. Keep it simple and natural
5. Re-record phrase in Settings

### Intent Extension Crashes

**Problem**: Shortcut causes app to crash

**Solutions**:
1. Check Intent Extension logs
2. Verify parameter validation
3. Add error handling in `handle()` method
4. Test with Xcode debugger attached
5. Check shared container access

### Parameters Not Passed

**Problem**: Intent parameters are nil/empty

**Solutions**:
1. Verify Intent Definition matches code
2. Check parameter is marked as required
3. Add proper prompts in Intent Definition
4. Test parameter confirmation
5. Check Siri dialog configuration

## Resources

### Apple Documentation

- [SiriKit Documentation](https://developer.apple.com/documentation/sirikit)
- [Shortcuts and Suggestions](https://developer.apple.com/documentation/sirikit/shortcuts_and_suggestions)
- [Creating an Intents Extension](https://developer.apple.com/documentation/sirikit/creating_an_intents_app_extension)

### Sample Code

- [Apple Siri Shortcuts Sample](https://developer.apple.com/documentation/sirikit/soup_chef_accelerating_app_interactions_with_shortcuts)

### Videos

- [WWDC 2018: Introduction to Siri Shortcuts](https://developer.apple.com/videos/play/wwdc2018/211/)
- [WWDC 2019: Introducing Parameters for Shortcuts](https://developer.apple.com/videos/play/wwdc2019/213/)

## Next Steps

1. [ ] Implement basic shortcut donations (NSUserActivity)
2. [ ] Add suggested shortcuts
3. [ ] Test shortcuts in Settings and Shortcuts app
4. [ ] Create Intent Definition for advanced shortcuts
5. [ ] Implement Intents Extension
6. [ ] Add custom Siri UI
7. [ ] Test with real users
8. [ ] Monitor adoption and usage
