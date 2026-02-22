// src/features/assistant/actions/handlers/index.ts
// Action handlers that generate PatchSets for AI-proposed changes

import { Deal } from '@/features/deals/types';
import { Property } from '@/features/real-estate/types';
import {
  ActionId,
  ActionHandlerInput,
  ActionHandlerResult,
} from '../catalog';

// Re-export all handlers from domain files
export {
  handleUpdateStage,
  handleSetNextAction,
  handleCreateTask,
  handleAddNote,
} from './dealHandlers';

export {
  handleSummarizeEvent,
  handleExtractFacts,
  handleRunUnderwriteCheck,
} from './analysisHandlers';

export {
  handleUpdateAssumption,
  handleGenerateSellerReport,
  handleGenerateOfferPacket,
  handleDraftCounterText,
  handlePrepareEsignEnvelope,
} from './underwritingHandlers';

// Import handlers for registry
import {
  handleUpdateStage,
  handleSetNextAction,
  handleCreateTask,
  handleAddNote,
} from './dealHandlers';

import {
  handleSummarizeEvent,
  handleExtractFacts,
  handleRunUnderwriteCheck,
} from './analysisHandlers';

import {
  handleUpdateAssumption,
  handleGenerateSellerReport,
  handleGenerateOfferPacket,
  handleDraftCounterText,
  handlePrepareEsignEnvelope,
} from './underwritingHandlers';

// ============================================
// Handler Context (passed to all handlers)
// ============================================

export interface HandlerContext {
  deal: Deal;
  property?: Property;
  userId?: string;
}

// ============================================
// Handler Type
// ============================================

export type ActionHandler = (
  input: ActionHandlerInput,
  context: HandlerContext
) => Promise<ActionHandlerResult>;

// ============================================
// Handler Registry
// ============================================

const HANDLER_REGISTRY: Record<ActionId, ActionHandler> = {
  update_stage: handleUpdateStage,
  set_next_action: handleSetNextAction,
  create_task: handleCreateTask,
  add_note: handleAddNote,
  summarize_event: handleSummarizeEvent,
  extract_facts: handleExtractFacts,
  run_underwrite_check: handleRunUnderwriteCheck,
  update_assumption: handleUpdateAssumption,
  generate_seller_report: handleGenerateSellerReport,
  generate_offer_packet: handleGenerateOfferPacket,
  draft_counter_text: handleDraftCounterText,
  prepare_esign_envelope: handlePrepareEsignEnvelope,
};

// ============================================
// Main Dispatcher
// ============================================

/**
 * Execute an action handler
 */
export async function executeAction(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const handler = HANDLER_REGISTRY[input.actionId];

  if (!handler) {
    return {
      success: false,
      error: `Unknown action: ${input.actionId}`,
    };
  }

  try {
    return await handler(input, context);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Handler execution failed',
    };
  }
}

/**
 * Check if an action has a handler
 */
export function hasHandler(actionId: ActionId): boolean {
  return actionId in HANDLER_REGISTRY;
}

export default executeAction;
