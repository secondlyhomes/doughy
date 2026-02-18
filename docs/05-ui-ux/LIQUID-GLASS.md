# Liquid Glass Effects

iOS 26+ glass effects with cross-platform fallbacks for React Native + Expo.

## Overview

Liquid Glass is Apple's most significant design evolution since iOS 7 (WWDC 2025). It introduces translucent, dynamic materials with real-time light bending, specular highlights, and adaptive shadows. Apple's guidance: **"Liquid Glass is best reserved for the navigation layer that floats above content"** — not full-screen backgrounds.

Standard UIKit/SwiftUI components inherit glass automatically when built with Xcode 26. For custom glass surfaces, use the `expo-glass-effect` library.

### When to Use Glass

| Use Case | Appropriate? |
|----------|-------------|
| Tab bar, header bar | Yes — navigation chrome |
| Floating action buttons | Yes — navigation layer |
| Cards overlaying content | Yes — elevated surfaces |
| Segmented controls, filters | Yes — interactive selectors |
| Full-screen backgrounds | No — kills content readability |
| Heavy text areas | No — reduces legibility |
| Every surface in the app | No — Apple says use sparingly |

## Prerequisites

- Expo SDK 54+ with Xcode 26
- `expo-glass-effect` (~0.1.8+) for native Liquid Glass
- `expo-blur` for iOS < 26 fallback
- Physical iOS 26 device or simulator for testing glass

```bash
npx expo install expo-glass-effect expo-blur
```

> **Note:** `expo-glass-effect` is designed to work in Expo Go. If you hit issues on early beta builds, use a development build instead.

## Quick Start

```typescript
// src/components/shared/GlassView.tsx
import { GlassView } from '@/components/shared/GlassView';

// Use anywhere you need a glass surface
<GlassView style={styles.card} glassStyle="regular">
  <Text>Content on glass</Text>
</GlassView>
```

See `.examples/components/shared/GlassView.tsx` for the full reference implementation.

## GlassView Component

The `GlassView` component provides a three-tier fallback system:

1. **iOS 26+**: Native Liquid Glass via `expo-glass-effect`
2. **iOS < 26**: `expo-blur` BlurView
3. **Android**: Semi-transparent View with theme fallback colors

### Implementation

```typescript
// src/components/shared/GlassView.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp, InteractionManager } from 'react-native';
import { BlurView } from 'expo-blur';
import { glass } from '@/theme';
import { useTheme } from '@/theme';

// Lazy import to avoid crashes on unsupported platforms
interface GlassViewNativeProps {
  style?: StyleProp<ViewStyle>;
  glassEffectStyle: 'clear' | 'regular';
  isInteractive?: boolean;
  tintColor?: string;
  children?: React.ReactNode;
}
let GlassViewNative: React.ComponentType<GlassViewNativeProps> | null = null;
let isLiquidGlassAvailableFn: (() => boolean) | null = null;

try {
  const glassEffect = require('expo-glass-effect');
  GlassViewNative = glassEffect.GlassView;
  isLiquidGlassAvailableFn = glassEffect.isLiquidGlassAvailable;
} catch {
  // Expected on non-iOS 26+ devices
}

// --- Global status subscription system ---
type LiquidGlassStatus = 'pending' | 'available' | 'unavailable';
let liquidGlassStatus: LiquidGlassStatus = 'pending';
const subscribers = new Set<() => void>();

const notifySubscribers = () => {
  subscribers.forEach(callback => callback());
};

// Resolve status at module load
if (Platform.OS === 'ios' && isLiquidGlassAvailableFn !== null) {
  const immediateResult = isLiquidGlassAvailableFn();
  if (immediateResult) {
    liquidGlassStatus = 'available';
  } else {
    InteractionManager.runAfterInteractions(() => {
      if (liquidGlassStatus === 'pending') {
        const result = isLiquidGlassAvailableFn!();
        liquidGlassStatus = result ? 'available' : 'unavailable';
        notifySubscribers();
      }
    });
  }
} else {
  liquidGlassStatus = 'unavailable';
}

/**
 * Call during app init to prevent flash on first render.
 * Resolves when liquid glass availability is determined.
 */
export function ensureLiquidGlassStatusResolved(): Promise<void> {
  return new Promise((resolve) => {
    if (liquidGlassStatus !== 'pending') {
      resolve();
      return;
    }
    const callback = () => {
      subscribers.delete(callback);
      resolve();
    };
    subscribers.add(callback);

    // Fallback timeout
    setTimeout(() => {
      if (liquidGlassStatus === 'pending') {
        liquidGlassStatus = (isLiquidGlassAvailableFn?.())
          ? 'available' : 'unavailable';
        notifySubscribers();
      }
    }, 500);
  });
}

// Hook for subscribing to glass availability
function useLiquidGlassAvailable(): boolean {
  const [status, setStatus] = useState<LiquidGlassStatus>(liquidGlassStatus);

  useEffect(() => {
    if (status !== liquidGlassStatus) setStatus(liquidGlassStatus);
    if (liquidGlassStatus === 'pending') {
      const callback = () => setStatus(liquidGlassStatus);
      subscribers.add(callback);
      return () => { subscribers.delete(callback); };
    }
  }, [status]);

  return status === 'available';
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glassStyle` | `'clear' \| 'regular'` | `'regular'` | Glass effect intensity |
| `isInteractive` | `boolean` | `false` | Responds to touch (iOS 26+) |
| `tintColor` | `string` | — | Optional color tint |
| `fallbackIntensity` | `number` | `50` | Blur intensity for iOS < 26 (0-100) |
| `style` | `StyleProp<ViewStyle>` | — | Container style |

### Render Logic

```typescript
export function GlassView({
  children, style, glassStyle = 'regular',
  isInteractive = false, tintColor, fallbackIntensity = 50,
}: GlassViewProps) {
  const { isDark } = useTheme();
  const supportsLiquidGlass = useLiquidGlassAvailable();
  const [renderPhase, setRenderPhase] = useState(0);

  // Two-phase rendering for UIVisualEffectView initialization
  useEffect(() => {
    if (supportsLiquidGlass && renderPhase === 0) {
      const frameId = requestAnimationFrame(() => setRenderPhase(1));
      return () => cancelAnimationFrame(frameId);
    }
  }, [supportsLiquidGlass, renderPhase]);

  // Tier 1: iOS 26+ native glass
  if (supportsLiquidGlass && GlassViewNative) {
    return (
      <GlassViewNative
        key={renderPhase === 0 ? 'glass-mounting' : 'glass-ready'}
        style={[styles.glass, style]}
        glassEffectStyle={glassStyle}
        isInteractive={isInteractive}
        tintColor={tintColor}
      >
        {children}
      </GlassViewNative>
    );
  }

  // Tier 2: iOS < 26 blur fallback
  if (Platform.OS === 'ios') {
    return (
      <BlurView style={[styles.glass, style]}
        intensity={fallbackIntensity} tint={isDark ? 'dark' : 'light'}>
        {children}
      </BlurView>
    );
  }

  // Tier 3: Android semi-transparent fallback
  const fallbackColor = isDark ? glass.fallback.dark : glass.fallback.light;
  return (
    <View style={[styles.glass, { backgroundColor: fallbackColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: { overflow: 'hidden' },
});
```

## Glass Styles

| Style | Visual Effect | Use Case |
|-------|--------------|----------|
| `clear` | Lighter, more transparent | Subtle overlays, secondary surfaces |
| `regular` | Standard translucency | Navigation elements, cards, primary surfaces |

```typescript
<GlassView glassStyle="clear">   {/* Lighter glass */}
<GlassView glassStyle="regular"> {/* Standard glass */}
```

## GlassContainer

When placing multiple glass elements adjacent to each other, use `GlassContainer` to merge them into a unified glass surface:

```typescript
import { GlassContainer } from 'expo-glass-effect';

// Merged glass surfaces with 2px gap
<GlassContainer spacing={2}>
  <GlassView style={styles.tab}>
    <Text>Tab 1</Text>
  </GlassView>
  <GlassView style={styles.tab}>
    <Text>Tab 2</Text>
  </GlassView>
</GlassContainer>
```

The `spacing` prop controls the gap between merged glass elements in points.

## Theme Integration

Add glass tokens to your theme system:

```typescript
// src/theme/glass.ts
export const glass = {
  styles: {
    clear: 'clear' as const,
    regular: 'regular' as const,
  },
  fallback: {
    light: 'rgba(255, 255, 255, 0.85)',
    dark: 'rgba(31, 41, 55, 0.85)',
  },
};
```

See [Theming Guide — Glass Effect Tokens](THEMING.md#glass-effect-tokens) for integration with the `ThemeColors` interface.

## App Initialization

Call `ensureLiquidGlassStatusResolved()` during app startup to prevent a flash where GlassView renders a fallback before the native module reports availability:

```typescript
// app/_layout.tsx
import { ensureLiquidGlassStatusResolved } from '@/components/shared/GlassView';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function init() {
      await ensureLiquidGlassStatusResolved();
      // ... other init (fonts, auth, etc.)
      setIsReady(true);
    }
    init();
  }, []);

  if (!isReady) return null; // Or splash screen

  return (
    <ThemeProvider>
      <Stack />
    </ThemeProvider>
  );
}
```

## Navigation Glass

### Tab Bar (NativeTabs)

Use `NativeTabs` from Expo Router for a native `UITabBarController` with automatic Liquid Glass on iOS 26+. Fork by platform since NativeTabs is iOS-only.

```typescript
// app/(tabs)/_layout.tsx
import { Platform, DynamicColorIOS } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/theme';

export default function TabLayout() {
  const { isDark, colors } = useTheme();

  // Android: use standard Tabs (NativeTabs is buggy on Android)
  if (Platform.OS !== 'ios') {
    return (
      <Tabs screenOptions={{
        tabBarActiveTintColor: colors.primary[500],
      }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    );
  }

  // iOS: native tab bar with liquid glass
  return (
    <NativeTabs
      backgroundColor="transparent"
      blurEffect={isDark
        ? 'systemUltraThinMaterialDark'
        : 'systemUltraThinMaterialLight'}
      tintColor={DynamicColorIOS({
        light: colors.primary[500],
        dark: colors.primary[500],
      })}
      shadowColor="transparent"
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tasks">
        <Icon sf={{ default: 'checkmark.circle', selected: 'checkmark.circle.fill' }} />
        <Label>Tasks</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
```

Key points:
- Use `DynamicColorIOS` or `PlatformColor` for tint colors (auto light/dark)
- SF Symbols via `sf` prop with `default`/`selected` variants
- `backgroundColor: "transparent"` lets glass show through
- Maximum 5 tabs on Android (Material Design constraint)
- SDK 55 adds `minimizeBehavior="onScrollDown"`, `hidden`, `NativeTabs.BottomAccessory`

See `.examples/platform/patterns/ios/LiquidGlassNavigation.tsx` for the full example.

### Headers

Apply glass blur to stack headers with `headerBlurEffect` and `headerTransparent`:

```typescript
// app/_layout.tsx or any Stack.Screen
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';

export default function Layout() {
  return (
    <Stack screenOptions={{
      ...(Platform.OS === 'ios' && {
        headerBlurEffect: 'regular',
        headerTransparent: true,
      }),
    }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}

// In your screen component, offset content below the transparent header
function MyScreen() {
  const headerHeight = useHeaderHeight();

  return (
    <ScrollView contentContainerStyle={{ paddingTop: headerHeight }}>
      {/* Content */}
    </ScrollView>
  );
}
```

> **iOS 26 note:** `react-native-screens` auto-applies glass to header buttons. To customize, use `unstable_headerLeftItems` / `unstable_headerRightItems`.

See `.examples/platform/patterns/ios/GlassHeader.tsx` for the full example.

### Modals

Combine glass with modal presentation for floating overlays:

```typescript
<Stack.Screen
  name="modal"
  options={{
    presentation: 'modal',
    ...(Platform.OS === 'ios' && {
      headerBlurEffect: 'regular',
      headerTransparent: true,
    }),
  }}
/>
```

## Reusable Patterns

### GlassTabSelector

A generic glass-styled selector component for filters, settings, and segmented controls:

```typescript
import { GlassTabSelector } from '@/components/shared/GlassTabSelector';

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Done' },
];

function TaskFilter() {
  const [filter, setFilter] = useState('all');

  return (
    <GlassTabSelector
      options={FILTER_OPTIONS}
      value={filter}
      onChange={setFilter}
      variant="compact"
    />
  );
}
```

Three variants: `compact` (single row), `expanded` (larger with descriptions), `list` (vertical stack). See `.examples/components/shared/GlassTabSelector.tsx`.

### GlassCard

```typescript
function GlassCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { theme } = useTheme();

  return (
    <GlassView
      style={[{
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing[4],
      }, style]}
      glassStyle="regular"
    >
      {children}
    </GlassView>
  );
}
```

## Troubleshooting

### Pre-Mounted Tab Fix

Tabs that are rendered but not yet focused (e.g., the Settings tab) may not display glass correctly because `UIVisualEffectView` requires a layout pass while visible.

**Fix:** Use `useFocusEffect` to force a single remount on first focus:

```typescript
import { useFocusEffect } from 'expo-router';

function SettingsScreen() {
  const [focusKey, setFocusKey] = useState(0);
  const hasBeenFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!hasBeenFocused.current) {
        hasBeenFocused.current = true;
        setFocusKey(prev => prev + 1);
      }
    }, [])
  );

  return (
    <View key={focusKey}>
      <GlassView>{/* ... */}</GlassView>
    </View>
  );
}
```

> **Warning:** Only increment on first focus. Incrementing every focus causes visible flashing.

### Opacity Gotcha

Setting `opacity < 1` on a `GlassView` from `expo-glass-effect` causes rendering errors. Use animation props or wrapper views instead:

```typescript
// BAD - rendering errors
<GlassView style={{ opacity: 0.5 }}> ... </GlassView>

// GOOD - animate with Animated API on a wrapper
<Animated.View style={{ opacity: fadeAnim }}>
  <GlassView> ... </GlassView>
</Animated.View>
```

### Beta API Check

Some iOS 26 beta builds lack the glass API. Use `isGlassEffectAPIAvailable()` for runtime checks:

```typescript
import { isGlassEffectAPIAvailable } from 'expo-glass-effect';

if (isGlassEffectAPIAvailable()) {
  // Safe to use GlassView with native glass
}
```

The `GlassView` component handles this automatically via the global status system.

### Two-Phase Rendering

The native `UIVisualEffectView` requires a complete layout pass before glass renders correctly. The `GlassView` component handles this with a `requestAnimationFrame` + key change pattern:

1. Phase 0: Initial render — native view mounts
2. Phase 1: After `requestAnimationFrame` — key change forces remount with proper layout

This is handled internally. You should not need to implement this yourself.

### `isInteractive` Cannot Change After Mount

The `isInteractive` prop on `expo-glass-effect`'s GlassView is set once during native view creation. To change interactivity, remount with a different `key`:

```typescript
<GlassView
  key={isInteractive ? 'interactive' : 'static'}
  isInteractive={isInteractive}
>
```

## Platform Fallback Summary

| Platform | iOS 26+ | iOS < 26 | Android |
|----------|---------|----------|---------|
| Glass surface | Native Liquid Glass | `expo-blur` BlurView | Semi-transparent View |
| Tab bar | Automatic via NativeTabs | Blur via NativeTabs blurEffect | Standard `<Tabs>` |
| Headers | Automatic glass | `headerBlurEffect: 'regular'` | Standard opaque header |
| Visual quality | Full glass with light bending | Gaussian blur | Solid color with alpha |

## Checklist

- [ ] `expo-glass-effect` and `expo-blur` installed
- [ ] `GlassView` component created with three-tier fallback
- [ ] Glass theme tokens added (`src/theme/glass.ts`)
- [ ] `ensureLiquidGlassStatusResolved()` called in `_layout.tsx`
- [ ] NativeTabs used for iOS tab bar (standard Tabs for Android)
- [ ] `headerBlurEffect` configured for stack headers (iOS only)
- [ ] Pre-mounted tab fix applied for tabs with GlassView
- [ ] Tested on iOS 26 device/simulator
- [ ] Tested fallback on iOS < 26 and Android
- [ ] No `opacity < 1` directly on GlassView
- [ ] Glass used only on navigation layer and elevated surfaces
