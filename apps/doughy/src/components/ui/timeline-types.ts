import { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

export interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  source?: 'user' | 'ai' | 'system';
}

export interface TimelineEventConfig {
  icon: LucideIcon;
  colorKey: keyof ReturnType<typeof useThemeColors>;
  label: string;
}

export interface TimelineProps<T extends TimelineEvent> {
  /** Events to display */
  events?: T[];

  /** Event type configuration mapping */
  eventConfig: Record<string, TimelineEventConfig>;

  /** Add activity button handler */
  onAddActivity?: () => void;

  /** Show header section */
  showHeader?: boolean;

  /** Header title */
  headerTitle?: string;

  /** Header badge text (e.g., "Focus Mode") */
  headerBadge?: string;

  /** Add button text */
  addButtonText?: string;

  /** Maximum number of events to show */
  maxEvents?: number;

  /** Empty state message */
  emptyStateMessage?: string;

  /** Empty state CTA button text */
  emptyCTAText?: string;

  /** Loading state */
  isLoading?: boolean;

  /** Error state */
  error?: Error | null;

  /** Error message */
  errorMessage?: string;

  /** Custom metadata renderer */
  renderEventMetadata?: (event: T) => React.ReactNode;

  /** View more handler when maxEvents is set */
  onViewMore?: () => void;
}

export interface TimelineItemProps<T extends TimelineEvent> {
  event: T;
  config: TimelineEventConfig;
  isLast: boolean;
  renderMetadata?: (event: T) => React.ReactNode;
}
