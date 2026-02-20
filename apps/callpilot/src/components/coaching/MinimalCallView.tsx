/**
 * MinimalCallView
 *
 * Focus mode — pulsing dot, duration, and a tap target to
 * switch back to the full stream when suggestions are available.
 */

import { useEffect, useRef } from 'react'
import { View, TouchableOpacity, Animated } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface MinimalCallViewProps {
  duration: number
  activeSuggestionCount: number
  onShowSuggestions: () => void
}

export function MinimalCallView({
  duration,
  activeSuggestionCount,
  onShowSuggestions,
}: MinimalCallViewProps) {
  const { theme } = useTheme()
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.3,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [pulse])

  const mins = Math.floor(duration / 60)
  const secs = duration % 60
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.tokens.spacing[4],
      }}
    >
      <Animated.View
        style={{
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: theme.colors.success[500],
          opacity: pulse,
        }}
      />
      <Text variant="caption" color={theme.colors.text.tertiary}>
        Call in progress
      </Text>
      <Text
        variant="h2"
        color={theme.colors.text.primary}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatted}
      </Text>
      {activeSuggestionCount > 0 && (
        <TouchableOpacity onPress={onShowSuggestions} activeOpacity={0.7}>
          <Text variant="bodySmall" color={theme.colors.primary[500]}>
            {activeSuggestionCount} suggestion{activeSuggestionCount !== 1 ? 's' : ''} available
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
