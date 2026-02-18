# Live Activities Guide

Complete guide for implementing iOS Live Activities with Dynamic Island integration.

## Overview

Live Activities display real-time information on the Lock Screen, Dynamic Island (iPhone 14 Pro+), and Always-On Display.

### Perfect For

- **Progress tracking**: Task completion, downloads, timers
- **Live updates**: Sports scores, delivery status, ride tracking
- **Time-sensitive info**: Timers, countdowns, live events
- **Quick glances**: Without opening the app

### Display Locations

1. **Lock Screen**: Always visible widget
2. **Dynamic Island**: Compact pill on iPhone 14 Pro+
3. **Always-On Display**: Visible when screen is off
4. **Banner**: Temporary notification-style banner

## Requirements

- **iOS 16.1+**: Basic Live Activities
- **iOS 16.2+**: Push notification updates
- **iOS 17+**: Interactive buttons
- **iPhone 14 Pro+**: Dynamic Island

## Setup

### 1. Enable in Info.plist

```xml
<key>NSSupportsLiveActivities</key>
<true/>
```

### 2. Install Dependencies

```bash
# For React Native
npm install react-native-live-activities

# Or create native bridge
```

### 3. Create Widget Extension

In Xcode:
1. File → New → Target
2. Select "Widget Extension"
3. Check "Include Live Activity"
4. Name it "TaskActivityWidget"

## Implementation

### Basic Usage

```typescript
import { TaskLiveActivity } from './platform/ios/live-activities/TaskLiveActivity';

// Start activity
const activityId = await TaskLiveActivity.start(
  'task-123',
  'Complete project documentation',
  5 // total steps
);

// Update progress
await TaskLiveActivity.updateProgress(activityId, 2, 5);

// Complete
await TaskLiveActivity.complete(activityId);
```

### SwiftUI Implementation

Create `TaskActivity.swift`:

```swift
import ActivityKit
import SwiftUI

// Activity attributes (static data)
struct TaskActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var taskTitle: String
        var progress: Int
        var totalSteps: Int
        var currentStep: Int
        var status: Status
        var estimatedCompletion: String?

        enum Status: String, Codable {
            case inProgress = "in_progress"
            case paused = "paused"
            case completed = "completed"
        }
    }

    var taskId: String
    var startTime: Date
}

// Live Activity widget
@main
struct TaskActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TaskActivityAttributes.self) { context in
            // Lock Screen UI
            LockScreenView(context: context)
        } dynamicIsland: { context in
            // Dynamic Island UI
            DynamicIsland {
                // Expanded view
                DynamicIslandExpandedRegion(.leading) {
                    TaskIcon()
                }
                DynamicIslandExpandedRegion(.trailing) {
                    ProgressCircle(progress: context.state.progress)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.taskTitle)
                        .font(.headline)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    ProgressBar(
                        current: context.state.currentStep,
                        total: context.state.totalSteps
                    )
                }
            } compactLeading: {
                // Compact leading (left side of pill)
                TaskIcon()
            } compactTrailing: {
                // Compact trailing (right side of pill)
                ProgressIndicator(progress: context.state.progress)
            } minimal: {
                // Minimal view (when multiple activities)
                ProgressIndicator(progress: context.state.progress)
            }
        }
    }
}

// Lock Screen view
struct LockScreenView: View {
    let context: ActivityViewContext<TaskActivityAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.blue)
                Text(context.state.taskTitle)
                    .font(.headline)
                Spacer()
                Text("\(context.state.currentStep)/\(context.state.totalSteps)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            ProgressView(value: Double(context.state.progress) / 100)
                .tint(.blue)

            if let eta = context.state.estimatedCompletion {
                Text("ETA: \(eta)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
    }
}
```

## Dynamic Island Regions

### Expanded View

Full-screen takeover when tapped:

```swift
DynamicIsland {
    DynamicIslandExpandedRegion(.leading) {
        // Left side content (40x40 pt)
    }

    DynamicIslandExpandedRegion(.trailing) {
        // Right side content (40x40 pt)
    }

    DynamicIslandExpandedRegion(.center) {
        // Center content (main focus)
    }

    DynamicIslandExpandedRegion(.bottom) {
        // Bottom content (full width)
    }
}
```

### Compact View

Small pill when collapsed:

```swift
compactLeading: {
    // Left side of pill (16x16 pt)
    Image(systemName: "checkmark")
}

compactTrailing: {
    // Right side of pill (24x24 pt)
    Text("\(progress)%")
}
```

### Minimal View

Smallest representation:

```swift
minimal: {
    // Single icon (16x16 pt)
    Image(systemName: "checkmark.circle")
}
```

## Push Notification Updates

### Get Push Token

```typescript
// Get activity push token
const activityId = await TaskLiveActivity.start(...);
const pushToken = await TaskLiveActivity.getPushToken(activityId);

// Send to your server
await api.registerActivityPushToken(activityId, pushToken);
```

### Server-Side Update

```bash
# APNs push notification
curl -X POST https://api.push.apple.com/3/device/{push_token} \
  -H "authorization: bearer $JWT_TOKEN" \
  -H "apns-topic: $BUNDLE_ID.push-type.liveactivity" \
  -H "apns-push-type: liveactivity" \
  -d '{
    "aps": {
      "timestamp": 1234567890,
      "event": "update",
      "content-state": {
        "progress": 75,
        "currentStep": 3,
        "totalSteps": 4
      }
    }
  }'
```

## Best Practices

### 1. Keep Activities Short

```typescript
// ✅ Good: < 8 hours
const activityId = await TaskLiveActivity.start(
  'task-123',
  'Quick task',
  3,
  {
    staleDate: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
  }
);

// ❌ Bad: Days-long activities
// Live Activities are not for long-term monitoring
```

### 2. Update Frequency

```typescript
// ✅ Good: Batch updates
let pendingUpdate = null;

function scheduleUpdate(data) {
  if (!pendingUpdate) {
    pendingUpdate = setTimeout(() => {
      TaskLiveActivity.updateProgress(...);
      pendingUpdate = null;
    }, 5000); // 5 seconds
  }
}

// ❌ Bad: Update on every change
taskProgress.onChange((progress) => {
  TaskLiveActivity.updateProgress(...); // Too frequent!
});
```

### 3. Handle Completion

```typescript
// ✅ Good: Dismiss after completion
await TaskLiveActivity.complete(activityId, {
  dismissAfter: 5, // seconds
});

// ❌ Bad: Leave activity indefinitely
await TaskLiveActivity.updateProgress(activityId, 100, 100);
// Activity stays forever
```

### 4. Error Handling

```typescript
// ✅ Good: Handle activity limits
try {
  const activityId = await TaskLiveActivity.start(...);
} catch (error) {
  if (error.code === 'ACTIVITY_LIMIT_EXCEEDED') {
    // User has too many active Live Activities
    Alert.alert('Too Many Activities', 'Please complete existing activities first');
  }
}
```

## Testing

### 1. Simulator Testing

```bash
# Run on simulator
# Long press home indicator to see Dynamic Island
# Lock device to see Lock Screen widget
```

### 2. Physical Device

Required for:
- Actual Dynamic Island (iPhone 14 Pro+)
- Always-On Display
- Push notification updates
- Real-world performance

### 3. Debug Logging

```swift
// In Swift code
print("[LiveActivity] Activity started: \(activityId)")

// View logs in Xcode
# Window → Devices and Simulators → Open Console
```

## Limitations

1. **8 Hours Maximum**: Activities end after 8 hours
2. **Size Limit**: Keep UI simple and lightweight
3. **No Interaction** (iOS 16): Buttons only work in iOS 17+
4. **Update Budget**: Limited number of updates per hour
5. **One at a Time**: Only one activity per app visible in Dynamic Island
6. **Background Only**: Must start from app, not background task

## Resources

- [ActivityKit Documentation](https://developer.apple.com/documentation/activitykit)
- [Displaying live data with Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)
- [Dynamic Island Design Guidelines](https://developer.apple.com/design/human-interface-guidelines/live-activities)
- [Push Notification Updates](https://developer.apple.com/documentation/activitykit/update-and-end-your-live-activity-with-activitykit-push-notifications)

## Next Steps

1. [ ] Create Widget Extension with Live Activity support
2. [ ] Implement activity start/update/end
3. [ ] Design Dynamic Island UI
4. [ ] Design Lock Screen UI
5. [ ] Test on iPhone 14 Pro+ (Dynamic Island)
6. [ ] Test on other iPhones (Lock Screen only)
7. [ ] Implement push notification updates
8. [ ] Monitor activity duration and update frequency
9. [ ] Gather user feedback
