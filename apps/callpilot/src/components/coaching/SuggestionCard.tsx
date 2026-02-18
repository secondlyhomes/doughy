/**
 * SuggestionCard
 *
 * A tappable card showing a talking point suggestion with category and priority.
 * Tapping marks it as used (dimmed + checkmark).
 */

import { TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { callpilotColors } from '@/theme/callpilotColors'
import type { TalkingPointSuggestion } from '@/types'

export interface SuggestionCardProps {
  suggestion: TalkingPointSuggestion
  onUse: () => void
}

const CATEGORY_LABELS: Record<TalkingPointSuggestion['category'], string> = {
  opener: 'Opener',
  objection_response: 'Objection',
  closing: 'Closing',
  discovery: 'Discovery',
  value_prop: 'Value Prop',
}

const PRIORITY_COLORS: Record<TalkingPointSuggestion['priority'], string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#a3a3a3',
}

export function SuggestionCard({ suggestion, onUse }: SuggestionCardProps) {
  const { theme } = useTheme()
  const categoryColor = callpilotColors.coaching[suggestion.category]

  return (
    <TouchableOpacity
      onPress={onUse}
      activeOpacity={0.7}
      disabled={suggestion.used}
      style={{
        backgroundColor: theme.colors.neutral[800],
        borderRadius: theme.tokens.borderRadius.lg,
        padding: theme.tokens.spacing[3],
        opacity: suggestion.used ? 0.5 : 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.tokens.spacing[2],
          marginBottom: theme.tokens.spacing[2],
        }}
      >
        {/* Priority dot */}
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: PRIORITY_COLORS[suggestion.priority],
          }}
        />
        {/* Category badge */}
        <View
          style={{
            backgroundColor: categoryColor + '30',
            paddingHorizontal: theme.tokens.spacing[2],
            paddingVertical: 2,
            borderRadius: theme.tokens.borderRadius.full,
          }}
        >
          <Text
            variant="caption"
            weight="semibold"
            style={{ color: categoryColor, fontSize: 10 }}
          >
            {CATEGORY_LABELS[suggestion.category]}
          </Text>
        </View>
        {suggestion.used ? (
          <Ionicons
            name="checkmark-circle"
            size={16}
            color={theme.colors.success[500]}
            style={{ marginLeft: 'auto' }}
          />
        ) : null}
      </View>
      <Text variant="bodySmall" color={theme.tokens.colors.white}>
        {suggestion.text}
      </Text>
    </TouchableOpacity>
  )
}
