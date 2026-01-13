// src/components/ui/GlassView.tsx
// Glass effect component with Liquid Glass (iOS 26+) and expo-blur fallback
import React from 'react';
import { Platform, View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { useTheme } from '@/context/ThemeContext';

export interface GlassViewProps extends ViewProps {
  /** Blur intensity for expo-blur fallback (0-100). Default: 50 */
  intensity?: number;
  /** Tint color for blur effect. Default: based on theme */
  tint?: 'light' | 'dark' | 'default';
  /** Liquid Glass effect type (iOS 26+ only). Default: 'regular' */
  effect?: 'clear' | 'regular';
  /** Enable touch interaction effects (iOS 26+ only). Default: false */
  interactive?: boolean;
  children?: React.ReactNode;
}

export function GlassView({
  intensity = 50,
  tint,
  effect = 'regular',
  interactive = false,
  style,
  children,
  ...props
}: GlassViewProps) {
  const { isDark } = useTheme();
  const effectiveTint = tint ?? (isDark ? 'dark' : 'light');

  // iOS 26+ with Liquid Glass support
  if (Platform.OS === 'ios' && isLiquidGlassSupported) {
    return (
      <LiquidGlassView
        style={style}
        effect={effect}
        interactive={interactive}
        colorScheme={isDark ? 'dark' : 'light'}
        {...props}
      >
        {children}
      </LiquidGlassView>
    );
  }

  // iOS < 26 or Android - use expo-blur
  if (Platform.OS !== 'web') {
    return (
      <BlurView
        intensity={intensity}
        tint={effectiveTint}
        style={style}
        {...props}
      >
        {children}
      </BlurView>
    );
  }

  // Web fallback - CSS backdrop-filter
  return (
    <View
      style={[
        style,
        styles.webGlass,
        isDark ? styles.webGlassDark : styles.webGlassLight,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Glass backdrop specifically for modal overlays
export interface GlassBackdropProps extends ViewProps {
  /** Blur intensity for the backdrop. Default: 20 */
  intensity?: number;
  children?: React.ReactNode;
}

export function GlassBackdrop({
  intensity = 20,
  style,
  children,
  ...props
}: GlassBackdropProps) {
  const { isDark } = useTheme();

  // iOS 26+ - use system blur with Liquid Glass
  if (Platform.OS === 'ios' && isLiquidGlassSupported) {
    return (
      <View style={[StyleSheet.absoluteFill, style]} {...props}>
        <BlurView
          intensity={intensity}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }

  // iOS < 26 or Android - use expo-blur
  if (Platform.OS !== 'web') {
    return (
      <BlurView
        intensity={intensity}
        tint={isDark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, style]}
        {...props}
      >
        {children}
      </BlurView>
    );
  }

  // Web fallback
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        style,
        styles.webBackdrop,
        isDark ? styles.webBackdropDark : styles.webBackdropLight,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  webGlass: {
    // @ts-ignore - web-only property
    backdropFilter: 'blur(12px)',
    // @ts-ignore - web-only property
    WebkitBackdropFilter: 'blur(12px)',
  },
  webGlassLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  webGlassDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  webBackdrop: {
    // @ts-ignore - web-only property
    backdropFilter: 'blur(8px)',
    // @ts-ignore - web-only property
    WebkitBackdropFilter: 'blur(8px)',
  },
  webBackdropLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  webBackdropDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
});

// Re-export the support check for conditional rendering
export { isLiquidGlassSupported };
