// src/stores/shared/ai-learning.ts
// Shared AI learning outcome logging for both Landlord and Investor conversation stores
// Extracted to reduce duplication and ensure consistent outcome tracking

import { supabase } from '@/lib/supabase';

export type EditSeverity = 'none' | 'minor' | 'major';
export type AIOutcome = 'pending' | 'auto_sent' | 'approved' | 'edited' | 'edited_minor' | 'edited_major' | 'rejected' | 'thumbs_up' | 'thumbs_down';

// Base outcome record interface
export interface AIOutcomeBase {
  user_id: string;
  conversation_id: string | null;
  message_id?: string | null;
  original_response: string;
  final_response: string | null;
  original_confidence: number;
  outcome: AIOutcome;
  edit_severity?: EditSeverity;
  response_time_seconds?: number | null;
  reviewed_at?: string | null;
}

// Landlord-specific outcome fields
export interface LandlordAIOutcome extends AIOutcomeBase {
  property_id?: string | null;
  contact_id?: string | null;
  message_type: string;
  topic: string;
  contact_type: string;
  channel?: string | null;
  platform?: string | null;
  sensitive_topics_detected?: string[];
  actions_suggested?: string[];
}

// Investor-specific outcome fields
export interface InvestorAIOutcome extends AIOutcomeBase {
  queue_item_id?: string;
  lead_situation: string;
  channel?: string | null;
}

/**
 * Log an AI response outcome for adaptive learning (Landlord platform)
 * Uses the ai.response_outcomes table
 *
 * @param outcome - The outcome record to log
 * @returns Promise<boolean> - true if logged successfully, false otherwise
 */
export async function logLandlordAIOutcome(outcome: LandlordAIOutcome): Promise<boolean> {
  try {
    // Type assertion needed since table may not be in generated Supabase types
    await (supabase as unknown as { schema: (name: string) => { from: (table: string) => { insert: (data: LandlordAIOutcome) => Promise<void> } } })
      .schema('ai')
      .from('response_outcomes')
      .insert(outcome);
    return true;
  } catch (error) {
    // CRITICAL: Adaptive learning data loss should be tracked
    // Log with enough context to investigate but don't fail the calling operation
    console.error('[AdaptiveLearning] CRITICAL - Failed to log landlord outcome:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: outcome.user_id,
      conversationId: outcome.conversation_id,
      outcome: outcome.outcome,
      context: 'This data loss affects AI learning quality and should be investigated',
    });
    return false;
  }
}

/**
 * Log an AI response outcome for adaptive learning (Investor platform)
 * Uses the ai.response_outcomes table
 *
 * @param outcome - The outcome record to log
 * @returns Promise<boolean> - true if logged successfully, false otherwise
 */
export async function logInvestorAIOutcome(outcome: InvestorAIOutcome): Promise<boolean> {
  try {
    await supabase.schema('ai').from('response_outcomes').insert(outcome);
    return true;
  } catch (error) {
    // CRITICAL: Adaptive learning data loss should be tracked
    console.error('[AdaptiveLearning] CRITICAL - Failed to log investor outcome:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: outcome.user_id,
      conversationId: outcome.conversation_id,
      outcome: outcome.outcome,
      context: 'This data loss affects AI learning quality and should be investigated',
    });
    return false;
  }
}

/**
 * Calculate edit severity based on original and edited response
 *
 * @param original - Original AI-generated response
 * @param edited - User-edited response
 * @returns EditSeverity - 'none' | 'minor' | 'major'
 */
export function calculateEditSeverity(original: string, edited: string | undefined): EditSeverity {
  if (!edited) return 'none';
  if (original === edited) return 'none';

  const originalLength = original.length;
  const editedLength = edited.length;
  const lengthDiff = Math.abs(originalLength - editedLength);
  const lengthChangeRatio = lengthDiff / Math.max(originalLength, 1);

  // Major edit: > 50% length change or complete rewrite
  if (lengthChangeRatio > 0.5) return 'major';

  // Check for word-level similarity
  const originalWords = new Set(original.toLowerCase().split(/\s+/));
  const editedWords = new Set(edited.toLowerCase().split(/\s+/));
  const commonWords = [...originalWords].filter((w) => editedWords.has(w));
  const similarityRatio = commonWords.length / Math.max(originalWords.size, 1);

  // Major edit: < 40% word similarity
  if (similarityRatio < 0.4) return 'major';

  // Minor edit: everything else
  return 'minor';
}
