/**
 * Tasks Feature (Supabase)
 *
 * Complete task management with Supabase backend
 *
 * @example
 * ```tsx
 * import { TasksProvider, useTasks } from '@/features/tasks-supabase'
 *
 * // In root layout
 * <TasksProvider>
 *   <App />
 * </TasksProvider>
 *
 * // In components
 * const { tasks, createTask, toggleTask } = useTasks()
 * ```
 */

// Provider
export { TasksProvider } from './TasksProvider'

// Hooks
export { useTasks } from './hooks/useTasks'

// Types
export type {
  Task,
  TaskRow,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStats,
  TasksContextValue,
  TasksProviderProps,
} from './types'

// API (for direct access if needed)
export * as TaskAPI from './api'
