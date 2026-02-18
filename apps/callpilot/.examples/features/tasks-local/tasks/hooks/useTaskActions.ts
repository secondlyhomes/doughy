/**
 * useTaskActions Hook
 *
 * CRUD operations for tasks with optimistic updates
 * Manages state updates through provided setters
 */

import { useCallback } from 'react'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../types'
import type { TaskActions } from '../types'
import * as TaskStorage from '../../storage'

interface UseTaskActionsParams {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  loadTasks: () => Promise<void>
}

/**
 * Hook for task CRUD operations
 *
 * @param params - State setters from useTaskStorage
 * @returns Task action methods
 */
export function useTaskActions({
  setTasks,
  setError,
  loadTasks,
}: UseTaskActionsParams): TaskActions {
  const refresh = useCallback(async () => {
    await loadTasks()
  }, [loadTasks])

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<Task> => {
      try {
        setError(null)
        const newTask = await TaskStorage.createTask(input)
        setTasks(prev => [...prev, newTask])
        return newTask
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create task'
        setError(message)
        throw new Error(message)
      }
    },
    [setTasks, setError]
  )

  const updateTask = useCallback(
    async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
      try {
        setError(null)
        const updatedTask = await TaskStorage.updateTask(id, input)
        if (updatedTask) {
          setTasks(prev => prev.map(task => (task.id === id ? updatedTask : task)))
        }
        return updatedTask
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update task'
        setError(message)
        throw new Error(message)
      }
    },
    [setTasks, setError]
  )

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null)
        const success = await TaskStorage.deleteTask(id)
        if (success) {
          setTasks(prev => prev.filter(task => task.id !== id))
        }
        return success
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete task'
        setError(message)
        throw new Error(message)
      }
    },
    [setTasks, setError]
  )

  const toggleTask = useCallback(
    async (id: string): Promise<Task | null> => {
      try {
        setError(null)
        const updatedTask = await TaskStorage.toggleTask(id)
        if (updatedTask) {
          setTasks(prev => prev.map(task => (task.id === id ? updatedTask : task)))
        }
        return updatedTask
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to toggle task'
        setError(message)
        throw new Error(message)
      }
    },
    [setTasks, setError]
  )

  const clearCompleted = useCallback(async (): Promise<number> => {
    try {
      setError(null)
      const deletedCount = await TaskStorage.clearCompleted()
      setTasks(prev => prev.filter(task => !task.completed))
      return deletedCount
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear completed tasks'
      setError(message)
      throw new Error(message)
    }
  }, [setTasks, setError])

  return {
    refresh,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    clearCompleted,
  }
}
