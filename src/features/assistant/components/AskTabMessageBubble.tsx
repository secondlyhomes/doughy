// src/features/assistant/components/AskTabMessageBubble.tsx
// Message bubble component for the AskTab chat interface

import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles, User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES, FONT_WEIGHTS, ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

import { Message } from '../hooks/useChat';
import { askTabStyles as styles } from './ask-tab-styles';

interface AskTabMessageBubbleProps {
  message: Message;
}

export function AskTabMessageBubble({ message }: AskTabMessageBubbleProps) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        {
          backgroundColor: isUser
            ? colors.primary
            : isSystem
            ? withOpacity(colors.destructive, 'light')
            : colors.muted,
        },
      ]}
    >
      {!isUser && (
        <View style={styles.avatarContainer}>
          {isSystem ? (
            <View
              style={[styles.avatar, { backgroundColor: withOpacity(colors.destructive, 'medium') }]}
            >
              <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold }}>!</Text>
            </View>
          ) : (
            <View style={[styles.avatar, { backgroundColor: withOpacity(colors.primary, 'light') }]}>
              <Sparkles size={ICON_SIZES.sm} color={colors.primary} />
            </View>
          )}
        </View>
      )}
      <View style={styles.messageContent}>
        <Text
          style={[
            styles.messageText,
            {
              color: isUser
                ? colors.primaryForeground
                : isSystem
                ? colors.destructive
                : colors.foreground,
            },
          ]}
        >
          {message.content}
        </Text>
      </View>
      {isUser && (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: withOpacity(colors.primaryForeground, 'light') }]}>
            <User size={ICON_SIZES.sm} color={colors.primaryForeground} />
          </View>
        </View>
      )}
    </View>
  );
}
