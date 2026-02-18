/**
 * Task Types (Supabase)
 *
 * Type definitions for tasks stored in Supabase with proper database types
 */

/**
 * Task database row (matches database schema exactly)
 */
export interface TaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_at: string
  updated_at: string
}

/**
 * Task type for application use
 */
export interface Task {
  /**
   * Unique task ID (UUID)
   */
  id: string

  /**
   * Owner user ID
   */
  userId: string

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

/**
 * Input for creating a new task
 */
export interface CreateTaskInput {
  title: string
  description?: string
  priority?: Task['priority']
  dueDate?: string
}

/**
 * Input for updating an existing task
 */
export interface UpdateTaskInput {
  title?: string
  description?: string
  completed?: boolean
  priority?: Task['priority']
  dueDate?: string
}

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
 * Tasks context value interface
 */
export interface TasksContextValue {
  tasks: Task[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  createTask: (input: CreateTaskInput) => Promise<Task>
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task>
  deleteTask: (id: string) => Promise<boolean>
  toggleTask: (id: string) => Promise<Task>
  clearCompleted: () => Promise<number>
  stats: TaskStats
}

/**
 * Tasks provider props
 */
export interface TasksProviderProps {
  children: React.ReactNode
  enableRealtime?: boolean
  enableRetry?: boolean
  maxRetries?: number
}

/**
 * Transform database row to application type
 */
export function transformTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description || undefined,
    completed: row.completed,
    priority: row.priority,
    dueDate: row.due_date || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
