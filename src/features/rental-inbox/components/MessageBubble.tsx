// src/features/rental-inbox/components/MessageBubble.tsx
// Message bubble component for conversation detail screen

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bot } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import type { Message, SentBy } from '@/stores/rental-conversations-store';

interface MessageBubbleProps {
  message: Message;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export const MessageBubble = memo(function MessageBubble({
  message,
}: MessageBubbleProps) {
  const colors = useThemeColors();

  const isOutbound = message.direction === 'outbound';
  const isAI = message.sent_by === 'ai';

  // Determine bubble colors based on direction and sender
  const getBubbleColor = () => {
    if (isOutbound) {
      if (isAI) {
        // AI messages - use a distinct color with slight transparency
        return withOpacity(colors.info, 'strong');
      }
      // User messages
      return colors.primary;
    }
    // Inbound (contact) messages
    return colors.muted;
  };

  const getTextColor = () => {
    if (isOutbound) {
      return colors.primaryForeground;
    }
    return colors.foreground;
  };

  return (
    <View
      style={[
        styles.container,
        isOutbound ? styles.containerOutbound : styles.containerInbound,
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: getBubbleColor(),
            borderBottomRightRadius: isOutbound ? BORDER_RADIUS.sm : BORDER_RADIUS.xl,
            borderBottomLeftRadius: isOutbound ? BORDER_RADIUS.xl : BORDER_RADIUS.sm,
          },
        ]}
      >
        {/* AI indicator badge */}
        {isAI && (
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
        <Text
          style={[
            styles.messageText,
            { color: getTextColor() },
          ]}
        >
          {message.content}
        </Text>
      </View>

      {/* Timestamp and sender info */}
      <View
        style={[
          styles.metaContainer,
          isOutbound ? styles.metaOutbound : styles.metaInbound,
        ]}
      >
        <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
          {formatTime(message.created_at)}
        </Text>
        {isOutbound && (
          <Text style={[styles.senderLabel, { color: colors.mutedForeground }]}>
            {isAI ? 'AI Assistant' : 'You'}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    maxWidth: '80%',
  },
  containerInbound: {
    alignSelf: 'flex-start',
    marginLeft: SPACING.md,
  },
  containerOutbound: {
    alignSelf: 'flex-end',
    marginRight: SPACING.md,
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    minWidth: 60,
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
});

export default MessageBubble;
