/**
 * AICallResultCard
 *
 * Inline card showing AI call result in a conversation thread.
 * Displays call summary, duration, and timestamp.
 */

import { View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '@/components/Text'
import { GlassView } from '@/components/GlassView'
import { formatTimestamp } from './messageUtils'
import { withOpacity } from '@/utils/formatters'
import type { Message } from '@/types'

interface AICallResultCardProps {
  message: Message
}

export function AICallResultCard({ message }: AICallResultCardProps) {
  const { theme } = useTheme()
  const meta = message.aiCallMeta
  if (!meta) return null

  return (
    <View style={{
      alignSelf: 'flex-start',
      maxWidth: '85%',
      marginBottom: theme.tokens.spacing[2],
      paddingHorizontal: theme.tokens.spacing[2],
    }}>
      <GlassView
        intensity="subtle"
        borderRadius={theme.tokens.borderRadius.lg}
        style={{
          padding: theme.tokens.spacing[3],
          borderWidth: 1,
          borderColor: withOpacity(theme.colors.info[500], 'light'),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1], marginBottom: theme.tokens.spacing[2] }}>
          <Ionicons name="call" size={14} color={theme.colors.info[500]} />
          <Text variant="caption" weight="semibold" color={theme.colors.info[500]}>
            AI Call
          </Text>
          <Text variant="caption" color={theme.colors.text.tertiary}>
            {formatTimestamp(message.timestamp)}
          </Text>
          <Text variant="caption" color={theme.colors.text.tertiary}>
            {meta.durationMinutes} min
          </Text>
        </View>
        <Text variant="bodySmall" color={theme.colors.text.primary}>
          {meta.summary}
        </Text>
      </GlassView>
    </View>
  )
}
