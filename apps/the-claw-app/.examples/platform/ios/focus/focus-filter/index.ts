/**
 * Focus Filter Module
 *
 * iOS Focus Filter Integration for React Native (iOS 16+)
 *
 * @example
 * ```tsx
 * import {
 *   FocusFilter,
 *   FocusFilterBanner,
 *   TaskListWithFocusFilter,
 *   useFocusFilter,
 *   FocusFilterManager,
 *   FocusMode,
 * } from '.examples/platform/ios/focus/focus-filter';
 * ```
 */

// Main component
export { FocusFilter } from './FocusFilter';

// Sub-components
export { FocusFilterBanner } from './components/FocusFilterBanner';
export { TaskListWithFocusFilter } from './components/TaskListWithFocusFilter';

// Hooks
export { useFocusFilter } from './hooks/useFocusFilter';

// Manager class
export { FocusFilterManager } from './FocusFilterManager';

// Types and enums
export {
  FocusMode,
  type FocusFilterConfig,
  type FilterableTask,
  type TaskListWithFocusFilterProps,
  type UseFocusFilterReturn,
} from './types';
