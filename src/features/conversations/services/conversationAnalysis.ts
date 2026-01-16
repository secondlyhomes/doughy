// src/features/conversations/services/conversationAnalysis.ts
// AI Conversation Analysis Service - Zone G Week 8
// Analyzes conversations for sentiment, key phrases, and action items

import { supabase } from '@/lib/supabase';

// ============================================
// Types
// ============================================

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface ConversationAnalysis {
  sentiment: Sentiment;
  keyPhrases: string[];
  actionItems: string[];
  summary: string;
}

export interface AnalysisResult {
  success: boolean;
  analysis?: ConversationAnalysis;
  error?: string;
}

// ============================================
// Analysis Prompts
// ============================================

const ANALYSIS_SYSTEM_PROMPT = `You are an AI assistant analyzing real estate conversations.
Analyze the following conversation and extract:
1. Sentiment (positive, neutral, or negative)
2. Key phrases (important topics, numbers, names, addresses mentioned)
3. Action items (follow-up tasks mentioned or implied)
4. A brief summary (1-2 sentences)

Return ONLY a JSON object with this structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "keyPhrases": ["phrase1", "phrase2"],
  "actionItems": ["action1", "action2"],
  "summary": "Brief summary of the conversation"
}

Focus on real estate-specific context:
- Property details (address, price, ARV, repairs)
- Seller motivation and timeline
- Deal terms and negotiations
- Follow-up requirements`;

// ============================================
// Service Functions
// ============================================

/**
 * Analyze a conversation using AI
 * Calls the OpenAI edge function via Supabase
 */
export async function analyzeConversation(content: string): Promise<AnalysisResult> {
  try {
    if (!content || content.trim().length < 10) {
      return {
        success: false,
        error: 'Content too short to analyze',
      };
    }

    // Call the OpenAI edge function
    const { data, error } = await supabase.functions.invoke('openai', {
      body: {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      },
    });

    if (error) {
      console.error('[ConversationAnalysis] Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to analyze conversation',
      };
    }

    // Parse the response
    const response = data?.choices?.[0]?.message?.content;
    if (!response) {
      return {
        success: false,
        error: 'No response from AI',
      };
    }

    // Safely parse JSON with specific error handling
    let analysis: ConversationAnalysis;
    try {
      analysis = JSON.parse(response);
    } catch (parseError) {
      console.error('[ConversationAnalysis] JSON parse error:', parseError);
      return {
        success: false,
        error: 'Failed to parse AI response as JSON',
      };
    }

    // Validate the response structure
    if (!analysis.sentiment || !Array.isArray(analysis.keyPhrases) || !Array.isArray(analysis.actionItems)) {
      return {
        success: false,
        error: 'Invalid response structure from AI',
      };
    }

    return {
      success: true,
      analysis,
    };
  } catch (err) {
    console.error('[ConversationAnalysis] Error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Analyze a conversation and update the database record
 */
export async function analyzeAndUpdateConversation(conversationId: string, content: string): Promise<boolean> {
  try {
    const result = await analyzeConversation(content);

    if (!result.success || !result.analysis) {
      console.warn('[ConversationAnalysis] Analysis failed for:', conversationId);
      return false;
    }

    // Update the conversation item with analysis results
    // Type assertion needed until Supabase types are regenerated after migration
    const { error } = await (supabase
      .from('conversation_items' as 'profiles')
      .update({
        sentiment: result.analysis.sentiment,
        key_phrases: result.analysis.keyPhrases,
        action_items: result.analysis.actionItems,
        ai_summary: result.analysis.summary,
      } as Record<string, unknown>)
      .eq('id', conversationId) as unknown as Promise<{ error: Error | null }>);

    if (error) {
      console.error('[ConversationAnalysis] Failed to update record:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[ConversationAnalysis] Error updating conversation:', err);
    return false;
  }
}

/**
 * Batch analyze unprocessed conversations
 * Called by background job
 */
export async function analyzeUnprocessedConversations(limit = 10): Promise<number> {
  try {
    // Get conversations that haven't been analyzed yet
    // Type assertion needed until Supabase types are regenerated after migration
    interface UnprocessedConversation {
      id: string;
      content: string | null;
      transcript: string | null;
    }
    const { data: conversations, error } = await (supabase
      .from('conversation_items' as 'profiles')
      .select('id, content, transcript')
      .is('sentiment', null)
      .not('content', 'is', null)
      .limit(limit) as unknown as Promise<{
        data: UnprocessedConversation[] | null;
        error: Error | null;
      }>);

    if (error) {
      console.error('[ConversationAnalysis] Failed to fetch unprocessed:', error);
      return 0;
    }

    if (!conversations || conversations.length === 0) {
      return 0;
    }

    let successCount = 0;

    for (const conv of conversations) {
      const content: string | null = conv.content || conv.transcript;
      if (!content) continue;

      const success = await analyzeAndUpdateConversation(conv.id, content);
      if (success) {
        successCount++;
      }

      // Rate limit: wait 1 second between API calls
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return successCount;
  } catch (err) {
    console.error('[ConversationAnalysis] Batch analysis error:', err);
    return 0;
  }
}

/**
 * Get sentiment color for UI display
 */
export function getSentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'positive':
      return '#10B981'; // success/green
    case 'negative':
      return '#EF4444'; // destructive/red
    default:
      return '#6B7280'; // muted/gray
  }
}

/**
 * Get sentiment label for UI display
 */
export function getSentimentLabel(sentiment: Sentiment): string {
  switch (sentiment) {
    case 'positive':
      return 'Positive';
    case 'negative':
      return 'Negative';
    default:
      return 'Neutral';
  }
}

export default {
  analyzeConversation,
  analyzeAndUpdateConversation,
  analyzeUnprocessedConversations,
  getSentimentColor,
  getSentimentLabel,
};
