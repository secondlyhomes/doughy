// src/features/lead-inbox/hooks/useLeadInbox.ts
// Custom hooks for lead inbox feature (RE Investor platform)

import { useCallback, useEffect, useMemo } from 'react';
import {
  useInvestorConversationsStore,
  InvestorConversationWithRelations,
  ApprovalMetadata,
} from '@/stores/investor-conversations-store';
import { useAuth } from '@/features/auth/hooks';
import type { LeadInboxFilter, LeadInboxSort, LeadConversationListItem } from '../types';

/**
 * Hook to fetch and manage lead inbox conversations
 */
export function useLeadInbox() {
  const { user } = useAuth();
  const {
    conversationsWithRelations,
    pendingResponses,
    aiConfidence,
    isLoading,
    isRefreshing,
    error,
    isSubscribed,
    subscriptionError,
    fetchConversations,
    fetchPendingResponses,
    fetchAIConfidence,
    approveResponse,
    clearError,
    subscribeToConversations,
    clearSubscriptionError,
  } = useInvestorConversationsStore();

  // Initial fetch
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (isMounted) {
        await fetchConversations();
      }
      if (isMounted) {
        await fetchPendingResponses();
      }
      if (isMounted) {
        await fetchAIConfidence();
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [fetchConversations, fetchPendingResponses, fetchAIConfidence]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToConversations(user.id);

    return () => {
      unsubscribe();
    };
  }, [user?.id, subscribeToConversations]);

  // Refresh all data
  const refresh = useCallback(async () => {
    clearError();
    clearSubscriptionError();
    await Promise.all([fetchConversations(), fetchPendingResponses(), fetchAIConfidence()]);
  }, [fetchConversations, fetchPendingResponses, fetchAIConfidence, clearError, clearSubscriptionError]);

  // Count of items needing review
  const pendingCount = pendingResponses.length;

  // Total unread count
  const unreadCount = useMemo(() => {
    return conversationsWithRelations.reduce((sum, c) => sum + c.unread_count, 0);
  }, [conversationsWithRelations]);

  // Conversations needing response (inbound with no reply)
  const conversationsNeedingResponse = useMemo(() => {
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
      return approveResponse(queueItemId, {
        editedResponse: undefined,
        editSeverity: 'none',
        responseTimeSeconds: 0,
      });
    },
    [approveResponse]
  );

  // Get AI confidence for a lead situation
  const getConfidenceForSituation = useCallback(
    (situation: string) => {
      return aiConfidence[situation]?.confidence_score ?? 0.6;
    },
    [aiConfidence]
  );

  // Check if auto-send is enabled for a situation
  const isAutoSendEnabled = useCallback(
    (situation: string) => {
      return aiConfidence[situation]?.auto_send_enabled ?? false;
    },
    [aiConfidence]
  );

  return {
    conversations: conversationsWithRelations,
    conversationsNeedingResponse,
    pendingCount,
    unreadCount,
    pendingResponses,
    aiConfidence,
    isLoading,
    isRefreshing,
    error,
    isSubscribed,
    subscriptionError,
    refresh,
    quickApprove,
    clearError,
    clearSubscriptionError,
    getConfidenceForSituation,
    isAutoSendEnabled,
  };
}

/**
 * Hook to filter and sort lead inbox conversations
 */
export function useFilteredLeadInbox(
  filter: LeadInboxFilter = 'all',
  sort: LeadInboxSort = 'pending_first',
  searchQuery: string = ''
): LeadConversationListItem[] {
  const { conversations, pendingResponses } = useLeadInbox();

  const filteredConversations = useMemo(() => {
    const pendingConversationIds = new Set(
      pendingResponses.map((p) => p.conversation_id)
    );

    let result = conversations.filter((c) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const leadName = c.lead?.name?.toLowerCase() || '';
        const leadEmail = c.lead?.email?.toLowerCase() || '';
        const leadPhone = c.lead?.phone?.toLowerCase() || '';
        const propertyAddress = c.property?.address_line_1?.toLowerCase() || '';
        const propertyCity = c.property?.city?.toLowerCase() || '';

        const matchesSearch =
          leadName.includes(query) ||
          leadEmail.includes(query) ||
          leadPhone.includes(query) ||
          propertyAddress.includes(query) ||
          propertyCity.includes(query);

        if (!matchesSearch) return false;
      }

      // Status filter
      switch (filter) {
        case 'needs_response':
          // Has unread inbound messages
          return c.unread_count > 0 && !pendingConversationIds.has(c.id);
        case 'ai_waiting':
          // Has pending AI response waiting for approval
          return pendingConversationIds.has(c.id);
        case 'resolved':
          return c.status === 'resolved';
        case 'archived':
          return c.status === 'archived';
        default:
          // 'all' - show active and escalated
          return c.status === 'active' || c.status === 'escalated';
      }
    });

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (
            new Date(a.last_message_at || a.created_at).getTime() -
            new Date(b.last_message_at || b.created_at).getTime()
          );
        case 'unread_first': {
          if (a.unread_count !== b.unread_count) {
            return b.unread_count - a.unread_count;
          }
          // Fall through to recent
          return (
            new Date(b.last_message_at || b.created_at).getTime() -
            new Date(a.last_message_at || a.created_at).getTime()
          );
        }
        case 'pending_first': {
          const aHasPending = pendingConversationIds.has(a.id) ? 0 : 1;
          const bHasPending = pendingConversationIds.has(b.id) ? 0 : 1;
          if (aHasPending !== bHasPending) return aHasPending - bHasPending;
          // Fall through to recent
          return (
            new Date(b.last_message_at || b.created_at).getTime() -
            new Date(a.last_message_at || a.created_at).getTime()
          );
        }
        case 'recent':
        default:
          return (
            new Date(b.last_message_at || b.created_at).getTime() -
            new Date(a.last_message_at || a.created_at).getTime()
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
 * Hook to manage a single lead conversation and its messages
 */
export function useLeadConversation(conversationId: string) {
  const {
    conversationsWithRelations,
    messages,
    pendingResponses,
    aiConfidence,
    isLoading,
    isSending,
    error,
    fetchConversationById,
    fetchMessages,
    sendMessage,
    approveResponse,
    rejectResponse,
    submitFeedback,
    toggleAI,
    toggleAutoRespond,
    markAsRead,
    clearError,
    subscribeToMessages,
  } = useInvestorConversationsStore();

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

  // Get AI confidence for this lead's situation
  const leadSituation = conversation?.lead?.tags?.[0] || 'general';
  const confidenceRecord = aiConfidence[leadSituation];

  // Fetch conversation and messages on mount
  useEffect(() => {
    if (conversationId) {
      fetchConversationById(conversationId);
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchConversationById, fetchMessages]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId && conversation?.unread_count && conversation.unread_count > 0) {
      markAsRead(conversationId);
    }
  }, [conversationId, conversation?.unread_count, markAsRead]);

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

  const reject = useCallback(
    async (responseTimeSeconds: number) => {
      if (pendingResponse) {
        return rejectResponse(pendingResponse.id, responseTimeSeconds);
      }
      return false;
    },
    [pendingResponse, rejectResponse]
  );

  const giveFeedback = useCallback(
    async (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
      return submitFeedback(messageId, feedback);
    },
    [submitFeedback]
  );

  const setAIEnabled = useCallback(
    async (enabled: boolean) => {
      return toggleAI(conversationId, enabled);
    },
    [conversationId, toggleAI]
  );

  const setAutoRespond = useCallback(
    async (enabled: boolean) => {
      return toggleAutoRespond(conversationId, enabled);
    },
    [conversationId, toggleAutoRespond]
  );

  // Refetch conversation and messages
  const refetch = useCallback(async () => {
    clearError();
    await Promise.all([
      fetchConversationById(conversationId),
      fetchMessages(conversationId),
    ]);
  }, [conversationId, fetchConversationById, fetchMessages, clearError]);

  return {
    conversation,
    messages: conversationMessages,
    pendingResponse,
    confidenceRecord,
    leadSituation,
    isLoading,
    isSending,
    error,
    send,
    approve,
    reject,
    giveFeedback,
    setAIEnabled,
    setAutoRespond,
    clearError,
    refetch,
  };
}
