/**
 * Divider Component
 *
 * Themed horizontal rule
 */

import { View, ViewStyle, StyleSheet } from 'react-native'
import { useTheme } from '@/theme'

export type DividerSpacing = 'sm' | 'md' | 'lg' | number

export interface DividerProps {
  style?: ViewStyle
  spacing?: DividerSpacing
}

export function Divider({ style, spacing }: DividerProps) {
  const { theme } = useTheme()

  const SPACING_MAP: Record<string, number> = {
    sm: theme.tokens.spacing[2],
    md: theme.tokens.spacing[3],
    lg: theme.tokens.spacing[6],
  }

  const marginVertical = spacing == null
    ? theme.tokens.spacing[3]
    : typeof spacing === 'string'
      ? SPACING_MAP[spacing] ?? theme.tokens.spacing[3]
      : spacing

  return (
    <View
      style={[
        {
          height: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
          marginVertical,
        },
        style,
      ]}
    />
  )
}
