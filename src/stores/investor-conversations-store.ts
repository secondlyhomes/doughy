// src/stores/investor-conversations-store.ts
// Zustand store for RE Investor platform lead conversations and messages
// Mirrors rental-conversations-store.ts patterns for Lead Communication Inbox
//
// NOTE: TypeScript errors for Supabase queries are expected until the migration
// (20260129140000_investor_communication_tables.sql) is run and types are regenerated
// with: npx supabase gen types typescript --local > src/types/supabase.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Re-export shared types from single source of truth
export type {
  InvestorChannel,
  InvestorConversationStatus,
  MessageDirection,
  ContentType,
  InvestorSender,
  AIQueueStatus,
  EditSeverity,
  AIOutcome,
} from '@/features/lead-inbox/types/investor-conversations.types';

import type {
  InvestorChannel,
  InvestorConversationStatus,
  MessageDirection,
  ContentType,
  InvestorSender,
  AIQueueStatus,
  EditSeverity,
  AIOutcome,
} from '@/features/lead-inbox/types/investor-conversations.types';

// Conversation interface - matches investor_conversations table schema
export interface InvestorConversation {
  id: string;
  user_id: string;
  lead_id: string;
  property_id: string | null;
  deal_id: string | null;
  channel: InvestorChannel;
  external_thread_id: string | null;
  status: InvestorConversationStatus;
  is_ai_enabled: boolean;
  is_ai_auto_respond: boolean;
  ai_confidence_threshold: number;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
}

// Message interface - matches investor_messages table schema
export interface InvestorMessage {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  content: string;
  content_type: ContentType;
  sent_by: InvestorSender;
  ai_confidence: number | null;
  ai_model: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// AI Response Queue item interface - matches investor_ai_queue table schema
export interface InvestorAIQueueItem {
  id: string;
  user_id: string;
  conversation_id: string;
  trigger_message_id: string | null;
  suggested_response: string;
  confidence: number; // 0-1 scale
  reasoning: string | null;
  intent: string | null;
  detected_topics: string[] | null;
  status: AIQueueStatus;
  final_response: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  expires_at: string;
  created_at: string;
}

// AI Confidence tracking - matches investor_ai_confidence table schema
export interface AIConfidenceRecord {
  id: string;
  user_id: string;
  lead_situation: string;
  confidence_score: number;
  total_approvals: number;
  total_edits: number;
  total_rejections: number;
  auto_send_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Metadata passed with approval for learning
export interface ApprovalMetadata {
  editedResponse?: string;
  editSeverity: EditSeverity;
  responseTimeSeconds: number;
}

// Lead info for display
export interface LeadInfo {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  opt_status: string | null;
  tags: string[] | null;
  source: string | null;
}

// Property info for display
export interface PropertyInfo {
  id: string;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
}

// Deal info for display
export interface DealInfo {
  id: string;
  name: string | null;
  status: string;
}

// Conversation with related data for display
export interface InvestorConversationWithRelations extends InvestorConversation {
  lead?: LeadInfo | null;
  property?: PropertyInfo | null;
  deal?: DealInfo | null;
  lastMessage?: InvestorMessage | null;
  pendingResponse?: InvestorAIQueueItem | null;
}

export interface InvestorConversationsState {
  // Data
  conversations: InvestorConversation[];
  conversationsWithRelations: InvestorConversationWithRelations[];
  messages: Record<string, InvestorMessage[]>; // keyed by conversation_id
  pendingResponses: InvestorAIQueueItem[];
  selectedConversationId: string | null;
  aiConfidence: Record<string, AIConfidenceRecord>; // keyed by lead_situation

  // Filters
  statusFilter: InvestorConversationStatus | 'all';
  channelFilter: InvestorChannel | 'all';

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSending: boolean;

  // Error state
  error: string | null;

  // Real-time subscription state
  isSubscribed: boolean;
  isSubscribing: boolean;
  messageSubscriptions: Set<string>;
  subscriptionError: string | null;

  // Actions - Conversations
  fetchConversations: () => Promise<void>;
  fetchConversationById: (id: string) => Promise<InvestorConversationWithRelations | null>;
  fetchConversationsWithPending: () => Promise<void>;
  setSelectedConversationId: (id: string | null) => void;
  updateConversationStatus: (id: string, status: InvestorConversationStatus) => Promise<boolean>;
  toggleAI: (id: string, enabled: boolean) => Promise<boolean>;
  toggleAutoRespond: (id: string, enabled: boolean) => Promise<boolean>;
  markAsRead: (id: string) => Promise<boolean>;

  // Actions - Messages
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, contentType?: ContentType) => Promise<InvestorMessage | null>;

  // Actions - AI Queue
  fetchPendingResponses: () => Promise<void>;
  approveResponse: (id: string, metadata: ApprovalMetadata) => Promise<boolean>;
  rejectResponse: (id: string, responseTimeSeconds: number) => Promise<boolean>;
  submitFeedback: (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => Promise<boolean>;

  // Actions - AI Confidence
  fetchAIConfidence: () => Promise<void>;
  toggleAutoSendForSituation: (leadSituation: string, enabled: boolean) => Promise<boolean>;

  // Filter actions
  setStatusFilter: (status: InvestorConversationStatus | 'all') => void;
  setChannelFilter: (channel: InvestorChannel | 'all') => void;

  // Real-time subscriptions
  subscribeToConversations: (userId: string) => () => void;
  subscribeToMessages: (conversationId: string) => () => void;
  clearSubscriptionError: () => void;

  clearError: () => void;
  reset: () => void;
}

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

      // Conversation Actions
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

          // Update in local state
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
          // Fetch conversations that have pending AI responses
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
            conversations: state.conversations.map((c) =>
              c.id === id ? { ...c, status } : c
            ),
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

      // Message Actions
      fetchMessages: async (conversationId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Sort descending (newest first) for inverted FlatList
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

          // Prepend new message to beginning (since array is sorted newest first)
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

      // AI Queue Actions
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
          // Check if the response has expired before approving
          const { pendingResponses } = get();
          const response = pendingResponses.find((p) => p.id === id);

          if (!response) {
            set({ error: 'Response not found' });
            return false;
          }

          const expiresAt = new Date(response.expires_at);
          const now = new Date();
          if (expiresAt < now) {
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

          // Check expiration at database level for safety
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

          // Get conversation for context
          const { conversationsWithRelations } = get();
          const conversation = conversationsWithRelations.find(
            (c) => c.id === response.conversation_id
          );

          // Determine outcome type
          let outcome: AIOutcome = 'approved';
          if (editedResponse) {
            outcome = editSeverity === 'major' ? 'edited_major' : 'edited_minor';
          }

          // Log outcome for adaptive learning
          try {
            await supabase.from('investor_ai_response_outcomes').insert({
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
          } catch (outcomeError) {
            console.error('[AdaptiveLearning] CRITICAL - Failed to log approval outcome:', {
              error: outcomeError instanceof Error ? outcomeError.message : String(outcomeError),
              userId: response.user_id,
              conversationId: response.conversation_id,
              outcome,
            });
          }

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
            .update({
              status: 'rejected',
              reviewed_at: reviewedAt,
            })
            .eq('id', id);

          if (error) throw error;

          // Log outcome for adaptive learning
          if (response) {
            const conversation = conversationsWithRelations.find(
              (c) => c.id === response.conversation_id
            );

            try {
              await supabase.from('investor_ai_response_outcomes').insert({
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
            } catch (outcomeError) {
              console.error('[AdaptiveLearning] CRITICAL - Failed to log rejection outcome:', {
                error: outcomeError instanceof Error ? outcomeError.message : String(outcomeError),
                userId: response.user_id,
                conversationId: response.conversation_id,
              });
            }
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
          // Get the message to find conversation context
          const { messages, conversationsWithRelations } = get();
          let targetMessage: InvestorMessage | undefined;
          let conversationId: string | undefined;

          // Find the message across all conversations
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

          // Log feedback outcome
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

      // AI Confidence Actions
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

          // Upsert the confidence record
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

      // Filter Actions
      setStatusFilter: (status: InvestorConversationStatus | 'all') => {
        set({ statusFilter: status });
      },

      setChannelFilter: (channel: InvestorChannel | 'all') => {
        set({ channelFilter: channel });
      },

      // Real-time subscription for conversations and AI queue
      subscribeToConversations: (userId: string) => {
        const { isSubscribed, isSubscribing } = get();
        if (isSubscribed || isSubscribing) {
          return () => {};
        }

        set({ isSubscribing: true });

        let retryCount = 0;
        const maxRetries = 3;
        const baseDelay = 2000;
        let currentChannel: ReturnType<typeof supabase.channel> | null = null;
        let isCleanedUp = false;
        let lastSubscribedAt = 0;
        let rapidFailureCount = 0;
        let useFilters = true;

        const subscribe = () => {
          if (isCleanedUp) return;

          const channelConfig = useFilters
            ? {
                conversationFilter: `user_id=eq.${userId}`,
                queueFilter: `user_id=eq.${userId}`,
              }
            : {
                conversationFilter: undefined,
                queueFilter: undefined,
              };

          const channelBuilder = supabase.channel('investor-conversations-changes');

          // Add conversation changes listener
          if (channelConfig.conversationFilter) {
            channelBuilder.on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'investor_conversations',
                filter: channelConfig.conversationFilter,
              },
              async (payload) => {
                if (isCleanedUp) return;
                if (__DEV__) {
                  console.log('[Real-time] Investor conversation change:', payload.eventType);
                }
                try {
                  await get().fetchConversations();
                } catch (fetchError) {
                  // Log for debugging - don't set error state to avoid blocking UI
                  console.warn('[Real-time] Failed to fetch conversations after change event', {
                    error: fetchError instanceof Error ? fetchError.message : String(fetchError),
                  });
                }
              }
            );
          } else {
            channelBuilder.on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'investor_conversations',
              },
              async (payload) => {
                if (isCleanedUp) return;
                const record = payload.new as Record<string, unknown>;
                if (record?.user_id !== userId) return;

                if (__DEV__) {
                  console.log('[Real-time] Investor conversation change:', payload.eventType);
                }
                try {
                  await get().fetchConversations();
                } catch (fetchError) {
                  console.warn('[Real-time] Failed to fetch conversations after change event', {
                    error: fetchError instanceof Error ? fetchError.message : String(fetchError),
                  });
                }
              }
            );
          }

          // Add AI queue changes listener
          if (channelConfig.queueFilter) {
            channelBuilder.on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'investor_ai_queue_items',
                filter: channelConfig.queueFilter,
              },
              async (payload) => {
                if (isCleanedUp) return;
                if (__DEV__) {
                  console.log('[Real-time] Investor AI queue change:', payload.eventType);
                }
                try {
                  await get().fetchPendingResponses();
                } catch (fetchError) {
                  console.warn('[Real-time] Failed to fetch pending responses after change event', {
                    error: fetchError instanceof Error ? fetchError.message : String(fetchError),
                  });
                }
              }
            );
          } else {
            channelBuilder.on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'investor_ai_queue_items',
              },
              async (payload) => {
                if (isCleanedUp) return;
                const record = payload.new as Record<string, unknown>;
                if (record?.user_id !== userId) return;

                if (__DEV__) {
                  console.log('[Real-time] Investor AI queue change:', payload.eventType);
                }
                try {
                  await get().fetchPendingResponses();
                } catch (fetchError) {
                  console.warn('[Real-time] Failed to fetch pending responses after change event', {
                    error: fetchError instanceof Error ? fetchError.message : String(fetchError),
                  });
                }
              }
            );
          }

          currentChannel = channelBuilder.subscribe((status, error) => {
            if (isCleanedUp) return;

            if (status === 'SUBSCRIBED') {
              lastSubscribedAt = Date.now();
              retryCount = 0;
              rapidFailureCount = 0;
              set({ isSubscribed: true, isSubscribing: false, subscriptionError: null });
              if (__DEV__) {
                console.log('[Real-time] Investor subscription active', useFilters ? '(with filters)' : '(without filters)');
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              set({ isSubscribed: false });

              const timeSinceSubscribed = Date.now() - lastSubscribedAt;
              if (lastSubscribedAt > 0 && timeSinceSubscribed < 5000) {
                rapidFailureCount++;
              }

              const errorMessage = error?.message || String(error) || '';
              const isMismatchError = errorMessage.includes('mismatch');

              if (isMismatchError && useFilters && !isCleanedUp) {
                if (__DEV__) {
                  console.log('[Real-time] Filter mismatch detected, retrying without filters');
                }
                useFilters = false;
                retryCount = 0;
                if (currentChannel) {
                  supabase.removeChannel(currentChannel);
                }
                setTimeout(() => subscribe(), 500);
                return;
              }

              if (rapidFailureCount >= 3) {
                if (__DEV__) {
                  console.log('[Real-time] Too many rapid failures, giving up');
                }
                set({
                  isSubscribing: false,
                  subscriptionError: 'Real-time updates unavailable. Pull to refresh for latest data.',
                });
                return;
              }

              if (retryCount < maxRetries && !isCleanedUp) {
                const delay = baseDelay * Math.pow(2, retryCount);
                retryCount++;
                if (__DEV__) {
                  console.log(`[Real-time] Retrying in ${delay}ms (attempt ${retryCount})`);
                }
                setTimeout(() => {
                  if (currentChannel && !isCleanedUp) {
                    supabase.removeChannel(currentChannel);
                    subscribe();
                  }
                }, delay);
              } else if (!isCleanedUp) {
                set({
                  isSubscribing: false,
                  subscriptionError: 'Real-time updates unavailable. Pull to refresh for latest data.',
                });
              }
            }
          });
        };

        subscribe();

        return () => {
          isCleanedUp = true;
          if (__DEV__) {
            console.log('[Real-time] Unsubscribing from investor conversations');
          }
          if (currentChannel) {
            supabase.removeChannel(currentChannel);
          }
          set({ isSubscribed: false, isSubscribing: false, subscriptionError: null });
        };
      },

      // Real-time subscription for messages in a specific conversation
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

        let isCleanedUp = false;
        let channel: ReturnType<typeof supabase.channel> | null = null;
        let useFilter = true;
        let retryCount = 0;
        const maxRetries = 2;

        const subscribe = () => {
          if (isCleanedUp) return;

          const channelBuilder = supabase.channel(`investor-messages-${conversationId}`);

          if (useFilter) {
            channelBuilder.on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'investor_messages',
                filter: `conversation_id=eq.${conversationId}`,
              },
              (payload) => {
                if (isCleanedUp) return;
                handleNewMessage(payload.new as Record<string, unknown>);
              }
            );
          } else {
            channelBuilder.on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'investor_messages',
              },
              (payload) => {
                if (isCleanedUp) return;
                const newMessage = payload.new as Record<string, unknown>;
                if (newMessage?.conversation_id !== conversationId) return;
                handleNewMessage(newMessage);
              }
            );
          }

          channel = channelBuilder.subscribe((status, error) => {
            if (isCleanedUp) return;

            if (status === 'SUBSCRIBED') {
              retryCount = 0;
              if (__DEV__) {
                console.log(`[Real-time] Messages subscription active for ${conversationId}`);
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              const errorMessage = error?.message || String(error) || '';
              const isMismatchError = errorMessage.includes('mismatch');

              if (isMismatchError && useFilter && !isCleanedUp) {
                if (__DEV__) {
                  console.log(`[Real-time] Message filter mismatch, retrying without filter`);
                }
                useFilter = false;
                if (channel) {
                  supabase.removeChannel(channel);
                }
                setTimeout(() => subscribe(), 500);
                return;
              }

              if (retryCount < maxRetries && !isCleanedUp) {
                retryCount++;
                if (channel) {
                  supabase.removeChannel(channel);
                }
                setTimeout(() => subscribe(), 2000 * retryCount);
                return;
              }

              if (__DEV__) {
                console.log(`[Real-time] Message subscription gave up for ${conversationId}`);
              }
              set((state) => {
                const newSubs = new Set(state.messageSubscriptions);
                newSubs.delete(conversationId);
                return { messageSubscriptions: newSubs };
              });
            }
          });
        };

        const handleNewMessage = (newMessage: Record<string, unknown>) => {
          if (!newMessage?.id || !newMessage?.conversation_id || !newMessage?.content) {
            if (__DEV__) {
              console.log('[Real-time] Invalid message payload, skipping');
            }
            return;
          }

          if (__DEV__) {
            console.log('[Real-time] New message received:', newMessage.id);
          }

          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [
                newMessage as unknown as InvestorMessage,
                ...(state.messages[conversationId] || []).filter(
                  (m) => m.id !== newMessage.id
                ),
              ],
            },
          }));
        };

        subscribe();

        return () => {
          isCleanedUp = true;
          if (__DEV__) {
            console.log(`[Real-time] Unsubscribing from messages for ${conversationId}`);
          }
          if (channel) {
            supabase.removeChannel(channel);
          }
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

// Selectors
export const selectInvestorConversations = (state: InvestorConversationsState) => state.conversations;
export const selectInvestorConversationsWithRelations = (state: InvestorConversationsState) =>
  state.conversationsWithRelations;
export const selectSelectedInvestorConversation = (state: InvestorConversationsState) =>
  state.conversationsWithRelations.find((c) => c.id === state.selectedConversationId);
export const selectInvestorMessages = (conversationId: string) => (state: InvestorConversationsState) =>
  state.messages[conversationId] || [];
export const selectInvestorPendingResponses = (state: InvestorConversationsState) => state.pendingResponses;
export const selectInvestorPendingCount = (state: InvestorConversationsState) => state.pendingResponses.length;
export const selectInvestorNeedsReviewConversations = (state: InvestorConversationsState) =>
  state.conversationsWithRelations.filter((c) =>
    state.pendingResponses.some((p) => p.conversation_id === c.id)
  );
export const selectInvestorUnreadCount = (state: InvestorConversationsState) =>
  state.conversationsWithRelations.reduce((sum, c) => sum + c.unread_count, 0);
export const selectAIConfidenceForSituation = (situation: string) => (state: InvestorConversationsState) =>
  state.aiConfidence[situation];
