// src/features/assistant/components/MessageBubble.tsx
// Re-exports unified MessageBubble with assistant-specific wrapper
//
// Migration: This component now uses the unified MessageBubble from @/components/ui
// The old implementation has been consolidated into the shared component.

import React from 'react';
import {
  MessageBubble as UnifiedMessageBubble,
  type MessageBubbleProps as UnifiedMessageBubbleProps,
} from '@/components/ui';
import { Message } from '../hooks/useChat';

interface MessageBubbleProps {
  message: Message;
}

/**
 * MessageBubble for AI assistant chat
 *
 * This wrapper adapts the assistant Message type to the unified MessageBubble component.
 * Features enabled: avatars, relative time format, system message support
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <UnifiedMessageBubble
      content={message.content}
      timestamp={message.createdAt}
      role={message.role}
      showAvatar={true}
      showAIIndicator={false}
      timeFormat="relative"
      showSenderLabel={false}
    />
  );
}

export default MessageBubble;
