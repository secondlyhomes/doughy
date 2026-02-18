# Android App Shortcuts

Complete guide for implementing App Shortcuts in React Native.

## Overview

App Shortcuts provide quick access to specific app actions from the home screen launcher. Users can long-press your app icon to reveal shortcuts.

### Types of Shortcuts

1. **Static Shortcuts**: Defined in XML, fixed at compile time
2. **Dynamic Shortcuts**: Created at runtime, can be updated
3. **Pinned Shortcuts**: User-pinned to home screen (Android 8.0+)

## Requirements

- **Android 7.1+ (API 25+)** for basic shortcuts
- **Android 8.0+ (API 26+)** for pinned shortcuts
- **Android 12+ (API 31+)** for improved icon support

## Setup

### 1. Create Static Shortcuts XML

Create `android/app/src/main/res/xml/shortcuts.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <!-- Create Task Shortcut -->
  <shortcut
    android:shortcutId="create_task"
    android:enabled="true"
    android:icon="@drawable/ic_add_shortcut"
    android:shortcutShortLabel="@string/shortcut_create_task_short"
    android:shortcutLongLabel="@string/shortcut_create_task_long"
    android:shortcutDisabledMessage="@string/shortcut_disabled_message">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="com.yourapp"
      android:targetClass="com.yourapp.MainActivity"
      android:data="yourapp://tasks/new" />
    <categories android:name="android.shortcut.conversation" />
  </shortcut>

  <!-- View Tasks Shortcut -->
  <shortcut
    android:shortcutId="view_tasks"
    android:enabled="true"
    android:icon="@drawable/ic_list_shortcut"
    android:shortcutShortLabel="@string/shortcut_view_tasks_short"
    android:shortcutLongLabel="@string/shortcut_view_tasks_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="com.yourapp"
      android:targetClass="com.yourapp.MainActivity"
      android:data="yourapp://tasks" />
  </shortcut>

  <!-- Completed Tasks Shortcut -->
  <shortcut
    android:shortcutId="view_completed"
    android:enabled="true"
    android:icon="@drawable/ic_check_shortcut"
    android:shortcutShortLabel="@string/shortcut_completed_short"
    android:shortcutLongLabel="@string/shortcut_completed_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="com.yourapp"
      android:targetClass="com.yourapp.MainActivity"
      android:data="yourapp://tasks?filter=completed" />
  </shortcut>
</shortcuts>
```

### 2. Add String Resources

Add to `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
  <!-- Shortcut labels -->
  <string name="shortcut_create_task_short">New Task</string>
  <string name="shortcut_create_task_long">Create a new task</string>

  <string name="shortcut_view_tasks_short">My Tasks</string>
  <string name="shortcut_view_tasks_long">View all my tasks</string>

  <string name="shortcut_completed_short">Completed</string>
  <string name="shortcut_completed_long">View completed tasks</string>

  <string name="shortcut_disabled_message">Task creation is currently disabled</string>
</resources>
```

### 3. Configure AndroidManifest.xml

Add to your main activity in `AndroidManifest.xml`:

```xml
<activity
  android:name=".MainActivity"
  android:label="@string/app_name">

  <!-- Existing intent filters -->
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>

  <!-- Add shortcuts meta-data -->
  <meta-data
    android:name="android.app.shortcuts"
    android:resource="@xml/shortcuts" />

  <!-- Handle shortcut deep links -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
      android:scheme="yourapp"
      android:host="tasks" />
  </intent-filter>
</activity>
```

### 4. Create Shortcut Icons

Create icon drawables in `android/app/src/main/res/drawable/`:

```xml
<!-- ic_add_shortcut.xml -->
<vector
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="24dp"
  android:height="24dp"
  android:viewportWidth="24"
  android:viewportHeight="24"
  android:tint="?attr/colorControlNormal">
  <path
    android:fillColor="@android:color/white"
    android:pathData="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
</vector>
```

### 5. Implement Native Module

Create `android/app/src/main/java/com/yourapp/modules/ShortcutModule.kt`:

```kotlin
package com.yourapp.modules

import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*

class ShortcutModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val shortcutManager: ShortcutManager? by lazy {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N_MR1) {
      reactApplicationContext.getSystemService(ShortcutManager::class.java)
    } else {
      null
    }
  }

  override fun getName(): String = "ShortcutModule"

  @ReactMethod
  fun setDynamicShortcuts(shortcuts: ReadableArray, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.reject("NOT_SUPPORTED", "Dynamic shortcuts require Android 7.1+")
      return
    }

    try {
      val shortcutList = parseShortcuts(shortcuts)
      shortcutManager?.dynamicShortcuts = shortcutList
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SET_SHORTCUTS_ERROR", e.message)
    }
  }

  @ReactMethod
  fun addDynamicShortcuts(shortcuts: ReadableArray, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.reject("NOT_SUPPORTED", "Dynamic shortcuts require Android 7.1+")
      return
    }

    try {
      val shortcutList = parseShortcuts(shortcuts)
      shortcutManager?.addDynamicShortcuts(shortcutList)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ADD_SHORTCUTS_ERROR", e.message)
    }
  }

  @ReactMethod
  fun updateShortcuts(shortcuts: ReadableArray, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.reject("NOT_SUPPORTED", "Dynamic shortcuts require Android 7.1+")
      return
    }

    try {
      val shortcutList = parseShortcuts(shortcuts)
      shortcutManager?.updateShortcuts(shortcutList)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("UPDATE_SHORTCUTS_ERROR", e.message)
    }
  }

  @ReactMethod
  fun removeDynamicShortcuts(shortcutIds: ReadableArray, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.reject("NOT_SUPPORTED", "Dynamic shortcuts require Android 7.1+")
      return
    }

    try {
      val ids = shortcutIds.toArrayList().map { it.toString() }
      shortcutManager?.removeDynamicShortcuts(ids)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("REMOVE_SHORTCUTS_ERROR", e.message)
    }
  }

  @ReactMethod
  fun removeAllDynamicShortcuts(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.reject("NOT_SUPPORTED", "Dynamic shortcuts require Android 7.1+")
      return
    }

    try {
      shortcutManager?.removeAllDynamicShortcuts()
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("REMOVE_ALL_SHORTCUTS_ERROR", e.message)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun requestPinShortcut(shortcutData: ReadableMap, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      promise.reject("NOT_SUPPORTED", "Pinned shortcuts require Android 8.0+")
      return
    }

    try {
      val shortcut = parseShortcut(shortcutData)
      val success = shortcutManager?.requestPinShortcut(shortcut, null) ?: false
      promise.resolve(success)
    } catch (e: Exception) {
      promise.reject("PIN_SHORTCUT_ERROR", e.message)
    }
  }

  @ReactMethod
  fun disableShortcuts(shortcutIds: ReadableArray, disabledMessage: String?, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.reject("NOT_SUPPORTED", "Dynamic shortcuts require Android 7.1+")
      return
    }

    try {
      val ids = shortcutIds.toArrayList().map { it.toString() }
      if (disabledMessage != null) {
        shortcutManager?.disableShortcuts(ids, disabledMessage)
      } else {
        shortcutManager?.disableShortcuts(ids)
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("DISABLE_SHORTCUTS_ERROR", e.message)
    }
  }

  @ReactMethod
  fun enableShortcuts(shortcutIds: ReadableArray, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.reject("NOT_SUPPORTED", "Dynamic shortcuts require Android 7.1+")
      return
    }

    try {
      val ids = shortcutIds.toArrayList().map { it.toString() }
      shortcutManager?.enableShortcuts(ids)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("ENABLE_SHORTCUTS_ERROR", e.message)
    }
  }

  @ReactMethod
  fun getMaxShortcutCountPerActivity(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.resolve(0)
      return
    }

    try {
      val count = shortcutManager?.maxShortcutCountPerActivity ?: 0
      promise.resolve(count)
    } catch (e: Exception) {
      promise.reject("GET_MAX_COUNT_ERROR", e.message)
    }
  }

  @ReactMethod
  fun reportShortcutUsed(shortcutId: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      promise.resolve(null)
      return
    }

    try {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
        shortcutManager?.reportShortcutUsed(shortcutId)
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("REPORT_USAGE_ERROR", e.message)
    }
  }

  @RequiresApi(Build.VERSION_CODES.N_MR1)
  private fun parseShortcuts(shortcuts: ReadableArray): List<ShortcutInfo> {
    return shortcuts.toArrayList().map { shortcutData ->
      parseShortcut(shortcutData as ReadableMap)
    }
  }

  @RequiresApi(Build.VERSION_CODES.N_MR1)
  private fun parseShortcut(data: ReadableMap): ShortcutInfo {
    val id = data.getString("id") ?: throw IllegalArgumentException("Shortcut ID is required")
    val shortLabel = data.getString("shortLabel") ?: ""
    val longLabel = data.getString("longLabel") ?: shortLabel
    val iconName = data.getString("icon") ?: "ic_shortcut"
    val intentData = data.getMap("intent") ?: throw IllegalArgumentException("Intent is required")

    val iconId = reactApplicationContext.resources.getIdentifier(
      iconName,
      "drawable",
      reactApplicationContext.packageName
    )

    val intent = Intent(
      intentData.getString("action") ?: Intent.ACTION_VIEW
    ).apply {
      intentData.getString("data")?.let { this.data = Uri.parse(it) }
      setPackage(reactApplicationContext.packageName)
      setClass(reactApplicationContext, reactApplicationContext.javaClass)
    }

    return ShortcutInfo.Builder(reactApplicationContext, id)
      .setShortLabel(shortLabel)
      .setLongLabel(longLabel)
      .setIcon(Icon.createWithResource(reactApplicationContext, iconId))
      .setIntent(intent)
      .apply {
        if (data.hasKey("rank")) {
          setRank(data.getInt("rank"))
        }
        if (data.hasKey("disabledMessage")) {
          setDisabledMessage(data.getString("disabledMessage"))
        }
      }
      .build()
  }
}
```

## Usage

### Initialize Default Shortcuts

```typescript
import { DynamicShortcutsManager } from './appShortcuts';

// In your App.tsx or initialization
useEffect(() => {
  DynamicShortcutsManager.initializeDefaults();
}, []);
```

### Add Dynamic Shortcut

```typescript
import { AppShortcuts } from './appShortcuts';

const addRecentTaskShortcut = async (task: Task) => {
  await AppShortcuts.addDynamicShortcuts([
    {
      id: `task-${task.id}`,
      shortLabel: task.title,
      longLabel: `Open "${task.title}"`,
      icon: 'ic_task_shortcut',
      intent: {
        action: 'android.intent.action.VIEW',
        data: `yourapp://tasks/${task.id}`,
      },
      rank: 0,
    },
  ]);
};
```

### Request Pin Shortcut

```typescript
import { PinnedShortcutsManager } from './appShortcuts';

const pinTaskToHomeScreen = async (task: Task) => {
  const success = await PinnedShortcutsManager.pinTask(task);

  if (success) {
    alert('Shortcut added to home screen!');
  } else {
    alert('Failed to add shortcut');
  }
};
```

### Handle Deep Links

```typescript
import { ShortcutDeepLinkHandler } from './appShortcuts';

// Initialize in App.tsx
useEffect(() => {
  ShortcutDeepLinkHandler.initialize();

  return () => {
    ShortcutDeepLinkHandler.cleanup();
  };
}, []);
```

## Shortcut Limits

| Type | Maximum Count |
|------|--------------|
| Static | 5 recommended |
| Dynamic | 15 (system limit) |
| Pinned | Unlimited |
| **Total Visible** | **4-5** (launcher dependent) |

## Best Practices

### 1. Prioritize Actions

```typescript
// Order by frequency of use
const shortcuts = [
  DEFAULT_SHORTCUTS.createTask,  // rank: 0 (most important)
  DEFAULT_SHORTCUTS.viewTasks,   // rank: 1
  DEFAULT_SHORTCUTS.voiceTask,   // rank: 2
];
```

### 2. Update Shortcuts Dynamically

```typescript
// Update when user creates task
const onTaskCreated = async (task: Task) => {
  await createTask(task);
  await DynamicShortcutsManager.updateRecentTasks([task, ...otherTasks]);
};
```

### 3. Remove Stale Shortcuts

```typescript
// Cleanup when tasks are deleted
const onTaskDeleted = async (taskId: string) => {
  await deleteTask(taskId);
  await AppShortcuts.removeDynamicShortcuts([`task-${taskId}`]);
};
```

### 4. Use Adaptive Icons

Create `ic_shortcut_foreground.xml` and `ic_shortcut_background.xml` for Android 8.0+

### 5. Test on Multiple Launchers

Different launchers show different numbers of shortcuts:
- Google Launcher: 5 shortcuts
- Samsung One UI: 4 shortcuts
- Nova Launcher: Configurable

## Icon Guidelines

### Icon Specifications

- **Size**: 24dp x 24dp (mdpi: 24px, xxhdpi: 72px)
- **Format**: Vector drawable preferred
- **Color**: Single color (tinted by launcher)
- **Style**: Material Design icons

### Adaptive Icons (Android 8.0+)

```xml
<!-- ic_shortcut_adaptive.xml -->
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@drawable/ic_shortcut_background"/>
  <foreground android:drawable="@drawable/ic_shortcut_foreground"/>
</adaptive-icon>
```

## Troubleshooting

### Shortcuts Not Appearing

1. Check API level (25+ required)
2. Verify `shortcuts.xml` syntax
3. Check AndroidManifest.xml meta-data
4. Test on different launchers

### Deep Links Not Working

1. Verify intent filter in manifest
2. Check URL scheme matches
3. Test with `adb shell am start -a android.intent.action.VIEW -d "yourapp://tasks/new"`
4. Ensure MainActivity handles the intent

### Icons Not Showing

1. Check drawable resource exists
2. Verify resource name matches
3. Use vector drawables for consistency
4. Test with different themes (light/dark)

## Resources

- [Android Shortcuts Documentation](https://developer.android.com/guide/topics/ui/shortcuts)
- [Shortcuts Design Guidelines](https://developer.android.com/guide/topics/ui/shortcuts/creating-shortcuts)
- [Material Icons](https://material.io/resources/icons/)
