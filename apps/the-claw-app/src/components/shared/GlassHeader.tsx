/**
 * GlassHeader Component
 *
 * Floating glass header that sits above scrollable content.
 * Uses native UIGlassEffect on iOS 26+, BlurView on older iOS, solid on Android.
 * Content scrolls behind the glass for that native iOS 26 look.
 *
 * DO NOT barrel-export (native dep via LiquidGlass).
 */

import { useCallback } from 'react'
import { View, Platform, StyleSheet, LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { useTheme } from '@/theme'
import { LiquidGlass, isLiquidGlassAvailable } from '../../../modules/liquid-glass'
import type { ReactNode } from 'react'

export interface GlassHeaderProps {
  children: ReactNode
  /** Called with the total header height (including safe area) so scroll content can add paddingTop */
  onHeightChange?: (height: number) => void
}

export function GlassHeader({ children, onHeightChange }: GlassHeaderProps) {
  const insets = useSafeAreaInsets()
  const { theme, isDark } = useTheme()

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      onHeightChange?.(e.nativeEvent.layout.height)
    },
    [onHeightChange],
  )

  return (
    <View
      onLayout={handleLayout}
      style={styles.container}
    >
      {/* Glass background layer */}
      {Platform.OS === 'ios' ? (
        isLiquidGlassAvailable ? (
          <LiquidGlass style={StyleSheet.absoluteFill} />
        ) : (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        )
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.surface },
          ]}
        />
      )}

      {/* Bottom separator — subtle line at bottom of glass */}
      <View
        style={[
          styles.separator,
          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
        ]}
      />

      {/* Content with safe area top padding */}
      <View style={{ paddingTop: insets.top }}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
})
