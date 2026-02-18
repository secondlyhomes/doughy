/**
 * GlassView Component
 *
 * Glass effect with 3-tier fallback:
 * 1. iOS 26+ — native Liquid Glass via @callstack/liquid-glass
 * 2. iOS < 26 — expo-blur BlurView
 * 3. Android — opaque semi-transparent fallback
 */

import { ReactNode } from 'react'
import { View, ViewStyle, Platform } from 'react-native'
import { BlurView } from 'expo-blur'
import { LiquidGlassView, isLiquidGlassSupported } from '@/lib/liquid-glass'
import { useTheme } from '@/theme'
import { withOpacity } from '@/utils/formatters'
import type { GlassIntensity } from './GlassView.types'

export type { GlassIntensity }

export { isLiquidGlassSupported }

export interface GlassViewProps {
  children: ReactNode
  /** Named intensity — maps to blur values for expo-blur fallback */
  intensity?: GlassIntensity
  style?: ViewStyle | undefined
  borderRadius?: number
  /** Liquid Glass effect type (iOS 26+ only). Default: 'regular' */
  effect?: 'clear' | 'regular'
  /** Enable touch interaction effects (iOS 26+ only). Default: false */
  interactive?: boolean
}

export function GlassView({
  children,
  intensity = 'medium',
  style,
  borderRadius,
  effect = 'regular',
  interactive = false,
}: GlassViewProps) {
  const { theme, isDark } = useTheme()
  const blurIntensity = theme.tokens.glassIntensity[intensity]
  const radius = borderRadius ?? theme.tokens.borderRadius.lg

  // Tier 1: iOS 26+ with native Liquid Glass
  if (Platform.OS === 'ios' && isLiquidGlassSupported && LiquidGlassView) {
    return (
      <LiquidGlassView
        style={[{ borderRadius: radius, overflow: 'hidden' }, style]}
        effect={effect}
        interactive={interactive}
        colorScheme={isDark ? 'dark' : 'light'}
      >
        {children}
      </LiquidGlassView>
    )
  }

  // Tier 2: iOS < 26 — expo-blur
  if (Platform.OS === 'ios') {
    return (
      <View style={{ borderRadius: radius, overflow: 'hidden' }}>
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={style}
        >
          {children}
        </BlurView>
      </View>
    )
  }

  // Tier 3: Android — opaque semi-transparent fallback
  return (
    <View
      style={[
        {
          backgroundColor: isDark
            ? withOpacity(theme.colors.neutral[800], 'strong')
            : withOpacity(theme.tokens.colors.white, 'strong'),
          borderRadius: radius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
