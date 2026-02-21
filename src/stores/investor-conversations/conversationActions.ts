// src/stores/investor-conversations/conversationActions.ts
// Conversation CRUD actions for the investor conversations store

import { supabase } from '@/lib/supabase';
import type { InvestorConversationsState, InvestorConversationWithRelations } from './types';
import type { InvestorConversationStatus } from '@/features/lead-inbox/types/investor-conversations.types';

type Set = (partial: Partial<InvestorConversationsState> | ((state: InvestorConversationsState) => Partial<InvestorConversationsState>)) => void;
type Get = () => InvestorConversationsState;

export const createConversationActions = (set: Set, get: Get) => ({
  fetchConversations: async () => {
    set({ isLoading: true, error: null });
    try {
      // Use RPC function for cross-schema join
      const { getConversationsWithLead, mapInvestorConversationRPC } = await import('@/lib/rpc');
      const data = await getConversationsWithLead();

      const conversations = data.map(mapInvestorConversationRPC) as InvestorConversationWithRelations[];
      set({
        conversations: conversations.map(({ lead, property, deal, ...c }) => c),
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
      const { getConversationById, mapInvestorConversationRPC } = await import('@/lib/rpc');
      const data = await getConversationById(id);

      if (!data) {
        set({ error: 'Conversation not found' });
        return null;
      }

      const conversation = mapInvestorConversationRPC(data) as InvestorConversationWithRelations;
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
        .schema('investor')
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
      const { getConversationsWithLead, mapInvestorConversationRPC } = await import('@/lib/rpc');
      const data = await getConversationsWithLead(conversationIds);

      set({
        conversationsWithRelations: data.map(mapInvestorConversationRPC) as InvestorConversationWithRelations[],
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

  updateConversationStatus: async (id: string, status: InvestorConversationStatus) => {
    try {
      const { error } = await supabase
        .schema('investor')
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
        .schema('investor')
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

  toggleAutoRespond: async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .schema('investor')
        .from('conversations')
        .update({ is_ai_auto_respond: enabled, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, is_ai_auto_respond: enabled } : c
        ),
        conversationsWithRelations: state.conversationsWithRelations.map((c) =>
          c.id === id ? { ...c, is_ai_auto_respond: enabled } : c
        ),
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle auto-respond';
      set({ error: message });
      return false;
    }
  },

  markAsRead: async (id: string) => {
    try {
      const { error } = await supabase
        .schema('investor')
        .from('conversations')
        .update({ unread_count: 0, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, unread_count: 0 } : c
        ),
        conversationsWithRelations: state.conversationsWithRelations.map((c) =>
          c.id === id ? { ...c, unread_count: 0 } : c
        ),
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark as read';
      set({ error: message });
      return false;
    }
  },
});
