// src/features/assistant/actions/handlers/analysisHandlers.ts
// Analysis and AI handlers: summarization, fact extraction, underwrite checks

import {
  ActionHandlerInput,
  ActionHandlerResult,
} from '../catalog';
import type { HandlerContext } from './index';

/**
 * Summarize Event Handler (Stub - requires AI)
 * Creates an AI summary card for a timeline event
 */
export async function handleSummarizeEvent(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { params } = input;
  const eventId = params?.eventId as string;

  if (!eventId) {
    return {
      success: false,
      error: 'Event ID is required for summarization',
    };
  }

  // TODO: Call AI endpoint to generate summary
  // For now, return a stub response
  return {
    success: true,
    content: 'AI summarization not yet implemented. This will generate a concise summary of the selected event.',
  };
}

/**
 * Extract Facts Handler (Long-running job)
 * Pulls stated facts from conversations
 */
export async function handleExtractFacts(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;

  // Return typed jobInput - caller will create the job
  return {
    success: true,
    jobInput: {
      deal_id: deal.id,
      job_type: 'extract_facts',
      input_json: {
        deal_id: deal.id,
        event_ids: input.params?.eventIds || [],
      },
    },
  };
}

/**
 * Run Underwrite Check Handler
 * Checks for missing info and unusual numbers
 */
export async function handleRunUnderwriteCheck(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal, property } = context;

  // Analyze the deal/property for issues
  const issues: string[] = [];
  const suggestions: Array<{ field: string; value: number; rationale: string }> = [];

  // Check for missing critical data
  if (!property?.arv) {
    issues.push('Missing ARV (After Repair Value)');
  }
  if (!property?.repair_cost) {
    issues.push('Missing repair cost estimate');
  }
  if (!property?.purchase_price) {
    issues.push('Missing purchase price');
  }

  // Check for unusual values
  if (property?.arv && property?.purchase_price) {
    const ratio = property.purchase_price / property.arv;
    if (ratio > 0.85) {
      issues.push(`Purchase price is ${Math.round(ratio * 100)}% of ARV - typical max is 70-75%`);
    }
  }

  if (property?.repair_cost && property?.arv) {
    const repairRatio = property.repair_cost / property.arv;
    if (repairRatio > 0.4) {
      issues.push(`Repairs are ${Math.round(repairRatio * 100)}% of ARV - unusually high`);
    }
  }

  // Build response content
  const content = {
    issueCount: issues.length,
    issues,
    suggestions,
    recommendation: issues.length === 0
      ? 'Underwriting looks complete. Ready to proceed.'
      : `Found ${issues.length} item(s) to review before proceeding.`,
  };

  return {
    success: true,
    content: JSON.stringify(content, null, 2),
  };
}
