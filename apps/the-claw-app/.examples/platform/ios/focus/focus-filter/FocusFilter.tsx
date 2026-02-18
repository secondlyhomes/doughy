/**
 * FocusFilter.tsx
 *
 * iOS Focus Filter Integration
 *
 * Filter app content based on user's Focus mode (Work, Personal, Sleep, etc.)
 * Available in iOS 16+
 *
 * Features:
 * - Detect current Focus mode
 * - Filter content automatically
 * - Respect Do Not Disturb
 * - Integrate with Focus settings
 *
 * Requirements:
 * - iOS 16+
 * - Focus Filter capability in Xcode
 *
 * Related docs:
 * - .examples/platform/ios/focus/README.md
 *
 * Usage:
 * ```tsx
 * import {
 *   FocusFilterBanner,
 *   TaskListWithFocusFilter,
 *   useFocusFilter,
 *   FocusFilterManager,
 * } from './focus-filter';
 *
 * // In your component:
 * const { currentFocus, filterTasks, isFiltering } = useFocusFilter();
 *
 * // Show banner when filtering is active
 * <FocusFilterBanner />
 *
 * // Or use the task list component
 * <TaskListWithFocusFilter
 *   tasks={tasks}
 *   renderTask={(task) => <TaskItem task={task} />}
 * />
 * ```
 */

import React from 'react';
import { View } from 'react-native';
import { FocusFilterBanner } from './components/FocusFilterBanner';
import { TaskListWithFocusFilter } from './components/TaskListWithFocusFilter';
import { useFocusFilter } from './hooks/useFocusFilter';
import { FocusFilterManager } from './FocusFilterManager';
import { FocusMode, FocusFilterConfig, FilterableTask } from './types';

/**
 * Props for the main FocusFilter container component
 */
interface FocusFilterProps {
  children?: React.ReactNode;
  showBanner?: boolean;
}

/**
 * FocusFilter Container Component
 *
 * A wrapper component that provides Focus Filter context to children.
 * Optionally displays a banner when Focus mode is active.
 *
 * @example
 * ```tsx
 * <FocusFilter showBanner>
 *   <YourTaskList />
 * </FocusFilter>
 * ```
 */
export function FocusFilter({
  children,
  showBanner = true,
}: FocusFilterProps): React.ReactElement {
  return (
    <View>
      {showBanner && <FocusFilterBanner />}
      {children}
    </View>
  );
}

// Re-export all public API
export {
  FocusFilterBanner,
  TaskListWithFocusFilter,
  useFocusFilter,
  FocusFilterManager,
  FocusMode,
};

export type { FocusFilterConfig, FilterableTask, FocusFilterProps };
