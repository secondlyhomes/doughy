# iOS Home Screen Widgets Guide

Complete guide for implementing iOS Home Screen Widgets in your React Native + Expo app.

## Table of Contents

- [Overview](#overview)
- [Requirements](#requirements)
- [Setup](#setup)
- [Widget Sizes](#widget-sizes)
- [Implementation](#implementation)
- [Data Synchronization](#data-synchronization)
- [Deep Linking](#deep-linking)
- [Timeline Management](#timeline-management)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

iOS Home Screen Widgets allow users to view app content directly on their home screen without opening the app. Widgets are built using SwiftUI and WidgetKit, and communicate with your React Native app through shared data storage.

### Key Features

- **Three sizes**: Small (2x2), Medium (4x2), Large (4x4)
- **Timeline-based**: Provide multiple snapshots for different times
- **Deep linking**: Navigate to specific screens when tapped
- **Background updates**: System-managed refresh schedule
- **App Groups**: Share data between app and widget extension

### iOS Version Requirements

- **iOS 14+**: Basic widget support
- **iOS 16+**: Lock Screen widgets
- **iOS 17+**: Interactive widgets

## Requirements

### 1. Development Environment

```bash
# Xcode 14.0+
xcode-select --install

# CocoaPods
sudo gem install cocoapods

# React Native dependencies
npm install react-native-widget-extension
npm install @react-native-async-storage/async-storage
```

### 2. Xcode Configuration

**App Groups** (required for data sharing):
1. Open `ios/YourApp.xcworkspace` in Xcode
2. Select your app target
3. Go to "Signing & Capabilities"
4. Click "+ Capability" → "App Groups"
5. Add group: `group.com.yourcompany.yourapp.shared`

**Widget Extension Target**:
1. File → New → Target
2. Select "Widget Extension"
3. Name it `TaskWidget`
4. Enable "Include Configuration Intent" if you want user-configurable widgets

### 3. Info.plist Configuration

Add to your main app's `Info.plist`:

```xml
<key>NSSupportsLiveActivities</key>
<true/>
<key>UIBackgroundModes</key>
<array>
  <string>fetch</string>
  <string>processing</string>
</array>
```

## Setup

### Step 1: Create Widget Extension in Xcode

```bash
# In Xcode:
# File → New → Target → Widget Extension
# Name: TaskWidget
# Language: Swift
# Include Configuration Intent: No (for now)
```

### Step 2: Configure App Groups

Both your main app and widget extension need the same App Group:

**Main App Target:**
- Signing & Capabilities → App Groups
- Add: `group.com.yourcompany.yourapp.shared`

**Widget Extension Target:**
- Signing & Capabilities → App Groups
- Add: `group.com.yourcompany.yourapp.shared`

### Step 3: Create Widget SwiftUI Code

Create `TaskWidget.swift` in your widget extension:

```swift
import WidgetKit
import SwiftUI

// MARK: - Widget Data Model
struct TaskWidgetEntry: TimelineEntry {
    let date: Date
    let tasks: [Task]
    let completedCount: Int
    let totalCount: Int
}

struct Task: Codable, Identifiable {
    let id: String
    let title: String
    let completed: Bool
    let priority: Priority

    enum Priority: String, Codable {
        case low, medium, high
    }
}

// MARK: - Timeline Provider
struct TaskWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> TaskWidgetEntry {
        TaskWidgetEntry(
            date: Date(),
            tasks: placeholderTasks(),
            completedCount: 2,
            totalCount: 5
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (TaskWidgetEntry) -> ()) {
        let entry = loadWidgetData()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskWidgetEntry>) -> ()) {
        let currentDate = Date()
        let entry = loadWidgetData()

        // Update every 15 minutes
        let nextUpdate = Calendar.current.date(
            byAdding: .minute,
            value: 15,
            to: currentDate
        )!

        let timeline = Timeline(
            entries: [entry],
            policy: .after(nextUpdate)
        )

        completion(timeline)
    }

    // MARK: - Data Loading
    private func loadWidgetData() -> TaskWidgetEntry {
        guard let sharedContainer = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: "group.com.yourcompany.yourapp.shared"
        ) else {
            return placeholderEntry()
        }

        let dataURL = sharedContainer.appendingPathComponent("widget_data.json")

        guard let data = try? Data(contentsOf: dataURL),
              let widgetData = try? JSONDecoder().decode(WidgetData.self, from: data) else {
            return placeholderEntry()
        }

        return TaskWidgetEntry(
            date: Date(),
            tasks: widgetData.tasks,
            completedCount: widgetData.completedCount,
            totalCount: widgetData.totalCount
        )
    }

    private func placeholderEntry() -> TaskWidgetEntry {
        TaskWidgetEntry(
            date: Date(),
            tasks: [],
            completedCount: 0,
            totalCount: 0
        )
    }

    private func placeholderTasks() -> [Task] {
        [
            Task(id: "1", title: "Morning standup", completed: true, priority: .high),
            Task(id: "2", title: "Review PRs", completed: false, priority: .medium),
            Task(id: "3", title: "Update documentation", completed: false, priority: .low),
        ]
    }
}

// MARK: - Widget Data Model
struct WidgetData: Codable {
    let tasks: [Task]
    let completedCount: Int
    let totalCount: Int
    let lastUpdated: String
}

// MARK: - Widget Views
struct TaskWidgetSmallView: View {
    let entry: TaskWidgetEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Tasks")
                    .font(.headline)
                Spacer()
            }

            Spacer()

            ZStack {
                Circle()
                    .stroke(lineWidth: 6)
                    .opacity(0.3)
                    .foregroundColor(.blue)

                Circle()
                    .trim(from: 0.0, to: progressPercentage)
                    .stroke(style: StrokeStyle(lineWidth: 6, lineCap: .round))
                    .foregroundColor(.blue)
                    .rotationEffect(Angle(degrees: -90))

                Text("\(Int(progressPercentage * 100))%")
                    .font(.system(size: 24, weight: .bold))
            }
            .frame(width: 60, height: 60)

            Spacer()

            Text("\(entry.completedCount)/\(entry.totalCount)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }

    var progressPercentage: CGFloat {
        guard entry.totalCount > 0 else { return 0 }
        return CGFloat(entry.completedCount) / CGFloat(entry.totalCount)
    }
}

struct TaskWidgetMediumView: View {
    let entry: TaskWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Today's Tasks")
                    .font(.headline)
                Spacer()
                Text("\(entry.completedCount)/\(entry.totalCount)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.secondary.opacity(0.2))
                    .cornerRadius(8)
            }

            if entry.tasks.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    Text("No tasks")
                        .foregroundColor(.secondary)
                    Spacer()
                }
                Spacer()
            } else {
                ForEach(entry.tasks.prefix(3)) { task in
                    TaskRow(task: task)
                }
            }

            Spacer()
        }
        .padding()
    }
}

struct TaskWidgetLargeView: View {
    let entry: TaskWidgetEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading) {
                    Text("My Tasks")
                        .font(.headline)
                    Text("\(entry.completedCount) of \(entry.totalCount) completed")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Text("\(entry.totalCount)")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.secondary)
            }

            // Progress bar
            ProgressView(value: progressPercentage)
                .tint(.blue)

            // Task list
            if entry.tasks.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 4) {
                        Text("No tasks yet")
                            .foregroundColor(.secondary)
                        Text("Tap to add your first task")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
                Spacer()
            } else {
                ForEach(entry.tasks.prefix(7)) { task in
                    TaskRow(task: task)
                }
            }

            Spacer()

            // Footer
            Divider()
            Text("Tap to open app")
                .font(.caption2)
                .foregroundColor(.secondary)
                .frame(maxWidth: .infinity, alignment: .center)
        }
        .padding()
    }

    var progressPercentage: Double {
        guard entry.totalCount > 0 else { return 0 }
        return Double(entry.completedCount) / Double(entry.totalCount)
    }
}

struct TaskRow: View {
    let task: Task

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: task.completed ? "checkmark.circle.fill" : "circle")
                .foregroundColor(task.completed ? .blue : .secondary)
                .font(.system(size: 20))

            Text(task.title)
                .font(.subheadline)
                .strikethrough(task.completed)
                .foregroundColor(task.completed ? .secondary : .primary)

            Spacer()

            if task.priority == .high {
                Circle()
                    .fill(Color.red)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Widget Configuration
@main
struct TaskWidgetBundle: WidgetBundle {
    var body: some Widget {
        TaskWidget()
    }
}

struct TaskWidget: Widget {
    let kind: String = "TaskWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TaskWidgetProvider()) { entry in
            TaskWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Tasks")
        .description("View your daily tasks at a glance")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct TaskWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    let entry: TaskWidgetEntry

    var body: some View {
        switch widgetFamily {
        case .systemSmall:
            TaskWidgetSmallView(entry: entry)
        case .systemMedium:
            TaskWidgetMediumView(entry: entry)
        case .systemLarge:
            TaskWidgetLargeView(entry: entry)
        default:
            TaskWidgetMediumView(entry: entry)
        }
    }
}
```

### Step 4: React Native Integration

```typescript
// src/services/widgetService.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';

export class WidgetService {
  private static readonly WIDGET_DATA_KEY = 'widget_data';

  /**
   * Update widget with latest task data
   */
  static async updateWidget(tasks: Task[]) {
    if (Platform.OS !== 'ios') return;

    try {
      const completedCount = tasks.filter(t => t.completed).length;
      const widgetData = {
        tasks: tasks.slice(0, 10), // Top 10 tasks
        completedCount,
        totalCount: tasks.length,
        lastUpdated: new Date().toISOString(),
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(
        this.WIDGET_DATA_KEY,
        JSON.stringify(widgetData)
      );

      // Save to App Group container (requires native module)
      // await NativeModules.WidgetKit.updateWidget(widgetData);

      // Reload widget
      // await NativeModules.WidgetKit.reloadAllTimelines();

    } catch (error) {
      console.error('Failed to update widget:', error);
    }
  }

  /**
   * Call this whenever task data changes
   */
  static async syncWithWidget(tasks: Task[]) {
    await this.updateWidget(tasks);
  }
}
```

## Widget Sizes

### Small Widget (2x2)

**Dimensions**: 158x158 points (iPhone), 141x141 points (iPad)

**Best for**:
- Quick stats (count, percentage)
- Single metric
- Glanceable information

**Design guidelines**:
- Minimal text
- Large, clear numbers
- Simple icons

### Medium Widget (4x2)

**Dimensions**: 338x158 points (iPhone), 305x141 points (iPad)

**Best for**:
- List of 3-4 items
- Summary with detail
- Multiple metrics

**Design guidelines**:
- 2-3 lines per item
- Clear hierarchy
- Balanced layout

### Large Widget (4x4)

**Dimensions**: 338x354 points (iPhone), 305x305 points (iPad)

**Best for**:
- List of 7-8 items
- Detailed information
- Rich content

**Design guidelines**:
- More content, still scannable
- Clear sections
- Action-oriented footer

## Data Synchronization

### App Groups Setup

1. **Enable App Groups in Xcode**:
   - Main app target → Capabilities → App Groups → ON
   - Widget extension target → Capabilities → App Groups → ON
   - Use same group ID: `group.com.yourcompany.yourapp.shared`

2. **Write data from React Native**:

```typescript
// Save to shared container
const saveWidgetData = async (data: WidgetData) => {
  try {
    // Save locally
    await AsyncStorage.setItem('widget_data', JSON.stringify(data));

    // Save to shared container (via native module)
    const sharedPath = await NativeModules.WidgetKit.getSharedContainerPath();
    const filePath = `${sharedPath}/widget_data.json`;
    await RNFS.writeFile(filePath, JSON.stringify(data), 'utf8');

    // Reload widget
    await NativeModules.WidgetKit.reloadAllTimelines();
  } catch (error) {
    console.error('Failed to save widget data:', error);
  }
};
```

3. **Read data from Swift**:

```swift
private func loadWidgetData() -> WidgetData? {
    guard let sharedContainer = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: "group.com.yourcompany.yourapp.shared"
    ) else {
        return nil
    }

    let dataURL = sharedContainer.appendingPathComponent("widget_data.json")

    guard let data = try? Data(contentsOf: dataURL) else {
        return nil
    }

    return try? JSONDecoder().decode(WidgetData.self, from: data)
}
```

### Update Frequency

Widgets have a **limited update budget** (~40-70 updates per day):

```typescript
// Update strategies
export enum UpdateStrategy {
  Immediate = 'immediate',     // Critical updates only
  Batched = 'batched',        // Batch updates every 15 min
  Scheduled = 'scheduled',    // Specific times only
}

// Implement smart updating
class SmartWidgetUpdater {
  private lastUpdate: Date | null = null;
  private pendingUpdate = false;

  async scheduleUpdate(data: WidgetData, priority: 'high' | 'low' = 'low') {
    const now = new Date();
    const timeSinceLastUpdate = this.lastUpdate
      ? now.getTime() - this.lastUpdate.getTime()
      : Infinity;

    // High priority: update immediately
    if (priority === 'high') {
      await this.updateWidget(data);
      return;
    }

    // Low priority: batch if updated recently
    if (timeSinceLastUpdate < 15 * 60 * 1000) { // 15 minutes
      this.pendingUpdate = true;
      setTimeout(() => this.flushUpdate(data), 15 * 60 * 1000);
    } else {
      await this.updateWidget(data);
    }
  }

  private async updateWidget(data: WidgetData) {
    await WidgetService.updateWidget(data.tasks);
    this.lastUpdate = new Date();
    this.pendingUpdate = false;
  }

  private async flushUpdate(data: WidgetData) {
    if (this.pendingUpdate) {
      await this.updateWidget(data);
    }
  }
}
```

## Deep Linking

### Configure URL Scheme

1. **Add URL scheme in Info.plist**:

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

2. **Add deep link to widget in Swift**:

```swift
struct TaskWidgetEntryView: View {
    let entry: TaskWidgetEntry

    var body: some View {
        TaskWidgetMediumView(entry: entry)
            .widgetURL(URL(string: "yourapp://tasks"))
    }
}

// For individual items
ForEach(entry.tasks) { task in
    Link(destination: URL(string: "yourapp://task/\(task.id)")!) {
        TaskRow(task: task)
    }
}
```

3. **Handle deep links in React Native**:

```typescript
// App.tsx
import { Linking } from 'react-native';

useEffect(() => {
  // Handle initial URL
  Linking.getInitialURL().then(url => {
    if (url) handleDeepLink(url);
  });

  // Handle incoming URLs while app is open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return () => subscription.remove();
}, []);

function handleDeepLink(url: string) {
  // yourapp://tasks
  if (url.includes('tasks')) {
    navigation.navigate('Tasks');
  }

  // yourapp://task/123
  const taskMatch = url.match(/task\/(\w+)/);
  if (taskMatch) {
    navigation.navigate('TaskDetail', { taskId: taskMatch[1] });
  }
}
```

## Timeline Management

### Timeline Provider

Provide multiple snapshots for different times:

```swift
func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    var entries: [TaskWidgetEntry] = []
    let currentDate = Date()

    // Generate entries for next 6 hours
    for hourOffset in 0 ..< 6 {
        let entryDate = Calendar.current.date(
            byAdding: .hour,
            value: hourOffset,
            to: currentDate
        )!

        let entry = loadWidgetData(for: entryDate)
        entries.append(entry)
    }

    // Reload policy
    let nextUpdate = Calendar.current.date(
        byAdding: .hour,
        value: 6,
        to: currentDate
    )!

    let timeline = Timeline(
        entries: entries,
        policy: .after(nextUpdate)
    )

    completion(timeline)
}
```

### Reload Policies

```swift
// Update after specific date
.policy(.after(nextUpdateDate))

// Update at specific date
.policy(.atEnd)

// Never update automatically
.policy(.never)
```

## Testing

### 1. Test in Xcode

```bash
# Select widget scheme
# Product → Scheme → TaskWidget

# Run on simulator or device
# The widget will appear in widget gallery

# Add widget to home screen:
# Long press home screen → "+" → Search "Tasks"
```

### 2. Test Data Updates

```typescript
// In your React Native app
import { WidgetService } from './services/widgetService';

// Update widget with test data
const testTasks: Task[] = [
  { id: '1', title: 'Test task 1', completed: false, priority: 'high' },
  { id: '2', title: 'Test task 2', completed: true, priority: 'medium' },
  { id: '3', title: 'Test task 3', completed: false, priority: 'low' },
];

await WidgetService.updateWidget(testTasks);
```

### 3. Test Deep Links

```bash
# Using xcrun simctl (simulator only)
xcrun simctl openurl booted "yourapp://tasks"
xcrun simctl openurl booted "yourapp://task/123"
```

### 4. Debug Widget

Add logging to Swift code:

```swift
import os.log

private let log = OSLog(subsystem: "com.yourapp.widget", category: "TaskWidget")

os_log("Loading widget data...", log: log, type: .info)
```

View logs:
```bash
# In Terminal
log stream --predicate 'subsystem == "com.yourapp.widget"' --level debug
```

## Best Practices

### 1. Performance

- **Keep it light**: Widgets should load in <1 second
- **Optimize images**: Use SF Symbols when possible
- **Limit data**: Only display most relevant information
- **Cache data**: Don't fetch from network in widget

### 2. Design

- **Follow HIG**: Use iOS design patterns
- **Dark mode**: Support both light and dark appearances
- **Accessibility**: Use proper contrast ratios, font sizes
- **Consistency**: Match your app's visual style

### 3. Data Management

- **Update smartly**: Respect system's update budget
- **Handle errors**: Always have fallback data
- **Validate data**: Check data integrity from shared storage
- **Clean up**: Remove old data when no longer needed

### 4. User Experience

- **Clear purpose**: Widget should have single, clear purpose
- **Tap targets**: Make tappable areas large enough (44x44 pt minimum)
- **Empty states**: Design for when there's no data
- **Loading states**: Show placeholder while loading

## Troubleshooting

### Widget Not Updating

1. **Check App Group configuration**:
   - Both targets have same App Group ID
   - App Group is enabled in Apple Developer portal

2. **Verify data is being written**:
   ```typescript
   const data = await AsyncStorage.getItem('widget_data');
   console.log('Widget data:', data);
   ```

3. **Force reload widget**:
   ```typescript
   await NativeModules.WidgetKit.reloadAllTimelines();
   ```

### Widget Shows Placeholder

- Data file might not exist in shared container
- Check file path is correct
- Verify JSON structure matches Swift model

### Deep Links Not Working

1. **Check URL scheme in Info.plist**
2. **Verify URL format in widget**:
   ```swift
   .widgetURL(URL(string: "yourapp://tasks")!)
   ```
3. **Test URL scheme manually**:
   ```bash
   xcrun simctl openurl booted "yourapp://test"
   ```

### Widget Crashes

- Check Swift code for force unwraps (`!`)
- Add proper error handling
- Use optional chaining (`?.`)
- View crash logs in Xcode → Window → Devices and Simulators

## Resources

- [Apple WidgetKit Documentation](https://developer.apple.com/documentation/widgetkit)
- [Human Interface Guidelines - Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets)
- [WWDC 2020: Widgets Code-Along](https://developer.apple.com/videos/play/wwdc2020/10034/)
- [App Groups Documentation](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_security_application-groups)

## Next Steps

- [ ] Implement widget timeline for different times of day
- [ ] Add user-configurable widget (IntentConfiguration)
- [ ] Support Lock Screen widgets (iOS 16+)
- [ ] Implement interactive widgets (iOS 17+)
- [ ] Add widget to TestFlight for testing
- [ ] Monitor widget reload budget in production
