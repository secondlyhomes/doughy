// src/features/lead-inbox/types/index.ts
// Types for lead inbox feature (RE Investor platform)

import type { InvestorConversationWithRelations as StoreConversationWithRelations } from '@/stores/investor-conversations-store';

// Re-export types from the store for convenience
export type {
  InvestorConversation,
  InvestorMessage,
  InvestorAIQueueItem,
  InvestorConversationWithRelations,
  InvestorChannel,
  InvestorConversationStatus,
  InvestorSender,
  AIQueueStatus,
  MessageDirection,
  ContentType,
  AIConfidenceRecord,
  ApprovalMetadata,
  EditSeverity,
  AIOutcome,
  LeadInfo,
  PropertyInfo,
  DealInfo,
} from '@/stores/investor-conversations-store';

// Display-related types
export interface LeadConversationListItem extends StoreConversationWithRelations {
  hasPendingResponse?: boolean;
}

// Filter types
export type LeadInboxFilter = 'all' | 'needs_response' | 'ai_waiting' | 'resolved' | 'archived';

// Sort options
export type LeadInboxSort = 'recent' | 'oldest' | 'pending_first' | 'unread_first';

// Section types for inbox UI
export interface LeadInboxSection {
  id: string;
  title: string;
  description?: string;
  iconName: 'alert-circle' | 'sparkles' | 'clock' | 'message-square' | 'bell';
  iconColor: string;
  iconBgColor: string;
  data: LeadConversationListItem[];
}
