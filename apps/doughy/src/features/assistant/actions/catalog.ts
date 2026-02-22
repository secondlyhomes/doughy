// src/features/assistant/actions/catalog.ts
// Action catalog defining all AI-proposable actions

import { DealStage, DealStrategy } from '@/features/deals/types';
import { ActionCategory } from '@/features/deals/hooks/useNextAction';
import { PatchSet, PatchEntity, Confidence, createEmptyPatchSet, addOperation, addTimelineEvent } from '../types/patchset';
import { AIJobType } from '../types/jobs';

/**
 * Action IDs
 */
export type ActionId =
  | 'update_stage'
  | 'set_next_action'
  | 'create_task'
  | 'add_note'
  | 'summarize_event'
  | 'extract_facts'
  | 'run_underwrite_check'
  | 'update_assumption'
  | 'generate_seller_report'
  | 'generate_offer_packet'
  | 'draft_counter_text'
  | 'prepare_esign_envelope';

/**
 * Action definition
 */
export interface ActionDefinition {
  id: ActionId;
  label: string;
  description: string;
  icon: string;
  category: 'deal' | 'underwrite' | 'offer' | 'docs';
  /** Whether this action requires user confirmation before executing */
  requiresConfirmation: boolean;
  /** Whether this action runs as a background job */
  isLongRunning: boolean;
  /** If long-running, what job type does it create */
  jobType?: AIJobType;
  /** Action categories from NBA engine that this action addresses */
  addressesCategories?: ActionCategory[];
  /** Stages where this action is most relevant */
  relevantStages?: DealStage[];
  /** Minimum user plan required */
  requiredPlan?: 'starter' | 'pro' | 'elite';
}

/**
 * Action handler input
 */
export interface ActionHandlerInput {
  actionId: ActionId;
  dealId: string;
  /** Additional parameters specific to the action */
  params?: Record<string, unknown>;
}

/**
 * Action handler result
 */
export interface ActionHandlerResult {
  success: boolean;
  /** If immediate action, the PatchSet to preview */
  patchSet?: PatchSet;
  /** If long-running action, the job input to create */
  jobInput?: {
    deal_id?: string;
    job_type: AIJobType;
    input_json?: Record<string, unknown>;
  };
  /** If long-running action, the job ID (after creation) */
  jobId?: string;
  /** Generated content (e.g., draft text, analysis) */
  content?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Action catalog
 */
export const ACTION_CATALOG: Record<ActionId, ActionDefinition> = {
  // ============================================
  // Deal-level Actions
  // ============================================

  update_stage: {
    id: 'update_stage',
    label: 'Update Stage',
    description: 'Advance or change the deal pipeline stage',
    icon: 'git-branch',
    category: 'deal',
    requiresConfirmation: true,
    isLongRunning: false,
    addressesCategories: ['close', 'followup'],
    relevantStages: ['new', 'contacted', 'appointment_set', 'analyzing', 'offer_sent', 'negotiating', 'under_contract'],
  },

  set_next_action: {
    id: 'set_next_action',
    label: 'Set Next Action',
    description: 'Set or update the next action with optional due date',
    icon: 'target',
    category: 'deal',
    requiresConfirmation: true,
    isLongRunning: false,
    addressesCategories: ['contact', 'followup'],
  },

  create_task: {
    id: 'create_task',
    label: 'Create Task',
    description: 'Add a task to your inbox linked to this deal',
    icon: 'check-square',
    category: 'deal',
    requiresConfirmation: true,
    isLongRunning: false,
    addressesCategories: ['document', 'followup'],
  },

  add_note: {
    id: 'add_note',
    label: 'Add Note',
    description: 'Add a structured note to the deal timeline',
    icon: 'message-square',
    category: 'deal',
    requiresConfirmation: false,
    isLongRunning: false,
  },

  summarize_event: {
    id: 'summarize_event',
    label: 'Summarize Event',
    description: 'Create an AI summary card for a timeline event',
    icon: 'file-text',
    category: 'deal',
    requiresConfirmation: false,
    isLongRunning: false,
    requiredPlan: 'pro',
  },

  extract_facts: {
    id: 'extract_facts',
    label: 'Extract Facts',
    description: 'Pull stated facts from conversations and flag inconsistencies',
    icon: 'search',
    category: 'deal',
    requiresConfirmation: true,
    isLongRunning: true,
    jobType: 'extract_facts',
    requiredPlan: 'pro',
  },

  // ============================================
  // Underwrite/Offer Actions
  // ============================================

  run_underwrite_check: {
    id: 'run_underwrite_check',
    label: 'Run Underwrite Check',
    description: 'Check for missing info, unusual numbers, and suggest defaults',
    icon: 'calculator',
    category: 'underwrite',
    requiresConfirmation: false,
    isLongRunning: false,
    addressesCategories: ['analyze', 'underwrite'],
    relevantStages: ['analyzing'],
  },

  update_assumption: {
    id: 'update_assumption',
    label: 'Update Assumption',
    description: 'Change an underwriting assumption with rationale',
    icon: 'sliders',
    category: 'underwrite',
    requiresConfirmation: true,
    isLongRunning: false,
    addressesCategories: ['underwrite'],
    relevantStages: ['analyzing', 'offer_sent', 'negotiating'],
  },

  generate_seller_report: {
    id: 'generate_seller_report',
    label: 'Generate Seller Report',
    description: 'Create transparent options report for the seller',
    icon: 'share-2',
    category: 'offer',
    requiresConfirmation: true,
    isLongRunning: true,
    jobType: 'generate_seller_report',
    addressesCategories: ['offer', 'document'],
    relevantStages: ['analyzing', 'offer_sent', 'negotiating'],
  },

  generate_offer_packet: {
    id: 'generate_offer_packet',
    label: 'Generate Offer Packet',
    description: 'Create offer document with terms and disclosures',
    icon: 'file-plus',
    category: 'offer',
    requiresConfirmation: true,
    isLongRunning: true,
    jobType: 'generate_offer_packet',
    addressesCategories: ['offer'],
    relevantStages: ['analyzing'],
  },

  draft_counter_text: {
    id: 'draft_counter_text',
    label: 'Draft Counter',
    description: 'Draft negotiation response text (copy-only)',
    icon: 'message-circle',
    category: 'offer',
    requiresConfirmation: false,
    isLongRunning: false,
    addressesCategories: ['negotiate'],
    relevantStages: ['negotiating'],
    requiredPlan: 'pro',
  },

  // ============================================
  // Docs/Closing Actions
  // ============================================

  prepare_esign_envelope: {
    id: 'prepare_esign_envelope',
    label: 'Prepare E-Sign',
    description: 'Set up DocuSign envelope with field mapping',
    icon: 'pen-tool',
    category: 'docs',
    requiresConfirmation: true,
    isLongRunning: true,
    jobType: 'prepare_esign_envelope',
    addressesCategories: ['document', 'close'],
    relevantStages: ['under_contract'],
    requiredPlan: 'elite',
  },
};

/**
 * Get all actions as an array
 */
export function getAllActions(): ActionDefinition[] {
  return Object.values(ACTION_CATALOG);
}

/**
 * Get actions by category
 */
export function getActionsByCategory(category: ActionDefinition['category']): ActionDefinition[] {
  return getAllActions().filter(action => action.category === category);
}

/**
 * Get actions relevant to a deal stage
 */
export function getActionsForStage(stage: DealStage): ActionDefinition[] {
  return getAllActions().filter(
    action => !action.relevantStages || action.relevantStages.includes(stage)
  );
}

/**
 * Get actions that address a specific NBA category
 */
export function getActionsForNBACategory(nbaCategory: ActionCategory): ActionDefinition[] {
  return getAllActions().filter(
    action => action.addressesCategories?.includes(nbaCategory)
  );
}

/**
 * Check if user's plan allows an action
 */
export function canUserExecuteAction(
  actionId: ActionId,
  userPlan: 'starter' | 'pro' | 'elite'
): boolean {
  const action = ACTION_CATALOG[actionId];
  if (!action.requiredPlan) return true;

  const planHierarchy = { starter: 0, pro: 1, elite: 2 };
  return planHierarchy[userPlan] >= planHierarchy[action.requiredPlan];
}

/**
 * Get recommended actions for current context
 */
export function getRecommendedActions(context: {
  stage: DealStage;
  nbaCategory?: ActionCategory;
  userPlan: 'starter' | 'pro' | 'elite';
  missingInfo?: string[];
}): ActionDefinition[] {
  const { stage, nbaCategory, userPlan, missingInfo } = context;

  // Start with stage-relevant actions
  let actions = getActionsForStage(stage);

  // Filter by NBA category if provided
  if (nbaCategory) {
    const categoryActions = getActionsForNBACategory(nbaCategory);
    if (categoryActions.length > 0) {
      // Prioritize actions that match the NBA category
      actions = [
        ...categoryActions,
        ...actions.filter(a => !categoryActions.includes(a)),
      ];
    }
  }

  // Filter by user plan
  actions = actions.filter(action => canUserExecuteAction(action.id, userPlan));

  // If missing info, prioritize underwrite check
  if (missingInfo && missingInfo.length > 0) {
    const underwriteCheck = actions.find(a => a.id === 'run_underwrite_check');
    if (underwriteCheck) {
      actions = [underwriteCheck, ...actions.filter(a => a.id !== 'run_underwrite_check')];
    }
  }

  return actions.slice(0, 6); // Return top 6 recommendations
}

// ============================================
// PatchSet Builders (helpers for action handlers)
// ============================================

/**
 * Build PatchSet for stage update
 */
export function buildStageUpdatePatchSet(
  dealId: string,
  currentStage: DealStage,
  newStage: DealStage,
  rationale: string
): PatchSet {
  let patchSet = createEmptyPatchSet(
    `Update deal stage from ${currentStage} to ${newStage}`,
    { dealId, actionId: 'update_stage', confidence: 'high' }
  );

  patchSet = addOperation(patchSet, {
    op: 'update',
    entity: 'Deal',
    id: dealId,
    before: { stage: currentStage },
    after: { stage: newStage },
    rationale,
  });

  patchSet = addTimelineEvent(patchSet, {
    type: 'stage_change',
    title: `Stage changed to ${newStage}`,
  });

  return patchSet;
}

/**
 * Build PatchSet for assumption update
 */
export function buildAssumptionUpdatePatchSet(
  dealId: string,
  field: string,
  oldValue: number,
  newValue: number,
  rationale: string,
  sourceEventId?: string
): PatchSet {
  let patchSet = createEmptyPatchSet(
    `Update ${field} from ${oldValue} to ${newValue}`,
    { dealId, actionId: 'update_assumption', confidence: 'med' }
  );

  patchSet = addOperation(patchSet, {
    op: 'update',
    entity: 'DealAssumption',
    fieldPath: field,
    before: { value: oldValue },
    after: { value: newValue },
    rationale,
    source: sourceEventId,
  });

  patchSet = addTimelineEvent(patchSet, {
    type: 'assumption_updated',
    title: `${field} updated to ${newValue}`,
    description: rationale,
  });

  return patchSet;
}

/**
 * Build PatchSet for adding a note
 */
export function buildAddNotePatchSet(
  dealId: string,
  noteContent: string
): PatchSet {
  let patchSet = createEmptyPatchSet(
    'Add note to timeline',
    { dealId, actionId: 'add_note', confidence: 'high' }
  );

  patchSet = addTimelineEvent(patchSet, {
    type: 'note',
    title: noteContent.length > 50 ? noteContent.substring(0, 50) + '...' : noteContent,
    description: noteContent,
  });

  return patchSet;
}

export default ACTION_CATALOG;
