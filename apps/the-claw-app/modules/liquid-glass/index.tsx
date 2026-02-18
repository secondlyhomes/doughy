/**
 * Liquid Glass Module
 *
 * Wraps expo-glass-effect's GlassView for iOS 26+ Liquid Glass.
 * Falls back to plain View on iOS < 26 and Android.
 *
 * DO NOT barrel-export this from src/components/index.ts
 * (native dep — import directly where needed).
 */

import { View, ViewStyle, StyleProp } from 'react-native'
import type { ReactNode } from 'react'

// Import from Expo's official glass effect package (bundled in Expo Go)
import {
  GlassView,
  isLiquidGlassAvailable as checkLiquidGlassAvailable,
} from 'expo-glass-effect'
import type { GlassStyle } from 'expo-glass-effect'

let _isAvailable: boolean | null = null
function getIsAvailable(): boolean {
  if (_isAvailable === null) {
    try {
      _isAvailable = checkLiquidGlassAvailable()
    } catch {
      _isAvailable = false
    }
  }
  return _isAvailable
}

/** Whether the real UIGlassEffect native view is available */
export const isLiquidGlassAvailable = getIsAvailable()

export interface LiquidGlassProps {
  cornerRadius?: number
  /** Glass effect style — 'regular' (default) or 'clear' */
  glassEffectStyle?: GlassStyle
  /** Tint color applied to the glass effect */
  tintColor?: string
  /** Whether the glass effect responds to touch interactions */
  isInteractive?: boolean
  style?: StyleProp<ViewStyle>
  fallbackStyle?: StyleProp<ViewStyle>
  children?: ReactNode
}

export function LiquidGlass({
  cornerRadius = 0,
  glassEffectStyle,
  tintColor,
  isInteractive,
  style,
  fallbackStyle,
  children,
}: LiquidGlassProps) {
  if (getIsAvailable()) {
    return (
      <GlassView
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        isInteractive={isInteractive}
        style={[style, cornerRadius ? { borderRadius: cornerRadius } : undefined]}
      >
        {children}
      </GlassView>
    )
  }

  // Fallback: plain View on Android or iOS < 26
  return (
    <View style={[style, fallbackStyle]}>
      {children}
    </View>
  )
}
