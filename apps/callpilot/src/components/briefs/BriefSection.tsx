/**
 * BriefSection Component
 *
 * Renders a titled section within a pre-call brief.
 */

import { View, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export interface BriefSectionProps {
  title: string
  items: string[]
  accentColor?: string
  style?: ViewStyle
}

export function BriefSection({ title, items, accentColor, style }: BriefSectionProps) {
  const { theme } = useTheme()

  return (
    <View
      style={[
        {
          borderLeftWidth: theme.tokens.borderWidth[4],
          borderLeftColor: accentColor ?? theme.colors.primary[500],
          paddingLeft: theme.tokens.spacing[3],
          marginBottom: theme.tokens.spacing[4],
        },
        style,
      ]}
    >
      <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
        {title}
      </Text>
      {items.map((item, index) => (
        <View key={index} style={{ flexDirection: 'row', marginBottom: theme.tokens.spacing[1] }}>
          <Text variant="bodySmall" color={theme.colors.text.secondary} style={{ marginRight: theme.tokens.spacing[2] }}>
            {'\u2022'}
          </Text>
          <Text variant="bodySmall" color={theme.colors.text.secondary} style={{ flex: 1 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  )
}
