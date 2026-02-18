/**
 * ConversationListItem
 *
 * Inbox row showing avatar, name, module badge, last message preview,
 * timestamp, and channel icon. Blue dot for unread.
 */

import { View, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { Text } from '@/components/Text'
import type { Conversation } from '@/types'

export interface ConversationListItemProps {
  conversation: Conversation
  onPress: (conversation: Conversation) => void
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const MODULE_EMOJI: Record<string, string> = {
  investor: '\uD83D\uDCB0',
  landlord: '\uD83C\uDFE0',
}

export function ConversationListItem({ conversation, onPress }: ConversationListItemProps) {
  const { theme } = useTheme()
  const hasUnread = conversation.unreadCount > 0
  const channelIcon = conversation.lastMessageChannel === 'sms' ? 'chatbubble' : 'mail'
  const channelColor =
    conversation.lastMessageChannel === 'sms'
      ? callpilotColors.channel.sms
      : callpilotColors.channel.email

  const preview =
    conversation.lastMessageDirection === 'outgoing'
      ? `You: ${conversation.lastMessage}`
      : conversation.lastMessage

  const moduleEmoji = conversation.module ? MODULE_EMOJI[conversation.module] ?? '' : ''

  return (
    <TouchableOpacity
      onPress={() => onPress(conversation)}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${conversation.contactName}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.tokens.spacing[4],
        paddingVertical: theme.tokens.spacing[3],
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Avatar — 48px with unread dot overlay */}
      <View style={{ width: 48, height: 48, marginRight: theme.tokens.spacing[3] }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: theme.colors.primary[100],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodySmall" weight="bold" color={theme.colors.primary[700]}>
            {getInitials(conversation.contactName)}
          </Text>
        </View>
        {hasUnread && (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: theme.colors.primary[500],
              borderWidth: 2,
              borderColor: theme.colors.background,
            }}
          />
        )}
      </View>

      {/* Name + Module + Preview */}
      <View style={{ flex: 1, marginRight: theme.tokens.spacing[2] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1] }}>
          <Text variant="body" weight={hasUnread ? 'bold' : 'semibold'} numberOfLines={1} style={{ flexShrink: 1 }}>
            {conversation.contactName}
          </Text>
          {moduleEmoji ? (
            <Text variant="caption">{moduleEmoji}</Text>
          ) : null}
        </View>
        <Text
          variant="caption"
          color={theme.colors.text.secondary}
          numberOfLines={2}
          style={{ marginTop: 2 }}
        >
          {preview}
        </Text>
      </View>

      {/* Timestamp + Channel Icon */}
      <View style={{ alignItems: 'flex-end', gap: theme.tokens.spacing[1] }}>
        <Text variant="caption" color={theme.colors.text.tertiary}>
          {formatRelativeDate(conversation.lastMessageDate)}
        </Text>
        <Ionicons name={channelIcon} size={14} color={channelColor} />
      </View>
    </TouchableOpacity>
  )
}
