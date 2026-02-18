/**
 * Real-Time List Example - Module Index
 *
 * A refactored example demonstrating real-time list updates with Supabase.
 *
 * Usage:
 *   import { RealtimeListExample } from '.examples/patterns/realtime/realtime-list';
 *
 * Or import individual pieces:
 *   import { useRealtimeList } from '.examples/patterns/realtime/realtime-list/hooks';
 *   import { TaskItem } from '.examples/patterns/realtime/realtime-list/components';
 */

// Main component
export { RealtimeListExample } from './RealtimeListExample';

// Hook
export { useRealtimeList } from './hooks';

// Components
export {
  TaskItem,
  TaskInput,
  ConnectionStatus,
  EmptyState,
  LoadingState,
} from './components';

// Types
export type {
  Task,
  UseRealtimeListResult,
  TaskItemProps,
  TaskInputProps,
  ConnectionStatusProps,
  EmptyStateProps,
} from './types';

// Styles (for customization)
export { styles } from './styles';
