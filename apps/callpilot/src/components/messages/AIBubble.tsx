/**
 * AIBubble
 *
 * Renders outbound AI-sent messages (sentBy === 'ai').
 * Extracted from MessageBubble.tsx.
 */

import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { withOpacity } from '@/utils/formatters'
import { formatTimestamp } from './messageUtils'
import { getChannelIconName, getSenderIconName, bubbleStyles as styles } from './messageBubbleStyles'
import type { MessageBubbleProps } from './MessageBubble'

export function AIBubble({
  message,
  onFeedback,
  showFeedback = true,
}: MessageBubbleProps) {
  const { theme } = useTheme()
  const [feedbackGiven, setFeedbackGiven] = useState<'thumbs_up' | 'thumbs_down' | null>(null)
  const [emailExpanded, setEmailExpanded] = useState(false)

  const senderIconName = getSenderIconName(message.sentBy)
  const channelIcon = getChannelIconName(message.channel)
  const timeAgo = formatTimestamp(message.timestamp)
  const isEmail = message.type === 'email'

  // Handle feedback
  const handleFeedback = (feedback: 'thumbs_up' | 'thumbs_down') => {
    if (feedbackGiven) return
    setFeedbackGiven(feedback)
    onFeedback?.(message.id, feedback)
  }

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
            { backgroundColor: withOpacity(theme.colors.info[500], 'medium') },
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

        {/* Feedback buttons */}
        {showFeedback && onFeedback && (
          <View style={styles.feedbackRow}>
            <Text style={[styles.feedbackLabel, { color: theme.colors.text.tertiary }]}>
              Was this helpful?
            </Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                onPress={() => handleFeedback('thumbs_up')}
                disabled={!!feedbackGiven}
                style={[
                  styles.feedbackButton,
                  feedbackGiven === 'thumbs_up' && {
                    backgroundColor: withOpacity(theme.colors.success[500], 'light'),
                  },
                ]}
              >
                <Ionicons
                  name="thumbs-up"
                  size={14}
                  color={feedbackGiven === 'thumbs_up' ? theme.colors.success[500] : theme.colors.text.tertiary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleFeedback('thumbs_down')}
                disabled={!!feedbackGiven}
                style={[
                  styles.feedbackButton,
                  feedbackGiven === 'thumbs_down' && {
                    backgroundColor: withOpacity(theme.colors.error[500], 'light'),
                  },
                ]}
              >
                <Ionicons
                  name="thumbs-down"
                  size={14}
                  color={feedbackGiven === 'thumbs_down' ? theme.colors.error[500] : theme.colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: withOpacity(theme.colors.info[500], 'light') },
        ]}
      >
        <Ionicons
          name={senderIconName}
          size={16}
          color={theme.colors.info[500]}
        />
      </View>
    </View>
  )
}
