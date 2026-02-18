/**
 * ExtraLargeTaskWidget Type Definitions
 *
 * Widget-specific types extending base widget types.
 */

import { Task, WidgetTheme, WidgetData } from '../types';

/**
 * Props for the main ExtraLargeTaskWidget component
 */
export interface ExtraLargeTaskWidgetProps {
  data: WidgetData;
  theme: WidgetTheme;
}

/**
 * Props for the WidgetHeader component
 */
export interface WidgetHeaderProps {
  theme: WidgetTheme;
}

/**
 * Props for the StatsRow component
 */
export interface StatsRowProps {
  totalCount: number;
  completedCount: number;
  theme: WidgetTheme;
}

/**
 * Props for the ProgressSection component
 */
export interface ProgressSectionProps {
  completedCount: number;
  totalCount: number;
  theme: WidgetTheme;
}

/**
 * Props for the TaskSection component
 */
export interface TaskSectionProps {
  title: string;
  tasks: Task[];
  maxItems: number;
  theme: WidgetTheme;
  showDetailed?: boolean;
}

/**
 * Props for the ActionButtons component
 */
export interface ActionButtonsProps {
  theme: WidgetTheme;
}

/**
 * Props for the UpdateTimestamp component
 */
export interface UpdateTimestampProps {
  lastUpdate: string;
  theme: WidgetTheme;
}
