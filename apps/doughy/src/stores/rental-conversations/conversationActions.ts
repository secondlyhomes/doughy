// src/stores/rental-conversations/conversationActions.ts
// Conversation CRUD actions for the rental conversations store

import { supabase } from '@/lib/supabase';
import type {
  RentalConversationsState,
  ConversationWithRelations,
  ConversationStatus,
} from './types';

type Set = (
  partial:
    | RentalConversationsState
    | Partial<RentalConversationsState>
    | ((state: RentalConversationsState) => RentalConversationsState | Partial<RentalConversationsState>),
  replace?: boolean
) => void;
type Get = () => RentalConversationsState;

export const createConversationActions = (set: Set, get: Get) => ({
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use RPC function for cross-schema join
      const { getConversationsWithContact, mapLandlordConversationRPC } = await import('@/lib/rpc');
      const data = await getConversationsWithContact();

      const conversations = data.map(mapLandlordConversationRPC) as ConversationWithRelations[];
      set({
        conversations: conversations.map(({ contact, property, ...c }) => c),
        conversationsWithRelations: conversations,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch conversations';
      set({ error: message, isLoading: false });
    }
  },

  fetchConversationById: async (id: string) => {
    try {
      // Use RPC function for cross-schema join
      const { getConversationsWithContact, mapLandlordConversationRPC } = await import('@/lib/rpc');
      const data = await getConversationsWithContact([id]);

      if (!data || data.length === 0) {
        set({ error: 'Conversation not found' });
        return null;
      }

      const conversation = mapLandlordConversationRPC(data[0]) as ConversationWithRelations;
      set((state) => ({
        conversationsWithRelations: state.conversationsWithRelations.some((c) => c.id === id)
          ? state.conversationsWithRelations.map((c) => (c.id === id ? conversation : c))
          : [...state.conversationsWithRelations, conversation],
      }));

      return conversation;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch conversation';
      set({ error: message });
      return null;
    }
  },

  fetchConversationsWithPending: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: queueItems, error: queueError } = await supabase
        .schema('landlord')
        .from('ai_queue_items')
        .select('conversation_id')
        .eq('status', 'pending');

      if (queueError) throw queueError;

      const conversationIds = (queueItems || []).map((q) => q.conversation_id);
      if (conversationIds.length === 0) {
        set({ conversationsWithRelations: [], isLoading: false });
        return;
      }

      // Use RPC function for cross-schema join
      const { getConversationsWithContact, mapLandlordConversationRPC } = await import('@/lib/rpc');
      const data = await getConversationsWithContact(conversationIds);

      set({
        conversationsWithRelations: data.map(mapLandlordConversationRPC) as ConversationWithRelations[],
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch conversations with pending responses';
      set({ error: message, isLoading: false });
    }
  },

  setSelectedConversationId: (id: string | null) => {
    set({ selectedConversationId: id });
  },

  updateConversationStatus: async (id: string, status: ConversationStatus) => {
    try {
      const { error } = await supabase
        .schema('landlord')
        .from('conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        conversations: state.conversations.map((c) => (c.id === id ? { ...c, status } : c)),
        conversationsWithRelations: state.conversationsWithRelations.map((c) =>
          c.id === id ? { ...c, status } : c
        ),
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update conversation status';
      set({ error: message });
      return false;
    }
  },

  toggleAI: async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .schema('landlord')
        .from('conversations')
        .update({ is_ai_enabled: enabled, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, is_ai_enabled: enabled } : c
        ),
        conversationsWithRelations: state.conversationsWithRelations.map((c) =>
          c.id === id ? { ...c, is_ai_enabled: enabled } : c
        ),
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle AI';
      set({ error: message });
      return false;
    }
  },
});
