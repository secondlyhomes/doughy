// src/features/deals/services/aiSuggestions.ts
// AI-Powered Suggestions Service - Zone G Week 9
// Generates contextual suggestions based on conversations, deal state, and patterns

import { supabase } from '@/lib/supabase';
import { Deal, DealStage } from '../types';
import { ActionContext, ActionCategory } from '../hooks/useNextAction';

// ============================================
// Types
// ============================================

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

// ============================================
// Suggestion Generators
// ============================================

/**
 * Generate suggestions from action items in conversations
 */
function generateActionItemSuggestions(
  actionItems: string[],
  deal: Deal
): AISuggestion[] {
  if (actionItems.length === 0) return [];

  return actionItems.slice(0, 3).map((item, index) => ({
    id: `action-${deal.id}-${index}`,
    action: item,
    reason: 'Extracted from recent conversation',
    priority: index === 0 ? 'high' : 'medium',
    category: inferCategoryFromText(item) as ActionCategory,
    confidence: 85 - index * 10,
    source: 'action_item' as const,
    metadata: { originalText: item },
  }));
}

/**
 * Generate suggestions based on key phrases
 */
function generateKeyPhraseSuggestions(
  keyPhrases: string[],
  deal: Deal
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // Look for motivation indicators
  const motivationPhrases = ['motivated', 'urgent', 'quick sale', 'need to sell', 'behind on payments'];
  const hasMotivation = keyPhrases.some((p) =>
    motivationPhrases.some((m) => p.toLowerCase().includes(m))
  );

  if (hasMotivation) {
    suggestions.push({
      id: `motivation-${deal.id}`,
      action: 'Seller shows motivation - consider making an offer quickly',
      reason: 'Detected motivation keywords in recent conversations',
      priority: 'high',
      category: 'offer',
      confidence: 80,
      source: 'conversation_analysis',
      metadata: { matchedPhrases: keyPhrases.filter((p) =>
        motivationPhrases.some((m) => p.toLowerCase().includes(m))
      )},
    });
  }

  // Look for repair/condition indicators
  const repairPhrases = ['repairs', 'needs work', 'roof', 'hvac', 'foundation', 'damage'];
  const mentionsRepairs = keyPhrases.some((p) =>
    repairPhrases.some((r) => p.toLowerCase().includes(r))
  );

  if (mentionsRepairs && !deal.property?.repair_cost) {
    suggestions.push({
      id: `repairs-${deal.id}`,
      action: 'Seller mentioned repairs - get detailed estimate',
      reason: 'Repair-related topics discussed but no estimate on file',
      priority: 'medium',
      category: 'walkthrough',
      confidence: 75,
      source: 'conversation_analysis',
      metadata: { matchedPhrases: keyPhrases.filter((p) =>
        repairPhrases.some((r) => p.toLowerCase().includes(r))
      )},
    });
  }

  // Look for price indicators
  const pricePhrases = ['asking', 'price', 'arv', 'value', 'worth', 'owe'];
  const mentionsPrice = keyPhrases.some((p) =>
    pricePhrases.some((pr) => p.toLowerCase().includes(pr))
  );

  if (mentionsPrice && deal.stage === 'analyzing') {
    suggestions.push({
      id: `pricing-${deal.id}`,
      action: 'Review pricing based on seller expectations',
      reason: 'Pricing discussed - ensure underwriting reflects conversation',
      priority: 'medium',
      category: 'underwrite',
      confidence: 70,
      source: 'conversation_analysis',
    });
  }

  return suggestions;
}

/**
 * Generate suggestions based on sentiment trends
 */
function generateSentimentSuggestions(
  sentiment: 'positive' | 'neutral' | 'negative' | undefined,
  deal: Deal
): AISuggestion[] {
  if (!sentiment) return [];

  const suggestions: AISuggestion[] = [];

  if (sentiment === 'negative') {
    if (deal.stage === 'offer_sent' || deal.stage === 'negotiating') {
      suggestions.push({
        id: `sentiment-negative-${deal.id}`,
        action: 'Address seller concerns before continuing negotiation',
        reason: 'Recent conversation showed negative sentiment',
        priority: 'high',
        category: 'contact',
        confidence: 75,
        source: 'sentiment_change',
      });
    } else {
      suggestions.push({
        id: `sentiment-negative-${deal.id}`,
        action: 'Check in with seller to understand concerns',
        reason: 'Recent conversation showed negative sentiment',
        priority: 'medium',
        category: 'contact',
        confidence: 70,
        source: 'sentiment_change',
      });
    }
  }

  if (sentiment === 'positive' && deal.stage === 'analyzing') {
    suggestions.push({
      id: `sentiment-positive-${deal.id}`,
      action: 'Seller is positive - good time to present offer',
      reason: 'Recent conversation showed positive sentiment',
      priority: 'medium',
      category: 'offer',
      confidence: 65,
      source: 'sentiment_change',
    });
  }

  return suggestions;
}

/**
 * Generate suggestions based on contact recency
 */
function generateRecencySuggestions(
  lastContactDate: string | undefined,
  deal: Deal
): AISuggestion[] {
  if (!lastContactDate) return [];

  const daysSince = Math.floor(
    (Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const suggestions: AISuggestion[] = [];

  // Active deal stages need more frequent contact
  const activeStages: DealStage[] = ['contacted', 'appointment_set', 'analyzing', 'offer_sent', 'negotiating'];

  if (activeStages.includes(deal.stage)) {
    if (daysSince >= 7) {
      suggestions.push({
        id: `recency-overdue-${deal.id}`,
        action: `Urgent: No contact in ${daysSince} days - re-engage seller`,
        reason: 'Risk of losing deal momentum',
        priority: 'high',
        category: 'contact',
        confidence: 90,
        source: 'contact_recency',
        metadata: { daysSinceContact: daysSince },
      });
    } else if (daysSince >= 4) {
      suggestions.push({
        id: `recency-warning-${deal.id}`,
        action: `Follow up with seller (${daysSince} days since last contact)`,
        reason: 'Maintain deal momentum',
        priority: 'medium',
        category: 'followup',
        confidence: 75,
        source: 'contact_recency',
        metadata: { daysSinceContact: daysSince },
      });
    }
  }

  return suggestions;
}

/**
 * Generate time-based suggestions
 */
function generateTimeSuggestions(deal: Deal): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // Check if offer follow-up is due
  if (deal.stage === 'offer_sent' && deal.offers && deal.offers.length > 0) {
    const sentOffer = deal.offers.find((o) => o.status === 'sent');
    if (sentOffer?.created_at) {
      const daysSinceSent = Math.floor(
        (Date.now() - new Date(sentOffer.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceSent >= 2 && daysSinceSent < 5) {
        suggestions.push({
          id: `offer-followup-${deal.id}`,
          action: `Follow up on offer (sent ${daysSinceSent} days ago)`,
          reason: 'Standard follow-up timing',
          priority: 'medium',
          category: 'followup',
          confidence: 80,
          source: 'time_based',
          metadata: { daysSinceSent },
        });
      } else if (daysSinceSent >= 5) {
        suggestions.push({
          id: `offer-urgent-${deal.id}`,
          action: `Urgent: Get response on offer (${daysSinceSent} days pending)`,
          reason: 'Offer may be going stale',
          priority: 'high',
          category: 'followup',
          confidence: 85,
          source: 'time_based',
          metadata: { daysSinceSent },
        });
      }
    }
  }

  return suggestions;
}

/**
 * Infer action category from text
 */
function inferCategoryFromText(text: string): ActionCategory {
  const lower = text.toLowerCase();

  if (lower.includes('call') || lower.includes('contact') || lower.includes('reach out')) {
    return 'contact';
  }
  if (lower.includes('walkthrough') || lower.includes('photos') || lower.includes('visit')) {
    return 'walkthrough';
  }
  if (lower.includes('offer') || lower.includes('proposal')) {
    return 'offer';
  }
  if (lower.includes('analyze') || lower.includes('comps') || lower.includes('arv')) {
    return 'analyze';
  }
  if (lower.includes('underwrite') || lower.includes('numbers')) {
    return 'underwrite';
  }
  if (lower.includes('negotiate') || lower.includes('counter')) {
    return 'negotiate';
  }
  if (lower.includes('document') || lower.includes('upload') || lower.includes('sign')) {
    return 'document';
  }
  if (lower.includes('close') || lower.includes('title') || lower.includes('escrow')) {
    return 'close';
  }

  return 'followup';
}

// ============================================
// Main Service Functions
// ============================================

/**
 * Fetch conversation context for a deal
 */
/**
 * Conversation row from database
 * NOTE: Defined here until Supabase types are regenerated after migration
 */
interface ConversationRow {
  sentiment: string | null;
  key_phrases: string[] | null;
  action_items: string[] | null;
  occurred_at: string | null;
}

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
    // Type assertion needed until Supabase types are regenerated after migration
    const queryBuilder = supabase
      .from('conversation_items' as 'profiles')
      .select('sentiment, key_phrases, action_items, occurred_at')
      .order('occurred_at' as 'id', { ascending: false })
      .limit(10);

    if (filters.length > 0) {
      queryBuilder.or(filters.join(','));
    }

    const { data, error } = await (queryBuilder as unknown as Promise<{
      data: ConversationRow[] | null;
      error: Error | null;
    }>);

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
