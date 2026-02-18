# Material You (Dynamic Color)

Complete guide for implementing Material You dynamic theming in React Native.

## Overview

Material You is Google's design language that adapts to user preferences, specifically extracting colors from the device wallpaper to create personalized color schemes.

### Key Features

- **Dynamic Color Extraction**: Colors derived from wallpaper
- **Monet Color System**: Harmonious color palettes
- **Adaptive Icons**: Icons that match system theme
- **Automatic Dark Mode**: Seamless light/dark transitions
- **Accessibility**: WCAG-compliant contrast ratios

## Requirements

- **Android 12+ (API 31+)** for dynamic colors
- **Material 3** design system
- Fallback theme for older Android versions

## Quick Start

```typescript
import { DynamicThemeProvider, useMaterialYouColors } from './DynamicTheme';

// Wrap your app
function App() {
  return (
    <DynamicThemeProvider>
      <YourApp />
    </DynamicThemeProvider>
  );
}

// Use in components
function MyComponent() {
  const colors = useMaterialYouColors();

  return (
    <View style={{ backgroundColor: colors.surface }}>
      <Text style={{ color: colors.onSurface }}>Hello Material You!</Text>
    </View>
  );
}
```

## Color Roles

### Primary Colors

```typescript
const colors = useMaterialYouColors();

colors.primary                // Main brand color
colors.onPrimary             // Text/icons on primary
colors.primaryContainer      // Containers using primary
colors.onPrimaryContainer    // Text/icons on primary container
```

### Secondary Colors

```typescript
colors.secondary             // Accent color
colors.onSecondary          // Text/icons on secondary
colors.secondaryContainer   // Containers using secondary
colors.onSecondaryContainer // Text/icons on secondary container
```

### Tertiary Colors

```typescript
colors.tertiary             // Additional accent
colors.onTertiary          // Text/icons on tertiary
colors.tertiaryContainer   // Containers using tertiary
colors.onTertiaryContainer // Text/icons on tertiary container
```

### Surface Colors

```typescript
colors.surface             // Default surface color
colors.onSurface          // Text/icons on surface
colors.surfaceVariant     // Subtle surface variant
colors.onSurfaceVariant   // Text/icons on surface variant

// Surface containers (elevation)
colors.surfaceContainerLowest   // Elevation 0
colors.surfaceContainerLow      // Elevation 1
colors.surfaceContainer         // Elevation 2
colors.surfaceContainerHigh     // Elevation 3
colors.surfaceContainerHighest  // Elevation 4
```

### Background Colors

```typescript
colors.background      // Screen background
colors.onBackground    // Text/icons on background
```

### Error Colors

```typescript
colors.error             // Error state
colors.onError          // Text/icons on error
colors.errorContainer   // Error containers
colors.onErrorContainer // Text/icons on error container
```

### Outline Colors

```typescript
colors.outline         // Borders, dividers
colors.outlineVariant  // Subtle borders
```

## Common Patterns

### Buttons

```typescript
import { ThemeComponents, useMaterialYouColors } from './DynamicTheme';

function MyButton({ variant = 'filled', label, onPress }) {
  const colors = useMaterialYouColors();
  const buttonColors = ThemeComponents.getButtonColors(colors, variant);

  return (
    <TouchableOpacity
      style={{
        backgroundColor: buttonColors.background,
        borderWidth: variant === 'outlined' ? 1 : 0,
        borderColor: buttonColors.border,
        padding: 16,
        borderRadius: 8,
      }}
      onPress={onPress}
    >
      <Text style={{ color: buttonColors.text }}>{label}</Text>
    </TouchableOpacity>
  );
}

// Usage
<MyButton variant="filled" label="Primary" />
<MyButton variant="tonal" label="Secondary" />
<MyButton variant="outlined" label="Outlined" />
<MyButton variant="text" label="Text" />
```

### Cards

```typescript
function MyCard({ children, elevated = false }) {
  const colors = useMaterialYouColors();
  const cardColors = ThemeComponents.getCardColors(colors, elevated);

  return (
    <View
      style={{
        backgroundColor: cardColors.background,
        borderRadius: 12,
        borderWidth: elevated ? 0 : 1,
        borderColor: cardColors.border,
        padding: 16,
      }}
    >
      {children}
    </View>
  );
}
```

### Text Inputs

```typescript
function MyTextInput({ placeholder, value, onChangeText }) {
  const colors = useMaterialYouColors();
  const inputColors = ThemeComponents.getInputColors(colors);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      <TextInput
        style={{
          backgroundColor: inputColors.background,
          color: inputColors.text,
          borderWidth: 1,
          borderColor: isFocused ? inputColors.borderFocused : inputColors.border,
          padding: 12,
          borderRadius: 8,
        }}
        placeholderTextColor={inputColors.placeholder}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </View>
  );
}
```

### Bottom Navigation

```typescript
function BottomNav({ routes, activeRoute, onRouteChange }) {
  const colors = useMaterialYouColors();
  const navColors = ThemeComponents.getNavigationColors(colors);

  return (
    <View style={{ backgroundColor: navColors.background, flexDirection: 'row' }}>
      {routes.map((route) => {
        const isActive = route.key === activeRoute;

        return (
          <TouchableOpacity
            key={route.key}
            style={{
              flex: 1,
              padding: 12,
              alignItems: 'center',
              backgroundColor: isActive ? navColors.indicator : 'transparent',
            }}
            onPress={() => onRouteChange(route.key)}
          >
            <Icon
              name={route.icon}
              color={isActive ? navColors.iconActive : navColors.icon}
            />
            <Text
              style={{
                color: isActive ? navColors.textActive : navColors.text,
                marginTop: 4,
              }}
            >
              {route.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
```

## Native Implementation

### Setup Material You Module

Create `android/app/src/main/java/com/yourapp/modules/MaterialYouModule.kt`:

```kotlin
package com.yourapp.modules

import android.content.res.Configuration
import android.os.Build
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.*
import com.google.android.material.color.DynamicColors

class MaterialYouModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "MaterialYouModule"

  @ReactMethod
  fun isDynamicColorAvailable(promise: Promise) {
    val available = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
      DynamicColors.isDynamicColorAvailable()
    promise.resolve(available)
  }

  @RequiresApi(Build.VERSION_CODES.S)
  @ReactMethod
  fun getDynamicColors(colorScheme: String?, promise: Promise) {
    try {
      val isDark = when (colorScheme) {
        "dark" -> true
        "light" -> false
        else -> {
          val uiMode = reactApplicationContext.resources.configuration.uiMode
          (uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
        }
      }

      val context = reactApplicationContext
      val colors = WritableNativeMap()

      // Get dynamic colors using Material 3
      val colorScheme = if (isDark) {
        com.google.android.material.color.MaterialColors
          .getColorScheme(context, android.R.style.Theme_DeviceDefault)
      } else {
        com.google.android.material.color.MaterialColors
          .getColorScheme(context, android.R.style.Theme_DeviceDefault_Light)
      }

      // Primary
      colors.putString("primary", String.format("#%06X", 0xFFFFFF and colorScheme.primary))
      colors.putString("onPrimary", String.format("#%06X", 0xFFFFFF and colorScheme.onPrimary))
      colors.putString("primaryContainer", String.format("#%06X", 0xFFFFFF and colorScheme.primaryContainer))
      colors.putString("onPrimaryContainer", String.format("#%06X", 0xFFFFFF and colorScheme.onPrimaryContainer))

      // Secondary
      colors.putString("secondary", String.format("#%06X", 0xFFFFFF and colorScheme.secondary))
      colors.putString("onSecondary", String.format("#%06X", 0xFFFFFF and colorScheme.onSecondary))
      colors.putString("secondaryContainer", String.format("#%06X", 0xFFFFFF and colorScheme.secondaryContainer))
      colors.putString("onSecondaryContainer", String.format("#%06X", 0xFFFFFF and colorScheme.onSecondaryContainer))

      // Tertiary
      colors.putString("tertiary", String.format("#%06X", 0xFFFFFF and colorScheme.tertiary))
      colors.putString("onTertiary", String.format("#%06X", 0xFFFFFF and colorScheme.onTertiary))
      colors.putString("tertiaryContainer", String.format("#%06X", 0xFFFFFF and colorScheme.tertiaryContainer))
      colors.putString("onTertiaryContainer", String.format("#%06X", 0xFFFFFF and colorScheme.onTertiaryContainer))

      // Error
      colors.putString("error", String.format("#%06X", 0xFFFFFF and colorScheme.error))
      colors.putString("onError", String.format("#%06X", 0xFFFFFF and colorScheme.onError))
      colors.putString("errorContainer", String.format("#%06X", 0xFFFFFF and colorScheme.errorContainer))
      colors.putString("onErrorContainer", String.format("#%06X", 0xFFFFFF and colorScheme.onErrorContainer))

      // Background
      colors.putString("background", String.format("#%06X", 0xFFFFFF and colorScheme.background))
      colors.putString("onBackground", String.format("#%06X", 0xFFFFFF and colorScheme.onBackground))

      // Surface
      colors.putString("surface", String.format("#%06X", 0xFFFFFF and colorScheme.surface))
      colors.putString("onSurface", String.format("#%06X", 0xFFFFFF and colorScheme.onSurface))
      colors.putString("surfaceVariant", String.format("#%06X", 0xFFFFFF and colorScheme.surfaceVariant))
      colors.putString("onSurfaceVariant", String.format("#%06X", 0xFFFFFF and colorScheme.onSurfaceVariant))

      // Outline
      colors.putString("outline", String.format("#%06X", 0xFFFFFF and colorScheme.outline))
      colors.putString("outlineVariant", String.format("#%06X", 0xFFFFFF and colorScheme.outlineVariant))

      promise.resolve(colors)
    } catch (e: Exception) {
      promise.reject("GET_COLORS_ERROR", e.message)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Set up wallpaper change listener
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Clean up listeners
  }
}
```

### Configure build.gradle

Add to `android/app/build.gradle`:

```gradle
dependencies {
  implementation "com.google.android.material:material:1.11.0"
}
```

## Adaptive Icons

### Create Adaptive Icon

`android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_launcher_background"/>
  <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
  <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
```

### Themed App Icon (Android 13+)

`res/values/colors.xml`:

```xml
<resources>
  <color name="ic_launcher_background">#FFFFFF</color>
</resources>
```

`res/drawable/ic_launcher_monochrome.xml`:

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
  android:width="108dp"
  android:height="108dp"
  android:viewportWidth="108"
  android:viewportHeight="108">
  <path
    android:fillColor="#000000"
    android:pathData="M54,54m-40,0a40,40 0,1 1,80 0a40,40 0,1 1,-80 0"/>
</vector>
```

## Testing

### Test on Different Wallpapers

1. Change wallpaper in device settings
2. Verify app colors update automatically
3. Test with light and dark wallpapers
4. Check color contrast

### Test Fallback

1. Test on Android <12 device/emulator
2. Verify fallback colors are used
3. Check all UI components render correctly

### Test Dark Mode

1. Toggle dark mode in system settings
2. Verify smooth color transitions
3. Check text readability
4. Test all screens

## Best Practices

### 1. Always Provide Fallbacks

```typescript
const colors = useMaterialYouColors();
// Always works on Android 7+ with fallback
```

### 2. Use Semantic Color Roles

```typescript
// Good: Semantic role
<Text style={{ color: colors.onSurface }}>

// Bad: Hardcoded color
<Text style={{ color: '#000000' }}>
```

### 3. Test Contrast

```typescript
// Material You guarantees WCAG AA contrast
// But verify in edge cases
const hasGoodContrast = checkContrast(
  colors.primary,
  colors.onPrimary
) >= 4.5;
```

### 4. Support Color Scheme Changes

```typescript
// Listen to system changes
const colorScheme = useColorScheme();

useEffect(() => {
  // Update UI when color scheme changes
}, [colorScheme]);
```

## Resources

- [Material You Design](https://m3.material.io/styles/color/dynamic-color/overview)
- [Android Dynamic Colors](https://developer.android.com/develop/ui/views/theming/dynamic-colors)
- [Material Color Tool](https://material.io/resources/color/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
