/**
 * types.ts
 *
 * TypeScript interfaces and enums for Focus Filter functionality
 */

/**
 * Focus modes available on iOS 16+
 */
export enum FocusMode {
  DoNotDisturb = 'do_not_disturb',
  Work = 'work',
  Personal = 'personal',
  Sleep = 'sleep',
  Driving = 'driving',
  Fitness = 'fitness',
  Gaming = 'gaming',
  Mindfulness = 'mindfulness',
  Reading = 'reading',
  Custom = 'custom',
  None = 'none',
}

/**
 * Focus filter configuration
 */
export interface FocusFilterConfig {
  mode: FocusMode;
  shouldFilterTasks: boolean;
  allowedCategories: string[];
  allowedPriorities: string[];
}

/**
 * Base task interface for filtering
 */
export interface FilterableTask {
  category?: string;
  priority?: string;
}

/**
 * Props for TaskListWithFocusFilter component
 */
export interface TaskListWithFocusFilterProps {
  tasks: FilterableTask[];
}

/**
 * Return type for useFocusFilter hook
 */
export interface UseFocusFilterReturn {
  currentFocus: FocusMode;
  filterConfig: FocusFilterConfig | null;
  filterTasks: <T extends FilterableTask>(tasks: T[]) => T[];
  shouldSilenceNotifications: () => boolean;
  getFocusDisplayName: () => string;
  isFiltering: boolean;
}
