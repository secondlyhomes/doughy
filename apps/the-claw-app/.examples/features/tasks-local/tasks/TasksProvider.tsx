/**
 * Tasks Provider Component
 *
 * React Context provider for task management using AsyncStorage
 * No database required - perfect for prototypes and offline-first apps
 */

import React, { createContext, useMemo } from 'react'
import type { TasksContextValue, TasksProviderProps } from './types'
import { useTaskStorage } from './hooks/useTaskStorage'
import { useTaskActions } from './hooks/useTaskActions'

export const TasksContext = createContext<TasksContextValue | undefined>(undefined)

/**
 * Tasks Provider Component
 *
 * Wraps your app to provide task management functionality.
 * Uses AsyncStorage for persistence - no database required.
 *
 * @example
 * ```tsx
 * import { TasksProvider } from '@/features/tasks-local/tasks'
 *
 * export default function RootLayout() {
 *   return (
 *     <TasksProvider>
 *       <Stack />
 *     </TasksProvider>
 *   )
 * }
 * ```
 */
export function TasksProvider({ children }: TasksProviderProps) {
  // Storage state and operations
  const {
    tasks,
    loading,
    error,
    stats,
    setTasks,
    setError,
    loadTasks,
  } = useTaskStorage()

  // CRUD actions
  const actions = useTaskActions({
    setTasks,
    setError,
    loadTasks,
  })

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<TasksContextValue>(
    () => ({
      // State
      tasks,
      loading,
      error,
      stats,
      // Actions
      ...actions,
    }),
    [tasks, loading, error, stats, actions]
  )

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  )
}
