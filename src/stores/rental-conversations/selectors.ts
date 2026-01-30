// src/stores/rental-conversations/selectors.ts
// Selectors for Landlord platform conversations store

import type { RentalConversationsState } from './types';

// Basic selectors
export const selectConversations = (state: RentalConversationsState) => state.conversations;

export const selectConversationsWithRelations = (state: RentalConversationsState) =>
  state.conversationsWithRelations;

export const selectSelectedConversationId = (state: RentalConversationsState) =>
  state.selectedConversationId;

export const selectSelectedConversation = (state: RentalConversationsState) =>
  state.conversationsWithRelations.find((c) => c.id === state.selectedConversationId);

export const selectMessages = (conversationId: string) => (state: RentalConversationsState) =>
  state.messages[conversationId] || [];

export const selectPendingResponses = (state: RentalConversationsState) => state.pendingResponses;

export const selectPendingCount = (state: RentalConversationsState) => state.pendingResponses.length;

export const selectPendingSend = (state: RentalConversationsState) => state.pendingSend;

// Computed selectors
export const selectNeedsReviewConversations = (state: RentalConversationsState) =>
  state.conversationsWithRelations.filter((c) =>
    state.pendingResponses.some((p) => p.conversation_id === c.id)
  );

export const selectUnreadCount = (state: RentalConversationsState) =>
  state.conversationsWithRelations.reduce((sum, c) => sum + c.unread_count, 0);

export const selectConversationById = (id: string) => (state: RentalConversationsState) =>
  state.conversationsWithRelations.find((c) => c.id === id);

export const selectPendingResponseForConversation = (conversationId: string) => (state: RentalConversationsState) =>
  state.pendingResponses.find((p) => p.conversation_id === conversationId);

// Filter selectors
export const selectStatusFilter = (state: RentalConversationsState) => state.statusFilter;

export const selectChannelFilter = (state: RentalConversationsState) => state.channelFilter;

export const selectFilteredConversations = (state: RentalConversationsState) => {
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
export const selectIsLoading = (state: RentalConversationsState) => state.isLoading;

export const selectIsRefreshing = (state: RentalConversationsState) => state.isRefreshing;

export const selectIsSending = (state: RentalConversationsState) => state.isSending;

export const selectError = (state: RentalConversationsState) => state.error;

// Subscription state selectors
export const selectIsSubscribed = (state: RentalConversationsState) => state.isSubscribed;

export const selectIsSubscribing = (state: RentalConversationsState) => state.isSubscribing;

export const selectSubscriptionError = (state: RentalConversationsState) => state.subscriptionError;
