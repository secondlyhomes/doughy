/**
 * SuggestionsTab
 *
 * ScrollView of tappable suggestion cards.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { SuggestionCard } from './SuggestionCard'
import type { TalkingPointSuggestion } from '@/types'

export interface SuggestionsTabProps {
  suggestions: TalkingPointSuggestion[]
  onMarkUsed: (id: string) => void
}

export function SuggestionsTab({ suggestions, onMarkUsed }: SuggestionsTabProps) {
  const { theme } = useTheme()

  if (suggestions.length === 0) {
    return (
      <Text variant="body" color={theme.colors.neutral[400]}>
        No suggestions available for this contact.
      </Text>
    )
  }

  return (
    <View style={{ gap: theme.tokens.spacing[3] }}>
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onUse={() => onMarkUsed(suggestion.id)}
        />
      ))}
    </View>
  )
}
