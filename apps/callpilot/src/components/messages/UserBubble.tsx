/**
 * UserBubble
 *
 * Renders outbound user messages (sentBy === 'user').
 * Extracted from MessageBubble.tsx.
 */

import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { formatTimestamp } from './messageUtils'
import { getChannelIconName, getSenderIconName, bubbleStyles as styles } from './messageBubbleStyles'
import type { MessageBubbleProps } from './MessageBubble'

export function UserBubble({
  message,
}: MessageBubbleProps) {
  const { theme } = useTheme()
  const [emailExpanded, setEmailExpanded] = useState(false)

  const senderIconName = getSenderIconName(message.sentBy)
  const channelIcon = getChannelIconName(message.channel)
  const timeAgo = formatTimestamp(message.timestamp)
  const isEmail = message.type === 'email'

  return (
    <View
      style={[
        styles.container,
        styles.outboundContainer,
      ]}
    >
      {/* Message content */}
      <View
        style={[
          styles.bubbleContainer,
          styles.outboundBubbleContainer,
        ]}
      >
        {/* Message bubble */}
        <View
          style={[
            styles.bubble,
            { backgroundColor: theme.colors.primary[500] },
          ]}
        >
          {/* Email subject header */}
          {isEmail && message.subject && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Ionicons
                name="mail-outline"
                size={12}
                color={theme.colors.text.inverse}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: theme.colors.text.inverse,
                }}
              >
                {message.subject}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.messageText,
              { color: theme.colors.text.inverse },
            ]}
            numberOfLines={isEmail && !emailExpanded ? 3 : undefined}
          >
            {message.content}
          </Text>

          {/* Email expand/collapse */}
          {isEmail && message.content.length > 120 && (
            <TouchableOpacity
              onPress={() => setEmailExpanded(!emailExpanded)}
              accessibilityRole="button"
              accessibilityLabel={emailExpanded ? 'Show less' : 'Show more'}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  marginTop: 4,
                  color: theme.colors.text.inverse,
                }}
              >
                {emailExpanded ? 'Show less' : 'Show more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Time and status row */}
        <View
          style={[
            styles.statusRow,
            styles.outboundStatusRow,
          ]}
        >
          {channelIcon && (
            <Ionicons name={channelIcon} size={10} color={theme.colors.text.tertiary} />
          )}
          <Text style={[styles.timeText, { color: theme.colors.text.tertiary }]}>
            {timeAgo}
          </Text>
        </View>
      </View>

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: theme.colors.primary[500] },
        ]}
      >
        <Ionicons
          name={senderIconName}
          size={16}
          color={theme.colors.text.inverse}
        />
      </View>
    </View>
  )
}
