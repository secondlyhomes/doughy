/**
 * Real-Time Patterns - Export Index
 *
 * Import examples and hooks from this file for easy access.
 *
 * Usage:
 *   import { ChatExample, useChat } from './realtime';
 *   import type { Message, ChatProps } from './realtime';
 */

// Example Components
export { PresenceExample } from './PresenceExample';
export { RealtimeListExample } from './realtime-list';
export { ChatExample } from './ChatExample';

// Chat Hook
export { useChat } from './hooks/useChat';

// Chat Components (for custom compositions)
export {
  ChatHeader,
  ChatInput,
  LoadingState,
  MessageBubble,
  TypingIndicator,
} from './components';

// Chat Types
export type {
  Message,
  TypingUser,
  ChatState,
  ChatProps,
  MessageBubbleProps,
  TypingIndicatorProps,
  ChatHeaderProps,
  ChatInputProps,
} from './types';

// Chat Styles (for extending)
export { styles as chatStyles } from './styles';

// Note: Pattern documentation files (.md) are reference materials
// and should be read directly:
//
// - realtime-subscriptions.md - Table subscriptions, presence, broadcast
// - collaborative-editing.md - Live cursors, OT, conflict resolution
// - presence-indicators.md - Online status, typing indicators
// - README.md - Overview, best practices, performance guide
