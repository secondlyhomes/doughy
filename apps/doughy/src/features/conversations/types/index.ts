// Conversation types for React Native
// Zone D: Conversations feature

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  last_message?: string;
  last_message_at?: string;
  message_count: number;
  is_archived?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ConversationContext {
  property_id?: string;
  lead_id?: string;
  topic?: string;
}
