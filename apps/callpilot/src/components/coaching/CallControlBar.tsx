/**
 * CallControlBar
 *
 * Fixed bottom bar with Mute (decorative), End Call, and Speaker (decorative).
 */

import { View, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface CallControlBarProps {
  onEndCall: () => void
}

export function CallControlBar({ onEndCall }: CallControlBarProps) {
  const { theme } = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        paddingVertical: theme.tokens.spacing[4],
        paddingHorizontal: theme.tokens.spacing[6],
      }}
    >
      {/* Mute (decorative) */}
      <View style={{ alignItems: 'center', gap: theme.tokens.spacing[2] }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: theme.colors.neutral[700],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name="mic-off-outline"
            size={22}
            color={theme.colors.neutral[300]}
          />
        </View>
        <Text variant="caption" color={theme.colors.neutral[400]}>
          Mute
        </Text>
      </View>

      {/* End Call */}
      <View style={{ alignItems: 'center', gap: theme.tokens.spacing[2] }}>
        <TouchableOpacity
          onPress={onEndCall}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="End call"
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: theme.colors.error[500],
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.tokens.shadows.lg,
          }}
        >
          <Ionicons
            name="call"
            size={28}
            color={theme.tokens.colors.white}
            style={{ transform: [{ rotate: '135deg' }] }}
          />
        </TouchableOpacity>
        <Text variant="caption" color={theme.colors.neutral[400]}>
          End Call
        </Text>
      </View>

      {/* Speaker (decorative) */}
      <View style={{ alignItems: 'center', gap: theme.tokens.spacing[2] }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: theme.colors.neutral[700],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons
            name="volume-high-outline"
            size={22}
            color={theme.colors.neutral[300]}
          />
        </View>
        <Text variant="caption" color={theme.colors.neutral[400]}>
          Speaker
        </Text>
      </View>
    </View>
  )
}
