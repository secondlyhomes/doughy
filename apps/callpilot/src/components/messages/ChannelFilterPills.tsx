/**
 * ChannelFilterPills
 *
 * Small horizontal pill group for filtering messages by channel: All | Text | Email
 */

import { View, TouchableOpacity } from 'react-native'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { triggerImpact } from '@/utils/haptics'
import { useTheme } from '@/theme'
import { Text } from '@/components/Text'

export type ChannelFilter = 'all' | 'text' | 'email'

const CHANNELS: { key: ChannelFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'text', label: 'Text' },
  { key: 'email', label: 'Email' },
]

interface ChannelFilterPillsProps {
  active: ChannelFilter
  onChange: (filter: ChannelFilter) => void
}

export function ChannelFilterPills({ active, onChange }: ChannelFilterPillsProps) {
  const { theme, isDark } = useTheme()

  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {CHANNELS.map(({ key, label }) => {
        const isActive = active === key
        return (
          <TouchableOpacity
            key={key}
            onPress={() => {
              triggerImpact(ImpactFeedbackStyle.Light)
              onChange(key)
            }}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            accessibilityLabel={`Filter by ${label}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: theme.tokens.borderRadius.full,
              backgroundColor: isActive
                ? theme.colors.primary[500]
                : isDark ? theme.colors.neutral[700] : theme.colors.neutral[200],
            }}
          >
            <Text
              variant="caption"
              weight={isActive ? 'semibold' : 'regular'}
              color={isActive ? theme.tokens.colors.white : theme.colors.text.secondary}
            >
              {label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}
