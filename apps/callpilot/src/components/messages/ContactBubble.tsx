/**
 * ContactBubble
 *
 * Renders inbound messages (contact or AI).
 * Extracted from MessageBubble.tsx.
 */

import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { withOpacity } from '@/utils/formatters'
import { formatTimestamp, getSenderLabel } from './messageUtils'
import { getChannelIconName, getSenderIconName, bubbleStyles as styles } from './messageBubbleStyles'
import type { MessageBubbleProps } from './MessageBubble'

export function ContactBubble({
  message,
  contactName = 'Contact',
}: MessageBubbleProps) {
  const { theme, isDark } = useTheme()
  const [emailExpanded, setEmailExpanded] = useState(false)

  const isContact = message.sentBy === 'contact'
  const senderIconName = getSenderIconName(message.sentBy)
  const senderLabel = getSenderLabel(message, contactName)
  const channelIcon = getChannelIconName(message.channel)
  const timeAgo = formatTimestamp(message.timestamp)
  const isEmail = message.type === 'email'

  // Muted background -- matches Doughy's colors.muted
  const mutedBg = isDark ? theme.colors.surfaceSecondary : theme.colors.neutral[100]

  return (
    <View
      style={[
        styles.container,
        styles.inboundContainer,
      ]}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: isContact ? mutedBg : withOpacity(theme.colors.info[500], 'light') },
        ]}
      >
        <Ionicons
          name={senderIconName}
          size={16}
          color={isContact ? theme.colors.text.primary : theme.colors.info[500]}
        />
      </View>

      {/* Message content */}
      <View
        style={[
          styles.bubbleContainer,
          styles.inboundBubbleContainer,
        ]}
      >
        {/* Sender label */}
        <View style={styles.senderRow}>
          <Text style={[styles.senderLabel, { color: theme.colors.text.tertiary }]}>
            {senderLabel}
          </Text>
        </View>

        {/* Message bubble */}
        <View
          style={[
            styles.bubble,
            { backgroundColor: mutedBg },
          ]}
        >
          {/* Email subject header */}
          {isEmail && message.subject && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Ionicons
                name="mail-outline"
                size={12}
                color={theme.colors.text.primary}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: theme.colors.text.primary,
                }}
              >
                {message.subject}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.messageText,
              { color: theme.colors.text.primary },
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
                  color: theme.colors.primary[500],
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
            styles.inboundStatusRow,
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
    </View>
  )
}
