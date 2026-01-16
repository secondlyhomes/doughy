// src/components/ui/GlassButton.tsx
// Reusable circular glass button for overlay actions (back buttons, floating actions, toolbar buttons)

import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LiquidGlassView, LiquidGlassContainerView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { GLASS_BLUR } from '@/constants/design-tokens';

export interface GlassButtonProps {
  /** Icon component to display */
  icon: React.ReactNode;
  /** Touch handler */
  onPress: () => void;
  /** Button diameter in pixels. Default: 40 */
  size?: number;
  /** Glass blur effect type. Default: 'clear' (minimal blur for small buttons) */
  effect?: 'clear' | 'regular';
  /** Custom container style for positioning */
  containerStyle?: ViewStyle;
  /** Accessibility label (required for a11y) */
  accessibilityLabel: string;
  /** Active opacity when pressed. Default: 0.7 */
  activeOpacity?: number;
}

export function GlassButton({
  icon,
  onPress,
  size = 40,
  effect = 'clear',
  containerStyle,
  accessibilityLabel,
  activeOpacity = 0.7,
}: GlassButtonProps) {
  const { isDark } = useTheme();
  const borderRadius = size / 2;

  const buttonStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  };

  // iOS 26+ with Liquid Glass support
  if (Platform.OS === 'ios' && isLiquidGlassSupported) {
    return (
      <LiquidGlassContainerView spacing={8} style={containerStyle}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={activeOpacity}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          style={buttonStyle}
        >
          <LiquidGlassView
            style={StyleSheet.absoluteFill}
            effect={effect}
            interactive={true} // Native touch feedback on iOS 26+
            colorScheme={isDark ? 'dark' : 'light'}
          />
          {icon}
        </TouchableOpacity>
      </LiquidGlassContainerView>
    );
  }

  // iOS < 26 or Android - use expo-blur fallback
  if (Platform.OS !== 'web') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={activeOpacity}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={[buttonStyle, containerStyle, { overflow: 'hidden' }]}
      >
        <BlurView
          intensity={effect === 'clear' ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {icon}
      </TouchableOpacity>
    );
  }

  // Web fallback - CSS backdrop-filter
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        buttonStyle,
        containerStyle,
        styles.webGlass,
        {
          backgroundColor: isDark
            ? withOpacity('#FFFFFF', 'muted')  // 10% white
            : withOpacity('#000000', 'muted'), // 10% black
        },
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  webGlass: {
    // @ts-ignore - web-only property
    backdropFilter: GLASS_BLUR.regular,
    // @ts-ignore - web-only property
    WebkitBackdropFilter: GLASS_BLUR.regular,
  },
});
