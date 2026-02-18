# Predictive Back Gesture (Android 13+)

Complete guide for implementing predictive back gestures in React Native.

## Overview

Predictive back gestures allow users to preview the result of a back navigation before committing to it. As the user swipes to go back, the current screen animates to show what's behind it, creating a more intuitive navigation experience.

## Requirements

- **Android 13+ (API 33+)** for predictive back gestures
- **Edge-to-edge display** recommended for best UX
- **OnBackInvokedCallback API** implementation

## Setup

### 1. Enable Predictive Back in AndroidManifest.xml

Add to your `<application>` tag:

```xml
<application
  android:enableOnBackInvokedCallback="true">
  <!-- Your app configuration -->
</application>
```

### 2. Create Native Module

`android/app/src/main/java/com/yourapp/modules/PredictiveBackModule.kt`:

```kotlin
package com.yourapp.modules

import android.os.Build
import android.window.OnBackAnimationCallback
import android.window.BackEvent
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class PredictiveBackModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), OnBackAnimationCallback {

  private var isCallbackRegistered = false

  override fun getName(): String = "PredictiveBackModule"

  @RequiresApi(Build.VERSION_CODES.TIRAMISU)
  @ReactMethod
  fun registerBackCallback(promise: Promise) {
    try {
      if (!isCallbackRegistered) {
        currentActivity?.onBackPressedDispatcher?.addCallback(
          currentActivity!!,
          object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
              sendEvent("onBackInvoked", null)
            }
          }
        )
        isCallbackRegistered = true
      }
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("REGISTER_ERROR", e.message)
    }
  }

  @ReactMethod
  fun unregisterBackCallback(promise: Promise) {
    isCallbackRegistered = false
    promise.resolve(true)
  }

  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  override fun onBackStarted(backEvent: BackEvent) {
    val params = Arguments.createMap().apply {
      putDouble("progress", backEvent.progress.toDouble())
      putString("swipeEdge", if (backEvent.swipeEdge == BackEvent.EDGE_LEFT) "left" else "right")
      putDouble("touchX", backEvent.touchX.toDouble())
      putDouble("touchY", backEvent.touchY.toDouble())
    }
    sendEvent("onBackStarted", params)
  }

  @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
  override fun onBackProgressed(backEvent: BackEvent) {
    val params = Arguments.createMap().apply {
      putDouble("progress", backEvent.progress.toDouble())
      putString("swipeEdge", if (backEvent.swipeEdge == BackEvent.EDGE_LEFT) "left" else "right")
      putDouble("touchX", backEvent.touchX.toDouble())
      putDouble("touchY", backEvent.touchY.toDouble())
    }
    sendEvent("onBackProgressed", params)
  }

  override fun onBackCancelled() {
    sendEvent("onBackCancelled", null)
  }

  override fun onBackInvoked() {
    sendEvent("onBackInvoked", null)
  }

  private fun sendEvent(eventName: String, params: WritableMap?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
}
```

## Usage

### Basic Implementation

```typescript
import { usePredictiveBack, BackAnimations } from './PredictiveBack';

function MyScreen({ onNavigateBack }) {
  const { animationValue } = usePredictiveBack({
    onBackInvoked: onNavigateBack,
  });

  const animatedStyle = BackAnimations.scaleDown(animationValue);

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {/* Screen content */}
    </Animated.View>
  );
}
```

### With Progress Tracking

```typescript
function DetailScreen() {
  const { animationValue } = usePredictiveBack({
    onBackStarted: (event) => {
      console.log('Back gesture started at', event.touchX, event.touchY);
    },
    onBackProgressed: (event) => {
      console.log('Gesture progress:', event.progress);
    },
    onBackCancelled: () => {
      console.log('User cancelled back gesture');
    },
    onBackInvoked: () => {
      navigation.goBack();
    },
  });

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [
          {
            translateX: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 300],
            }),
          },
        ],
      }}
    >
      {/* Content */}
    </Animated.View>
  );
}
```

## Animation Presets

### Scale Down (Material Design Default)

```typescript
const style = BackAnimations.scaleDown(animationValue);
// Scales from 100% to 90%, fades to 50%
```

### Slide to Edge

```typescript
const style = BackAnimations.slideToEdge(animationValue, 'right');
// Slides 100px to the right
```

### Slide and Scale

```typescript
const style = BackAnimations.slideAndScale(animationValue, 'right');
// Combines slide and scale for smoother effect
```

### Reveal Previous Screen

```typescript
// Current screen
const currentStyle = BackAnimations.reveal(animationValue);

// Previous screen (revealed from behind)
const previousStyle = BackAnimations.parallax(animationValue, 0.3);
```

## Custom Animations

```typescript
function CustomBackAnimation() {
  const { animationValue } = usePredictiveBack({
    onBackInvoked: () => navigation.goBack(),
  });

  const customStyle = {
    transform: [
      {
        // Custom rotation
        rotateY: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '90deg'],
        }),
      },
      {
        // Custom scale
        scale: animationValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.8],
        }),
      },
    ],
    // Custom opacity
    opacity: animationValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [1, 0.8, 0],
    }),
  };

  return <Animated.View style={[{ flex: 1 }, customStyle]}>{/* Content */}</Animated.View>;
}
```

## Modal with Predictive Back

```typescript
import { PredictiveBackModal } from './PredictiveBack';

function ModalExample() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button title="Show Modal" onPress={() => setShowModal(true)} />

      <PredictiveBackModal visible={showModal} onClose={() => setShowModal(false)}>
        <Text>Modal Content</Text>
      </PredictiveBackModal>
    </>
  );
}
```

## Navigation Stack

```typescript
function NavigationStack() {
  const [screens, setScreens] = useState(['Home']);

  const navigateBack = () => {
    setScreens((prev) => prev.slice(0, -1));
  };

  const navigateTo = (screen: string) => {
    setScreens((prev) => [...prev, screen]);
  };

  return (
    <View style={{ flex: 1 }}>
      {screens.map((screen, index) => (
        <NavigationStackItem
          key={screen}
          isActive={index === screens.length - 1}
          onNavigateBack={navigateBack}
          index={index}
        >
          <Screen name={screen} navigateTo={navigateTo} />
        </NavigationStackItem>
      ))}
    </View>
  );
}
```

## Advanced Use Cases

### Conditional Back Handling

```typescript
function FormScreen({ hasUnsavedChanges }) {
  useConditionalBack(hasUnsavedChanges, async () => {
    const shouldDiscard = await showConfirmDialog('Discard changes?');
    if (shouldDiscard) {
      navigation.goBack();
    }
  });

  return <Form />;
}
```

### Priority-based Back Handling

```typescript
function ScreenWithModal({ showModal }) {
  // Modal has priority 1
  useEffect(() => {
    if (showModal) {
      BackGestureInterceptor.register('modal', {
        onBackInvoked: () => setShowModal(false),
      }, 1);
    } else {
      BackGestureInterceptor.unregister('modal');
    }
  }, [showModal]);

  // Screen has priority 0
  useEffect(() => {
    BackGestureInterceptor.register('screen', {
      onBackInvoked: () => navigation.goBack(),
    }, 0);

    return () => BackGestureInterceptor.unregister('screen');
  }, []);
}
```

## Best Practices

### 1. Provide Visual Feedback

```typescript
// Good: Show preview of what's behind
const { animationValue } = usePredictiveBack({
  onBackInvoked: goBack,
});

// Animate current screen
const currentStyle = BackAnimations.slideAndScale(animationValue);
```

### 2. Handle Cancellation

```typescript
usePredictiveBack({
  onBackCancelled: () => {
    // Reset any state changes made during gesture
    resetTempState();
  },
  onBackInvoked: () => {
    // Commit changes and navigate
    saveState();
    goBack();
  },
});
```

### 3. Optimize Performance

```typescript
// Use native driver for better performance
Animated.timing(animationValue, {
  toValue: 1,
  duration: 200,
  useNativeDriver: true, // Important!
}).start();
```

### 4. Test on Real Devices

Predictive back gestures feel different on real hardware. Always test on physical devices with different screen sizes and Android versions.

## Fallback for Older Android

```typescript
function BackGestureHandler({ onBack }) {
  const { animationValue } = usePredictiveBack({
    onBackInvoked: onBack,
  });

  // Android 13+: Predictive back with animation
  if (Platform.Version >= 33) {
    const animatedStyle = BackAnimations.scaleDown(animationValue);
    return <Animated.View style={animatedStyle}>{/* Content */}</Animated.View>;
  }

  // Android <13: Standard back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack]);

  return <View>{/* Content */}</View>;
}
```

## Testing

### Manual Testing

1. Swipe from left or right edge to trigger back gesture
2. Verify animation plays smoothly
3. Test cancelling gesture (release before threshold)
4. Test committing gesture (swipe past threshold)
5. Test with modals, drawers, and sheets

### Automated Testing

```typescript
// Mock predictive back events
const mockBackEvent = {
  progress: 0.5,
  swipeEdge: 'right' as const,
  touchX: 100,
  touchY: 500,
};

// Test callback
const onBackProgressed = jest.fn();

usePredictiveBack({
  onBackProgressed,
});

// Emit event
backEmitter.emit('onBackProgressed', mockBackEvent);

expect(onBackProgressed).toHaveBeenCalledWith(mockBackEvent);
```

## Troubleshooting

### Gesture Not Working

1. Check Android version (13+ required)
2. Verify `enableOnBackInvokedCallback` in manifest
3. Ensure OnBackInvokedCallback is registered
4. Check if another handler is intercepting

### Animation Stuttering

1. Use `useNativeDriver: true`
2. Avoid expensive operations during animation
3. Optimize view hierarchy
4. Test on real device (not emulator)

### Gesture Not Cancelling

1. Verify `onBackCancelled` callback
2. Check animation spring configuration
3. Ensure state resets properly

## Resources

- [Android Predictive Back](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
- [OnBackInvokedCallback](https://developer.android.com/reference/android/window/OnBackInvokedCallback)
- [Material Motion](https://m3.material.io/styles/motion/overview)
