/**
 * ShareSheet Types
 *
 * Type definitions for iOS Share Sheet functionality
 */

/**
 * Share content types
 */
export interface ShareContent {
  message?: string;
  url?: string;
  title?: string;
  subject?: string;
  files?: string[];
}

/**
 * Share result
 */
export interface ShareResult {
  action: 'sharedAction' | 'dismissedAction';
  activityType?: string;
}

/**
 * Task type for sharing
 */
export interface ShareableTask {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: string;
  completed?: boolean;
}
