/**
 * Widget Type Definitions
 */

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface WidgetData {
  tasks: Task[];
  completedCount: number;
  totalCount: number;
  lastUpdate: string;
}

export enum WidgetSize {
  SMALL = 'small', // 1x1
  MEDIUM = 'medium', // 2x2
  LARGE = 'large', // 4x2
  EXTRA_LARGE = 'extraLarge', // 4x4
}

export interface WidgetTheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
}

export interface WidgetComponentProps {
  data: WidgetData;
  theme: WidgetTheme;
}
