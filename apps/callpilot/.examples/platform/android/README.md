# Android Platform Features

Comprehensive examples of Android-specific features for React Native apps.

## Overview

This directory contains production-ready implementations of Android platform features including widgets, quick settings tiles, app shortcuts, Material You theming, predictive back gestures, picture-in-picture, and more.

## Features

### 1. Home Screen Widgets
📁 `widgets/`

Create interactive home screen widgets that display app content without opening the app.

- **Small Widget (1x1)**: Quick stats and metrics
- **Medium Widget (2x2)**: Task list with basic actions
- **Large Widget (4x2)**: Detailed list with multiple sections
- **Extra Large Widget (4x4)**: Full dashboard experience

**Requirements**: Android 7.0+ (API 25+)

[→ Widget Documentation](./widgets/README.md)

### 2. Quick Settings Tiles
📁 `tiles/`

Add quick action tiles to the Android Quick Settings panel.

- **Basic Tiles**: Simple toggle or action
- **Dialog Tiles**: Input dialogs (Android 10+)
- **Voice Tiles**: Voice input integration
- **Status Tiles**: Display real-time information

**Requirements**: Android 7.0+ (API 24+)

[→ Tiles Documentation](./tiles/README.md)

### 3. App Shortcuts
📁 `shortcuts/`

Provide quick access to app features via long-press on app icon.

- **Static Shortcuts**: Defined in XML, fixed at compile time
- **Dynamic Shortcuts**: Created/updated at runtime
- **Pinned Shortcuts**: User-pinned to home screen (Android 8.0+)

**Requirements**: Android 7.1+ (API 25+)

[→ Shortcuts Documentation](./shortcuts/README.md)

### 4. Material You (Dynamic Color)
📁 `material-you/`

Adaptive theming that extracts colors from device wallpaper.

- **Dynamic Color Extraction**: Wallpaper-based theming
- **Monet Color System**: Harmonious palettes
- **Material 3 Components**: Updated design system
- **Automatic Fallbacks**: Support for older Android versions

**Requirements**: Android 12+ (API 31+) for dynamic colors

[→ Material You Documentation](./material-you/README.md)

### 5. Predictive Back Gesture
📁 `predictive-back/`

Preview destination when user starts back gesture.

- **Gesture Animations**: Smooth preview animations
- **Cancel Support**: Handle gesture cancellation
- **Custom Animations**: Define your own transitions
- **Cross-Activity**: Works between activities

**Requirements**: Android 13+ (API 33+)

[→ Predictive Back Documentation](./predictive-back/README.md)

### 6. Picture-in-Picture
📁 `pip/`

Continue video playback in a floating window.

- **Custom Aspect Ratios**: Various video formats
- **PiP Controls**: Custom action buttons
- **Auto-Enter**: Automatically enter on background
- **Seamless Transitions**: Smooth enter/exit

**Requirements**: Android 8.0+ (API 26+)

[→ PiP Documentation](./pip/README.md)

### 7. Additional Features
📁 `features/`

Other Android-specific capabilities:

- **Direct Share**: Share to specific app features
- **Conversation Bubbles**: Floating chat heads (Android 11+)
- **Notification Channels**: Categorized notifications
- **Edge-to-Edge**: Full-screen immersive mode (Android 15+)

[→ Features Documentation](./features/README.md)

## Android Version Compatibility

| Feature | Min Version | Recommended |
|---------|------------|-------------|
| Widgets | Android 7.0 (API 25) | Android 12+ |
| Quick Settings Tiles | Android 7.0 (API 24) | Android 10+ |
| App Shortcuts | Android 7.1 (API 25) | Android 8.0+ |
| Material You | Android 12 (API 31) | Android 12+ |
| Predictive Back | Android 13 (API 33) | Android 13+ |
| Picture-in-Picture | Android 8.0 (API 26) | Android 8.0+ |
| Direct Share | Android 6.0 (API 23) | Android 10+ |
| Bubbles | Android 11 (API 30) | Android 11+ |
| Notification Channels | Android 8.0 (API 26) | Android 8.0+ |
| Edge-to-Edge | Android 15 (API 35) | Android 15+ |

## Getting Started

### 1. Choose Features

Select the features you want to implement based on your app's needs and target Android versions.

### 2. Install Dependencies

```bash
# React Native Android Widget
npm install react-native-android-widget

# AsyncStorage (for widget data)
npm install @react-native-async-storage/async-storage

# Additional packages as needed
```

### 3. Configure AndroidManifest.xml

Each feature requires specific permissions and configurations in `AndroidManifest.xml`. See individual feature documentation for details.

### 4. Implement Native Modules

Most features require Kotlin/Java implementations. Native code examples are provided in each feature's directory.

### 5. Test on Device

Android-specific features must be tested on physical devices or emulators:

```bash
# Run on Android
npx react-native run-android

# Test on specific API level
emulator -avd Pixel_5_API_33
```

## Project Structure

```
.examples/platform/android/
├── widgets/                    # Home screen widgets
│   ├── TaskWidget.tsx         # Widget components
│   ├── widgetConfig.ts        # Widget configuration
│   └── README.md              # Widget documentation
├── tiles/                      # Quick Settings tiles
│   ├── QuickTaskTile.tsx      # Tile implementation
│   └── README.md              # Tile documentation
├── shortcuts/                  # App shortcuts
│   ├── appShortcuts.ts        # Shortcut manager
│   └── README.md              # Shortcut documentation
├── material-you/               # Material You theming
│   ├── DynamicTheme.tsx       # Theme provider
│   └── README.md              # Theming documentation
├── predictive-back/            # Predictive back gesture
│   ├── PredictiveBack.tsx     # Back gesture handling
│   └── README.md              # Gesture documentation
├── pip/                        # Picture-in-Picture
│   ├── PictureInPicture.tsx   # PiP implementation
│   └── README.md              # PiP documentation
├── features/                   # Additional features
│   ├── DirectShare.tsx        # Direct share
│   ├── Bubbles.tsx            # Conversation bubbles
│   ├── NotificationChannels.tsx # Notification channels
│   └── EdgeToEdge.tsx         # Edge-to-edge display
└── README.md                   # This file
```

## Material Design Guidelines

All Android features should follow Material Design 3 guidelines:

- **Color**: Use Material You dynamic colors
- **Typography**: Roboto font family
- **Spacing**: 4dp baseline grid
- **Elevation**: Use surface containers instead of shadows
- **Icons**: Material Symbols (24dp)
- **Shapes**: Rounded corners (8dp, 12dp, 16dp)

## Testing Checklist

### Widget Testing

- [ ] Widget appears in widget picker
- [ ] All sizes display correctly
- [ ] Data updates properly
- [ ] Click actions work
- [ ] Handles configuration changes
- [ ] Works on different launchers

### Tile Testing

- [ ] Tile appears in Quick Settings editor
- [ ] Tile state updates correctly
- [ ] Click action works
- [ ] Icon displays properly
- [ ] Subtitle updates (Android 10+)

### Shortcut Testing

- [ ] Long-press shows shortcuts
- [ ] Static shortcuts appear
- [ ] Dynamic shortcuts update
- [ ] Pinned shortcuts work
- [ ] Deep links navigate correctly

### Material You Testing

- [ ] Colors extracted from wallpaper
- [ ] Fallback colors work (Android <12)
- [ ] Dark mode transitions smoothly
- [ ] All components use theme colors
- [ ] Contrast ratios meet WCAG AA

### Predictive Back Testing

- [ ] Gesture preview animates smoothly
- [ ] Cancel gesture works
- [ ] Commit gesture navigates back
- [ ] Works with modals/dialogs
- [ ] Fallback works (Android <13)

### PiP Testing

- [ ] Enters PiP mode correctly
- [ ] Aspect ratio is correct
- [ ] Controls work in PiP
- [ ] Auto-enter works
- [ ] Exits PiP properly

## Performance Considerations

### Widgets

- Limit widget updates (battery impact)
- Optimize images (compress, cache)
- Use efficient layouts (RemoteViews limitations)
- Implement lazy loading for lists

### Quick Settings Tiles

- Keep tile actions fast (<100ms)
- Update state promptly
- Handle errors gracefully
- Minimize battery usage

### Material You

- Cache extracted colors
- Optimize theme switches
- Preload color resources
- Use color state lists

## ProGuard/R8 Configuration

Add to `android/app/proguard-rules.pro`:

```proguard
# React Native Android Widget
-keep class com.reactnativeandroidwidget.** { *; }

# Material You
-keep class com.google.android.material.** { *; }

# Keep native modules
-keep class com.yourapp.modules.** { *; }

# Preserve annotations
-keepattributes *Annotation*
```

## Google Play Requirements

### Privacy Policy

If your widgets/tiles collect data, disclose in privacy policy:
- What data is collected
- How it's used
- Third-party sharing

### Permissions

Declare all permissions in manifest:
```xml
<!-- For PiP video -->
<uses-permission android:name="android.permission.INTERNET" />

<!-- For background work -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### Target SDK

Update to latest target SDK annually:
```gradle
android {
  compileSdkVersion 34
  targetSdkVersion 34
}
```

## Debugging

### Enable Debug Logging

```typescript
// In development
if (__DEV__) {
  console.log('Widget data:', widgetData);
  console.log('Tile state:', tileState);
  console.log('PiP status:', pipStatus);
}
```

### ADB Commands

```bash
# View widget info
adb shell dumpsys appwidget

# Test deep link
adb shell am start -a android.intent.action.VIEW -d "yourapp://tasks/new"

# Force stop app
adb shell am force-stop com.yourapp

# Check PiP status
adb shell dumpsys activity activities | grep -i "pip"
```

### Common Issues

**Widget not updating:**
- Check update interval (min 15 min)
- Verify SharedPreferences access
- Check WorkManager configuration

**Tile not appearing:**
- Verify manifest configuration
- Check service permissions
- Ensure correct API level

**PiP not working:**
- Verify manifest flag
- Check aspect ratio limits
- Ensure activity not finishing

## Resources

### Official Documentation

- [Android Developers](https://developer.android.com/)
- [Material Design 3](https://m3.material.io/)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)

### Tools

- [Android Studio](https://developer.android.com/studio)
- [Material Theme Builder](https://material-foundation.github.io/material-theme-builder/)
- [Icon Kitchen](https://icon.kitchen/)

### Libraries

- [react-native-android-widget](https://www.npmjs.com/package/react-native-android-widget)
- [Material Components Android](https://github.com/material-components/material-components-android)

## Support

For questions or issues:

1. Check feature-specific README files
2. Review Android documentation
3. Test on multiple Android versions
4. Check device manufacturer customizations

## License

These examples are provided as-is for educational purposes. Adapt as needed for your app.
