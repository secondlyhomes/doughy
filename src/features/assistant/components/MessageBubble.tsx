// Message Bubble Component - React Native
// Chat message display for AI Assistant

import React from 'react';
import { View, Text } from 'react-native';
import { Bot, User } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

import { Message } from '../hooks/useChat';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <View className="items-center py-2">
        <Text className="text-xs px-3 py-1 rounded-full" style={{ color: colors.mutedForeground, backgroundColor: colors.muted }}>
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
          <View className="rounded-full p-1.5 mb-1" style={{ backgroundColor: `${colors.primary}15` }}>
            <Bot size={14} color={colors.info} />
          </View>
        )}

        {/* Message Bubble */}
        <View
          className={`rounded-2xl px-4 py-3 ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
          style={{ backgroundColor: isUser ? colors.primary : colors.muted }}
        >
          <Text
            className="text-base leading-6"
            style={{ color: isUser ? colors.primaryForeground : colors.foreground }}
          >
            {message.content}
          </Text>
        </View>

        {/* Avatar for User */}
        {isUser && (
          <View className="rounded-full p-1.5 mb-1" style={{ backgroundColor: colors.secondary }}>
            <User size={14} color={colors.mutedForeground} />
          </View>
        )}
      </View>

      {/* Timestamp */}
      <Text
        className={`text-xs mt-1 ${isUser ? 'mr-8' : 'ml-8'}`}
        style={{ color: colors.mutedForeground }}
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
