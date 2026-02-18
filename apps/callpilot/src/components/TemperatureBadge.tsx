/**
 * TemperatureBadge
 *
 * Colored badge indicating contact temperature: hot (red), warm (amber), cold (blue).
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { withOpacity } from '@/utils/formatters'
import { Text } from './Text'
import type { ContactTemperature } from '@/types/contact'

export interface TemperatureBadgeProps {
  temperature: ContactTemperature
  size?: 'sm' | 'md'
}

const LABELS: Record<ContactTemperature, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
}

export function TemperatureBadge({ temperature, size = 'sm' }: TemperatureBadgeProps) {
  const { theme } = useTheme()
  const color = callpilotColors.temperature[temperature]
  const isSmall = size === 'sm'

  return (
    <View
      style={{
        backgroundColor: withOpacity(color, 'light'),
        borderRadius: theme.tokens.borderRadius.full,
        paddingHorizontal: isSmall ? theme.tokens.spacing[2] : theme.tokens.spacing[3],
        paddingVertical: isSmall ? 2 : theme.tokens.spacing[1],
        alignSelf: 'flex-start',
      }}
    >
      <Text
        variant="caption"
        weight="semibold"
        color={color}
        style={{ fontSize: isSmall ? theme.tokens.fontSize['2xs'] : theme.tokens.fontSize.xs }}
      >
        {LABELS[temperature]}
      </Text>
    </View>
  )
}
