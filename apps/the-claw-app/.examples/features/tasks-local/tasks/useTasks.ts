/**
 * useTasks Hook
 *
 * Consumer hook for accessing the Tasks context
 */

import { useContext } from 'react'
import type { TasksContextValue } from './types'
import { TasksContext } from './TasksProvider'

/**
 * Hook to access tasks context
 *
 * Must be used within a TasksProvider.
 *
 * @throws Error if used outside of TasksProvider
 * @returns TasksContextValue with state and actions
 *
 * @example
 * ```tsx
 * import { useTasks } from '@/features/tasks-local/tasks'
 *
 * function TasksScreen() {
 *   const { tasks, loading, createTask } = useTasks()
 *
 *   if (loading) {
 *     return <LoadingState />
 *   }
 *
 *   return (
 *     <FlatList
 *       data={tasks}
 *       renderItem={({ item }) => <TaskCard task={item} />}
 *     />
 *   )
 * }
 * ```
 */
export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext)

  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider')
  }

  return context
}
