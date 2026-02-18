# Android Quick Settings Tiles

Complete guide for implementing Quick Settings Tiles in React Native.

## Overview

Quick Settings Tiles provide instant access to app functionality from the Quick Settings panel (swipe down from top of screen). They're perfect for frequently used actions that don't require opening the full app.

### Use Cases

- **Quick actions**: Create task, start timer, toggle setting
- **Status display**: Show app state, pending items
- **Voice input**: Capture voice notes/tasks
- **Toggle controls**: Enable/disable features

## Requirements

- **Android 7.0+ (API 24+)** for basic tiles
- **Android 10+ (API 29+)** for improved features
- **Android 13+ (API 33+)** for Material You theming

## Setup

### 1. Create Native TileService

Create `android/app/src/main/java/com/yourapp/tiles/QuickTaskTileService.kt`:

```kotlin
package com.yourapp.tiles

import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import android.content.Intent
import android.net.Uri

class QuickTaskTileService : TileService() {

  override fun onTileAdded() {
    super.onTileAdded()
    // Tile was added to Quick Settings
    updateTileState(Tile.STATE_INACTIVE, "Quick Task", "Tap to add task")
  }

  override fun onStartListening() {
    super.onStartListening()
    // Tile is visible - update with latest data
    val pendingTasks = getPendingTaskCount()
    updateTileState(
      Tile.STATE_INACTIVE,
      "Quick Task",
      "$pendingTasks pending"
    )
  }

  override fun onStopListening() {
    super.onStopListening()
    // Tile is no longer visible
  }

  override fun onClick() {
    super.onClick()

    // Option 1: Show dialog (Android 10+)
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
      showDialog()
    } else {
      // Option 2: Open app
      openApp()
    }
  }

  override fun onTileRemoved() {
    super.onTileRemoved()
    // Tile was removed from Quick Settings
  }

  private fun updateTileState(state: Int, label: String, subtitle: String? = null) {
    qsTile?.apply {
      this.state = state
      this.label = label
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
        this.subtitle = subtitle
      }
      updateTile()
    }
  }

  @RequiresApi(android.os.Build.VERSION_CODES.Q)
  private fun showDialog() {
    // Show dialog for task input
    val dialogIntent = Intent(this, QuickTaskDialogActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    startActivityAndCollapse(dialogIntent)
  }

  private fun openApp() {
    val intent = Intent(Intent.ACTION_VIEW).apply {
      data = Uri.parse("yourapp://tasks/new")
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    startActivityAndCollapse(intent)
  }

  private fun getPendingTaskCount(): Int {
    val prefs = getSharedPreferences("tasks", MODE_PRIVATE)
    val tasksJson = prefs.getString("tasks", "[]")
    // Parse and count pending tasks
    return 0 // Implement actual counting
  }
}
```

### 2. Configure AndroidManifest.xml

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <!-- Quick Settings Tile Service -->
  <service
    android:name=".tiles.QuickTaskTileService"
    android:icon="@drawable/ic_add_task"
    android:label="@string/quick_task_tile_label"
    android:exported="true"
    android:permission="android.permission.BIND_QUICK_SETTINGS_TILE">
    <intent-filter>
      <action android:name="android.service.quicksettings.action.QS_TILE" />
    </intent-filter>

    <!-- Tile metadata (optional) -->
    <meta-data
      android:name="android.service.quicksettings.ACTIVE_TILE"
      android:value="true" />
  </service>

  <!-- Dialog Activity for tile input -->
  <activity
    android:name=".tiles.QuickTaskDialogActivity"
    android:theme="@style/Theme.Transparent.NoTitleBar"
    android:excludeFromRecents="true"
    android:exported="false" />
</application>
```

### 3. Create React Native Bridge

Create `android/app/src/main/java/com/yourapp/modules/QuickTileModule.kt`:

```kotlin
package com.yourapp.modules

import android.content.ComponentName
import android.service.quicksettings.TileService
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class QuickTileModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "QuickTileModule"

  @ReactMethod
  fun updateTile(config: ReadableMap, promise: Promise) {
    try {
      val label = config.getString("label")
      val subtitle = config.getString("subtitle")
      val icon = config.getString("icon")
      val state = config.getInt("state")

      // Update tile via shared preferences
      val prefs = reactApplicationContext.getSharedPreferences(
        "tile_config",
        MODE_PRIVATE
      )
      prefs.edit().apply {
        putString("label", label)
        putString("subtitle", subtitle)
        putString("icon", icon)
        putInt("state", state)
        apply()
      }

      // Request tile update
      TileService.requestListeningState(
        reactApplicationContext,
        ComponentName(
          reactApplicationContext,
          QuickTaskTileService::class.java
        )
      )

      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("UPDATE_TILE_ERROR", e.message)
    }
  }

  @ReactMethod
  fun requestAddTile(promise: Promise) {
    try {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
        TileService.requestAddTileService(
          reactApplicationContext,
          ComponentName(
            reactApplicationContext,
            QuickTaskTileService::class.java
          ),
          "Quick Task",
          Icon.createWithResource(reactApplicationContext, R.drawable.ic_add_task),
          {}
        )
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("REQUEST_ADD_TILE_ERROR", e.message)
    }
  }

  @ReactMethod
  fun showDialog(config: ReadableMap, promise: Promise) {
    try {
      val title = config.getString("title")
      val message = config.getString("message")

      // Show dialog (implement in native code)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SHOW_DIALOG_ERROR", e.message)
    }
  }

  @ReactMethod
  fun startActivityAndCollapse(config: ReadableMap, promise: Promise) {
    try {
      val action = config.getString("action")
      val data = config.getString("data")

      val intent = Intent(action).apply {
        data?.let { this.data = Uri.parse(it) }
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }

      reactApplicationContext.startActivity(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("START_ACTIVITY_ERROR", e.message)
    }
  }

  @ReactMethod
  fun startVoiceRecognition(config: ReadableMap, promise: Promise) {
    try {
      val prompt = config.getString("prompt")
      val language = config.getString("language")

      val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
        putExtra(
          RecognizerIntent.EXTRA_LANGUAGE_MODEL,
          RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
        )
        putExtra(RecognizerIntent.EXTRA_LANGUAGE, language)
        putExtra(RecognizerIntent.EXTRA_PROMPT, prompt)
      }

      currentActivity?.startActivityForResult(intent, VOICE_RECOGNITION_REQUEST)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("VOICE_RECOGNITION_ERROR", e.message)
    }
  }

  fun sendEvent(eventName: String, params: WritableMap?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  companion object {
    const val VOICE_RECOGNITION_REQUEST = 1001
  }
}
```

### 4. Register Module

Add to `MainApplication.kt`:

```kotlin
override fun getPackages(): List<ReactPackage> {
  return PackageList(this).packages.apply {
    add(QuickTilePackage())
  }
}
```

## Tile States

### State Types

```kotlin
// Inactive - Default state
Tile.STATE_INACTIVE

// Active - Feature is on/running
Tile.STATE_ACTIVE

// Unavailable - Feature can't be used
Tile.STATE_UNAVAILABLE
```

### State Management

```typescript
import { QuickTaskTileManager, TileState } from './QuickTaskTile';

// Set inactive
await QuickTaskTileManager.updateTile({
  label: 'Quick Task',
  icon: 'ic_add_task',
  state: TileState.INACTIVE,
});

// Set active
await QuickTaskTileManager.updateTile({
  label: 'Processing...',
  icon: 'ic_add_task',
  state: TileState.ACTIVE,
});

// Set unavailable
await QuickTaskTileManager.updateTile({
  label: 'Quick Task',
  subtitle: 'Not available',
  icon: 'ic_error',
  state: TileState.UNAVAILABLE,
});
```

## Features

### 1. Basic Tile

```kotlin
class SimpleTileService : TileService() {
  override fun onClick() {
    // Toggle state
    val tile = qsTile
    val isActive = tile.state == Tile.STATE_ACTIVE

    tile.state = if (isActive) Tile.STATE_INACTIVE else Tile.STATE_ACTIVE
    tile.updateTile()

    // Perform action
    if (!isActive) {
      performAction()
    }
  }
}
```

### 2. Dialog Input (Android 10+)

```kotlin
@RequiresApi(Build.VERSION_CODES.Q)
override fun onClick() {
  showDialog(
    Intent(this, QuickTaskDialogActivity::class.java).apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
  )
}
```

### 3. Voice Input

```kotlin
class VoiceTileService : TileService() {
  override fun onClick() {
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(
        RecognizerIntent.EXTRA_LANGUAGE_MODEL,
        RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
      )
      putExtra(RecognizerIntent.EXTRA_PROMPT, "Say your task")
      flags = Intent.FLAG_ACTIVITY_NEW_TASK
    }
    startActivityAndCollapse(intent)
  }
}
```

### 4. Subtitle (Android 10+)

```kotlin
@RequiresApi(Build.VERSION_CODES.Q)
private fun updateTile(label: String, subtitle: String) {
  qsTile?.apply {
    this.label = label
    this.subtitle = subtitle
    updateTile()
  }
}
```

### 5. Custom Icon

```kotlin
qsTile?.icon = Icon.createWithResource(this, R.drawable.ic_custom)
qsTile?.updateTile()
```

## Advanced Features

### Request Add Tile (Android 13+)

```kotlin
@RequiresApi(Build.VERSION_CODES.TIRAMISU)
fun requestAddTile() {
  TileService.requestAddTileService(
    context,
    ComponentName(context, QuickTaskTileService::class.java),
    "Quick Task",
    Icon.createWithResource(context, R.drawable.ic_add_task),
    Executor { it.run() }
  ) { resultCode ->
    if (resultCode == RESULT_OK) {
      // Tile added successfully
    }
  }
}
```

### Update from App

```kotlin
// Request tile to update itself
TileService.requestListeningState(
  context,
  ComponentName(context, QuickTaskTileService::class.java)
)
```

### Data Sync

```typescript
// Update tile when data changes
export async function syncTileData() {
  const tasks = await loadTasks();
  const pendingCount = tasks.filter((t) => !t.completed).length;

  await QuickTaskTileManager.updateTile({
    label: 'Quick Task',
    subtitle: `${pendingCount} pending`,
    icon: 'ic_add_task',
    state: TileState.INACTIVE,
  });
}

// Call when tasks change
await createTask(newTask);
await syncTileData();
```

## Testing

### Manual Testing

1. **Add tile to Quick Settings:**
   - Swipe down from top of screen
   - Tap edit icon
   - Find your app's tile
   - Drag to Quick Settings panel

2. **Test interactions:**
   - Tap tile
   - Verify action occurs
   - Check state changes
   - Test subtitle updates

3. **Test states:**
   - Inactive state
   - Active state
   - Unavailable state

### Automated Testing

```kotlin
@Test
fun testTileUpdate() {
  val service = QuickTaskTileService()
  service.onCreate()
  service.onTileAdded()

  val tile = service.qsTile
  assertEquals(Tile.STATE_INACTIVE, tile.state)
  assertEquals("Quick Task", tile.label)
}
```

## Best Practices

### 1. Keep Actions Simple

```kotlin
// Good: Simple, fast action
override fun onClick() {
  toggleFeature()
  updateTile()
}

// Bad: Complex, slow action
override fun onClick() {
  // Don't do heavy work here
  syncWithServer() // Too slow!
  processLargeData() // Too complex!
}
```

### 2. Update State Promptly

```kotlin
override fun onClick() {
  // Show immediate feedback
  qsTile?.state = Tile.STATE_ACTIVE
  qsTile?.updateTile()

  // Perform action
  performAction()

  // Update final state
  qsTile?.state = Tile.STATE_INACTIVE
  qsTile?.updateTile()
}
```

### 3. Handle Errors Gracefully

```kotlin
override fun onClick() {
  try {
    performAction()
  } catch (e: Exception) {
    qsTile?.apply {
      state = Tile.STATE_UNAVAILABLE
      subtitle = "Error"
      updateTile()
    }
  }
}
```

### 4. Use Appropriate Icons

```kotlin
// Material icons recommended
qsTile?.icon = Icon.createWithResource(this, R.drawable.ic_task_24dp)

// Adaptive icon for Android 8+
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
  qsTile?.icon = Icon.createWithAdaptiveBitmap(bitmap)
}
```

### 5. Respect Battery Life

```kotlin
override fun onStartListening() {
  super.onStartListening()
  // Only update when tile is visible
  updateTileData()
}

override fun onStopListening() {
  super.onStopListening()
  // Stop updates when tile is hidden
  cancelUpdates()
}
```

## Icon Design

### Icon Guidelines

- **Size**: 24dp x 24dp
- **Format**: Vector drawable (XML) preferred
- **Color**: Single color (tinted by system)
- **Style**: Material Design icons

### Example Icon

`res/drawable/ic_add_task.xml`:

```xml
<vector
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="24dp"
  android:height="24dp"
  android:viewportWidth="24"
  android:viewportHeight="24">
  <path
    android:fillColor="@android:color/white"
    android:pathData="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
</vector>
```

## Troubleshooting

### Tile Not Appearing

1. Check AndroidManifest.xml configuration
2. Verify permission in service declaration
3. Ensure API level is 24+
4. Check service name matches class

### Tile Not Updating

1. Verify `updateTile()` is called
2. Check if `qsTile` is null
3. Ensure tile is added to Quick Settings
4. Use `requestListeningState()` for external updates

### Click Not Working

1. Implement `onClick()` method
2. Use `startActivityAndCollapse()` for intents
3. Check intent flags
4. Verify permissions

### Subtitle Not Showing

1. Check Android version (10+ required)
2. Verify subtitle is not null
3. Check if tile width is sufficient

## Resources

- [Android TileService Documentation](https://developer.android.com/reference/android/service/quicksettings/TileService)
- [Quick Settings Tile Guide](https://developer.android.com/develop/ui/views/components/settings/quicksettings-tiles)
- [Material Design Icons](https://material.io/resources/icons/)
