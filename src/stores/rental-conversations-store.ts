// src/stores/rental-conversations-store.ts
// Zustand store for Landlord platform conversations and messages
// Part of Zone 3: UI scaffolding for the Doughy architecture refactor

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Channel and status types based on Contract A from architecture doc
// Channel types matching rental_channel database enum
export type Channel = 'whatsapp' | 'telegram' | 'email' | 'sms' | 'imessage' | 'discord' | 'webchat' | 'phone';
export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'archived';
export type MessageDirection = 'inbound' | 'outbound';
export type ContentType = 'text' | 'image' | 'file' | 'voice' | 'location';
export type SentBy = 'contact' | 'ai' | 'user';
export type AIQueueStatus = 'pending' | 'approved' | 'edited' | 'rejected' | 'expired' | 'auto_sent';

// Conversation interface
export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  property_id: string | null;
  channel: Channel;
  platform: string | null;
  external_thread_id: string | null;
  status: ConversationStatus;
  ai_enabled: boolean;
  last_message_at: string;
  last_ai_response_at: string | null;
  message_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Message interface
export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  content: string;
  content_type: ContentType;
  sent_by: SentBy;
  ai_confidence: number | null;
  ai_model: string | null;
  approved_by: string | null;
  approved_at: string | null;
  original_content: string | null;
  delivered_at: string | null;
  read_at: string | null;
  external_message_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// AI Response Queue item interface
export interface AIResponseQueueItem {
  id: string;
  user_id: string;
  conversation_id: string;
  trigger_message_id: string | null;
  suggested_response: string;
  confidence: number;
  reason: string | null;
  score_breakdown: Record<string, unknown> | null;
  status: AIQueueStatus;
  final_response: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  expires_at: string;
  created_at: string;
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
  approveResponse: (id: string, editedResponse?: string) => Promise<boolean>;
  rejectResponse: (id: string) => Promise<boolean>;

  // Filter actions
  setStatusFilter: (status: ConversationStatus | 'all') => void;
  setChannelFilter: (channel: Channel | 'all') => void;

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
          const { data, error } = await supabase
            .from('rental_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

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

          set((state) => ({
            messages: {
              ...state.messages,
              [conversationId]: [...(state.messages[conversationId] || []), message],
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

      approveResponse: async (id: string, editedResponse?: string) => {
        try {
          const status = editedResponse ? 'edited' : 'approved';
          const updateData: Partial<AIResponseQueueItem> = {
            status,
            reviewed_at: new Date().toISOString(),
          };

          if (editedResponse) {
            updateData.final_response = editedResponse;
          }

          const { error } = await supabase
            .from('rental_ai_queue')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;

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

      rejectResponse: async (id: string) => {
        try {
          const { error } = await supabase
            .from('rental_ai_queue')
            .update({
              status: 'rejected',
              reviewed_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;

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
