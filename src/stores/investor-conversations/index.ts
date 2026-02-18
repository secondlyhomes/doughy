// src/stores/investor-conversations/index.ts
// Barrel export for backward compatibility
// This maintains the same public API as the original investor-conversations-store.ts

// Re-export store
export { useInvestorConversationsStore } from './store';

// Re-export types
export type {
  InvestorChannel,
  InvestorConversationStatus,
  MessageDirection,
  ContentType,
  InvestorSender,
  AIQueueStatus,
  InvestorConversation,
  InvestorMessage,
  InvestorAIQueueItem,
  AIConfidenceRecord,
  ApprovalMetadata,
  LeadInfo,
  PropertyInfo,
  DealInfo,
  InvestorConversationWithRelations,
  InvestorConversationsState,
} from './types';

// Re-export shared types
export type { EditSeverity, AIOutcome } from '../shared/ai-learning';

// Re-export selectors
export {
  selectInvestorConversations,
  selectInvestorConversationsWithRelations,
  selectSelectedInvestorConversationId,
  selectSelectedInvestorConversation,
  selectInvestorMessages,
  selectInvestorPendingResponses,
  selectInvestorPendingCount,
  selectInvestorNeedsReviewConversations,
  selectInvestorUnreadCount,
  selectInvestorConversationById,
  selectInvestorPendingResponseForConversation,
  selectAIConfidence,
  selectAIConfidenceForSituation,
  selectInvestorStatusFilter,
  selectInvestorChannelFilter,
  selectFilteredInvestorConversations,
  selectInvestorIsLoading,
  selectInvestorIsRefreshing,
  selectInvestorIsSending,
  selectInvestorError,
  selectInvestorIsSubscribed,
  selectInvestorIsSubscribing,
  selectInvestorSubscriptionError,
} from './selectors';
