// src/features/public/components/MessageBubble.tsx
// Chat message bubble component for the SimpleAssistant
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Loader2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, ICON_SIZES, SPACING } from '@/constants/design-tokens';
import { Message } from './simple-assistant-types';

interface MessageBubbleProps {
  message: Message;
  colors: ReturnType<typeof useThemeColors>;
}

export function MessageBubble({ message, colors }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = message.role === 'loading';

  return (
    <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
      <View
        style={[
          bubbleStyles.bubble,
          { backgroundColor: isUser ? colors.primary : colors.muted },
        ]}
      >
        <Text
          style={[
            bubbleStyles.text,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.content}
        </Text>
        {isLoading && <Loader2 size={ICON_SIZES.md} color={colors.mutedForeground} />}
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
});
