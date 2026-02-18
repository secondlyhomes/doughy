/**
 * iOS Live Activities Module
 *
 * Provides Live Activity support for Dynamic Island and Lock Screen.
 *
 * @example
 * ```tsx
 * import { TaskLiveActivity, useTaskLiveActivity, TaskProgressTracker } from './live-activities';
 *
 * // Using the class directly
 * const activityId = await TaskLiveActivity.start('task-123', 'Processing', 5);
 * await TaskLiveActivity.updateProgress(activityId, 2, 5);
 * await TaskLiveActivity.complete(activityId);
 *
 * // Using the hook
 * const { startActivity, updateProgress, completeActivity } = useTaskLiveActivity();
 *
 * // Using the tracker class
 * const tracker = new TaskProgressTracker();
 * await tracker.startTracking('task-123', 'Processing', 5);
 * await tracker.updateStep(2, 5);
 * await tracker.completeTracking();
 * ```
 */

// Types
export type {
  TaskActivityState,
  TaskActivityAttributes,
  ActivityOptions,
  CompleteActivityOptions,
  ActivityStatus,
} from './types';

// Core class
export { TaskLiveActivity } from './TaskLiveActivity';

// React hook
export { useTaskLiveActivity } from './useTaskLiveActivity';
export type { UseTaskLiveActivityReturn } from './useTaskLiveActivity';

// Progress tracker
export { TaskProgressTracker } from './TaskProgressTracker';

// Utilities (for advanced use cases)
export {
  isLiveActivityAvailable,
  calculateProgress,
  calculateEstimatedCompletion,
} from './utils';
