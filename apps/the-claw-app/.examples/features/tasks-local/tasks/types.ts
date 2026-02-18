/**
 * Tasks Context Types
 *
 * TypeScript interfaces for the Tasks context system
 */

import type { Task, CreateTaskInput, UpdateTaskInput } from '../types'

/**
 * Task statistics
 */
export interface TaskStats {
  total: number
  completed: number
  incomplete: number
  byPriority: {
    high: number
    medium: number
    low: number
  }
}

/**
 * Tasks state managed by the provider
 */
export interface TasksState {
  tasks: Task[]
  loading: boolean
  error: string | null
  stats: TaskStats
}

/**
 * Task action methods
 */
export interface TaskActions {
  /**
   * Refresh tasks from storage
   */
  refresh: () => Promise<void>

  /**
   * Create a new task
   */
  createTask: (input: CreateTaskInput) => Promise<Task>

  /**
   * Update a task
   */
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | null>

  /**
   * Delete a task
   */
  deleteTask: (id: string) => Promise<boolean>

  /**
   * Toggle task completion
   */
  toggleTask: (id: string) => Promise<Task | null>

  /**
   * Clear all completed tasks
   */
  clearCompleted: () => Promise<number>
}

/**
 * Complete Tasks context value
 */
export interface TasksContextValue extends TasksState, TaskActions {}

/**
 * Tasks provider props
 */
export interface TasksProviderProps {
  children: React.ReactNode
}

// Re-export base types for convenience
export type { Task, CreateTaskInput, UpdateTaskInput }
