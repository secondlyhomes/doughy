/**
 * InlineSuggestionCard
 *
 * AI suggestion displayed inline within the unified call stream.
 * Full-width with colored left border based on suggestion type.
 * Tap to dismiss — dims with checkmark overlay.
 */

import { TouchableOpacity, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { GlassView } from '../GlassView'
import type { SuggestionStreamItem } from '@/types/callStream'

export interface InlineSuggestionCardProps {
  item: SuggestionStreamItem
  onDismiss: (id: string) => void
}

const TYPE_CONFIG: Record<
  SuggestionStreamItem['suggestionType'],
  { label: string; colorKey: 'info' | 'warning' | 'success' | 'primary' }
> = {
  info: { label: 'Insight', colorKey: 'info' },
  question: { label: 'Ask', colorKey: 'primary' },
  action: { label: 'Action', colorKey: 'success' },
  response: { label: 'Say', colorKey: 'warning' },
}

export function InlineSuggestionCard({ item, onDismiss }: InlineSuggestionCardProps) {
  const { theme } = useTheme()
  const config = TYPE_CONFIG[item.suggestionType]
  const accentColor = theme.colors[config.colorKey][500]

  return (
    <TouchableOpacity
      onPress={() => onDismiss(item.id)}
      activeOpacity={0.7}
      disabled={item.dismissed}
    >
      <GlassView
        intensity="subtle"
        style={{
          padding: theme.tokens.spacing[3],
          opacity: item.dismissed ? 0.4 : 1,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.tokens.spacing[2],
            marginBottom: theme.tokens.spacing[1],
          }}
        >
          <Ionicons name="sparkles" size={12} color={accentColor} />
          <View
            style={{
              backgroundColor: accentColor + '25',
              paddingHorizontal: theme.tokens.spacing[2],
              paddingVertical: 2,
              borderRadius: theme.tokens.borderRadius.full,
            }}
          >
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: accentColor, fontSize: 10 }}
            >
              {config.label}
            </Text>
          </View>
          {item.dismissed && (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={theme.colors.success[500]}
              style={{ marginLeft: 'auto' }}
            />
          )}
        </View>
        <Text variant="bodySmall" color={theme.colors.text.primary}>
          {item.text}
        </Text>
      </GlassView>
    </TouchableOpacity>
  )
}
