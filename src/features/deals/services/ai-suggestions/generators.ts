// src/features/deals/services/ai-suggestions/generators.ts
// Suggestion generator functions

import type { Deal, DealStage } from '../../types';
import type { ActionCategory } from '../../hooks/useNextAction';
import type { AISuggestion } from './types';
import { inferCategoryFromText } from './utils';

/**
 * Generate suggestions from action items in conversations
 */
export function generateActionItemSuggestions(
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
export function generateKeyPhraseSuggestions(
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
export function generateSentimentSuggestions(
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
export function generateRecencySuggestions(
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
export function generateTimeSuggestions(deal: Deal): AISuggestion[] {
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
