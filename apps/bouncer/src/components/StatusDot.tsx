/**
 * StatusDot Component
 *
 * Small colored indicator for connection/integration status
 */

import { useRef, useEffect, useState } from 'react'
import { View, Animated, AccessibilityInfo, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { withAlpha } from '@/utils/color'

export type StatusDotColor = 'green' | 'yellow' | 'red' | 'gray' | 'blue'
export type StatusDotSize = 'sm' | 'md' | 'lg' | number

const SIZE_MAP: Record<string, number> = {
  sm: 8,
  md: 10,
  lg: 14,
}

export interface StatusDotProps {
  color?: StatusDotColor
  size?: StatusDotSize
  pulse?: boolean
  style?: ViewStyle
}

export function StatusDot({
  color = 'gray',
  size: sizeProp = 'md',
  pulse = false,
  style,
}: StatusDotProps) {
  const size = typeof sizeProp === 'string' ? SIZE_MAP[sizeProp] ?? 10 : sizeProp
  const { theme } = useTheme()
  const pulseScale = useRef(new Animated.Value(1)).current
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  useEffect(() => {
    if (pulse && !reduceMotion) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      )
      animation.start()
      return () => { animation.stop() }
    }
    pulseScale.setValue(1)
    return undefined
  }, [pulse, reduceMotion, pulseScale])

  const colorMap: Record<StatusDotColor, string> = {
    green: theme.colors.success[500],
    yellow: theme.colors.warning[500],
    red: theme.colors.error[500],
    gray: theme.colors.neutral[400],
    blue: theme.colors.info[500],
  }

  if (pulse && !reduceMotion) {
    return (
      <View style={[{ width: size * 1.6, height: size * 1.6, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Animated.View
          style={{
            position: 'absolute',
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: (size * 1.6) / 2,
            backgroundColor: withAlpha(colorMap[color], 0.25),
            transform: [{ scale: pulseScale }],
          }}
        />
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colorMap[color],
          }}
          accessibilityRole="image"
          accessibilityLabel={`Status: ${color}`}
        />
      </View>
    )
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colorMap[color],
        },
        pulse && {
          borderWidth: 2,
          borderColor: withAlpha(colorMap[color], 0.25),
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`Status: ${color}`}
    />
  )
}
