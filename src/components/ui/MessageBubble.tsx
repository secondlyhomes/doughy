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
import { View, Text, StyleSheet } from 'react-native';
import { Bot, User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

export type MessageDirection = 'inbound' | 'outbound';
export type MessageRole = 'user' | 'assistant' | 'system';
export type TimeFormat = 'absolute' | 'relative';

export interface MessageBubbleProps {
  /** Message content text */
  content: string;
  /** Timestamp string (ISO or parseable date) */
  timestamp: string;
  /**
   * Message direction for inbox-style chats.
   * 'outbound' = sent by user/AI, 'inbound' = received from contact
   * If not provided, derives from role prop.
   */
  direction?: MessageDirection;
  /**
   * Message role for assistant-style chats.
   * 'user' | 'assistant' | 'system'
   * If not provided, derives from direction prop.
   */
  role?: MessageRole;
  /** Whether this message was sent by AI (shows AI indicator) */
  isAI?: boolean;
  /** Show the AI indicator badge. Default: true when isAI=true */
  showAIIndicator?: boolean;
  /** Show avatar icons for user/assistant. Default: false */
  showAvatar?: boolean;
  /** Time format: 'absolute' (2:30 PM) or 'relative' (2m ago). Default: 'absolute' */
  timeFormat?: TimeFormat;
  /** Show sender label below timestamp. Default: true for outbound */
  showSenderLabel?: boolean;
  /** Custom sender label override */
  senderLabel?: string;
}

// Format time in absolute format (e.g., "2:30 PM")
function formatTimeAbsolute(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format time in relative format (e.g., "2m ago", "Just now")
function formatTimeRelative(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  }

  // Fallback to absolute for older messages
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    maxWidth: '85%',
  },
  containerInbound: {
    alignSelf: 'flex-start',
    marginLeft: SPACING.md,
  },
  containerOutbound: {
    alignSelf: 'flex-end',
    marginRight: SPACING.md,
  },
  bubbleRow: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  avatar: {
    borderRadius: 999,
    padding: 6,
    marginBottom: SPACING.xs,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    minWidth: 60,
    flexShrink: 1,
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
    gap: 2,
  },
  aiIndicatorText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
  messageText: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.sm,
  },
  metaInbound: {
    justifyContent: 'flex-start',
  },
  metaOutbound: {
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
  },
  senderLabel: {
    fontSize: FONT_SIZES.xs,
    fontStyle: 'italic',
  },
  systemContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  systemText: {
    fontSize: FONT_SIZES.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 999,
    overflow: 'hidden',
  },
});

export default MessageBubble;
