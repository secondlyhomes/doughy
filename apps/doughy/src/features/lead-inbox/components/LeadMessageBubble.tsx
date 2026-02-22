// src/features/lead-inbox/components/LeadMessageBubble.tsx
// Message bubble component for lead conversation threads
// Supports feedback (thumbs up/down) on AI-sent messages

import React, { memo, useState } from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { formatRelativeTime } from '@/utils/format';
import { getSenderIcon, getSenderLabel } from './lead-message-bubble-helpers';
import { styles } from './lead-message-bubble-styles';
import { DeliveryStatusIndicator } from './DeliveryStatusIndicator';
import { MessageFeedbackRow } from './MessageFeedbackRow';
import type { LeadMessageBubbleProps, FeedbackType } from './lead-message-bubble-types';

export const LeadMessageBubble = memo(function LeadMessageBubble({
  message,
  onFeedback,
  showFeedback = true,
  leadName,
}: LeadMessageBubbleProps) {
  const colors = useThemeColors();
  const [feedbackGiven, setFeedbackGiven] = useState<FeedbackType | null>(null);

  const isOutbound = message.direction === 'outbound';
  const isAI = message.sent_by === 'ai';
  const isLead = message.sent_by === 'lead';

  const SenderIcon = getSenderIcon(message.sent_by);
  const senderLabel = getSenderLabel(message.sent_by, leadName);

  const timeAgo = formatRelativeTime(new Date(message.created_at));

  const isDelivered = !!message.delivered_at;
  const isRead = !!message.read_at;
  const isFailed = !!message.failed_at;

  const confidencePercent = message.ai_confidence
    ? Math.round(message.ai_confidence * 100)
    : null;

  const handleFeedback = (feedback: FeedbackType) => {
    if (feedbackGiven) return;
    setFeedbackGiven(feedback);
    onFeedback?.(message.id, feedback);
  };

  return (
    <View
      style={[
        styles.container,
        isOutbound ? styles.outboundContainer : styles.inboundContainer,
      ]}
    >
      {/* Avatar (inbound) */}
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
        {/* Sender label with confidence badge */}
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
              { color: isOutbound && !isAI ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {message.content}
          </Text>
        </View>

        {/* Time and delivery status */}
        <View
          style={[
            styles.statusRow,
            isOutbound ? styles.outboundStatusRow : styles.inboundStatusRow,
          ]}
        >
          <Text style={[styles.timeText, { color: colors.mutedForeground }]}>
            {timeAgo}
          </Text>
          {isOutbound && (
            <View style={styles.deliveryStatus}>
              <DeliveryStatusIndicator
                isFailed={isFailed}
                isRead={isRead}
                isDelivered={isDelivered}
              />
            </View>
          )}
        </View>

        {/* Feedback (AI outbound only) */}
        {showFeedback && isOutbound && isAI && onFeedback && (
          <MessageFeedbackRow
            feedbackGiven={feedbackGiven}
            onFeedback={handleFeedback}
          />
        )}
      </View>

      {/* Avatar (outbound) */}
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

export default LeadMessageBubble;
