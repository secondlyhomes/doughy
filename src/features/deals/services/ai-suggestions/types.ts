// src/features/deals/services/ai-suggestions/types.ts
// Types for AI suggestions service

import type { ActionCategory } from '../../hooks/useNextAction';
import type { Deal } from '../../types';

export interface AISuggestion {
  id: string;
  action: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  category: ActionCategory;
  confidence: number; // 0-100
  source: SuggestionSource;
  metadata?: Record<string, unknown>;
}

export type SuggestionSource =
  | 'conversation_analysis'
  | 'contact_recency'
  | 'stage_pattern'
  | 'sentiment_change'
  | 'action_item'
  | 'time_based';

export interface ConversationContext {
  recentSentiment?: 'positive' | 'neutral' | 'negative';
  keyPhrases: string[];
  actionItems: string[];
  lastContactDate?: string;
  totalConversations: number;
}

export interface SuggestionRequest {
  deal: Deal;
  conversationContext?: ConversationContext;
  maxSuggestions?: number;
}

export interface SuggestionResult {
  success: boolean;
  suggestions: AISuggestion[];
  error?: string;
}

/**
 * Conversation row from database
 * NOTE: Defined here until Supabase types are regenerated after migration
 */
export interface ConversationRow {
  sentiment: string | null;
  key_phrases: string[] | null;
  action_items: string[] | null;
  occurred_at: string | null;
}
