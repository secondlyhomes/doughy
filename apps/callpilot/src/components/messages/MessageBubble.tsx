/**
 * MessageBubble
 *
 * Copied 1:1 from Doughy's LeadMessageBubble.tsx.
 * Structure, styles, and layout are identical — only import paths,
 * token references, icon library, and type names were changed.
 *
 * Doughy source: src/features/lead-inbox/components/LeadMessageBubble.tsx
 */

import { memo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { withOpacity } from '@/utils/formatters'
import { formatTimestamp, getSenderLabel } from './messageUtils'
import { AICallResultCard } from './AICallResultCard'
import type { Message, MessageSender } from '@/types'

export interface MessageBubbleProps {
  message: Message
  onFeedback?: (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => void
  showFeedback?: boolean
  contactName?: string
}

function getSenderIconName(sentBy: MessageSender) {
  switch (sentBy) {
    case 'ai':
      return 'sparkles' as const
    case 'contact':
    case 'user':
    default:
      return 'person' as const
  }
}

export const MessageBubble = memo(function MessageBubble({
  message,
  onFeedback,
  showFeedback = true,
  contactName = 'Contact',
}: MessageBubbleProps) {
  const { theme, isDark } = useTheme()
  const [feedbackGiven, setFeedbackGiven] = useState<'thumbs_up' | 'thumbs_down' | null>(null)
  const [emailExpanded, setEmailExpanded] = useState(false)

  // Delegate AI call results to dedicated card
  if (message.type === 'ai_call' && message.aiCallMeta) {
    return <AICallResultCard message={message} />
  }

  const isOutbound = message.direction === 'outgoing'
  const isAI = message.sentBy === 'ai'
  const isContact = message.sentBy === 'contact'
  const isEmail = message.type === 'email'

  const senderIconName = getSenderIconName(message.sentBy)
  const senderLabel = getSenderLabel(message, contactName)

  const timeAgo = formatTimestamp(message.timestamp)

  // Handle feedback
  const handleFeedback = (feedback: 'thumbs_up' | 'thumbs_down') => {
    if (feedbackGiven) return
    setFeedbackGiven(feedback)
    onFeedback?.(message.id, feedback)
  }

  // Muted background — matches Doughy's colors.muted
  const mutedBg = isDark ? theme.colors.surfaceSecondary : theme.colors.neutral[100]

  return (
    <View
      style={[
        styles.container,
        isOutbound ? styles.outboundContainer : styles.inboundContainer,
      ]}
    >
      {/* Avatar (for inbound messages) */}
      {!isOutbound && (
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
      )}

      {/* Message content */}
      <View
        style={[
          styles.bubbleContainer,
          isOutbound ? styles.outboundBubbleContainer : styles.inboundBubbleContainer,
        ]}
      >
        {/* Sender label (for inbound messages) */}
        {!isOutbound && (
          <View style={styles.senderRow}>
            <Text style={[styles.senderLabel, { color: theme.colors.text.tertiary }]}>
              {senderLabel}
            </Text>
          </View>
        )}

        {/* Message bubble */}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOutbound
                ? isAI
                  ? withOpacity(theme.colors.info[500], 'medium')
                  : theme.colors.primary[500]
                : mutedBg,
            },
          ]}
        >
          {/* Email subject header */}
          {isEmail && message.subject && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
              <Ionicons
                name="mail-outline"
                size={12}
                color={isOutbound && !isAI ? theme.colors.text.inverse : theme.colors.text.primary}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isOutbound && !isAI ? theme.colors.text.inverse : theme.colors.text.primary,
                }}
              >
                {message.subject}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.messageText,
              {
                color: isOutbound && !isAI ? theme.colors.text.inverse : theme.colors.text.primary,
              },
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
                  color: isOutbound ? theme.colors.text.inverse : theme.colors.primary[500],
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
            isOutbound ? styles.outboundStatusRow : styles.inboundStatusRow,
          ]}
        >
          <Text style={[styles.timeText, { color: theme.colors.text.tertiary }]}>
            {timeAgo}
          </Text>
        </View>

        {/* Feedback buttons (for AI-sent outbound messages) */}
        {showFeedback && isOutbound && isAI && onFeedback && (
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

      {/* Avatar (for outbound messages) */}
      {isOutbound && (
        <View
          style={[
            styles.avatar,
            { backgroundColor: isAI ? withOpacity(theme.colors.info[500], 'light') : theme.colors.primary[500] },
          ]}
        >
          <Ionicons
            name={senderIconName}
            size={16}
            color={isAI ? theme.colors.info[500] : theme.colors.text.inverse}
          />
        </View>
      )}
    </View>
  )
})

// Hardcoded values matching Doughy's design tokens exactly:
// SPACING: xs=4, sm=8, md=12, lg=16
// BORDER_RADIUS: sm=6, lg=12, full=9999
// FONT_SIZES: 2xs=10, xs=12, base=16
// LINE_HEIGHTS: normal=1.5 → 16*1.5=24
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  outboundContainer: {
    justifyContent: 'flex-end',
  },
  inboundContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleContainer: {
    maxWidth: '75%',
  },
  outboundBubbleContainer: {
    marginRight: 8,
    alignItems: 'flex-end',
  },
  inboundBubbleContainer: {
    marginLeft: 8,
    alignItems: 'flex-start',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  outboundStatusRow: {
    justifyContent: 'flex-end',
  },
  inboundStatusRow: {
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 10,
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  feedbackLabel: {
    fontSize: 10,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  feedbackButton: {
    padding: 6,
    borderRadius: 9999,
  },
})
