// src/stores/rental-conversations/index.ts
// Barrel export for backward compatibility
// This maintains the same public API as the original rental-conversations-store.ts

// Re-export store
export { useRentalConversationsStore } from './store';

// Re-export types
export type {
  Channel,
  ConversationStatus,
  MessageDirection,
  ContentType,
  SentBy,
  AIQueueStatus,
  LandlordConversation,
  LandlordMessage,
  Conversation,
  Message,
  AIResponseQueueItem,
  ApprovalMetadata,
  PendingSend,
  SendResult,
  ConversationWithRelations,
  RentalConversationsState,
} from './types';

// Re-export edit severity from shared module
export type { EditSeverity, AIOutcome } from '../shared/ai-learning';

// Re-export AI response outcome type for backward compatibility
export interface AIResponseOutcomeInsert {
  user_id: string;
  conversation_id: string | null;
  message_id: string | null;
  property_id: string | null;
  contact_id: string | null;
  message_type: string;
  topic: string;
  contact_type: string;
  channel?: string | null;
  platform?: string | null;
  initial_confidence: number;
  suggested_response: string;
  final_response?: string | null;
  outcome: 'pending' | 'auto_sent' | 'approved' | 'edited' | 'rejected';
  edit_severity?: 'none' | 'minor' | 'major';
  response_time_seconds?: number | null;
  sensitive_topics_detected?: string[];
  actions_suggested?: string[];
  reviewed_at?: string | null;
}

// Re-export selectors
export {
  selectConversations,
  selectConversationsWithRelations,
  selectSelectedConversationId,
  selectSelectedConversation,
  selectMessages,
  selectPendingResponses,
  selectPendingCount,
  selectPendingSend,
  selectNeedsReviewConversations,
  selectUnreadCount,
  selectConversationById,
  selectPendingResponseForConversation,
  selectStatusFilter,
  selectChannelFilter,
  selectFilteredConversations,
  selectIsLoading,
  selectIsRefreshing,
  selectIsSending,
  selectError,
  selectIsSubscribed,
  selectIsSubscribing,
  selectSubscriptionError,
} from './selectors';
