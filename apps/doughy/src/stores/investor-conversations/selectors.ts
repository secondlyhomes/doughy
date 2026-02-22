// src/stores/investor-conversations/selectors.ts
// Selectors for RE Investor platform conversations store

import type { InvestorConversationsState } from './types';

// Basic selectors
export const selectInvestorConversations = (state: InvestorConversationsState) => state.conversations;

export const selectInvestorConversationsWithRelations = (state: InvestorConversationsState) =>
  state.conversationsWithRelations;

export const selectSelectedInvestorConversationId = (state: InvestorConversationsState) =>
  state.selectedConversationId;

export const selectSelectedInvestorConversation = (state: InvestorConversationsState) =>
  state.conversationsWithRelations.find((c) => c.id === state.selectedConversationId);

export const selectInvestorMessages = (conversationId: string) => (state: InvestorConversationsState) =>
  state.messages[conversationId] || [];

export const selectInvestorPendingResponses = (state: InvestorConversationsState) => state.pendingResponses;

export const selectInvestorPendingCount = (state: InvestorConversationsState) => state.pendingResponses.length;

// Computed selectors
export const selectInvestorNeedsReviewConversations = (state: InvestorConversationsState) =>
  state.conversationsWithRelations.filter((c) =>
    state.pendingResponses.some((p) => p.conversation_id === c.id)
  );

export const selectInvestorUnreadCount = (state: InvestorConversationsState) =>
  state.conversationsWithRelations.reduce((sum, c) => sum + c.unread_count, 0);

export const selectInvestorConversationById = (id: string) => (state: InvestorConversationsState) =>
  state.conversationsWithRelations.find((c) => c.id === id);

export const selectInvestorPendingResponseForConversation = (conversationId: string) => (state: InvestorConversationsState) =>
  state.pendingResponses.find((p) => p.conversation_id === conversationId);

// AI Confidence selectors
export const selectAIConfidence = (state: InvestorConversationsState) => state.aiConfidence;

export const selectAIConfidenceForSituation = (situation: string) => (state: InvestorConversationsState) =>
  state.aiConfidence[situation];

// Filter selectors
export const selectInvestorStatusFilter = (state: InvestorConversationsState) => state.statusFilter;

export const selectInvestorChannelFilter = (state: InvestorConversationsState) => state.channelFilter;

export const selectFilteredInvestorConversations = (state: InvestorConversationsState) => {
  let filtered = state.conversationsWithRelations;

  if (state.statusFilter !== 'all') {
    filtered = filtered.filter((c) => c.status === state.statusFilter);
  }

  if (state.channelFilter !== 'all') {
    filtered = filtered.filter((c) => c.channel === state.channelFilter);
  }

  return filtered;
};

// Loading state selectors
export const selectInvestorIsLoading = (state: InvestorConversationsState) => state.isLoading;

export const selectInvestorIsRefreshing = (state: InvestorConversationsState) => state.isRefreshing;

export const selectInvestorIsSending = (state: InvestorConversationsState) => state.isSending;

export const selectInvestorError = (state: InvestorConversationsState) => state.error;

// Subscription state selectors
export const selectInvestorIsSubscribed = (state: InvestorConversationsState) => state.isSubscribed;

export const selectInvestorIsSubscribing = (state: InvestorConversationsState) => state.isSubscribing;

export const selectInvestorSubscriptionError = (state: InvestorConversationsState) => state.subscriptionError;
