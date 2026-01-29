// src/stores/rental-conversations-store.ts
// Zustand store for Landlord platform conversations and messages
// Part of Zone 3: UI scaffolding for the Doughy architecture refactor

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Channel and status types based on Contract A from architecture doc
// These must match the database enum values exactly
// Channel types matching rental_channel database enum
export type Channel = 'whatsapp' | 'telegram' | 'email' | 'sms' | 'imessage' | 'discord' | 'webchat' | 'phone';
export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'archived';
export type MessageDirection = 'inbound' | 'outbound';
// Database has 'video' not 'location' for ContentType
export type ContentType = 'text' | 'image' | 'file' | 'voice' | 'video';
export type SentBy = 'contact' | 'ai' | 'user';
// Database has 'sent' not 'auto_sent' for AIQueueStatus
export type AIQueueStatus = 'pending' | 'approved' | 'edited' | 'rejected' | 'expired' | 'sent';

// Conversation interface - matches rental_conversations table schema
export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  property_id: string | null;
  booking_id: string | null;
  channel: Channel;
  platform: string | null;
  external_thread_id: string | null;
  status: ConversationStatus;
  ai_enabled: boolean;
  ai_auto_respond: boolean;
  ai_confidence_threshold: number;
  ai_personality: string | null;
  subject: string | null;
  message_count: number;
  unread_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
}

// Message interface - matches rental_messages table schema
export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  content: string;
  content_type: ContentType;
  sent_by: SentBy;
  ai_confidence: number | null;
  ai_model: string | null;
  ai_prompt_tokens: number | null;
  ai_completion_tokens: number | null;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  edited_content: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  attachments: unknown[];
  metadata: Record<string, unknown>;
  created_at: string;
}

// AI Response Queue item interface - matches rental_ai_queue table schema
export interface AIResponseQueueItem {
  id: string;
  user_id: string;
  conversation_id: string;
  trigger_message_id: string | null;
  sent_message_id: string | null;
  suggested_response: string;
  confidence: number;
  reasoning: string | null;
  intent: string | null;
  detected_topics: string[] | null;
  alternatives: unknown[];
  status: AIQueueStatus;
  final_response: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  expires_at: string;
  created_at: string;
  // Additional fields for learning context (populated from metadata)
  message_type?: string;
  topic?: string;
  contact_type?: string;
}

// Edit severity for adaptive learning
export type EditSeverity = 'none' | 'minor' | 'major';

// AI Outcome types matching database enum
export type AIOutcome = 'pending' | 'auto_sent' | 'approved' | 'edited' | 'rejected';

// AI Response Outcome for adaptive learning (matches ai_response_outcomes table)
export interface AIResponseOutcomeInsert {
  user_id: string;
  conversation_id: string | null;
  message_id: string | null;
  property_id: string | null;
  contact_id: string | null;
  message_type: string;
  topic: string;
  contact_type: string;
  channel?: string | null;
  platform?: string | null;
  initial_confidence: number;
  suggested_response: string;
  final_response?: string | null;
  outcome: AIOutcome;
  edit_severity?: EditSeverity;
  response_time_seconds?: number | null;
  sensitive_topics_detected?: string[];
  actions_suggested?: string[];
  reviewed_at?: string | null;
}

// Metadata passed with approval for learning
export interface ApprovalMetadata {
  editedResponse?: string;
  editSeverity: EditSeverity;
  responseTimeSeconds: number;
}

// Conversation with related data for display
export interface ConversationWithRelations extends Conversation {
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    contact_types: string[];
  } | null;
  property?: {
    id: string;
    name: string;
    address: string;
  } | null;
  lastMessage?: Message | null;
  pendingResponse?: AIResponseQueueItem | null;
}

export interface RentalConversationsState {
  // Data
  conversations: Conversation[];
  conversationsWithRelations: ConversationWithRelations[];
  messages: Record<string, Message[]>; // keyed by conversation_id
  pendingResponses: AIResponseQueueItem[];
  selectedConversationId: string | null;

  // Filters
  statusFilter: ConversationStatus | 'all';
  channelFilter: Channel | 'all';

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSending: boolean;

  // Error state
  error: string | null;

  // Real-time subscription state
  isSubscribed: boolean;
  isSubscribing: boolean; // Guard against duplicate subscription attempts
  messageSubscriptions: Set<string>; // Track active message subscription conversation IDs
  subscriptionError: string | null; // Subscription-specific errors

  // Actions - Conversations
  fetchConversations: () => Promise<void>;
  fetchConversationById: (id: string) => Promise<ConversationWithRelations | null>;
  fetchConversationsWithPending: () => Promise<void>;
  setSelectedConversationId: (id: string | null) => void;
  updateConversationStatus: (id: string, status: ConversationStatus) => Promise<boolean>;
  toggleAI: (id: string, enabled: boolean) => Promise<boolean>;

  // Actions - Messages
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, contentType?: ContentType) => Promise<Message | null>;

  // Actions - AI Queue
  fetchPendingResponses: () => Promise<void>;
  approveResponse: (id: string, metadata: ApprovalMetadata) => Promise<boolean>;
  rejectResponse: (id: string, responseTimeSeconds: number) => Promise<boolean>;

  // Filter actions
  setStatusFilter: (status: ConversationStatus | 'all') => void;
  setChannelFilter: (channel: Channel | 'all') => void;

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

      // Conversation Actions
      fetchConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('rental_conversations')
            .select(`
              *,
              contact:crm_contacts(id, first_name, last_name, email, phone, contact_types),
              property:rental_properties(id, name, address)
            `)
            .order('last_message_at', { ascending: false });

          if (error) throw error;

          const conversations = (data || []) as ConversationWithRelations[];

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
          const { data, error } = await supabase
            .from('rental_conversations')
            .select(`
              *,
              contact:crm_contacts(id, first_name, last_name, email, phone, contact_types),
              property:rental_properties(id, name, address)
            `)
            .eq('id', id)
            .single();

          if (error) throw error;

          const conversation = data as ConversationWithRelations;

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
            .from('rental_ai_queue')
            .select('conversation_id')
            .eq('status', 'pending');

          if (queueError) throw queueError;

          const conversationIds = (queueItems || []).map((q) => q.conversation_id);

          if (conversationIds.length === 0) {
            set({ conversationsWithRelations: [], isLoading: false });
            return;
          }

          const { data, error } = await supabase
            .from('rental_conversations')
            .select(`
              *,
              contact:crm_contacts(id, first_name, last_name, email, phone, contact_types),
              property:rental_properties(id, name, address)
            `)
            .in('id', conversationIds)
            .order('last_message_at', { ascending: false });

          if (error) throw error;

          set({
            conversationsWithRelations: (data || []) as ConversationWithRelations[],
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
            .from('rental_conversations')
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
            .from('rental_conversations')
            .update({ ai_enabled: enabled, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === id ? { ...c, ai_enabled: enabled } : c
            ),
            conversationsWithRelations: state.conversationsWithRelations.map((c) =>
              c.id === id ? { ...c, ai_enabled: enabled } : c
            ),
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to toggle AI';
          set({ error: message });
          return false;
        }
      },

      // Message Actions
      fetchMessages: async (conversationId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Sort descending (newest first) for inverted FlatList
          // This puts newest messages at the bottom like iOS Messenger
          const { data, error } = await supabase
            .from('rental_messages')
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
            .from('rental_messages')
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
            .from('rental_ai_queue')
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
            // Remove expired response from local state
            set((state) => ({
              pendingResponses: state.pendingResponses.filter((p) => p.id !== id),
            }));
            return false;
          }

          const { editedResponse, editSeverity, responseTimeSeconds } = metadata;
          const status = editedResponse ? 'edited' : 'approved';
          const reviewedAt = new Date().toISOString();

          const updateData: Partial<AIResponseQueueItem> = {
            status,
            reviewed_at: reviewedAt,
          };

          if (editedResponse) {
            updateData.final_response = editedResponse;
          }

          // Also check expiration at database level for safety
          const { error, count } = await supabase
            .from('rental_ai_queue')
            .update(updateData)
            .eq('id', id)
            .gt('expires_at', new Date().toISOString()) // Only update if not expired
            .select('id');

          if (error) throw error;

          // If no rows were updated, the response may have expired
          if (!count || count === 0) {
            set({ error: 'Cannot approve: response has expired or not found' });
            set((state) => ({
              pendingResponses: state.pendingResponses.filter((p) => p.id !== id),
            }));
            return false;
          }

          // Log outcome for adaptive learning
          // Extract context from intent and detected_topics fields
          const messageType = response.intent || response.message_type || 'unknown';
          const topic = response.detected_topics?.[0] || response.topic || 'general';
          const contactType = response.contact_type || 'lead';

          // Get conversation details for additional context
          const { conversationsWithRelations } = get();
          const conversation = conversationsWithRelations.find(
            (c) => c.id === response.conversation_id
          );

          // Log outcome to ai_response_outcomes table for adaptive learning
          // Type assertion needed since table isn't in generated Supabase types yet
          // Don't fail the main operation if logging fails
          try {
            await (supabase as any).from('ai_response_outcomes').insert({
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
              initial_confidence: response.confidence,
              suggested_response: response.suggested_response,
              final_response: editedResponse || response.suggested_response,
              outcome: status as 'approved' | 'edited',
              edit_severity: editSeverity,
              response_time_seconds: responseTimeSeconds,
              reviewed_at: reviewedAt,
            });
          } catch (outcomeError) {
            // CRITICAL: Adaptive learning data loss should be tracked
            // TODO: Replace with Sentry/logError when error tracking is set up
            console.error('[AdaptiveLearning] CRITICAL - Failed to log approval outcome:', {
              error: outcomeError instanceof Error ? outcomeError.message : String(outcomeError),
              stack: outcomeError instanceof Error ? outcomeError.stack : undefined,
              userId: response.user_id,
              conversationId: response.conversation_id,
              outcome: status,
              context: 'This data loss affects AI learning quality and should be investigated',
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
            .from('rental_ai_queue')
            .update({
              status: 'rejected',
              reviewed_at: reviewedAt,
            })
            .eq('id', id);

          if (error) throw error;

          // Log outcome for adaptive learning
          if (response) {
            // Extract context from intent and detected_topics fields
            const messageType = response.intent || response.message_type || 'unknown';
            const topic = response.detected_topics?.[0] || response.topic || 'general';
            const contactType = response.contact_type || 'lead';

            const conversation = conversationsWithRelations.find(
              (c) => c.id === response.conversation_id
            );

            // Log outcome to ai_response_outcomes table for adaptive learning
            // Type assertion needed since table isn't in generated Supabase types yet
            // Don't fail the main operation if logging fails
            try {
              await (supabase as any).from('ai_response_outcomes').insert({
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
                initial_confidence: response.confidence,
                suggested_response: response.suggested_response,
                final_response: null,
                outcome: 'rejected',
                edit_severity: 'none',
                response_time_seconds: responseTimeSeconds,
                reviewed_at: reviewedAt,
              });
            } catch (outcomeError) {
              // CRITICAL: Adaptive learning data loss should be tracked
              // TODO: Replace with Sentry/logError when error tracking is set up
              console.error('[AdaptiveLearning] CRITICAL - Failed to log rejection outcome:', {
                error: outcomeError instanceof Error ? outcomeError.message : String(outcomeError),
                stack: outcomeError instanceof Error ? outcomeError.stack : undefined,
                userId: response.user_id,
                conversationId: response.conversation_id,
                outcome: 'rejected',
                context: 'This data loss affects AI learning quality and should be investigated',
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

      // Filter Actions
      setStatusFilter: (status: ConversationStatus | 'all') => {
        set({ statusFilter: status });
      },

      setChannelFilter: (channel: Channel | 'all') => {
        set({ channelFilter: channel });
      },

      // Real-time subscription for conversations and AI queue with retry logic
      subscribeToConversations: (userId: string) => {
        const { isSubscribed, isSubscribing } = get();
        if (isSubscribed || isSubscribing) {
          // Already subscribed or subscription in progress, return no-op cleanup
          return () => {};
        }

        // Set guard immediately to prevent race conditions from multiple callers
        set({ isSubscribing: true });

        let retryCount = 0;
        const maxRetries = 3;
        const baseDelay = 2000;
        let currentChannel: ReturnType<typeof supabase.channel> | null = null;
        let isCleanedUp = false;
        let lastSubscribedAt = 0;
        let rapidFailureCount = 0;
        let useFilters = true; // Start with filters, fall back to no filters if mismatch

        const subscribe = () => {
          if (isCleanedUp) return;

          // Build channel configuration
          // Note: If filters cause "mismatch" errors, we fall back to no filters
          // and filter on the client side instead. This requires Realtime to be
          // enabled for the tables in Supabase Dashboard (Database > Replication).
          const channelConfig = useFilters
            ? {
                conversationFilter: `user_id=eq.${userId}`,
                queueFilter: `user_id=eq.${userId}`,
              }
            : {
                // No filters - will receive all changes and filter client-side
                conversationFilter: undefined,
                queueFilter: undefined,
              };

          const channelBuilder = supabase.channel('rental-conversations-changes');

          // Add conversation changes listener
          if (channelConfig.conversationFilter) {
            channelBuilder.on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'rental_conversations',
                filter: channelConfig.conversationFilter,
              },
              async (payload) => {
                if (isCleanedUp) return;
                if (__DEV__) {
                  console.log('[Real-time] Conversation change:', payload.eventType);
                }
                try {
                  await get().fetchConversations();
                } catch {
                  // Silently fail - user can pull to refresh
                }
              }
            );
          } else {
            channelBuilder.on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'rental_conversations',
              },
              async (payload) => {
                if (isCleanedUp) return;
                // Client-side filter when not using server filters
                const record = payload.new as Record<string, unknown>;
                if (record?.user_id !== userId) return;

                if (__DEV__) {
                  console.log('[Real-time] Conversation change:', payload.eventType);
                }
                try {
                  await get().fetchConversations();
                } catch {
                  // Silently fail - user can pull to refresh
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
                table: 'rental_ai_queue',
                filter: channelConfig.queueFilter,
              },
              async (payload) => {
                if (isCleanedUp) return;
                if (__DEV__) {
                  console.log('[Real-time] AI queue change:', payload.eventType);
                }
                try {
                  await get().fetchPendingResponses();
                } catch {
                  // Silently fail - user can pull to refresh
                }
              }
            );
          } else {
            channelBuilder.on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'rental_ai_queue',
              },
              async (payload) => {
                if (isCleanedUp) return;
                // Client-side filter when not using server filters
                const record = payload.new as Record<string, unknown>;
                if (record?.user_id !== userId) return;

                if (__DEV__) {
                  console.log('[Real-time] AI queue change:', payload.eventType);
                }
                try {
                  await get().fetchPendingResponses();
                } catch {
                  // Silently fail - user can pull to refresh
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
                console.log('[Real-time] Subscription active', useFilters ? '(with filters)' : '(without filters)');
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              set({ isSubscribed: false });

              // Check if this is a rapid failure (failed within 5s of subscribing)
              const timeSinceSubscribed = Date.now() - lastSubscribedAt;
              if (lastSubscribedAt > 0 && timeSinceSubscribed < 5000) {
                rapidFailureCount++;
              }

              // Check for mismatch error - indicates server doesn't support our filter config
              const errorMessage = error?.message || String(error) || '';
              const isMismatchError = errorMessage.includes('mismatch');

              // If we get mismatch error with filters, try without filters
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

              // If we're getting rapid failures repeatedly, stop retrying
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

              // Retry with exponential backoff
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

        // Return cleanup function
        return () => {
          isCleanedUp = true;
          if (__DEV__) {
            console.log('[Real-time] Unsubscribing from conversations');
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

        // Prevent duplicate subscriptions for the same conversation
        if (messageSubscriptions.has(conversationId)) {
          if (__DEV__) {
            console.log(`[Real-time] Already subscribed to messages for ${conversationId}`);
          }
          return () => {};
        }

        // Track this subscription
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

          const channelBuilder = supabase.channel(`rental-messages-${conversationId}`);

          if (useFilter) {
            channelBuilder.on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'rental_messages',
                filter: `conversation_id=eq.${conversationId}`,
              },
              (payload) => {
                if (isCleanedUp) return;
                handleNewMessage(payload.new as Record<string, unknown>);
              }
            );
          } else {
            // Without filter - filter client-side
            channelBuilder.on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'rental_messages',
              },
              (payload) => {
                if (isCleanedUp) return;
                const newMessage = payload.new as Record<string, unknown>;
                // Client-side filter
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
              // Check for mismatch error
              const errorMessage = error?.message || String(error) || '';
              const isMismatchError = errorMessage.includes('mismatch');

              // If mismatch with filter, try without
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

              // Retry a couple times
              if (retryCount < maxRetries && !isCleanedUp) {
                retryCount++;
                if (channel) {
                  supabase.removeChannel(channel);
                }
                setTimeout(() => subscribe(), 2000 * retryCount);
                return;
              }

              // Give up - remove from tracking so it can be retried later
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
          // Validate payload before using
          if (!newMessage?.id || !newMessage?.conversation_id || !newMessage?.content) {
            if (__DEV__) {
              console.log('[Real-time] Invalid message payload, skipping');
            }
            return;
          }

          if (__DEV__) {
            console.log('[Real-time] New message received:', newMessage.id);
          }

          // Add new message to local state (prepend since array is sorted newest first)
          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [
                newMessage as unknown as Message,
                ...(state.messages[conversationId] || []).filter(
                  (m) => m.id !== newMessage.id // Avoid duplicates
                ),
              ],
            },
          }));
        };

        subscribe();

        // Return cleanup function
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
      name: 'rental-conversations-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedConversationId: state.selectedConversationId,
      }),
    }
  )
);

// Selectors
export const selectConversations = (state: RentalConversationsState) => state.conversations;
export const selectConversationsWithRelations = (state: RentalConversationsState) =>
  state.conversationsWithRelations;
export const selectSelectedConversation = (state: RentalConversationsState) =>
  state.conversationsWithRelations.find((c) => c.id === state.selectedConversationId);
export const selectMessages = (conversationId: string) => (state: RentalConversationsState) =>
  state.messages[conversationId] || [];
export const selectPendingResponses = (state: RentalConversationsState) => state.pendingResponses;
export const selectPendingCount = (state: RentalConversationsState) => state.pendingResponses.length;
export const selectNeedsReviewConversations = (state: RentalConversationsState) =>
  state.conversationsWithRelations.filter((c) =>
    state.pendingResponses.some((p) => p.conversation_id === c.id)
  );
