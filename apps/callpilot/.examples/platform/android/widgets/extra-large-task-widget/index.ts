/**
 * ExtraLargeTaskWidget Module
 *
 * Clean re-exports for the 4x4 widget.
 */

// Main component
export { ExtraLargeTaskWidget } from './ExtraLargeTaskWidget';

// Types
export type {
  ExtraLargeTaskWidgetProps,
  WidgetHeaderProps,
  StatsRowProps,
  ProgressSectionProps,
  TaskSectionProps,
  ActionButtonsProps,
  UpdateTimestampProps,
} from './types';

// Sub-components (for testing or custom compositions)
export { WidgetHeader } from './components/WidgetHeader';
export { StatsRow } from './components/StatsRow';
export { ProgressSection } from './components/ProgressSection';
export { TaskSection } from './components/TaskSection';
export { ActionButtons } from './components/ActionButtons';
export { UpdateTimestamp } from './components/UpdateTimestamp';

// Style utilities
export { getContainerStyle, LAYOUT, TYPOGRAPHY, PROGRESS_BAR, BUTTON, COLORS } from './styles';
