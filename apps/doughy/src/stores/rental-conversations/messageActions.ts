// src/stores/rental-conversations/messageActions.ts
// Message fetch and send actions for the rental conversations store

import { supabase } from '@/lib/supabase';
import type {
  RentalConversationsState,
  ContentType,
  Message,
} from './types';

type Set = (
  partial:
    | RentalConversationsState
    | Partial<RentalConversationsState>
    | ((state: RentalConversationsState) => RentalConversationsState | Partial<RentalConversationsState>),
  replace?: boolean
) => void;

export const createMessageActions = (set: Set) => ({
  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('landlord')
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (data || []) as Message[],
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch messages';
      set({ error: message, isLoading: false });
    }
  },

  sendMessage: async (conversationId: string, content: string, contentType: ContentType = 'text') => {
    set({ isSending: true, error: null });
    try {
      const { data: newMessage, error } = await supabase
        .schema('landlord')
        .from('messages')
        .insert({
          conversation_id: conversationId,
          direction: 'outbound',
          content,
          content_type: contentType,
          sent_by: 'user',
        })
        .select()
        .single();

      if (error) throw error;

      const message = newMessage as Message;
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: [message, ...(state.messages[conversationId] || [])],
        },
        isSending: false,
      }));

      return message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      set({ error: errorMessage, isSending: false });
      return null;
    }
  },
});
