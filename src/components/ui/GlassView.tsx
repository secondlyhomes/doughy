// src/components/ui/GlassView.tsx
// Glass effect component with Liquid Glass (iOS 26+) and expo-blur fallback
import React from 'react';
import { Platform, View, ViewProps, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@/lib/liquid-glass';
import { useTheme, useThemeColors } from '@/contexts/ThemeContext';
import { getBackdropColor, withOpacity } from '@/lib/design-utils';
import { GLASS_BLUR } from '@/constants/design-tokens';

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

// Map effect type to iOS system material tint for native chrome look
function getIOSMaterialTint(effect: 'clear' | 'regular', isDark: boolean): string {
  if (effect === 'clear') {
    return isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight';
  }
  return isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';
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
  const colors = useThemeColors();

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

  // iOS without liquid glass — use system material tints for native chrome look
  if (Platform.OS === 'ios') {
    const materialTint = tint ?? getIOSMaterialTint(effect, isDark);
    return (
      <BlurView
        intensity={intensity}
        tint={materialTint as any}
        style={[style, { overflow: 'hidden' }]}
        {...props}
      >
        {children}
      </BlurView>
    );
  }

  // Android - use expo-blur with standard tint
  if (Platform.OS !== 'web') {
    const effectiveTint = tint ?? (isDark ? 'dark' : 'light');
    return (
      <BlurView
        intensity={intensity}
        tint={effectiveTint}
        style={[style, { overflow: 'hidden' }]}
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
        {
          backgroundColor: isDark
            ? withOpacity(colors.card, 'opaque')
            : withOpacity(colors.background, 'opaque'),
        },
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
        { backgroundColor: getBackdropColor(isDark) },
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
    backdropFilter: GLASS_BLUR.regular,
    // @ts-ignore - web-only property
    WebkitBackdropFilter: GLASS_BLUR.regular,
  },
  webBackdrop: {
    // @ts-ignore - web-only property
    backdropFilter: GLASS_BLUR.subtle,
    // @ts-ignore - web-only property
    WebkitBackdropFilter: GLASS_BLUR.subtle,
  },
});

// Re-export the support check for conditional rendering
export { isLiquidGlassSupported };
