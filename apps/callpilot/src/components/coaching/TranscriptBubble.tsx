/**
 * TranscriptBubble
 *
 * Single transcript line in the unified call stream.
 * Shows timestamp, speaker label, and text.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import type { TranscriptStreamItem } from '@/types/callStream'

export interface TranscriptBubbleProps {
  item: TranscriptStreamItem
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function TranscriptBubble({ item }: TranscriptBubbleProps) {
  const { theme } = useTheme()

  return (
    <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[2] }}>
      <Text
        variant="caption"
        color={theme.colors.text.tertiary}
        style={{ width: 36, flexShrink: 0, paddingTop: 2 }}
      >
        {formatTimestamp(item.timestamp)}
      </Text>
      <View style={{ flex: 1 }}>
        <Text
          variant="caption"
          weight="semibold"
          color={
            item.speaker === 'user'
              ? theme.colors.primary[500]
              : theme.colors.text.secondary
          }
        >
          {item.speaker === 'user' ? 'You' : 'Contact'}
        </Text>
        <Text variant="bodySmall" color={theme.colors.text.primary}>
          {item.text}
        </Text>
      </View>
    </View>
  )
}
