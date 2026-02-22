// src/features/assistant/actions/handlers/dealHandlers.ts
// Deal progression handlers: stage updates, next actions, tasks, notes

import { DealStage, DEAL_STAGE_CONFIG, getNextStages } from '@/features/deals/types';
import {
  ActionHandlerInput,
  ActionHandlerResult,
  buildStageUpdatePatchSet,
  buildAddNotePatchSet,
} from '../catalog';
import {
  createEmptyPatchSet,
  addOperation,
  addTimelineEvent,
} from '../../types/patchset';
import type { HandlerContext } from './index';

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
