// src/stores/investor-conversations/types.ts
// Type definitions for RE Investor platform conversations

// Re-export shared types from feature types
export type {
  InvestorChannel,
  InvestorConversationStatus,
  MessageDirection,
  ContentType,
  InvestorSender,
  AIQueueStatus,
} from '@/features/lead-inbox/types/investor-conversations.types';

import type {
  InvestorChannel,
  InvestorConversationStatus,
  ContentType,
  InvestorSender,
  AIQueueStatus,
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
  direction: 'inbound' | 'outbound';
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

// AI Response Queue item interface
export interface InvestorAIQueueItem {
  id: string;
  user_id: string;
  conversation_id: string;
  trigger_message_id: string | null;
  suggested_response: string;
  confidence: number;
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

// AI Confidence tracking
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

// Metadata for approval
export interface ApprovalMetadata {
  editedResponse?: string;
  editSeverity: 'none' | 'minor' | 'major';
  responseTimeSeconds: number;
}

// Related data types
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

export interface PropertyInfo {
  id: string;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
}

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

// Store state interface
export interface InvestorConversationsState {
  // Data
  conversations: InvestorConversation[];
  conversationsWithRelations: InvestorConversationWithRelations[];
  messages: Record<string, InvestorMessage[]>;
  pendingResponses: InvestorAIQueueItem[];
  selectedConversationId: string | null;
  aiConfidence: Record<string, AIConfidenceRecord>;

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
