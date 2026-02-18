/**
 * MessageBubble Component
 *
 * Renders a single chat message with different styles
 * for own messages vs others' messages.
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { MessageBubbleProps } from '../types';
import { styles } from '../styles';

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.messageContainerOwn : styles.messageContainerOther,
      ]}
    >
      {!isOwnMessage && (
        <Text style={styles.messageUsername}>{message.username}</Text>
      )}
      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isOwnMessage ? styles.messageTextOwn : styles.messageTextOther,
          ]}
        >
          {message.content}
        </Text>
      </View>
      <Text style={styles.messageTime}>
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
}
