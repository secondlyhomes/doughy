// Message Bubble Component - React Native
// Chat message display for AI Assistant

import React from 'react';
import { View, Text } from 'react-native';
import { Bot, User } from 'lucide-react-native';

import { Message } from '../hooks/useChat';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View className="items-center py-2">
        <Text className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </Text>
      </View>
    );
  }

  return (
    <View className={`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
      <View className="flex-row items-end gap-2" style={{ maxWidth: '85%' }}>
        {/* Avatar for Assistant */}
        {!isUser && (
          <View className="bg-primary/10 rounded-full p-1.5 mb-1">
            <Bot size={14} color="#3b82f6" />
          </View>
        )}

        {/* Message Bubble */}
        <View
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          }`}
        >
          <Text
            className={`text-base leading-6 ${
              isUser ? 'text-primary-foreground' : 'text-foreground'
            }`}
          >
            {message.content}
          </Text>
        </View>

        {/* Avatar for User */}
        {isUser && (
          <View className="bg-secondary rounded-full p-1.5 mb-1">
            <User size={14} color="#6b7280" />
          </View>
        )}
      </View>

      {/* Timestamp */}
      <Text
        className={`text-xs text-muted-foreground mt-1 ${
          isUser ? 'mr-8' : 'ml-8'
        }`}
      >
        {formatTime(message.createdAt)}
      </Text>
    </View>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default MessageBubble;
