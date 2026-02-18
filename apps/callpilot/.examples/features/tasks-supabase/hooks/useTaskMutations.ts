/**
 * useTaskMutations Hook
 *
 * Mutation operations for tasks with optimistic updates
 */

import { useCallback } from 'react'
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types'
import * as TaskAPI from '../api'

interface UseTaskMutationsOptions {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  refresh: () => Promise<void>
}

export function useTaskMutations({
  tasks,
  setTasks,
  setError,
  refresh,
}: UseTaskMutationsOptions) {
  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<Task> => {
      try {
        setError(null)

        const tempId = `temp-${Date.now()}`
        const tempTask: Task = {
          id: tempId,
          userId: 'pending',
          title: input.title,
          description: input.description,
          completed: false,
          priority: input.priority || 'medium',
          dueDate: input.dueDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setTasks(prev => [tempTask, ...prev])

        const newTask = await TaskAPI.createTask(input)
        setTasks(prev => prev.map(t => (t.id === tempId ? newTask : t)))

        return newTask
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create task'
        setError(message)
        setTasks(prev => prev.filter(t => !t.id.startsWith('temp-')))
        throw new Error(message)
      }
    },
    [setTasks, setError]
  )

  const updateTask = useCallback(
    async (id: string, input: UpdateTaskInput): Promise<Task> => {
      try {
        setError(null)

        const originalTask = tasks.find(t => t.id === id)
        if (!originalTask) {
          throw new Error('Task not found')
        }

        const optimisticTask: Task = {
          ...originalTask,
          ...input,
          updatedAt: new Date().toISOString(),
        }

        setTasks(prev => prev.map(t => (t.id === id ? optimisticTask : t)))

        const updatedTask = await TaskAPI.updateTask(id, input)
        setTasks(prev => prev.map(t => (t.id === id ? updatedTask : t)))

        return updatedTask
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update task'
        setError(message)
        await refresh()
        throw new Error(message)
      }
    },
    [tasks, setTasks, setError, refresh]
  )

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null)

        const originalTask = tasks.find(t => t.id === id)
        if (!originalTask) {
          throw new Error('Task not found')
        }

        setTasks(prev => prev.filter(t => t.id !== id))

        return await TaskAPI.deleteTask(id)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete task'
        setError(message)
        await refresh()
        throw new Error(message)
      }
    },
    [tasks, setTasks, setError, refresh]
  )

  const toggleTask = useCallback(
    async (id: string): Promise<Task> => {
      const task = tasks.find(t => t.id === id)
      if (!task) {
        throw new Error('Task not found')
      }
      return updateTask(id, { completed: !task.completed })
    },
    [tasks, updateTask]
  )

  const clearCompleted = useCallback(async (): Promise<number> => {
    try {
      setError(null)
      setTasks(prev => prev.filter(t => !t.completed))

      return await TaskAPI.clearCompleted()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear completed tasks'
      setError(message)
      await refresh()
      throw new Error(message)
    }
  }, [setTasks, setError, refresh])

  return {
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    clearCompleted,
  }
}
