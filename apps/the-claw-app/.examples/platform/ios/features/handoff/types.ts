/**
 * types.ts
 *
 * TypeScript types and interfaces for iOS Handoff (Continuity) Integration
 */

/**
 * Activity types for Handoff
 */
export enum HandoffActivityType {
  ViewTask = 'com.yourapp.viewTask',
  EditTask = 'com.yourapp.editTask',
  BrowseTasks = 'com.yourapp.browseTasks',
  CreateTask = 'com.yourapp.createTask',
}

/**
 * Handoff activity configuration
 */
export interface HandoffActivity {
  activityType: HandoffActivityType | string;
  title: string;
  userInfo?: Record<string, unknown>;
  webpageURL?: string;
  requiredUserInfoKeys?: string[];
  keywords?: string[];
}

/**
 * Task type for demo components
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
}

/**
 * Return type for useHandoff hook
 */
export interface UseHandoffReturn {
  startActivity: (
    title: string,
    userInfo?: Record<string, unknown>,
    webpageURL?: string
  ) => Promise<void>;
  updateActivity: (userInfo: Record<string, unknown>) => Promise<void>;
  stopActivity: () => Promise<void>;
}

/**
 * Props for TaskDetailWithHandoff component
 */
export interface TaskDetailWithHandoffProps {
  task: Task;
}
