// src/stores/rental-conversations/store.ts
// Main Zustand store for Landlord platform conversations
// Composes action slices from separate modules

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createConversationActions } from './conversationActions';
import { createMessageActions } from './messageActions';
import { createAIQueueActions } from './aiQueueActions';
import { createRealtimeActions } from './realtimeActions';
import type {
  RentalConversationsState,
  PendingSend,
  ConversationStatus,
  Channel,
} from './types';

const initialState = {
  conversations: [],
  conversationsWithRelations: [],
  messages: {},
  pendingResponses: [],
  selectedConversationId: null,
  pendingSend: null as PendingSend | null,
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

export const useRentalConversationsStore = create<RentalConversationsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Conversation actions (fetch, update, toggle AI)
      ...createConversationActions(set, get),

      // Message actions (fetch, send)
      ...createMessageActions(set),

      // AI queue actions (pending responses, approve, reject, cancel)
      ...createAIQueueActions(set, get),

      // Real-time subscription actions
      ...createRealtimeActions(set, get),

      // Filter actions
      setStatusFilter: (status: ConversationStatus | 'all') => {
        set({ statusFilter: status });
      },

      setChannelFilter: (channel: Channel | 'all') => {
        set({ channelFilter: channel });
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'rental-conversations-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedConversationId: state.selectedConversationId,
      }),
    }
  )
);
