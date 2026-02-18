/**
 * Types for iOS Live Activities
 *
 * Live Activity state and attribute interfaces for:
 * - Dynamic Island (iPhone 14 Pro+)
 * - Lock Screen
 * - Always-On Display
 */

/**
 * Live Activity state - dynamic content that updates
 */
export interface TaskActivityState {
  taskTitle: string;
  progress: number;
  totalSteps: number;
  currentStep: number;
  status: 'in_progress' | 'paused' | 'completed';
  estimatedCompletion?: string;
}

/**
 * Live Activity attributes - static data set at creation
 */
export interface TaskActivityAttributes {
  taskId: string;
  taskTitle: string;
  startTime: string;
}

/**
 * Configuration options for starting a Live Activity
 */
export interface ActivityOptions {
  /** Date when the activity becomes stale */
  staleDate?: Date;
  /** Relevance score for sorting (0-100) */
  relevanceScore?: number;
  /** Push token for remote updates */
  pushToken?: string;
}

/**
 * Options for completing a Live Activity
 */
export interface CompleteActivityOptions {
  /** Seconds before dismissing (default: 5) */
  dismissAfter?: number;
  /** Final message to display */
  finalMessage?: string;
}

/**
 * Activity status type alias
 */
export type ActivityStatus = TaskActivityState['status'];
