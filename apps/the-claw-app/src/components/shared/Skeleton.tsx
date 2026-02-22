/**
 * Skeleton loading placeholder.
 *
 * Animated pulse effect for content placeholders while data loads.
 */

import { useEffect, useRef } from 'react'
import { View, Animated, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'

export interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { theme } = useTheme()
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: theme.colors.border,
          opacity,
        },
        style,
      ]}
    />
  )
}

export function SkeletonCard({ lines = 3, style }: { lines?: number; style?: ViewStyle }) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: theme.tokens.borderRadius.lg,
          padding: theme.tokens.spacing[4],
          gap: theme.tokens.spacing[3],
        },
        style,
      ]}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={i === 0 ? 20 : 14}
        />
      ))}
    </View>
  )
}
