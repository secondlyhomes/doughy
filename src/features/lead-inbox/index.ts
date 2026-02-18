// src/features/lead-inbox/index.ts
// Lead Communication Inbox feature for RE Investor platform
// Export all public components, hooks, and types

// Screens
export { LeadInboxListScreen } from './screens/LeadInboxListScreen';
export { LeadConversationScreen } from './screens/LeadConversationScreen';

// Components
export { LeadConversationCard } from './components/LeadConversationCard';
export { LeadMessageBubble } from './components/LeadMessageBubble';
export { LeadAIReviewCard, calculateEditSeverity } from './components/LeadAIReviewCard';
export { ComposeSheet } from './components/ComposeSheet';
export { ChannelSelector } from './components/ChannelSelector';

// Hooks
export { useLeadInbox, useFilteredLeadInbox, useLeadConversation } from './hooks/useLeadInbox';

// Types
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
  LeadConversationListItem,
  LeadInboxFilter,
  LeadInboxSort,
  LeadInboxSection,
} from './types';
