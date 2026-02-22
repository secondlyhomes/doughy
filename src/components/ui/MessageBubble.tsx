// src/components/ui/MessageBubble.tsx
// Unified message bubble component for chat interfaces
// Consolidates: rental-inbox/MessageBubble.tsx + assistant/MessageBubble.tsx
//
// Features:
// - Direction-based or role-based message positioning
// - AI indicator badge (from rental-inbox)
// - User/Assistant avatars (from assistant)
// - Absolute or relative time formats
// - System message support
// - Glass variant for iOS 26 Liquid Glass

import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { Bot, User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

export type { MessageBubbleProps, MessageDirection, MessageRole, TimeFormat } from './message-bubble-types';
import type { MessageBubbleProps } from './message-bubble-types';
import { formatTimeAbsolute, formatTimeRelative } from './message-bubble-helpers';
import { styles } from './message-bubble-styles';

/**
 * MessageBubble - Unified chat message component
 *
 * Usage patterns:
 *
 * Rental Inbox (direction-based with AI indicator):
 * ```tsx
 * <MessageBubble
 *   content={message.content}
 *   timestamp={message.created_at}
 *   direction={message.direction}
 *   isAI={message.sent_by === 'ai'}
 *   showAIIndicator={true}
 *   timeFormat="absolute"
 * />
 * ```
 *
 * AI Assistant (role-based with avatars):
 * ```tsx
 * <MessageBubble
 *   content={message.content}
 *   timestamp={message.createdAt}
 *   role={message.role}
 *   showAvatar={true}
 *   timeFormat="relative"
 * />
 * ```
 */
export const MessageBubble = memo(function MessageBubble({
  content,
  timestamp,
  direction,
  role,
  isAI = false,
  showAIIndicator = isAI,
  showAvatar = false,
  timeFormat = 'absolute',
  showSenderLabel,
  senderLabel,
}: MessageBubbleProps) {
  const colors = useThemeColors();

  // Determine if this is an outbound message (from user/AI to others)
  // Priority: explicit direction > derived from role
  const isOutbound = direction
    ? direction === 'outbound'
    : role === 'user' || role === 'assistant';

  const isSystem = role === 'system';
  const isAssistant = role === 'assistant' || (direction === 'outbound' && isAI);
  const isUser = role === 'user' || (direction === 'outbound' && !isAI);

  // System messages render as centered pills
  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text
          style={[
            styles.systemText,
            {
              color: colors.mutedForeground,
              backgroundColor: colors.muted,
            },
          ]}
        >
          {content}
        </Text>
      </View>
    );
  }

  // Determine bubble colors
  const getBubbleColor = () => {
    if (isOutbound) {
      if (isAI) {
        // AI messages - use a distinct color with transparency
        return withOpacity(colors.info, 'strong');
      }
      return colors.primary;
    }
    // Inbound messages
    return colors.muted;
  };

  const getTextColor = () => {
    if (isOutbound) {
      return colors.primaryForeground;
    }
    return colors.foreground;
  };

  // Format timestamp based on selected format
  const formattedTime =
    timeFormat === 'relative'
      ? formatTimeRelative(timestamp)
      : formatTimeAbsolute(timestamp);

  // Determine sender label
  const defaultShowSenderLabel = showSenderLabel ?? isOutbound;
  const defaultSenderLabel =
    senderLabel ?? (isAI ? 'AI Assistant' : isAssistant ? 'Assistant' : 'You');

  return (
    <View
      style={[
        styles.container,
        isOutbound ? styles.containerOutbound : styles.containerInbound,
      ]}
    >
      <View
        style={[
          styles.bubbleRow,
          { flexDirection: isOutbound ? 'row-reverse' : 'row' },
        ]}
      >
        {/* Avatar - Assistant/Bot */}
        {showAvatar && !isUser && (
          <View
            style={[
              styles.avatar,
              { backgroundColor: withOpacity(colors.primary, 'muted') },
            ]}
          >
            <Bot size={14} color={colors.info} />
          </View>
        )}

        {/* Message Bubble */}
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: getBubbleColor(),
              borderBottomRightRadius: isOutbound
                ? BORDER_RADIUS.sm
                : BORDER_RADIUS.xl,
              borderBottomLeftRadius: isOutbound
                ? BORDER_RADIUS.xl
                : BORDER_RADIUS.sm,
            },
          ]}
        >
          {/* AI indicator badge */}
          {showAIIndicator && isAI && (
            <View
              style={[
                styles.aiIndicator,
                { backgroundColor: withOpacity(colors.background, 'medium') },
              ]}
            >
              <Bot size={10} color={colors.primaryForeground} />
              <Text
                style={[
                  styles.aiIndicatorText,
                  { color: colors.primaryForeground },
                ]}
              >
                AI
              </Text>
            </View>
          )}

          {/* Message content */}
          <Text style={[styles.messageText, { color: getTextColor() }]}>
            {content}
          </Text>
        </View>

        {/* Avatar - User */}
        {showAvatar && isUser && (
          <View
            style={[styles.avatar, { backgroundColor: colors.secondary }]}
          >
            <User size={14} color={colors.mutedForeground} />
          </View>
        )}
      </View>

      {/* Timestamp and sender info */}
      <View
        style={[
          styles.metaContainer,
          isOutbound ? styles.metaOutbound : styles.metaInbound,
          showAvatar && { marginHorizontal: 32 },
        ]}
      >
        <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
          {formattedTime}
        </Text>
        {defaultShowSenderLabel && (
          <Text style={[styles.senderLabel, { color: colors.mutedForeground }]}>
            {defaultSenderLabel}
          </Text>
        )}
      </View>
    </View>
  );
});

export default MessageBubble;
