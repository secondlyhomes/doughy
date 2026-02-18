// src/features/rental-inbox/components/MessageBubble.tsx
// Re-exports unified MessageBubble with rental-inbox specific wrapper
//
// Migration: This component now uses the unified MessageBubble from @/components/ui
// The old implementation has been consolidated into the shared component.

import React, { memo } from 'react';
import {
  MessageBubble as UnifiedMessageBubble,
  type MessageBubbleProps as UnifiedMessageBubbleProps,
} from '@/components/ui';
import type { Message } from '@/stores/rental-conversations-store';

interface MessageBubbleProps {
  message: Message;
}

/**
 * MessageBubble for rental inbox conversations
 *
 * This wrapper adapts the rental-inbox Message type to the unified MessageBubble component.
 * Features enabled: AI indicator badge, absolute time format, no avatars
 */
export const MessageBubble = memo(function MessageBubble({
  message,
}: MessageBubbleProps) {
  return (
    <UnifiedMessageBubble
      content={message.content}
      timestamp={message.created_at}
      direction={message.direction}
      isAI={message.sent_by === 'ai'}
      showAIIndicator={message.sent_by === 'ai'}
      showAvatar={false}
      timeFormat="absolute"
      showSenderLabel={message.direction === 'outbound'}
    />
  );
});

export default MessageBubble;
