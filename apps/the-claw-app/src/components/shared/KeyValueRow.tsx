/**
 * KeyValueRow Component
 *
 * Simple label + value display row for settings and detail views.
 */

import { View, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface KeyValueRowProps {
  label: string
  value: string
  style?: ViewStyle
}

export function KeyValueRow({ label, value, style }: KeyValueRowProps) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: theme.tokens.spacing[2],
        },
        style,
      ]}
    >
      <Text variant="bodySmall" color={theme.colors.text.tertiary}>
        {label}
      </Text>
      <Text
        variant="bodySmall"
        weight="medium"
        numberOfLines={1}
        style={{ flex: 1, textAlign: 'right', marginLeft: theme.tokens.spacing[2] }}
      >
        {value}
      </Text>
    </View>
  )
}
