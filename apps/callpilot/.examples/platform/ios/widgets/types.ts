/**
 * types.ts
 *
 * Type definitions for iOS Task Widget
 */

/**
 * Task data structure
 */
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
}

/**
 * Widget data passed from main app
 */
export interface WidgetData {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  lastUpdated: string;
}

/**
 * Props for main TaskWidget component
 */
export interface TaskWidgetProps {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  size: 'small' | 'medium' | 'large';
  colorScheme: 'light' | 'dark';
}

/**
 * Props for individual widget size components
 */
export interface SizeWidgetProps {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  colorScheme: 'light' | 'dark';
}

/**
 * Props for SmallWidget (doesn't need tasks array)
 */
export interface SmallWidgetProps {
  completedCount: number;
  totalCount: number;
  colorScheme: 'light' | 'dark';
}

/**
 * Props for TaskRow component
 */
export interface TaskRowProps {
  task: Task;
  colorScheme: 'light' | 'dark';
}

/**
 * Color scheme type
 */
export type ColorScheme = 'light' | 'dark';

/**
 * Widget size type
 */
export type WidgetSize = 'small' | 'medium' | 'large';

/**
 * Priority level type
 */
export type Priority = 'low' | 'medium' | 'high';
