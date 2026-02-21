// src/stores/investor-conversations/realtimeActions.ts
// Real-time subscription actions for the investor conversations store

import { createRealtimeSubscription, createMessageSubscription } from '../shared/realtime-retry';
import type { InvestorConversationsState, InvestorMessage } from './types';

type Set = (partial: Partial<InvestorConversationsState> | ((state: InvestorConversationsState) => Partial<InvestorConversationsState>)) => void;
type Get = () => InvestorConversationsState;

export const createRealtimeActions = (set: Set, get: Get) => ({
  subscribeToConversations: (userId: string) => {
    const { isSubscribed, isSubscribing } = get();
    if (isSubscribed || isSubscribing) {
      return () => {};
    }

    return createRealtimeSubscription({
      channelName: 'investor-conversations-changes',
      userId,
      tables: [
        {
          tableName: 'investor.conversations',
          onEvent: async () => {
            await get().fetchConversations();
          },
        },
        {
          tableName: 'investor.ai_queue_items',
          onEvent: async () => {
            await get().fetchPendingResponses();
          },
        },
      ],
      onStatusChange: (status) => {
        set({
          isSubscribed: status.isSubscribed,
          isSubscribing: status.isSubscribing,
          subscriptionError: status.error,
        });
      },
    });
  },

  subscribeToMessages: (conversationId: string) => {
    const { messageSubscriptions } = get();

    if (messageSubscriptions.has(conversationId)) {
      if (__DEV__) {
        console.log(`[Real-time] Already subscribed to messages for ${conversationId}`);
      }
      return () => {};
    }

    set((state) => ({
      messageSubscriptions: new Set(state.messageSubscriptions).add(conversationId),
    }));

    const cleanup = createMessageSubscription(
      conversationId,
      'investor.messages',
      (newMessage) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [
              newMessage as unknown as InvestorMessage,
              ...(state.messages[conversationId] || []).filter((m) => m.id !== newMessage.id),
            ],
          },
        }));
      }
    );

    return () => {
      cleanup();
      set((state) => {
        const newSubs = new Set(state.messageSubscriptions);
        newSubs.delete(conversationId);
        return { messageSubscriptions: newSubs };
      });
    };
  },
});
