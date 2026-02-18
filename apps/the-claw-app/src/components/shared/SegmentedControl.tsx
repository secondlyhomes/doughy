/**
 * SegmentedControl Component
 *
 * iOS-style segmented control with animated selection indicator.
 */

import { useRef, useEffect } from 'react'
import { View, TouchableOpacity, Animated } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface SegmentedControlOption<T extends string> {
  label: string
  value: T
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[]
  selected: T
  onSelect: (value: T) => void
}

export function SegmentedControl<T extends string>({
  options,
  selected,
  onSelect,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme()
  const selectedIndex = options.findIndex((o) => o.value === selected)
  const translateX = useRef(new Animated.Value(0)).current
  const segmentWidth = useRef(0)

  useEffect(() => {
    if (segmentWidth.current > 0) {
      Animated.spring(translateX, {
        toValue: selectedIndex * segmentWidth.current,
        useNativeDriver: true,
        tension: 120,
        friction: 14,
      }).start()
    }
  }, [selectedIndex, translateX])

  function handleLayout(event: { nativeEvent: { layout: { width: number } } }) {
    const totalWidth = event.nativeEvent.layout.width
    segmentWidth.current = totalWidth / options.length
    translateX.setValue(selectedIndex * segmentWidth.current)
  }

  function handleSelect(value: T) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelect(value)
  }

  return (
    <View
      onLayout={handleLayout}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceSecondary,
        borderRadius: theme.tokens.borderRadius.sm,
        padding: 2,
      }}
    >
      {/* Animated selection pill */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 2,
          bottom: 2,
          left: 2,
          width: `${100 / options.length}%` as unknown as number,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.tokens.borderRadius.sm - 2,
          transform: [{ translateX }],
          ...theme.tokens.shadows.subtle,
        }}
      />

      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => handleSelect(option.value)}
          style={{
            flex: 1,
            paddingVertical: theme.tokens.spacing[2],
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.7}
          accessibilityRole="tab"
          accessibilityState={{ selected: option.value === selected }}
        >
          <Text
            variant="bodySmall"
            weight={option.value === selected ? 'semibold' : 'regular'}
            color={option.value === selected ? theme.colors.text.primary : theme.colors.text.secondary}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
