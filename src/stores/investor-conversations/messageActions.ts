// src/stores/investor-conversations/messageActions.ts
// Message fetch/send actions for the investor conversations store

import { supabase } from '@/lib/supabase';
import type { InvestorConversationsState, InvestorMessage } from './types';
import type { ContentType } from '@/features/lead-inbox/types/investor-conversations.types';

type Set = (partial: Partial<InvestorConversationsState> | ((state: InvestorConversationsState) => Partial<InvestorConversationsState>)) => void;
type Get = () => InvestorConversationsState;

export const createMessageActions = (set: Set, _get: Get) => ({
  fetchMessages: async (conversationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('investor')
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (data || []) as InvestorMessage[],
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
        .schema('investor')
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

      const message = newMessage as InvestorMessage;
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
