/**
 * iOS Task Widget
 *
 * Home screen widget for displaying tasks on iOS devices.
 *
 * @example
 * ```tsx
 * import { TaskWidget } from './.examples/platform/ios/widgets';
 *
 * <TaskWidget
 *   tasks={tasks}
 *   completedCount={5}
 *   totalCount={10}
 *   size="medium"
 *   colorScheme="light"
 * />
 * ```
 */

// Main widget component
export { TaskWidget } from './TaskWidget';

// Individual widget sizes
export { SmallWidget } from './SmallWidget';
export { MediumWidget } from './MediumWidget';
export { LargeWidget } from './LargeWidget';

// Shared components
export { TaskRow } from './components/TaskRow';

// Types
export type {
  Task,
  WidgetData,
  TaskWidgetProps,
  SizeWidgetProps,
  SmallWidgetProps,
  TaskRowProps,
  ColorScheme,
  WidgetSize,
  Priority,
} from './types';

// Utilities
export {
  formatDueDate,
  calculatePercentage,
  getWidgetStyles,
} from './utils/widget-utils';

// Colors
export {
  getColorPalette,
  PRIORITY_COLORS,
} from './utils/widget-colors';
export type { ColorPalette } from './utils/widget-colors';
