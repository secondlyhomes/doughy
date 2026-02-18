/**
 * Tasks Provider
 *
 * Thin provider component that composes hooks for task management
 */

import React, { useCallback } from 'react'
import type { TasksProviderProps, TasksContextValue } from './types'
import { TasksContext, useTasksState } from './hooks/useTasks'
import { useTaskMutations } from './hooks/useTaskMutations'

/**
 * Tasks Provider Component
 *
 * @example
 * ```tsx
 * import { TasksProvider } from '@/features/tasks-supabase'
 *
 * export default function RootLayout() {
 *   return (
 *     <TasksProvider enableRealtime={true}>
 *       <Stack />
 *     </TasksProvider>
 *   )
 * }
 * ```
 */
export function TasksProvider({
  children,
  enableRealtime = true,
  enableRetry = true,
  maxRetries = 3,
}: TasksProviderProps) {
  const {
    tasks,
    setTasks,
    loading,
    error,
    setError,
    stats,
    refresh: loadTasks,
  } = useTasksState({ enableRealtime, enableRetry, maxRetries })

  const refresh = useCallback(async () => {
    await loadTasks()
  }, [loadTasks])

  const mutations = useTaskMutations({
    tasks,
    setTasks,
    setError,
    refresh,
  })

  const value: TasksContextValue = {
    tasks,
    loading,
    error,
    refresh,
    stats,
    ...mutations,
  }

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  )
}
