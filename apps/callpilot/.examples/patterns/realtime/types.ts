/**
 * Chat Types
 *
 * Type definitions for the real-time chat feature.
 */

export interface Message {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

export interface TypingUser {
  username: string;
  typing: boolean;
}

export interface ChatState {
  messages: Message[];
  newMessage: string;
  isLoading: boolean;
  isSending: boolean;
  isConnected: boolean;
  onlineCount: number;
  typingUsers: string[];
  currentUserId: string;
  currentUsername: string;
}

export interface ChatProps {
  roomId?: string;
}

export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export interface TypingIndicatorProps {
  typingUsers: string[];
}

export interface ChatHeaderProps {
  roomId: string;
  onlineCount: number;
  isConnected: boolean;
}

export interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isSending: boolean;
}
