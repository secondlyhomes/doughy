// src/stores/rental-conversations/types.ts
// Type definitions for Landlord platform conversations

// Channel and status types matching database enums
export type Channel = 'whatsapp' | 'telegram' | 'email' | 'sms' | 'imessage' | 'discord' | 'webchat' | 'phone';
export type ConversationStatus = 'active' | 'resolved' | 'escalated' | 'archived';
export type MessageDirection = 'inbound' | 'outbound';
export type ContentType = 'text' | 'image' | 'file' | 'voice' | 'video';
export type SentBy = 'contact' | 'ai' | 'user';
export type AIQueueStatus = 'pending' | 'approved' | 'edited' | 'rejected' | 'expired' | 'sent';

/**
 * Conversation for Landlord platform.
 * Matches rental_conversations table schema.
 */
export interface LandlordConversation {
  id: string;
  user_id: string;
  contact_id: string;
  property_id: string | null;
  booking_id: string | null;
  channel: Channel;
  platform: string | null;
  external_thread_id: string | null;
  status: ConversationStatus;
  is_ai_enabled: boolean;
  is_ai_auto_respond: boolean;
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

/**
 * Message for Landlord platform.
 * Matches rental_messages table schema.
 */
export interface LandlordMessage {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  content: string;
  content_type: ContentType;
  sent_by: SentBy;
  ai_confidence: number | null;
  ai_model: string | null;
  ai_prompt_token_count: number | null;
  ai_completion_token_count: number | null;
  is_requires_approval: boolean;
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

// Backward-compatible aliases
/** @deprecated Use LandlordConversation instead */
export type Conversation = LandlordConversation;
/** @deprecated Use LandlordMessage instead */
export type Message = LandlordMessage;

// AI Response Queue item interface
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
  // Additional fields for learning context
  message_type?: string;
  topic?: string;
  contact_type?: string;
}

// Metadata passed with approval for learning
export interface ApprovalMetadata {
  editedResponse?: string;
  editSeverity: 'none' | 'minor' | 'major';
  responseTimeSeconds: number;
}

// Pending send state for delay/undo functionality
export interface PendingSend {
  queueItemId: string;
  conversationId: string;
  messageId: string;
  responseText: string;
  timeoutId: ReturnType<typeof setTimeout>;
  scheduledAt: number;
}

// Send result from lead-response-sender
export interface SendResult {
  success: boolean;
  messageId?: string;
  externalMessageId?: string;
  deliveredAt?: string;
  error?: string;
  requiresManualAction?: boolean;
  warnings?: string[];
}

// Conversation with related data for display
export interface ConversationWithRelations extends LandlordConversation {
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
  lastMessage?: LandlordMessage | null;
  pendingResponse?: AIResponseQueueItem | null;
}

// Store state interface
export interface RentalConversationsState {
  // Data
  conversations: LandlordConversation[];
  conversationsWithRelations: ConversationWithRelations[];
  messages: Record<string, LandlordMessage[]>;
  pendingResponses: AIResponseQueueItem[];
  selectedConversationId: string | null;
  pendingSend: PendingSend | null;

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
  isSubscribing: boolean;
  messageSubscriptions: Set<string>;
  subscriptionError: string | null;

  // Actions - Conversations
  fetchConversations: () => Promise<void>;
  fetchConversationById: (id: string) => Promise<ConversationWithRelations | null>;
  fetchConversationsWithPending: () => Promise<void>;
  setSelectedConversationId: (id: string | null) => void;
  updateConversationStatus: (id: string, status: ConversationStatus) => Promise<boolean>;
  toggleAI: (id: string, enabled: boolean) => Promise<boolean>;

  // Actions - Messages
  fetchMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, contentType?: ContentType) => Promise<LandlordMessage | null>;

  // Actions - AI Queue
  fetchPendingResponses: () => Promise<void>;
  approveResponse: (id: string, metadata: ApprovalMetadata) => Promise<boolean>;
  rejectResponse: (id: string, responseTimeSeconds: number) => Promise<boolean>;
  cancelPendingSend: () => void;

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
