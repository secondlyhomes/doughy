/**
 * Task Types (Local Storage)
 *
 * Type definitions for tasks stored in AsyncStorage
 * No database required - perfect for prototypes and offline-first apps
 */

export interface Task {
  /**
   * Unique task ID
   */
  id: string

  /**
   * Task title
   */
  title: string

  /**
   * Task description (optional)
   */
  description?: string

  /**
   * Completion status
   */
  completed: boolean

  /**
   * Priority level
   * @default 'medium'
   */
  priority: 'low' | 'medium' | 'high'

  /**
   * Due date (ISO string)
   */
  dueDate?: string

  /**
   * Created timestamp (ISO string)
   */
  createdAt: string

  /**
   * Last updated timestamp (ISO string)
   */
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: Task['priority']
  dueDate?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  completed?: boolean
  priority?: Task['priority']
  dueDate?: string
}
