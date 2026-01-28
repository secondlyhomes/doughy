// src/features/rental-inbox/types/index.ts
// Types for rental inbox feature

import type { ConversationWithRelations as StoreConversationWithRelations } from '@/stores/rental-conversations-store';

// Re-export types from the store for convenience
export type {
  Conversation,
  Message,
  AIResponseQueueItem,
  ConversationWithRelations,
  Channel,
  ConversationStatus,
  MessageDirection,
  ContentType,
  SentBy,
  AIQueueStatus,
} from '@/stores/rental-conversations-store';

// Display-related types
export interface ConversationListItem extends StoreConversationWithRelations {
  unreadCount?: number;
  hasPendingResponse?: boolean;
}

// Filter types
export type InboxFilter = 'all' | 'unread' | 'needs_review' | 'archived';

// Sort options
export type InboxSort = 'recent' | 'oldest' | 'pending_first';
