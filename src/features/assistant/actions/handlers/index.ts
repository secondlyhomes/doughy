// src/features/assistant/actions/handlers/index.ts
// Action handlers that generate PatchSets for AI-proposed changes

import { Deal, DealStage, DEAL_STAGE_CONFIG, getNextStages } from '@/features/deals/types';
import { Property } from '@/features/real-estate/types';
import {
  ActionId,
  ActionHandlerInput,
  ActionHandlerResult,
  ACTION_CATALOG,
  buildStageUpdatePatchSet,
  buildAssumptionUpdatePatchSet,
  buildAddNotePatchSet,
} from '../catalog';
import {
  PatchSet,
  createEmptyPatchSet,
  addOperation,
  addTimelineEvent,
} from '../../types/patchset';
import { CreateJobInput } from '../../types/jobs';

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
// Individual Handlers
// ============================================

/**
 * Update Stage Handler
 * Advances or changes the deal pipeline stage
 */
export async function handleUpdateStage(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  // Get target stage from params or suggest next logical stage
  let newStage = params?.newStage as DealStage | undefined;

  if (!newStage) {
    // Auto-suggest the next stage in pipeline
    const nextStages = getNextStages(deal.stage);
    if (nextStages.length === 0) {
      return {
        success: false,
        error: 'Deal is already at final stage',
      };
    }
    newStage = nextStages[0]; // Suggest first available next stage
  }

  // Validate stage transition
  const validNextStages = getNextStages(deal.stage);
  if (!validNextStages.includes(newStage) && newStage !== deal.stage) {
    // Allow any stage change, but note if it's non-standard
    const rationale = params?.rationale as string ||
      `Moving from ${DEAL_STAGE_CONFIG[deal.stage]?.label || deal.stage} to ${DEAL_STAGE_CONFIG[newStage]?.label || newStage}`;

    const patchSet = buildStageUpdatePatchSet(
      deal.id,
      deal.stage,
      newStage,
      rationale + ' (non-standard transition)'
    );

    return { success: true, patchSet };
  }

  const rationale = params?.rationale as string ||
    `Advancing deal to ${DEAL_STAGE_CONFIG[newStage]?.label || newStage}`;

  const patchSet = buildStageUpdatePatchSet(
    deal.id,
    deal.stage,
    newStage,
    rationale
  );

  return { success: true, patchSet };
}

/**
 * Set Next Action Handler
 * Updates the deal's next action with optional due date
 */
export async function handleSetNextAction(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const nextAction = params?.nextAction as string;
  const dueDate = params?.dueDate as string | undefined;

  if (!nextAction) {
    return {
      success: false,
      error: 'Next action text is required',
    };
  }

  let patchSet = createEmptyPatchSet(
    `Set next action: ${nextAction}`,
    { dealId: deal.id, actionId: 'set_next_action', confidence: 'high' }
  );

  const afterValue: Record<string, unknown> = { next_action: nextAction };
  if (dueDate) {
    afterValue.next_action_due = dueDate;
  }

  patchSet = addOperation(patchSet, {
    op: 'update',
    entity: 'Deal',
    id: deal.id,
    before: {
      next_action: deal.next_action,
      next_action_due: deal.next_action_due,
    },
    after: afterValue,
    rationale: params?.rationale as string || 'Setting next action for deal progression',
  });

  patchSet = addTimelineEvent(patchSet, {
    type: 'next_action_set',
    title: nextAction,
    description: dueDate ? `Due: ${dueDate}` : undefined,
  });

  return { success: true, patchSet };
}

/**
 * Create Task Handler
 * Creates a task linked to the deal
 */
export async function handleCreateTask(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const title = params?.title as string;
  const description = params?.description as string | undefined;
  const dueDate = params?.dueDate as string | undefined;

  if (!title) {
    return {
      success: false,
      error: 'Task title is required',
    };
  }

  let patchSet = createEmptyPatchSet(
    `Create task: ${title}`,
    { dealId: deal.id, actionId: 'create_task', confidence: 'high' }
  );

  patchSet = addOperation(patchSet, {
    op: 'create',
    entity: 'Task',
    after: {
      title,
      description,
      due_date: dueDate,
      deal_id: deal.id,
      status: 'pending',
    },
    rationale: params?.rationale as string || 'Creating task for deal follow-up',
  });

  return { success: true, patchSet };
}

/**
 * Add Note Handler
 * Adds a note to the deal timeline
 */
export async function handleAddNote(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const content = params?.content as string;

  if (!content) {
    return {
      success: false,
      error: 'Note content is required',
    };
  }

  const patchSet = buildAddNotePatchSet(deal.id, content);

  return { success: true, patchSet };
}

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

/**
 * Update Assumption Handler
 * Changes an underwriting assumption with rationale
 */
export async function handleUpdateAssumption(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const field = params?.field as string;
  const newValue = params?.newValue as number;
  const oldValue = params?.oldValue as number;
  const rationale = params?.rationale as string;

  if (!field || newValue === undefined) {
    return {
      success: false,
      error: 'Field and new value are required',
    };
  }

  const patchSet = buildAssumptionUpdatePatchSet(
    deal.id,
    field,
    oldValue || 0,
    newValue,
    rationale || `Updating ${field} to ${newValue}`,
    params?.sourceEventId as string | undefined
  );

  return { success: true, patchSet };
}

/**
 * Generate Seller Report Handler (Long-running job)
 * Creates transparent options report for the seller
 */
export async function handleGenerateSellerReport(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal, property } = context;

  // Validate we have enough data
  if (!property?.arv || !property?.purchase_price) {
    return {
      success: false,
      error: 'Cannot generate seller report: missing ARV or purchase price',
    };
  }

  return {
    success: true,
    jobInput: {
      deal_id: deal.id,
      job_type: 'generate_seller_report',
      input_json: {
        deal_id: deal.id,
        property_id: property.id,
        include_options: ['cash', 'creative', 'list'],
        arv: property.arv,
        repair_cost: property.repair_cost,
        purchase_price: property.purchase_price,
      },
    },
  };
}

/**
 * Generate Offer Packet Handler (Long-running job)
 * Creates offer document with terms and disclosures
 */
export async function handleGenerateOfferPacket(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal, property } = context;
  const { params } = input;

  const offerType = params?.offerType as string || 'cash';
  const offerAmount = params?.offerAmount as number || property?.purchase_price;

  if (!offerAmount) {
    return {
      success: false,
      error: 'Cannot generate offer packet: no offer amount specified',
    };
  }

  return {
    success: true,
    jobInput: {
      deal_id: deal.id,
      job_type: 'generate_offer_packet',
      input_json: {
        deal_id: deal.id,
        offer_type: offerType,
        offer_amount: offerAmount,
        include_disclosures: true,
      },
    },
  };
}

/**
 * Draft Counter Text Handler (Stub - requires AI)
 * Drafts negotiation response text
 */
export async function handleDraftCounterText(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const counterAmount = params?.counterAmount as number;
  const tone = params?.tone as string || 'professional';

  // TODO: Call AI endpoint to generate counter text
  // For now, return a template
  const template = `Thank you for your offer on the property. After careful consideration, we would like to counter at $${counterAmount?.toLocaleString() || '[AMOUNT]'}.

This price reflects [RATIONALE].

We remain committed to finding a solution that works for both parties and look forward to your response.`;

  return {
    success: true,
    content: template,
  };
}

/**
 * Prepare E-Sign Envelope Handler (Long-running job)
 * Sets up DocuSign envelope with field mapping
 */
export async function handlePrepareEsignEnvelope(
  input: ActionHandlerInput,
  context: HandlerContext
): Promise<ActionHandlerResult> {
  const { deal } = context;
  const { params } = input;

  const documentType = params?.documentType as string || 'purchase_agreement';

  return {
    success: true,
    jobInput: {
      deal_id: deal.id,
      job_type: 'prepare_esign_envelope',
      input_json: {
        deal_id: deal.id,
        document_type: documentType,
      },
    },
  };
}

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
