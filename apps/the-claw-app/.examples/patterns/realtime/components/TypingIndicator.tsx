/**
 * TypingIndicator Component
 *
 * Shows which users are currently typing in the chat.
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { TypingIndicatorProps } from '../types';
import { styles } from '../styles';

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers[0]} and ${typingUsers.length - 1} other${
          typingUsers.length > 2 ? 's' : ''
        } are typing...`;

  return (
    <View style={styles.typingContainer}>
      <Text style={styles.typingText}>{text}</Text>
    </View>
  );
}
