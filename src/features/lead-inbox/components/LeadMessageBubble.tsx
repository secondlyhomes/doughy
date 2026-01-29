// src/features/lead-inbox/components/LeadMessageBubble.tsx
// Message bubble component for lead conversation threads
// Supports feedback (thumbs up/down) on AI-sent messages

import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bot, User, ThumbsUp, ThumbsDown, Check, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';
import { formatRelativeTime } from '@/utils/format';
import type { InvestorMessage, InvestorSender, MessageDirection } from '../types';

interface LeadMessageBubbleProps {
  message: InvestorMessage;
  onFeedback?: (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => void;
  showFeedback?: boolean;
  leadName?: string;
}

function getSenderIcon(sentBy: InvestorSender) {
  switch (sentBy) {
    case 'ai':
      return Bot;
    case 'lead':
    case 'user':
    default:
      return User;
  }
}

function getSenderLabel(sentBy: InvestorSender, leadName?: string): string {
  switch (sentBy) {
    case 'ai':
      return 'MoltBot AI';
    case 'lead':
      return leadName || 'Lead';
    case 'user':
      return 'You';
    default:
      return sentBy;
  }
}

export const LeadMessageBubble = memo(function LeadMessageBubble({
  message,
  onFeedback,
  showFeedback = true,
  leadName,
}: LeadMessageBubbleProps) {
  const colors = useThemeColors();
  const [feedbackGiven, setFeedbackGiven] = useState<'thumbs_up' | 'thumbs_down' | null>(null);

  const isOutbound = message.direction === 'outbound';
  const isAI = message.sent_by === 'ai';
  const isLead = message.sent_by === 'lead';

  const SenderIcon = getSenderIcon(message.sent_by);
  const senderLabel = getSenderLabel(message.sent_by, leadName);

  // Format timestamp
  const timeAgo = formatRelativeTime(new Date(message.created_at));

  // Delivery status
  const isDelivered = !!message.delivered_at;
  const isRead = !!message.read_at;
  const isFailed = !!message.failed_at;

  // Handle feedback
  const handleFeedback = (feedback: 'thumbs_up' | 'thumbs_down') => {
    if (feedbackGiven) return; // Already gave feedback
    setFeedbackGiven(feedback);
    onFeedback?.(message.id, feedback);
  };

  // AI confidence display (only for AI messages)
  const confidencePercent = message.ai_confidence
    ? Math.round(message.ai_confidence * 100)
    : null;

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
            { backgroundColor: isLead ? colors.muted : withOpacity(colors.info, 'light') },
          ]}
        >
          <SenderIcon size={16} color={isLead ? colors.foreground : colors.info} />
        </View>
      )}

      {/* Message content */}
      <View
        style={[
          styles.bubbleContainer,
          isOutbound ? styles.outboundBubbleContainer : styles.inboundBubbleContainer,
        ]}
      >
        {/* Sender label (for non-user messages) */}
        {!isOutbound && (
          <View style={styles.senderRow}>
            <Text style={[styles.senderLabel, { color: colors.mutedForeground }]}>
              {senderLabel}
            </Text>
            {isAI && confidencePercent && (
              <View
                style={[
                  styles.confidenceBadge,
                  {
                    backgroundColor: withOpacity(
                      confidencePercent >= 85 ? colors.success : colors.warning,
                      'light'
                    ),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.confidenceText,
                    { color: confidencePercent >= 85 ? colors.success : colors.warning },
                  ]}
                >
                  {confidencePercent}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Message bubble */}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isOutbound
                ? isAI
                  ? withOpacity(colors.info, 'medium')
                  : colors.primary
                : colors.muted,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isOutbound && !isAI ? colors.primaryForeground : colors.foreground,
              },
            ]}
          >
            {message.content}
          </Text>
        </View>

        {/* Time and status row */}
        <View
          style={[
            styles.statusRow,
            isOutbound ? styles.outboundStatusRow : styles.inboundStatusRow,
          ]}
        >
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
            {timeAgo}
          </Text>

          {/* Delivery status (for outbound messages) */}
          {isOutbound && (
            <View style={styles.deliveryStatus}>
              {isFailed ? (
                <Text style={[styles.failedText, { color: colors.destructive }]}>
                  Failed
                </Text>
              ) : isRead ? (
                <View style={styles.statusIconRow}>
                  <Check size={12} color={colors.success} />
                  <Check size={12} color={colors.success} style={{ marginLeft: -6 }} />
                </View>
              ) : isDelivered ? (
                <Check size={12} color={colors.mutedForeground} />
              ) : (
                <Clock size={12} color={colors.mutedForeground} />
              )}
            </View>
          )}
        </View>

        {/* Feedback buttons (for AI-sent outbound messages) */}
        {showFeedback && isOutbound && isAI && onFeedback && (
          <View style={styles.feedbackRow}>
            <Text style={[styles.feedbackLabel, { color: colors.mutedForeground }]}>
              Was this helpful?
            </Text>
            <View style={styles.feedbackButtons}>
              <TouchableOpacity
                onPress={() => handleFeedback('thumbs_up')}
                disabled={!!feedbackGiven}
                style={[
                  styles.feedbackButton,
                  feedbackGiven === 'thumbs_up' && {
                    backgroundColor: withOpacity(colors.success, 'light'),
                  },
                ]}
              >
                <ThumbsUp
                  size={14}
                  color={feedbackGiven === 'thumbs_up' ? colors.success : colors.mutedForeground}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleFeedback('thumbs_down')}
                disabled={!!feedbackGiven}
                style={[
                  styles.feedbackButton,
                  feedbackGiven === 'thumbs_down' && {
                    backgroundColor: withOpacity(colors.destructive, 'light'),
                  },
                ]}
              >
                <ThumbsDown
                  size={14}
                  color={feedbackGiven === 'thumbs_down' ? colors.destructive : colors.mutedForeground}
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
            { backgroundColor: isAI ? withOpacity(colors.info, 'light') : colors.primary },
          ]}
        >
          <SenderIcon
            size={16}
            color={isAI ? colors.info : colors.primaryForeground}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
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
    marginRight: SPACING.sm,
    alignItems: 'flex-end',
  },
  inboundBubbleContainer: {
    marginLeft: SPACING.sm,
    alignItems: 'flex-start',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  senderLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
  },
  confidenceText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
  bubble: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: 4,
  },
  outboundStatusRow: {
    justifyContent: 'flex-end',
  },
  inboundStatusRow: {
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: FONT_SIZES['2xs'],
  },
  deliveryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  failedText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '500',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  feedbackLabel: {
    fontSize: FONT_SIZES['2xs'],
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  feedbackButton: {
    padding: 6,
    borderRadius: BORDER_RADIUS.full,
  },
});

export default LeadMessageBubble;
