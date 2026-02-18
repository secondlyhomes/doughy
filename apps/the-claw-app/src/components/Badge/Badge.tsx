/**
 * Badge Component
 *
 * Colored label for tier indicators and status
 */

import { View, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'custom'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps {
  label: string
  variant?: BadgeVariant
  size?: BadgeSize
  color?: string
  backgroundColor?: string
  style?: ViewStyle
}

export function Badge({
  label,
  variant = 'default',
  size = 'sm',
  color,
  backgroundColor,
  style,
}: BadgeProps) {
  const { theme } = useTheme()

  const colorMap: Record<string, { bg: string; text: string }> = {
    default: { bg: 'rgba(60,60,67,0.08)', text: theme.colors.neutral[700] },
    success: { bg: 'rgba(34,197,94,0.12)', text: theme.colors.success[700] },
    warning: { bg: 'rgba(245,158,11,0.12)', text: theme.colors.warning[700] },
    error: { bg: 'rgba(239,68,68,0.12)', text: theme.colors.error[700] },
    info: { bg: 'rgba(59,130,246,0.12)', text: theme.colors.info[700] },
    custom: { bg: backgroundColor || 'rgba(60,60,67,0.08)', text: color || theme.colors.neutral[700] },
  }

  const colors = colorMap[variant]

  const containerStyle: ViewStyle = {
    backgroundColor: backgroundColor || colors.bg,
    borderRadius: theme.tokens.borderRadius.full,
    paddingHorizontal: size === 'sm' ? theme.tokens.spacing[2] : theme.tokens.spacing[3],
    paddingVertical: size === 'sm' ? theme.tokens.spacing[0] + 2 : theme.tokens.spacing[1],
    alignSelf: 'flex-start',
    ...style,
  }

  const textStyle: TextStyle = {
    color: color || colors.text,
    fontSize: size === 'sm' ? theme.tokens.fontSize.xs : theme.tokens.fontSize.sm,
    fontWeight: theme.tokens.fontWeight.medium,
  }

  return (
    <View style={containerStyle} accessibilityRole="text" accessibilityLabel={label}>
      <Text style={textStyle}>{label}</Text>
    </View>
  )
}
