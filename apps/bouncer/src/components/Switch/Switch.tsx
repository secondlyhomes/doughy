/**
 * Switch Component
 *
 * Toggle switch with haptic feedback and theme support
 */

import React from 'react'
import { TouchableOpacity, Animated, ViewStyle } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { SwitchProps } from './types'

const TRACK_WIDTH = 52
const TRACK_HEIGHT = 32
const THUMB_SIZE = 28
const THUMB_OFFSET = 2

export function Switch({
  value,
  onValueChange,
  disabled = false,
  label,
  style,
}: SwitchProps) {
  const { theme } = useTheme()
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start()
  }, [value, animatedValue])

  function handleToggle() {
    if (disabled) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onValueChange(!value)
  }

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.neutral[300], theme.colors.primary[500]],
  })

  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [THUMB_OFFSET, TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET],
  })

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.tokens.spacing[3],
    ...style,
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handleToggle}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          backgroundColor: trackColor,
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <Animated.View
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: theme.tokens.colors.white,
            transform: [{ translateX: thumbTranslateX }],
            ...theme.tokens.shadows.sm,
          }}
        />
      </Animated.View>
      {label && (
        <Text
          variant="body"
          color={disabled ? theme.colors.text.tertiary : theme.colors.text.primary}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
