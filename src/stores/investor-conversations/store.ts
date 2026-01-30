// src/stores/investor-conversations/store.ts
// Main Zustand store for RE Investor platform lead conversations

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { logInvestorAIOutcome } from '../shared/ai-learning';
import { createRealtimeSubscription, createMessageSubscription } from '../shared/realtime-retry';
import type {
  InvestorConversationsState,
  InvestorConversationWithRelations,
  InvestorMessage,
  InvestorAIQueueItem,
  AIConfidenceRecord,
  ApprovalMetadata,
} from './types';
import type {
  InvestorConversationStatus,
  InvestorChannel,
  ContentType,
  AIOutcome,
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

      // ========== Conversation Actions ==========

      fetchConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('investor_conversations')
            .select(`
              *,
              lead:crm_leads(id, name, phone, email, status, opt_status, tags),
              property:investor_properties(id, address_line_1, city, state),
              deal:investor_deals_pipeline(id, title, status)
            `)
            .order('last_message_at', { ascending: false, nullsFirst: false });

          if (error) throw error;

          const conversations = (data || []) as InvestorConversationWithRelations[];
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
          const { data, error } = await supabase
            .from('investor_conversations')
            .select(`
              *,
              lead:crm_leads(id, name, phone, email, status, opt_status, tags),
              property:investor_properties(id, address_line_1, city, state),
              deal:investor_deals_pipeline(id, title, status)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;

          const conversation = data as InvestorConversationWithRelations;
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
            .from('investor_ai_queue_items')
            .select('conversation_id')
            .eq('status', 'pending');

          if (queueError) throw queueError;

          const conversationIds = (queueItems || []).map((q) => q.conversation_id);
          if (conversationIds.length === 0) {
            set({ conversationsWithRelations: [], isLoading: false });
            return;
          }

          const { data, error } = await supabase
            .from('investor_conversations')
            .select(`
              *,
              lead:crm_leads(id, name, phone, email, status, opt_status, tags),
              property:investor_properties(id, address_line_1, city, state),
              deal:investor_deals_pipeline(id, title, status)
            `)
            .in('id', conversationIds)
            .order('last_message_at', { ascending: false, nullsFirst: false });

          if (error) throw error;

          set({
            conversationsWithRelations: (data || []) as InvestorConversationWithRelations[],
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
            .from('investor_conversations')
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
            .from('investor_conversations')
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
            .from('investor_conversations')
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
            .from('investor_conversations')
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

      // ========== Message Actions ==========

      fetchMessages: async (conversationId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('investor_messages')
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
            .from('investor_messages')
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

      // ========== AI Queue Actions ==========

      fetchPendingResponses: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('investor_ai_queue_items')
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
            .from('investor_ai_queue_items')
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
            .from('investor_ai_queue_items')
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

          await supabase.from('investor_ai_response_outcomes').insert({
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

      // ========== AI Confidence Actions ==========

      fetchAIConfidence: async () => {
        try {
          const { data, error } = await supabase
            .from('investor_ai_confidence_settings')
            .select('*');

          if (error) throw error;

          const confidenceMap: Record<string, AIConfidenceRecord> = {};
          for (const record of (data || []) as AIConfidenceRecord[]) {
            confidenceMap[record.lead_situation] = record;
          }

          set({ aiConfidence: confidenceMap });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch AI confidence';
          set({ error: message });
        }
      },

      toggleAutoSendForSituation: async (leadSituation: string, enabled: boolean) => {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) {
            set({ error: 'Not authenticated' });
            return false;
          }

          const { error } = await supabase
            .from('investor_ai_confidence_settings')
            .upsert({
              user_id: userData.user.id,
              lead_situation: leadSituation,
              auto_send_enabled: enabled,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,lead_situation',
            });

          if (error) throw error;

          set((state) => ({
            aiConfidence: {
              ...state.aiConfidence,
              [leadSituation]: {
                ...state.aiConfidence[leadSituation],
                auto_send_enabled: enabled,
              } as AIConfidenceRecord,
            },
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to toggle auto-send';
          set({ error: message });
          return false;
        }
      },

      // ========== Filter Actions ==========

      setStatusFilter: (status: InvestorConversationStatus | 'all') => {
        set({ statusFilter: status });
      },

      setChannelFilter: (channel: InvestorChannel | 'all') => {
        set({ channelFilter: channel });
      },

      // ========== Real-time Subscriptions ==========

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
              tableName: 'investor_conversations',
              onEvent: async () => {
                await get().fetchConversations();
              },
            },
            {
              tableName: 'investor_ai_queue_items',
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
          'investor_messages',
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
