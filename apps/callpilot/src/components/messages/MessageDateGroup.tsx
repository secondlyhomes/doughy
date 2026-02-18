/**
 * MessageDateGroup
 *
 * Centered date label with line divider, wrapping a group of MessageBubbles.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '@/components/Text'
import { MessageBubble } from './MessageBubble'
import type { Message } from '@/types'

export interface MessageDateGroupProps {
  date: string
  messages: Message[]
  contactName?: string
}

function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const now = new Date()

  if (date.toDateString() === now.toDateString()) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function MessageDateGroup({ date, messages, contactName }: MessageDateGroupProps) {
  const { theme } = useTheme()

  return (
    <View style={{ marginBottom: theme.tokens.spacing[3] }}>
      {/* Date divider */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.tokens.spacing[3],
        paddingHorizontal: theme.tokens.spacing[4],
      }}>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
        <Text
          variant="caption"
          color={theme.colors.text.tertiary}
          style={{ paddingHorizontal: theme.tokens.spacing[3] }}
        >
          {formatDateDisplay(date)}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
      </View>

      {/* Messages */}
      <View style={{ paddingHorizontal: theme.tokens.spacing[2] }}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} contactName={contactName ?? 'Contact'} />
        ))}
      </View>
    </View>
  )
}
