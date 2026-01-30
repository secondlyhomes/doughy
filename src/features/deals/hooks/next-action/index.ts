// src/features/deals/hooks/next-action/index.ts
// Barrel export for Next Best Action engine

// Re-export types
export type {
  NextAction,
  ActionContext,
  ActionCategory,
} from './types';

// Re-export constants
export { PHOTO_BUCKETS, STAGE_DEFAULT_ACTIONS } from './constants';
export type { PhotoBucket } from './constants';

// Re-export context helpers
export {
  calculateWalkthroughProgress,
  calculateDaysSinceLastContact,
  formatTimeSince,
  buildActionContext,
} from './context';

// Re-export rules engine
export {
  calculateNextAction,
  inferCategoryFromAction,
  getPriorityForStage,
} from './rules';

// Re-export UI helpers
export { getActionButtonText, getActionIcon } from './ui';
