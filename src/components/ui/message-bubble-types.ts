// src/components/ui/message-bubble-types.ts
// Types for the unified MessageBubble component

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
