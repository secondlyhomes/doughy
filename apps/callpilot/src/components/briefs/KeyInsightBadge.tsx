/**
 * KeyInsightBadge Component
 *
 * Displays a key fact as a tag/chip within a pre-call brief.
 */

import { View, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface KeyInsightBadgeProps {
  text: string
  style?: ViewStyle
}

export function KeyInsightBadge({ text, style }: KeyInsightBadgeProps) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.info[50],
          paddingHorizontal: theme.tokens.spacing[3],
          paddingVertical: theme.tokens.spacing[1],
          borderRadius: theme.tokens.borderRadius.md,
          marginRight: theme.tokens.spacing[2],
          marginBottom: theme.tokens.spacing[2],
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        weight="medium"
        color={theme.colors.info[700]}
      >
        {text}
      </Text>
    </View>
  )
}
