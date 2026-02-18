import { View, ViewStyle, TextStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from './Text'
import { callpilotColors } from '@/theme/callpilotColors'

export type BadgeVariant = 'outcome' | 'sentiment' | 'relationship' | 'custom'

export interface StatusBadgeProps {
  label: string
  color?: string
  backgroundColor?: string
  variant?: BadgeVariant
  /** Used with variant='outcome' */
  outcome?: 'won' | 'progressed' | 'stalled' | 'lost' | 'follow_up'
  /** Used with variant='sentiment' */
  sentiment?: 'positive' | 'neutral' | 'negative'
  /** Used with variant='relationship' */
  relationship?: 'new' | 'building' | 'established' | 'strong'
  size?: 'sm' | 'md'
  style?: ViewStyle
}

export function StatusBadge({
  label,
  color,
  backgroundColor,
  variant = 'custom',
  outcome,
  sentiment,
  relationship,
  size = 'sm',
  style,
}: StatusBadgeProps) {
  const { theme } = useTheme()

  // Resolve color from variant
  let resolvedColor = color || theme.colors.text.primary
  let resolvedBg = backgroundColor || theme.colors.surfaceSecondary

  if (variant === 'outcome' && outcome) {
    resolvedColor = callpilotColors.outcome[outcome]
    resolvedBg = resolvedColor + '20' // 20% opacity
  } else if (variant === 'sentiment' && sentiment) {
    resolvedColor = callpilotColors.sentiment[sentiment]
    resolvedBg = resolvedColor + '20'
  } else if (variant === 'relationship' && relationship) {
    resolvedColor = callpilotColors.relationship[relationship]
    resolvedBg = resolvedColor + '20'
  }

  const isSmall = size === 'sm'

  const containerStyle: ViewStyle = {
    paddingHorizontal: theme.tokens.spacing[isSmall ? 2 : 3],
    paddingVertical: theme.tokens.spacing[isSmall ? 1 : 1],
    borderRadius: theme.tokens.borderRadius.full,
    backgroundColor: resolvedBg,
    alignSelf: 'flex-start',
    ...style,
  }

  const textStyle: TextStyle = {
    color: resolvedColor,
    fontSize: theme.tokens.fontSize[isSmall ? 'xs' : 'sm'],
    fontWeight: theme.tokens.fontWeight.semibold,
  }

  return (
    <View style={containerStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  )
}
