// src/features/rental-inbox/hooks/useInbox.ts
// Custom hooks for inbox feature

import { useCallback, useEffect, useMemo } from 'react';
import {
  useRentalConversationsStore,
  ConversationWithRelations,
  ApprovalMetadata,
} from '@/stores/rental-conversations-store';
import { useAuth } from '@/features/auth/hooks';
import type { InboxFilter, InboxSort } from '../types';

/**
 * Hook to fetch and manage inbox conversations
 */
export function useInbox() {
  const { user } = useAuth();
  const {
    conversationsWithRelations,
    pendingResponses,
    isLoading,
    isRefreshing,
    error,
    isSubscribed,
    subscriptionError,
    fetchConversations,
    fetchPendingResponses,
    approveResponse,
    clearError,
    subscribeToConversations,
    clearSubscriptionError,
  } = useRentalConversationsStore();

  // Initial fetch with cleanup to prevent state updates on unmounted component
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // Only proceed if component is still mounted
      if (isMounted) {
        await fetchConversations();
      }
      if (isMounted) {
        await fetchPendingResponses();
      }
    };

    fetchData();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [fetchConversations, fetchPendingResponses]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToConversations(user.id);

    return () => {
      unsubscribe();
    };
  }, [user?.id, subscribeToConversations]);

  // Refresh both conversations and pending responses (clears error on attempt)
  const refresh = useCallback(async () => {
    clearError();
    clearSubscriptionError();
    await Promise.all([fetchConversations(), fetchPendingResponses()]);
  }, [fetchConversations, fetchPendingResponses, clearError, clearSubscriptionError]);

  // Count of items needing review
  const pendingCount = pendingResponses.length;

  // Conversations with pending AI responses
  const conversationsNeedingReview = useMemo(() => {
    const pendingConversationIds = new Set(
      pendingResponses.map((p) => p.conversation_id)
    );
    return conversationsWithRelations.filter((c) =>
      pendingConversationIds.has(c.id)
    );
  }, [conversationsWithRelations, pendingResponses]);

  // Quick approve function for inbox list
  const quickApprove = useCallback(
    async (queueItemId: string) => {
      // For quick approve from inbox list, use default metadata
      // (no edits, minimal review time since it's quick action)
      return approveResponse(queueItemId, {
        editedResponse: undefined,
        editSeverity: 'none',
        responseTimeSeconds: 0, // Quick approve = instant decision
      });
    },
    [approveResponse]
  );

  return {
    conversations: conversationsWithRelations,
    conversationsNeedingReview,
    pendingCount,
    pendingResponses,
    isLoading,
    isRefreshing,
    error,
    isSubscribed,
    subscriptionError,
    refresh,
    quickApprove,
    clearError,
    clearSubscriptionError,
  };
}

/**
 * Hook to filter and sort inbox conversations
 */
export function useFilteredInbox(
  filter: InboxFilter = 'all',
  sort: InboxSort = 'recent',
  searchQuery: string = ''
) {
  const { conversations, conversationsNeedingReview, pendingCount } = useInbox();
  const { pendingResponses } = useRentalConversationsStore();

  const filteredConversations = useMemo(() => {
    const pendingConversationIds = new Set(
      pendingResponses.map((p) => p.conversation_id)
    );

    let result = conversations.filter((c) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const contactName = `${c.contact?.first_name || ''} ${c.contact?.last_name || ''}`.trim().toLowerCase();
        const contactEmail = c.contact?.email?.toLowerCase() || '';
        const propertyName = c.property?.name?.toLowerCase() || '';
        const propertyAddress = c.property?.address?.toLowerCase() || '';

        const matchesSearch =
          contactName.includes(query) ||
          contactEmail.includes(query) ||
          propertyName.includes(query) ||
          propertyAddress.includes(query);

        if (!matchesSearch) return false;
      }

      // Status filter
      switch (filter) {
        case 'needs_review':
          return pendingConversationIds.has(c.id);
        case 'archived':
          return c.status === 'archived';
        case 'unread':
          // For now, treat conversations with recent messages as unread
          // This could be enhanced with proper read status tracking
          return true;
        default:
          return c.status !== 'archived';
      }
    });

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (
            new Date(a.last_message_at).getTime() -
            new Date(b.last_message_at).getTime()
          );
        case 'pending_first':
          const aHasPending = pendingConversationIds.has(a.id) ? 0 : 1;
          const bHasPending = pendingConversationIds.has(b.id) ? 0 : 1;
          if (aHasPending !== bHasPending) return aHasPending - bHasPending;
          // Fall through to recent
          return (
            new Date(b.last_message_at).getTime() -
            new Date(a.last_message_at).getTime()
          );
        case 'recent':
        default:
          return (
            new Date(b.last_message_at).getTime() -
            new Date(a.last_message_at).getTime()
          );
      }
    });

    // Mark conversations with pending responses
    return result.map((c) => ({
      ...c,
      hasPendingResponse: pendingConversationIds.has(c.id),
    }));
  }, [conversations, pendingResponses, filter, sort, searchQuery]);

  return filteredConversations;
}

/**
 * Hook to manage a single conversation and its messages
 */
export function useConversation(conversationId: string) {
  const {
    conversationsWithRelations,
    messages,
    pendingResponses,
    isLoading,
    isSending,
    error,
    fetchConversationById,
    fetchMessages,
    sendMessage,
    approveResponse,
    rejectResponse,
    toggleAI,
    clearError,
    subscribeToMessages,
  } = useRentalConversationsStore();

  // Get conversation
  const conversation = useMemo(
    () => conversationsWithRelations.find((c) => c.id === conversationId),
    [conversationsWithRelations, conversationId]
  );

  // Get messages for this conversation
  const conversationMessages = messages[conversationId] || [];

  // Get pending response for this conversation
  const pendingResponse = useMemo(
    () => pendingResponses.find((p) => p.conversation_id === conversationId),
    [pendingResponses, conversationId]
  );

  // Fetch conversation and messages on mount
  useEffect(() => {
    if (conversationId) {
      fetchConversationById(conversationId);
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchConversationById, fetchMessages]);

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = subscribeToMessages(conversationId);

    return () => {
      unsubscribe();
    };
  }, [conversationId, subscribeToMessages]);

  // Actions
  const send = useCallback(
    async (content: string) => {
      return sendMessage(conversationId, content);
    },
    [conversationId, sendMessage]
  );

  const approve = useCallback(
    async (metadata: ApprovalMetadata) => {
      if (pendingResponse) {
        return approveResponse(pendingResponse.id, metadata);
      }
      return false;
    },
    [pendingResponse, approveResponse]
  );

  const reject = useCallback(async (responseTimeSeconds: number) => {
    if (pendingResponse) {
      return rejectResponse(pendingResponse.id, responseTimeSeconds);
    }
    return false;
  }, [pendingResponse, rejectResponse]);

  const setAIEnabled = useCallback(
    async (enabled: boolean) => {
      return toggleAI(conversationId, enabled);
    },
    [conversationId, toggleAI]
  );

  return {
    conversation,
    messages: conversationMessages,
    pendingResponse,
    isLoading,
    isSending,
    error,
    send,
    approve,
    reject,
    setAIEnabled,
    clearError,
  };
}
