// src/stores/investor-conversations/store.ts
// Main Zustand store for RE Investor platform lead conversations
// Composes action slices from separate files

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createConversationActions } from './conversationActions';
import { createMessageActions } from './messageActions';
import { createAIQueueActions } from './aiQueueActions';
import { createAIConfidenceActions } from './aiConfidenceActions';
import { createRealtimeActions } from './realtimeActions';
import type { InvestorConversationsState } from './types';
import type {
  InvestorConversationStatus,
  InvestorChannel,
} from '@/features/lead-inbox/types/investor-conversations.types';

const initialState = {
  conversations: [],
  conversationsWithRelations: [],
  messages: {},
  pendingResponses: [],
  selectedConversationId: null,
  aiConfidence: {},
  statusFilter: 'all' as const,
  channelFilter: 'all' as const,
  isLoading: false,
  isRefreshing: false,
  isSending: false,
  error: null,
  isSubscribed: false,
  isSubscribing: false,
  messageSubscriptions: new Set<string>(),
  subscriptionError: null,
};

export const useInvestorConversationsStore = create<InvestorConversationsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Conversation actions (fetch, update, toggle, markAsRead)
      ...createConversationActions(set, get),

      // Message actions (fetch, send)
      ...createMessageActions(set, get),

      // AI queue actions (pending responses, approve, reject, feedback)
      ...createAIQueueActions(set, get),

      // AI confidence actions (fetch settings, toggle auto-send)
      ...createAIConfidenceActions(set, get),

      // Real-time subscription actions
      ...createRealtimeActions(set, get),

      // ========== Filter Actions ==========

      setStatusFilter: (status: InvestorConversationStatus | 'all') => {
        set({ statusFilter: status });
      },

      setChannelFilter: (channel: InvestorChannel | 'all') => {
        set({ channelFilter: channel });
      },

      // ========== Utility Actions ==========

      clearSubscriptionError: () => set({ subscriptionError: null }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'investor-conversations-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedConversationId: state.selectedConversationId,
      }),
    }
  )
);
