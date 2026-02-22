// src/stores/investor-conversations/aiQueueActions.ts
// AI queue (approve/reject/feedback) actions for the investor conversations store

import { supabase } from '@/lib/supabase';
import { logInvestorAIOutcome } from '../shared/ai-learning';
import type {
  InvestorConversationsState,
  InvestorAIQueueItem,
  InvestorMessage,
  ApprovalMetadata,
} from './types';
import type { AIOutcome } from '@/features/lead-inbox/types/investor-conversations.types';

type Set = (partial: Partial<InvestorConversationsState> | ((state: InvestorConversationsState) => Partial<InvestorConversationsState>)) => void;
type Get = () => InvestorConversationsState;

export const createAIQueueActions = (set: Set, get: Get) => ({
  fetchPendingResponses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('investor')
        .from('ai_queue_items')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({
        pendingResponses: (data || []) as InvestorAIQueueItem[],
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch pending responses';
      set({ error: message, isLoading: false });
    }
  },

  approveResponse: async (id: string, metadata: ApprovalMetadata) => {
    try {
      const { pendingResponses, conversationsWithRelations } = get();
      const response = pendingResponses.find((p) => p.id === id);

      if (!response) {
        set({ error: 'Response not found' });
        return false;
      }

      if (new Date(response.expires_at) < new Date()) {
        set({ error: 'Cannot approve: response has expired' });
        set((state) => ({
          pendingResponses: state.pendingResponses.filter((p) => p.id !== id),
        }));
        return false;
      }

      const { editedResponse, editSeverity, responseTimeSeconds } = metadata;
      const status = editedResponse ? 'edited' : 'approved';
      const reviewedAt = new Date().toISOString();

      const updateData: Partial<InvestorAIQueueItem> = {
        status,
        reviewed_at: reviewedAt,
      };
      if (editedResponse) {
        updateData.final_response = editedResponse;
      }

      const { error, count } = await supabase
        .schema('investor')
        .from('ai_queue_items')
        .update(updateData)
        .eq('id', id)
        .gt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      if (!count || count === 0) {
        set({ error: 'Cannot approve: response has expired or not found' });
        set((state) => ({
          pendingResponses: state.pendingResponses.filter((p) => p.id !== id),
        }));
        return false;
      }

      const conversation = conversationsWithRelations.find((c) => c.id === response.conversation_id);

      let outcome: AIOutcome = 'approved';
      if (editedResponse) {
        outcome = editSeverity === 'major' ? 'edited_major' : 'edited_minor';
      }

      await logInvestorAIOutcome({
        user_id: response.user_id,
        queue_item_id: response.id,
        conversation_id: response.conversation_id,
        lead_situation: conversation?.lead?.tags?.[0] || 'general',
        channel: conversation?.channel,
        outcome,
        original_response: response.suggested_response,
        final_response: editedResponse || response.suggested_response,
        original_confidence: response.confidence,
        response_time_seconds: responseTimeSeconds,
        edit_severity: editSeverity,
      });

      set((state) => ({
        pendingResponses: state.pendingResponses.filter((p) => p.id !== id),
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve response';
      set({ error: message });
      return false;
    }
  },

  rejectResponse: async (id: string, responseTimeSeconds: number) => {
    try {
      const { pendingResponses, conversationsWithRelations } = get();
      const response = pendingResponses.find((p) => p.id === id);
      const reviewedAt = new Date().toISOString();

      const { error } = await supabase
        .schema('investor')
        .from('ai_queue_items')
        .update({ status: 'rejected', reviewed_at: reviewedAt })
        .eq('id', id);

      if (error) throw error;

      if (response) {
        const conversation = conversationsWithRelations.find((c) => c.id === response.conversation_id);

        await logInvestorAIOutcome({
          user_id: response.user_id,
          queue_item_id: response.id,
          conversation_id: response.conversation_id,
          lead_situation: conversation?.lead?.tags?.[0] || 'general',
          channel: conversation?.channel,
          outcome: 'rejected',
          original_response: response.suggested_response,
          final_response: null,
          original_confidence: response.confidence,
          response_time_seconds: responseTimeSeconds,
          edit_severity: 'none',
        });
      }

      set((state) => ({
        pendingResponses: state.pendingResponses.filter((p) => p.id !== id),
      }));

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject response';
      set({ error: message });
      return false;
    }
  },

  submitFeedback: async (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
    try {
      const { messages, conversationsWithRelations } = get();
      let targetMessage: InvestorMessage | undefined;
      let conversationId: string | undefined;

      for (const [convId, convMessages] of Object.entries(messages)) {
        const found = convMessages.find((m) => m.id === messageId);
        if (found) {
          targetMessage = found;
          conversationId = convId;
          break;
        }
      }

      if (!targetMessage || !conversationId) {
        set({ error: 'Message not found' });
        return false;
      }

      const conversation = conversationsWithRelations.find((c) => c.id === conversationId);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        set({ error: 'Not authenticated' });
        return false;
      }

      await supabase.schema('ai').from('response_outcomes').insert({
        user_id: userData.user.id,
        conversation_id: conversationId,
        message_id: messageId,
        lead_situation: conversation?.lead?.tags?.[0] || 'general',
        channel: conversation?.channel,
        outcome: feedback,
        original_response: targetMessage.content,
        final_response: targetMessage.content,
        original_confidence: targetMessage.ai_confidence,
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit feedback';
      set({ error: message });
      return false;
    }
  },
});
