# Focus Filters Guide

Complete guide for implementing iOS Focus Filters to adapt your app based on user's Focus mode.

## Overview

Focus Filters allow your app to automatically adjust content based on the user's current Focus mode (Work, Personal, Sleep, etc.). Introduced in iOS 16.

### What are Focus Modes?

iOS Focus modes help users minimize distractions:
- **Do Not Disturb**: Silence all notifications
- **Work**: Show work-related content only
- **Personal**: Show personal content only
- **Sleep**: Minimize all activity
- **Custom**: User-defined modes (Fitness, Gaming, Reading, etc.)

### Why Use Focus Filters?

- **Respect user intent**: Show relevant content only
- **Reduce distractions**: Filter out non-essential items
- **Better UX**: Automatic context switching
- **iOS integration**: Native system feature

## Requirements

- **iOS 16+** for Focus Filters
- **Focus Filter capability** in Xcode
- User must have Focus modes configured

## Setup

### 1. Add Focus Filter Capability

In Xcode:
1. Select your app target
2. Go to "Signing & Capabilities"
3. Click "+ Capability"
4. Add "Focus Filter"

### 2. Declare Focus Filter Support

Create `FocusFilterExtension.swift`:

```swift
import FocusKit

@main
struct TaskFocusFilterExtension: FocusFilterExtension {
    var body: some FocusFilterExtensionScene {
        FocusFilterScene(for: TaskFocusFilter.self) {
            TaskFocusFilterView()
        }
    }
}

struct TaskFocusFilter: FocusFilterProtocol {
    var displayName: String {
        "Task Categories"
    }

    var description: String {
        "Filter tasks based on your Focus"
    }

    func applyFilter(to content: [Task]) -> [Task] {
        // Filter logic here
        return content
    }
}
```

### 3. Implement Filter Logic

```swift
import FocusKit

class TaskFilterManager {
    static func filterTasks(_ tasks: [Task], for focusMode: FocusMode) -> [Task] {
        switch focusMode {
        case .work:
            return tasks.filter { task in
                task.category == "work" || task.priority == .high
            }

        case .personal:
            return tasks.filter { task in
                task.category == "personal" || task.category == "home"
            }

        case .sleep:
            return [] // Hide all tasks during sleep

        case .doNotDisturb:
            return tasks.filter { $0.priority == .high }

        default:
            return tasks
        }
    }
}
```

## Implementation

### Detect Current Focus Mode

```typescript
import { FocusFilterManager } from './platform/ios/focus/FocusFilter';

// Get current Focus mode
const focusMode = await FocusFilterManager.getCurrentFocus();

console.log('Current Focus:', focusMode);
// Possible values: work, personal, sleep, do_not_disturb, none
```

### Listen for Focus Changes

```typescript
import { FocusFilterManager } from './platform/ios/focus/FocusFilter';

useEffect(() => {
  // Listen for Focus mode changes
  const unsubscribe = FocusFilterManager.addFocusChangeListener((mode) => {
    console.log('Focus changed to:', mode);

    // Update UI accordingly
    reloadTasks();
  });

  return unsubscribe;
}, []);
```

### Filter Content

```typescript
import { useFocusFilter } from './platform/ios/focus/FocusFilter';

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const { filterTasks, isFiltering, currentFocus } = useFocusFilter();

  // Load tasks
  useEffect(() => {
    loadTasks().then(setTasks);
  }, []);

  // Filter based on Focus mode
  const filteredTasks = filterTasks(tasks);

  return (
    <View>
      {isFiltering && (
        <Banner>
          {currentFocus} Focus active - {tasks.length - filteredTasks.length} tasks hidden
        </Banner>
      )}

      {filteredTasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </View>
  );
}
```

## Focus Filter Configurations

### Work Focus

```typescript
const workFilter: FocusFilterConfig = {
  mode: FocusMode.Work,
  shouldFilterTasks: true,
  allowedCategories: ['work', 'business', 'project'],
  allowedPriorities: ['high', 'medium'],
};

// Shows only work-related high/medium priority tasks
```

### Personal Focus

```typescript
const personalFilter: FocusFilterConfig = {
  mode: FocusMode.Personal,
  shouldFilterTasks: true,
  allowedCategories: ['personal', 'home', 'family', 'errands'],
  allowedPriorities: ['high', 'medium', 'low'],
};

// Shows personal tasks of all priorities
```

### Sleep Focus

```typescript
const sleepFilter: FocusFilterConfig = {
  mode: FocusMode.Sleep,
  shouldFilterTasks: true,
  allowedCategories: [],
  allowedPriorities: [],
};

// Hides all tasks during sleep
```

### Do Not Disturb

```typescript
const dndFilter: FocusFilterConfig = {
  mode: FocusMode.DoNotDisturb,
  shouldFilterTasks: true,
  allowedCategories: [], // All categories
  allowedPriorities: ['high'], // Only urgent
};

// Shows only high-priority tasks regardless of category
```

## User Configuration

Allow users to customize filters:

```typescript
function FocusFilterSettings() {
  const [workCategories, setWorkCategories] = useState(['work']);
  const [personalCategories, setPersonalCategories] = useState(['personal']);

  const saveFilters = async () => {
    await AsyncStorage.setItem('focus_filter_work', JSON.stringify({
      categories: workCategories,
      priorities: ['high', 'medium'],
    }));

    await AsyncStorage.setItem('focus_filter_personal', JSON.stringify({
      categories: personalCategories,
      priorities: ['high', 'medium', 'low'],
    }));
  };

  return (
    <View>
      <Text>Work Focus Filter</Text>
      <CategorySelector
        selected={workCategories}
        onChange={setWorkCategories}
      />

      <Text>Personal Focus Filter</Text>
      <CategorySelector
        selected={personalCategories}
        onChange={setPersonalCategories}
      />

      <Button onPress={saveFilters}>Save</Button>
    </View>
  );
}
```

## Best Practices

### 1. Respect User Intent

```typescript
// ✅ Good: Filter based on Focus mode
if (currentFocus === FocusMode.Work) {
  // Show work tasks only
  displayTasks(workTasks);
}

// ❌ Bad: Ignore Focus mode
// Always show all tasks regardless of mode
displayTasks(allTasks);
```

### 2. Provide Feedback

```typescript
// ✅ Good: Show filter status
<Banner>
  Work Focus active - 12 personal tasks hidden
</Banner>

// ❌ Bad: Silent filtering
// User doesn't know why tasks are missing
```

### 3. Allow Override

```typescript
// ✅ Good: Let user temporarily disable filter
<Button onPress={() => setFilterEnabled(false)}>
  Show All Tasks
</Button>

// ❌ Bad: Force filtering
// User can't access hidden content even if needed
```

### 4. Sensible Defaults

```typescript
// ✅ Good: Conservative filtering
// Work Focus: Hide personal tasks
// Personal Focus: Hide work tasks
// Sleep Focus: Hide all tasks

// ❌ Bad: Aggressive filtering
// Work Focus: Hide everything except one category
// User loses access to too much content
```

## Integration with Other Features

### Notifications

```typescript
// Silence notifications during Focus
const shouldNotify = !FocusFilterManager.shouldSilenceNotifications();

if (shouldNotify) {
  showNotification(task);
}
```

### Widgets

```swift
// Filter widget content based on Focus
func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    let focusMode = getCurrentFocusMode()
    let filteredTasks = filterTasks(allTasks, for: focusMode)

    let entry = TaskWidgetEntry(
        date: Date(),
        tasks: filteredTasks,
        focusMode: focusMode
    )

    let timeline = Timeline(entries: [entry], policy: .atEnd)
    completion(timeline)
}
```

### Live Activities

```swift
// Update Live Activity based on Focus
if focusMode == .sleep {
    // Hide or minimize Live Activity
    endActivity(activityId)
} else {
    // Continue showing Live Activity
    updateActivity(activityId, state: newState)
}
```

## Testing

### 1. Test All Focus Modes

```bash
# Enable different Focus modes on device:
# Control Center → Focus → Select mode

# Test app behavior for each mode:
# - Work
# - Personal
# - Sleep
# - Do Not Disturb
# - Custom modes
```

### 2. Test Focus Transitions

```typescript
// Log Focus changes
FocusFilterManager.addFocusChangeListener((mode) => {
  console.log('Focus changed:', mode);
  console.log('Tasks before filter:', tasks.length);

  const filtered = filterTasks(tasks);
  console.log('Tasks after filter:', filtered.length);
});
```

### 3. Test Edge Cases

- No Focus mode active
- Custom user Focus modes
- Multiple categories in one task
- Tasks without category
- Rapid Focus mode switching

## Limitations

1. **iOS 16+ only**: Older iOS versions don't support Focus Filters
2. **User configuration required**: User must set up Focus modes
3. **Limited API**: Can't programmatically change Focus mode
4. **No background detection**: Can only detect when app is active

## Troubleshooting

### Focus Mode Not Detected

**Problem**: `getCurrentFocus()` always returns `none`

**Solutions**:
1. Check iOS version (16+)
2. Verify Focus Filter capability enabled
3. Ensure user has Focus mode enabled
4. Check Focus mode settings allow your app

### Filters Not Applied

**Problem**: Content not filtered despite Focus being active

**Solutions**:
1. Check filter logic in `filterTasks()`
2. Verify task categories match filter config
3. Test with console logs
4. Check if override is enabled

### User Can't Access Content

**Problem**: Too much content hidden during Focus

**Solutions**:
1. Make filters less aggressive
2. Add "Show All" button
3. Show high-priority items regardless of Focus
4. Let user customize filters

## Resources

- [FocusKit Documentation](https://developer.apple.com/documentation/focuskit)
- [Focus Filters Overview](https://developer.apple.com/documentation/focuskit/creating-a-focus-filter)
- [Human Interface Guidelines - Focus](https://developer.apple.com/design/human-interface-guidelines/focus)
- [WWDC 2022: Meet Focus filters](https://developer.apple.com/videos/play/wwdc2022/10121/)

## Next Steps

1. [ ] Add Focus Filter capability in Xcode
2. [ ] Implement filter detection
3. [ ] Create filter configurations for each Focus mode
4. [ ] Add UI indicators when filtering is active
5. [ ] Allow users to customize filters
6. [ ] Test all Focus modes
7. [ ] Add "Show All" override option
8. [ ] Integrate with widgets and notifications
9. [ ] Monitor filter usage
10. [ ] Gather user feedback
