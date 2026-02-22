// src/features/assistant/types/patchset.ts
// PatchSet types for AI-proposed changes with Preview → Apply flow

import { DealEventType } from '../../deals/types/events';

/**
 * Confidence level for AI-proposed changes
 */
export type Confidence = 'high' | 'med' | 'low';

/**
 * PatchSet operation types
 */
export type PatchOp = 'create' | 'update' | 'delete';

/**
 * Entity types that can be modified via PatchSet
 */
export type PatchEntity =
  | 'Deal'
  | 'DealOffer'
  | 'DealAssumption'
  | 'DealEvidence'
  | 'DealWalkthrough'
  | 'Property'
  | 'Lead'
  | 'Task';

/**
 * A single operation within a PatchSet
 */
export interface PatchOperation {
  /** Operation type */
  op: PatchOp;

  /** Entity type being modified */
  entity: PatchEntity;

  /** Entity ID (required for update/delete, optional for create) */
  id?: string;

  /** Previous value (for update operations) */
  before?: Record<string, unknown>;

  /** New value (required for create/update) */
  after: Record<string, unknown>;

  /** Human-readable rationale for this change */
  rationale: string;

  /** Reference to evidence (event ID, doc ID, etc.) */
  source?: string;

  /** Field path within entity (e.g., "terms_json.purchase_price") */
  fieldPath?: string;
}

/**
 * Timeline event that will be created when PatchSet is applied
 */
export interface PendingTimelineEvent {
  type: DealEventType;
  title: string;
  description?: string;
}

/**
 * A complete PatchSet proposed by the AI
 */
export interface PatchSet {
  /** Unique identifier for this PatchSet */
  patchSetId: string;

  /** Human-readable summary of all changes */
  summary: string;

  /** Overall confidence level */
  confidence: Confidence;

  /** Action that generated this PatchSet */
  actionId?: string;

  /** Deal ID this PatchSet relates to */
  dealId?: string;

  /** List of operations to apply */
  ops: PatchOperation[];

  /** Timeline events that will be created on apply */
  willCreateTimelineEvents: PendingTimelineEvent[];

  /** Timestamp when this PatchSet was generated */
  createdAt: string;

  /** Whether this PatchSet has been applied */
  applied?: boolean;

  /** Timestamp when applied (if applicable) */
  appliedAt?: string;
}

/**
 * Result of applying a PatchSet
 */
export interface PatchSetApplyResult {
  success: boolean;
  patchSetId: string;
  appliedOps: number;
  failedOps: number;
  errors?: Array<{
    opIndex: number;
    entity: PatchEntity;
    error: string;
  }>;
  createdEventIds?: string[];
  updatedEntities?: Array<{
    entity: PatchEntity;
    id: string;
  }>;
}

/**
 * PatchSet preview display mode
 */
export type PreviewMode = 'compact' | 'detailed' | 'diff';

/**
 * Configuration for preview display
 */
export interface PreviewConfig {
  mode: PreviewMode;
  showRationale: boolean;
  showSource: boolean;
  showBeforeValues: boolean;
  highlightChanges: boolean;
}

/**
 * Default preview configuration
 */
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  mode: 'detailed',
  showRationale: true,
  showSource: true,
  showBeforeValues: true,
  highlightChanges: true,
};

/**
 * Generate a unique PatchSet ID
 */
export function generatePatchSetId(): string {
  return `ps_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create an empty PatchSet
 */
export function createEmptyPatchSet(
  summary: string,
  options?: {
    actionId?: string;
    dealId?: string;
    confidence?: Confidence;
  }
): PatchSet {
  return {
    patchSetId: generatePatchSetId(),
    summary,
    confidence: options?.confidence ?? 'med',
    actionId: options?.actionId,
    dealId: options?.dealId,
    ops: [],
    willCreateTimelineEvents: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Add an operation to a PatchSet
 */
export function addOperation(
  patchSet: PatchSet,
  op: PatchOperation
): PatchSet {
  return {
    ...patchSet,
    ops: [...patchSet.ops, op],
  };
}

/**
 * Add a timeline event that will be created when PatchSet is applied
 */
export function addTimelineEvent(
  patchSet: PatchSet,
  event: PendingTimelineEvent
): PatchSet {
  return {
    ...patchSet,
    willCreateTimelineEvents: [...patchSet.willCreateTimelineEvents, event],
  };
}

/**
 * Get display label for an entity type
 */
export const ENTITY_LABELS: Record<PatchEntity, string> = {
  Deal: 'Deal',
  DealOffer: 'Offer',
  DealAssumption: 'Assumption',
  DealEvidence: 'Evidence',
  DealWalkthrough: 'Walkthrough',
  Property: 'Property',
  Lead: 'Lead',
  Task: 'Task',
};

/**
 * Get display label for an operation type
 */
export const OP_LABELS: Record<PatchOp, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};

/**
 * Get color for confidence level
 */
export const CONFIDENCE_COLORS: Record<Confidence, string> = {
  high: 'green',
  med: 'amber',
  low: 'red',
};
