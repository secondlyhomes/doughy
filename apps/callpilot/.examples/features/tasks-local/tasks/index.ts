/**
 * Tasks Context Module
 *
 * Clean re-exports for the tasks context system
 *
 * @example
 * ```tsx
 * import { TasksProvider, useTasks } from '@/features/tasks-local/tasks'
 * import type { Task, TasksContextValue } from '@/features/tasks-local/tasks'
 * ```
 */

// Provider and consumer
export { TasksProvider } from './TasksProvider'
export { useTasks } from './useTasks'

// Types
export type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStats,
  TasksState,
  TaskActions,
  TasksContextValue,
  TasksProviderProps,
} from './types'

// Internal hooks (for advanced use cases)
export { useTaskStorage } from './hooks/useTaskStorage'
export { useTaskActions } from './hooks/useTaskActions'
