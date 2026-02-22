// src/features/conversations/components/conversation-types.ts
// Shared types and config for conversation components

import React from 'react';
import {
  MessageSquare,
  Phone,
  Mic,
  Mail,
  StickyNote,
} from 'lucide-react-native';

// ============================================
// Types
// ============================================

export type ConversationType = 'sms' | 'call' | 'voice_memo' | 'email' | 'note';
export type ConversationDirection = 'inbound' | 'outbound' | 'internal';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface ConversationItem {
  id: string;
  type: ConversationType;
  direction: ConversationDirection;
  content?: string;
  transcript?: string;
  subject?: string;
  duration_seconds?: number;
  sentiment?: Sentiment;
  key_phrases?: string[];
  action_items?: string[];
  ai_summary?: string;
  occurred_at: string;
  created_at: string;
}

export interface ConversationsViewProps {
  items: ConversationItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onAddConversation?: (type: ConversationType) => void;
  onItemPress?: (item: ConversationItem) => void;
  /** Pagination: callback when user scrolls near the end */
  onLoadMore?: () => void;
  /** Pagination: whether there are more items to load */
  hasMore?: boolean;
  /** Pagination: whether more items are currently loading */
  isLoadingMore?: boolean;
}

// ============================================
// Type Config
// ============================================

export const TYPE_CONFIG: Record<ConversationType, {
  icon: React.ComponentType<any>;
  label: string;
  color: string;
}> = {
  sms: { icon: MessageSquare, label: 'SMS', color: '#3B82F6' },
  call: { icon: Phone, label: 'Call', color: '#10B981' },
  voice_memo: { icon: Mic, label: 'Voice Memo', color: '#8B5CF6' },
  email: { icon: Mail, label: 'Email', color: '#F59E0B' },
  note: { icon: StickyNote, label: 'Note', color: '#6B7280' },
};
