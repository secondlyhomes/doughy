/**
 * GlassButton
 *
 * Circular glass button for nav actions (back, menu, FABs).
 * iOS 26+: native Liquid Glass via LiquidGlassContainerView + LiquidGlassView
 *   (container must have explicit size to prevent oval distortion)
 * iOS < 26: expo-blur BlurView fallback
 * Android: opaque semi-transparent fallback
 */

import { useCallback, ReactNode } from 'react'
import { TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { triggerImpact } from '@/utils/haptics'
import {
  LiquidGlassView,
  LiquidGlassContainerView,
  isLiquidGlassSupported,
} from '@/lib/liquid-glass'
import { useTheme } from '@/theme'
import { withOpacity } from '@/utils/formatters'

export interface GlassButtonProps {
  icon: ReactNode
  onPress: () => void
  /** Button diameter. Default: 32 */
  size?: number
  /** Liquid Glass effect type. Default: 'clear' */
  effect?: 'clear' | 'regular'
  containerStyle?: ViewStyle | undefined
  accessibilityLabel: string
  activeOpacity?: number
  enableHaptics?: boolean
}

export function GlassButton({
  icon,
  onPress,
  size = 32,
  effect = 'clear',
  containerStyle,
  accessibilityLabel,
  activeOpacity = 0.7,
  enableHaptics = true,
}: GlassButtonProps) {
  const { theme, isDark } = useTheme()
  const borderRadius = size / 2

  const handlePress = useCallback(() => {
    if (enableHaptics) {
      triggerImpact(ImpactFeedbackStyle.Light)
    }
    onPress()
  }, [enableHaptics, onPress])

  const buttonStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  // Ensure 44pt minimum touch target (Apple HIG)
  const hitSlopPx = Math.max(0, Math.ceil((44 - size) / 2))
  const hitSlop = hitSlopPx > 0
    ? { top: hitSlopPx, bottom: hitSlopPx, left: hitSlopPx, right: hitSlopPx }
    : undefined

  // iOS 26+ — native Liquid Glass (interactive button effect)
  // Container pinned to exact button size to prevent oval distortion
  if (Platform.OS === 'ios' && isLiquidGlassSupported) {
    return (
      <LiquidGlassContainerView
        style={[{ width: size, height: size }, containerStyle]}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={activeOpacity}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          hitSlop={hitSlop}
          style={buttonStyle}
        >
          <LiquidGlassView
            style={[StyleSheet.absoluteFill, { borderRadius }]}
            effect={effect}
            interactive
            colorScheme={isDark ? 'dark' : 'light'}
          />
          {icon}
        </TouchableOpacity>
      </LiquidGlassContainerView>
    )
  }

  // iOS < 26 — expo-blur fallback
  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={activeOpacity}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        hitSlop={hitSlop}
        style={[buttonStyle, containerStyle]}
      >
        <BlurView
          intensity={effect === 'clear' ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {icon}
      </TouchableOpacity>
    )
  }

  // Android — opaque semi-transparent fallback
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={activeOpacity}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={hitSlop}
      style={[
        buttonStyle,
        {
          backgroundColor: isDark
            ? withOpacity(theme.colors.neutral[800], 'medium')
            : withOpacity(theme.tokens.colors.white, 'medium'),
        },
        containerStyle,
      ]}
    >
      {icon}
    </TouchableOpacity>
  )
}
