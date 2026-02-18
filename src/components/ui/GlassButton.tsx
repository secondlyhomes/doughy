// src/components/ui/GlassButton.tsx
// Reusable circular glass button for overlay actions (back buttons, floating actions, toolbar buttons)

import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { LiquidGlassView, LiquidGlassContainerView, isLiquidGlassSupported } from '@/lib/liquid-glass';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { GLASS_BLUR, PRESS_OPACITY } from '@/constants/design-tokens';
import { haptic } from '@/lib/haptics';

/** Default hit slop to extend touch target to 44pt minimum (Apple HIG) */
const DEFAULT_HIT_SLOP = 6;

export interface GlassButtonProps {
  /** Icon component to display */
  icon: React.ReactNode;
  /** Touch handler */
  onPress: () => void;
  /** Button diameter in pixels. Default: 32 (native iOS back button size) */
  size?: number;
  /** Glass blur effect type. Default: 'clear' (minimal blur for small buttons) */
  effect?: 'clear' | 'regular';
  /** Custom container style for positioning */
  containerStyle?: ViewStyle;
  /** Accessibility label (required for a11y) */
  accessibilityLabel: string;
  /** Active opacity when pressed. Default: 0.7 */
  activeOpacity?: number;
  /** Enable haptic feedback on press (default: true) */
  enableHaptics?: boolean;
}

export function GlassButton({
  icon,
  onPress,
  size = 32,
  effect = 'clear',
  containerStyle,
  accessibilityLabel,
  activeOpacity = PRESS_OPACITY.DEFAULT,
  enableHaptics = true,
}: GlassButtonProps) {
  const { isDark, colors } = useTheme();
  const borderRadius = size / 2;

  const handlePress = useCallback(() => {
    if (enableHaptics) {
      haptic.light();
    }
    onPress();
  }, [enableHaptics, onPress]);

  const buttonStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Ensure 44pt minimum touch target (Apple HIG)
  const hitSlopPx = Math.max(0, Math.ceil((44 - size) / 2));
  const hitSlop = hitSlopPx > 0 ? { top: hitSlopPx, bottom: hitSlopPx, left: hitSlopPx, right: hitSlopPx } : undefined;

  // iOS 26+ with Liquid Glass support
  if (Platform.OS === 'ios' && isLiquidGlassSupported) {
    return (
      <LiquidGlassContainerView spacing={8} style={containerStyle}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={activeOpacity}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          hitSlop={hitSlop}
          style={[buttonStyle, { overflow: 'hidden' }]}
        >
          <LiquidGlassView
            style={[StyleSheet.absoluteFill, { borderRadius }]}
            effect={effect}
            interactive={true}
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
        onPress={handlePress}
        activeOpacity={activeOpacity}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={hitSlop}
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

  // Web fallback - CSS backdrop-filter with improved visibility
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={hitSlop}
      style={[
        buttonStyle,
        containerStyle,
        styles.webGlass,
        {
          backgroundColor: isDark
            ? withOpacity(colors.foreground, 'medium')
            : withOpacity(colors.foreground, 'light'),
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
