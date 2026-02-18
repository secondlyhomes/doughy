# Picture-in-Picture (PiP)

Complete guide for implementing Picture-in-Picture mode in React Native.

## Overview

Picture-in-Picture (PiP) allows users to watch video content in a small window that floats above other apps. This enables multitasking while continuing video playback.

## Requirements

- **Android 8.0+ (API 26+)** for basic PiP
- **Android 12+ (API 31+)** for auto-enter PiP
- **Android 13+ (API 33+)** for improved transitions

## Setup

### 1. Configure AndroidManifest.xml

Add to your main activity:

```xml
<activity
  android:name=".MainActivity"
  android:supportsPictureInPicture="true"
  android:configChanges="screenSize|smallestScreenSize|screenLayout|orientation">

  <!-- Existing intent filters -->

</activity>
```

### 2. Create Native Module

`android/app/src/main/java/com/yourapp/modules/PictureInPictureModule.kt`:

```kotlin
package com.yourapp.modules

import android.app.PendingIntent
import android.app.PictureInPictureParams
import android.app.RemoteAction
import android:content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.drawable.Icon
import android.os.Build
import android.util.Rational
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class PictureInPictureModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var pipReceiver: BroadcastReceiver? = null

  override fun getName(): String = "PictureInPictureModule"

  @ReactMethod
  fun isSupported(promise: Promise) {
    val supported = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
    promise.resolve(supported)
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun enterPictureInPicture(params: ReadableMap, promise: Promise) {
    try {
      val activity = currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null")
        return
      }

      val width = params.getInt("width")
      val height = params.getInt("height")
      val aspectRatio = Rational(width, height)

      val pipParamsBuilder = PictureInPictureParams.Builder()
        .setAspectRatio(aspectRatio)

      // Add custom actions (Android 8+)
      if (params.hasKey("actions")) {
        val actions = params.getArray("actions")
        val remoteActions = createRemoteActions(actions)
        pipParamsBuilder.setActions(remoteActions)
      }

      // Set auto-enter (Android 12+)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && params.hasKey("autoEnter")) {
        val autoEnter = params.getBoolean("autoEnter")
        pipParamsBuilder.setAutoEnterEnabled(autoEnter)
      }

      val success = activity.enterPictureInPictureMode(pipParamsBuilder.build())

      val result = Arguments.createMap().apply {
        putBoolean("success", success)
      }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("ENTER_PIP_ERROR", e.message)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun exitPictureInPicture(promise: Promise) {
    try {
      // PiP mode exits automatically when user taps the window
      // Or you can finish the activity to exit
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("EXIT_PIP_ERROR", e.message)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  @ReactMethod
  fun updatePictureInPicture(params: ReadableMap, promise: Promise) {
    try {
      val activity = currentActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity is null")
        return
      }

      val pipParamsBuilder = PictureInPictureParams.Builder()

      // Update aspect ratio if provided
      if (params.hasKey("width") && params.hasKey("height")) {
        val width = params.getInt("width")
        val height = params.getInt("height")
        pipParamsBuilder.setAspectRatio(Rational(width, height))
      }

      // Update actions if provided
      if (params.hasKey("actions")) {
        val actions = params.getArray("actions")
        val remoteActions = createRemoteActions(actions)
        pipParamsBuilder.setActions(remoteActions)
      }

      activity.setPictureInPictureParams(pipParamsBuilder.build())
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("UPDATE_PIP_ERROR", e.message)
    }
  }

  @RequiresApi(Build.VERSION_CODES.O)
  private fun createRemoteActions(actions: ReadableArray?): List<RemoteAction> {
    if (actions == null) return emptyList()

    return actions.toArrayList().mapNotNull { action ->
      try {
        val actionMap = action as ReadableMap
        val iconName = actionMap.getString("icon") ?: return@mapNotNull null
        val title = actionMap.getString("title") ?: return@mapNotNull null
        val actionId = actionMap.getString("action") ?: return@mapNotNull null

        val iconId = reactApplicationContext.resources.getIdentifier(
          iconName,
          "drawable",
          reactApplicationContext.packageName
        )

        val intent = Intent(ACTION_MEDIA_CONTROL).apply {
          putExtra(EXTRA_CONTROL_TYPE, actionId)
        }

        val pendingIntent = PendingIntent.getBroadcast(
          reactApplicationContext,
          actionId.hashCode(),
          intent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        RemoteAction(
          Icon.createWithResource(reactApplicationContext, iconId),
          title,
          title,
          pendingIntent
        )
      } catch (e: Exception) {
        null
      }
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    if (pipReceiver == null) {
      pipReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
          val action = intent?.getStringExtra(EXTRA_CONTROL_TYPE)
          if (action != null) {
            val params = Arguments.createMap().apply {
              putString("action", action)
            }
            sendEvent("onPictureInPictureActionReceived", params)
          }
        }
      }

      val filter = IntentFilter(ACTION_MEDIA_CONTROL)
      reactApplicationContext.registerReceiver(pipReceiver, filter)
    }
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    if (pipReceiver != null) {
      try {
        reactApplicationContext.unregisterReceiver(pipReceiver)
        pipReceiver = null
      } catch (e: Exception) {
        // Already unregistered
      }
    }
  }

  private fun sendEvent(eventName: String, params: WritableMap?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  override fun onHostResume() {
    // Detect PiP mode changes
    val activity = currentActivity
    if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val isInPipMode = activity.isInPictureInPictureMode
      val params = Arguments.createMap().apply {
        putBoolean("isInPipMode", isInPipMode)
      }
      sendEvent("onPictureInPictureModeChanged", params)
    }
  }

  companion object {
    const val ACTION_MEDIA_CONTROL = "com.yourapp.ACTION_MEDIA_CONTROL"
    const val EXTRA_CONTROL_TYPE = "control_type"
  }
}
```

### 3. Handle PiP in MainActivity

Add to `MainActivity.kt`:

```kotlin
override fun onPictureInPictureModeChanged(
  isInPictureInPictureMode: Boolean,
  newConfig: Configuration
) {
  super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)

  // Notify React Native
  val params = Arguments.createMap().apply {
    putBoolean("isInPipMode", isInPictureInPictureMode)
  }

  reactInstanceManager.currentReactContext
    ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    ?.emit("onPictureInPictureModeChanged", params)
}
```

## Usage

### Basic Video Player with PiP

```typescript
import { usePictureInPicture, PIP_ASPECT_RATIOS } from './PictureInPicture';

function VideoPlayer({ videoUrl }) {
  const { isInPipMode, isSupported, enterPiP } = usePictureInPicture();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleEnterPiP = async () => {
    const result = await enterPiP({
      width: PIP_ASPECT_RATIOS.VIDEO_16_9.width,
      height: PIP_ASPECT_RATIOS.VIDEO_16_9.height,
      actions: [
        {
          icon: 'ic_play_arrow',
          title: 'Play',
          action: 'PLAY',
        },
        {
          icon: 'ic_pause',
          title: 'Pause',
          action: 'PAUSE',
        },
      ],
    });

    if (!result.success) {
      console.error('Failed to enter PiP:', result.error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Video content */}

      {isSupported && !isInPipMode && (
        <Button title="Enter PiP" onPress={handleEnterPiP} />
      )}
    </View>
  );
}
```

### Auto-Enter PiP on Background

```typescript
function VideoPlayerWithAutoEnter() {
  const { isSupported, enterPiP } = usePictureInPicture();
  const [isPlaying, setIsPlaying] = useState(false);

  useAutoEnterPiP(isPlaying && isSupported, {
    width: 16,
    height: 9,
    autoEnter: true,
  });

  return <VideoPlayer />;
}
```

### Custom PiP Controls

```typescript
function VideoWithControls() {
  const { isInPipMode, updatePiP } = usePictureInPicture();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    // Update PiP controls when state changes
    updatePiP({
      actions: [
        {
          icon: isPlaying ? 'ic_pause' : 'ic_play_arrow',
          title: isPlaying ? 'Pause' : 'Play',
          action: 'PLAY_PAUSE',
          enabled: true,
        },
        {
          icon: isMuted ? 'ic_volume_off' : 'ic_volume_up',
          title: isMuted ? 'Unmute' : 'Mute',
          action: 'TOGGLE_MUTE',
          enabled: true,
        },
        {
          icon: 'ic_replay_10',
          title: 'Rewind',
          action: 'REWIND',
          enabled: true,
        },
        {
          icon: 'ic_forward_10',
          title: 'Forward',
          action: 'FORWARD',
          enabled: true,
        },
      ],
    });
  }, [isPlaying, isMuted]);

  return <VideoPlayer />;
}
```

### Handle PiP Actions

```typescript
function InteractiveVideo() {
  const [position, setPosition] = useState(0);

  usePiPActions([
    {
      icon: 'ic_play_arrow',
      title: 'Play',
      action: 'PLAY',
    },
    {
      icon: 'ic_pause',
      title: 'Pause',
      action: 'PAUSE',
    },
    {
      icon: 'ic_replay_10',
      title: 'Rewind',
      action: 'REWIND',
    },
    {
      icon: 'ic_forward_10',
      title: 'Forward',
      action: 'FORWARD',
    },
  ]);

  // Actions are handled automatically by the hook
}
```

## Aspect Ratios

### Supported Ratios

```typescript
// Landscape video (standard)
{ width: 16, height: 9 }

// Landscape video (ultrawide)
{ width: 21, height: 9 }

// Standard video
{ width: 4, height: 3 }

// Square
{ width: 1, height: 1 }

// Portrait video
{ width: 9, height: 16 }
```

### Ratio Limits

Android enforces minimum and maximum aspect ratios:
- **Minimum**: 1:2.39 (very wide)
- **Maximum**: 2.39:1 (very tall)

## PiP Controls

### Maximum Controls

- **Android 8-11**: 3 actions
- **Android 12+**: 5 actions

### Control Icons

Use Material icons for consistency:

```xml
<!-- res/drawable/ic_play_arrow.xml -->
<vector
  xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="24dp"
  android:height="24dp"
  android:viewportWidth="24"
  android:viewportHeight="24"
  android:tint="?attr/colorControlNormal">
  <path
    android:fillColor="@android:color/white"
    android:pathData="M8,5v14l11,-7z"/>
</vector>
```

## Best Practices

### 1. Check Support

```typescript
const { isSupported } = usePictureInPicture();

if (!isSupported) {
  // Hide PiP button or show alternative
  return <VideoPlayerWithoutPiP />;
}
```

### 2. Auto-Enter Wisely

```typescript
// Only auto-enter if video is playing
useAutoEnterPiP(isPlaying && userWantsAutoEnter, pipParams);

// Provide user control
<Switch
  value={autoEnterEnabled}
  onValueChange={setAutoEnterEnabled}
  label="Auto-enter PiP"
/>
```

### 3. Optimize for PiP Mode

```typescript
const { isInPipMode } = usePictureInPicture();

return (
  <View style={{ flex: 1 }}>
    {/* Always show video */}
    <VideoView />

    {/* Hide UI in PiP mode */}
    {!isInPipMode && (
      <>
        <VideoControls />
        <VideoInfo />
        <Comments />
      </>
    )}
  </View>
);
```

### 4. Handle State Changes

```typescript
useEffect(() => {
  if (isInPipMode) {
    // Minimize non-essential updates
    // Keep video playing
    // Pause analytics tracking
  } else {
    // Restore full UI
    // Resume normal operation
  }
}, [isInPipMode]);
```

## Testing

### Manual Testing

1. Play video
2. Tap PiP button or go to home
3. Verify PiP window appears
4. Test aspect ratio is correct
5. Tap PiP controls
6. Verify controls work
7. Tap PiP window to return
8. Verify state is preserved

### Test Checklist

- [ ] PiP window appears with correct aspect ratio
- [ ] Video continues playing in PiP
- [ ] Controls are visible and work
- [ ] Tapping window returns to app
- [ ] Auto-enter works on background (if enabled)
- [ ] State is preserved when exiting PiP
- [ ] Works with screen rotation
- [ ] Works with other apps open

## Troubleshooting

### PiP Not Entering

1. Check Android version (8.0+ required)
2. Verify `supportsPictureInPicture="true"` in manifest
3. Check aspect ratio is valid
4. Ensure activity is not finishing

### Controls Not Showing

1. Verify icon resources exist
2. Check action limit (3-5 actions max)
3. Ensure PendingIntent is created correctly
4. Test with different launchers

### Video Stops in PiP

1. Keep video player active
2. Don't pause on activity lifecycle
3. Handle configuration changes
4. Use foreground service if needed

## Resources

- [Android PiP Guide](https://developer.android.com/develop/ui/views/picture-in-picture)
- [PictureInPictureParams](https://developer.android.com/reference/android/app/PictureInPictureParams)
- [Material Icons](https://material.io/resources/icons/)
