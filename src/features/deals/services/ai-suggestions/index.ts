// src/features/deals/services/ai-suggestions/index.ts
// AI-Powered Suggestions Service
// Generates contextual suggestions based on conversations, deal state, and patterns

import { supabase } from '@/lib/supabase';

import type { Deal } from '../../types';
import type {
  AISuggestion,
  ConversationContext,
  ConversationRow,
  SuggestionRequest,
  SuggestionResult,
} from './types';
import {
  generateActionItemSuggestions,
  generateKeyPhraseSuggestions,
  generateSentimentSuggestions,
  generateRecencySuggestions,
  generateTimeSuggestions,
} from './generators';

export type {
  AISuggestion,
  SuggestionSource,
  ConversationContext,
  SuggestionRequest,
  SuggestionResult,
} from './types';

/**
 * Fetch conversation context for a deal
 */
export async function fetchConversationContext(
  dealId?: string,
  leadId?: string
): Promise<ConversationContext> {
  try {
    // Build filter conditions
    const filters: string[] = [];
    if (dealId) filters.push(`deal_id.eq.${dealId}`);
    if (leadId) filters.push(`lead_id.eq.${leadId}`);

    // Query recent conversations
    const query = supabase
      .from('conversation_items')
      .select('sentiment, key_phrases, action_items, occurred_at')
      .order('occurred_at', { ascending: false })
      .limit(10);

    if (filters.length > 0) {
      query.or(filters.join(','));
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AISuggestions] Error fetching conversations:', error);
      return { keyPhrases: [], actionItems: [], totalConversations: 0 };
    }

    const conversations = data || [];
    if (conversations.length === 0) {
      return { keyPhrases: [], actionItems: [], totalConversations: 0 };
    }

    // Aggregate context from conversations
    const allKeyPhrases: string[] = [];
    const allActionItems: string[] = [];
    let recentSentiment: 'positive' | 'neutral' | 'negative' | undefined;

    conversations.forEach((conv: ConversationRow, index: number) => {
      if (index === 0 && conv.sentiment) {
        recentSentiment = conv.sentiment as 'positive' | 'neutral' | 'negative';
      }
      if (conv.key_phrases) {
        allKeyPhrases.push(...conv.key_phrases);
      }
      if (conv.action_items) {
        allActionItems.push(...conv.action_items);
      }
    });

    // Deduplicate
    const uniqueKeyPhrases = [...new Set(allKeyPhrases)].slice(0, 10);
    const uniqueActionItems = [...new Set(allActionItems)].slice(0, 5);

    return {
      recentSentiment,
      keyPhrases: uniqueKeyPhrases,
      actionItems: uniqueActionItems,
      lastContactDate: conversations[0]?.occurred_at ?? undefined,
      totalConversations: conversations.length,
    };
  } catch (error) {
    console.error('[AISuggestions] Error in fetchConversationContext:', error);
    return { keyPhrases: [], actionItems: [], totalConversations: 0 };
  }
}

/**
 * Generate AI suggestions for a deal
 */
export async function generateSuggestions(
  request: SuggestionRequest
): Promise<SuggestionResult> {
  try {
    const { deal, conversationContext, maxSuggestions = 5 } = request;

    // Fetch conversation context if not provided
    let context = conversationContext;
    if (!context) {
      context = await fetchConversationContext(deal.id, deal.lead_id);
    }

    // Generate suggestions from various sources
    const allSuggestions: AISuggestion[] = [
      ...generateActionItemSuggestions(context.actionItems, deal),
      ...generateKeyPhraseSuggestions(context.keyPhrases, deal),
      ...generateSentimentSuggestions(context.recentSentiment, deal),
      ...generateRecencySuggestions(context.lastContactDate, deal),
      ...generateTimeSuggestions(deal),
    ];

    // Sort by confidence and priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    allSuggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    // Deduplicate by category (keep highest confidence per category)
    const seenCategories = new Set<string>();
    const uniqueSuggestions = allSuggestions.filter((s) => {
      const key = `${s.category}-${s.source}`;
      if (seenCategories.has(key)) return false;
      seenCategories.add(key);
      return true;
    });

    return {
      success: true,
      suggestions: uniqueSuggestions.slice(0, maxSuggestions),
    };
  } catch (error) {
    console.error('[AISuggestions] Error generating suggestions:', error);
    return {
      success: false,
      suggestions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get suggestions for a deal (convenience wrapper)
 */
export async function getSuggestionsForDeal(deal: Deal): Promise<AISuggestion[]> {
  const result = await generateSuggestions({ deal });
  return result.suggestions;
}

export default {
  generateSuggestions,
  getSuggestionsForDeal,
  fetchConversationContext,
};
