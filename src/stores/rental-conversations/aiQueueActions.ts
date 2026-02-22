// src/stores/rental-conversations/aiQueueActions.ts
// AI queue actions: fetch pending, approve, reject, cancel for the rental conversations store

import { supabase } from '@/lib/supabase';
import { logLandlordAIOutcome } from '../shared/ai-learning';
import type {
  RentalConversationsState,
  AIResponseQueueItem,
  ApprovalMetadata,
  SendResult,
  Message,
} from './types';

// Constants
const SEND_DELAY_MS = 5000;

type Set = (
  partial:
    | RentalConversationsState
    | Partial<RentalConversationsState>
    | ((state: RentalConversationsState) => RentalConversationsState | Partial<RentalConversationsState>),
  replace?: boolean
) => void;
type Get = () => RentalConversationsState;

export const createAIQueueActions = (set: Set, get: Get) => ({
  fetchPendingResponses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('landlord')
        .from('ai_queue_items')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({
        pendingResponses: (data || []) as AIResponseQueueItem[],
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

      // Check expiration
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
      const finalResponseText = editedResponse || response.suggested_response;

      const updateData: Partial<AIResponseQueueItem> = {
        status,
        reviewed_at: reviewedAt,
      };
      if (editedResponse) {
        updateData.final_response = editedResponse;
      }

      const { error, count } = await supabase
        .schema('landlord')
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

      // Log outcome for adaptive learning
      const conversation = conversationsWithRelations.find((c) => c.id === response.conversation_id);
      const messageType = response.intent || response.message_type || 'unknown';
      const topic = response.detected_topics?.[0] || response.topic || 'general';
      const contactType = response.contact_type || 'lead';

      await logLandlordAIOutcome({
        user_id: response.user_id,
        conversation_id: response.conversation_id,
        message_id: response.trigger_message_id,
        property_id: conversation?.property_id,
        contact_id: conversation?.contact_id,
        message_type: messageType,
        topic,
        contact_type: contactType,
        channel: conversation?.channel,
        platform: conversation?.platform,
        original_confidence: response.confidence,
        original_response: response.suggested_response,
        final_response: finalResponseText,
        outcome: status as 'approved' | 'edited',
        edit_severity: editSeverity,
        response_time_seconds: responseTimeSeconds,
        reviewed_at: reviewedAt,
      });

      set((state) => ({
        pendingResponses: state.pendingResponses.filter((p) => p.id !== id),
      }));

      // Create outbound message
      const { data: newMessage, error: messageError } = await supabase
        .schema('landlord')
        .from('messages')
        .insert({
          conversation_id: response.conversation_id,
          direction: 'outbound',
          content: finalResponseText,
          content_type: 'text',
          sent_by: 'ai',
          ai_confidence: response.confidence,
          is_requires_approval: false,
          approved_by: response.user_id,
          approved_at: reviewedAt,
          metadata: {
            queue_item_id: id,
            edited: !!editedResponse,
            edit_severity: editSeverity,
          },
        })
        .select('*')
        .single();

      if (messageError) {
        console.error('[ApproveResponse] Failed to create message:', messageError);
        set({ error: 'Approved but failed to create message record' });
        return false;
      }

      set((state) => ({
        messages: {
          ...state.messages,
          [response.conversation_id]: [
            newMessage as Message,
            ...(state.messages[response.conversation_id] || []),
          ],
        },
      }));

      // Schedule delayed send with undo capability
      const scheduledAt = Date.now() + SEND_DELAY_MS;
      const timeoutId = setTimeout(async () => {
        set({ pendingSend: null });

        try {
          set({ isSending: true });

          const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
          const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

          if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Supabase configuration missing');
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Not authenticated');
          }

          const sendResponse = await fetch(
            `${supabaseUrl}/functions/v1/lead-response-sender`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                messageId: newMessage.id,
                conversationId: response.conversation_id,
                responseText: finalResponseText,
              }),
            }
          );

          const result: SendResult = await sendResponse.json();

          if (!result.success) {
            console.error('[ApproveResponse] Send failed:', result.error);
            set({
              error: result.requiresManualAction
                ? result.error || 'Please reply manually on the platform'
                : result.error || 'Failed to send response',
            });
          } else {
            set((state) => ({
              messages: {
                ...state.messages,
                [response.conversation_id]: (state.messages[response.conversation_id] || []).map(
                  (m) => m.id === newMessage.id ? { ...m, delivered_at: result.deliveredAt } : m
                ),
              },
            }));
            if (__DEV__) {
              console.log('[ApproveResponse] Email sent successfully:', result.externalMessageId);
            }
          }
        } catch (sendError) {
          console.error('[ApproveResponse] Send error:', sendError);
          set({
            error: sendError instanceof Error ? sendError.message : 'Failed to send response',
          });
        } finally {
          set({ isSending: false });
        }
      }, SEND_DELAY_MS);

      set({
        pendingSend: {
          queueItemId: id,
          conversationId: response.conversation_id,
          messageId: newMessage.id,
          responseText: finalResponseText,
          timeoutId,
          scheduledAt,
        },
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve response';
      set({ error: message });
      return false;
    }
  },

  cancelPendingSend: async () => {
    const { pendingSend } = get();
    if (!pendingSend) return;

    clearTimeout(pendingSend.timeoutId);

    let hasError = false;
    let errorMessage = '';

    const { error: deleteError } = await supabase
      .schema('landlord')
      .from('messages')
      .delete()
      .eq('id', pendingSend.messageId);

    if (deleteError) {
      console.error('[CancelPendingSend] Failed to delete message:', deleteError);
      hasError = true;
      errorMessage = 'Failed to cancel message deletion.';
    }

    const { error: revertError } = await supabase
      .schema('landlord')
      .from('ai_queue_items')
      .update({ status: 'pending', reviewed_at: null })
      .eq('id', pendingSend.queueItemId);

    if (revertError) {
      console.error('[CancelPendingSend] Failed to revert queue item:', revertError);
      hasError = true;
      errorMessage = errorMessage || 'Failed to revert AI response status.';
    } else {
      get().fetchPendingResponses();
    }

    set({
      pendingSend: null,
      error: hasError ? errorMessage : null,
    });

    if (__DEV__) {
      console.log('[CancelPendingSend] Send cancelled, message deleted');
    }
  },

  rejectResponse: async (id: string, responseTimeSeconds: number) => {
    try {
      const { pendingResponses, conversationsWithRelations } = get();
      const response = pendingResponses.find((p) => p.id === id);
      const reviewedAt = new Date().toISOString();

      const { error } = await supabase
        .schema('landlord')
        .from('ai_queue_items')
        .update({ status: 'rejected', reviewed_at: reviewedAt })
        .eq('id', id);

      if (error) throw error;

      if (response) {
        const conversation = conversationsWithRelations.find((c) => c.id === response.conversation_id);
        const messageType = response.intent || response.message_type || 'unknown';
        const topic = response.detected_topics?.[0] || response.topic || 'general';
        const contactType = response.contact_type || 'lead';

        await logLandlordAIOutcome({
          user_id: response.user_id,
          conversation_id: response.conversation_id,
          message_id: response.trigger_message_id,
          property_id: conversation?.property_id,
          contact_id: conversation?.contact_id,
          message_type: messageType,
          topic,
          contact_type: contactType,
          channel: conversation?.channel,
          platform: conversation?.platform,
          original_confidence: response.confidence,
          original_response: response.suggested_response,
          final_response: null,
          outcome: 'rejected',
          edit_severity: 'none',
          response_time_seconds: responseTimeSeconds,
          reviewed_at: reviewedAt,
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
});
