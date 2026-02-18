/**
 * Tasks API (Supabase)
 *
 * All task-related database operations with proper error handling and type safety
 */

import { supabase } from '@/services/supabase'
import type { Task, TaskRow, CreateTaskInput, UpdateTaskInput, TaskStats } from './types'
import { transformTask } from './types'

/**
 * Get all tasks for the current user
 *
 * @returns Array of tasks sorted by created date (newest first)
 * @throws Error if query fails
 *
 * @example
 * ```tsx
 * const tasks = await getTasks()
 * ```
 */
export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`)
  }

  return (data as TaskRow[]).map(transformTask)
}

/**
 * Get a single task by ID
 *
 * @param id - Task UUID
 * @returns Task object
 * @throws Error if task not found or query fails
 *
 * @example
 * ```tsx
 * const task = await getTask('uuid-here')
 * ```
 */
export async function getTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch task: ${error.message}`)
  }

  if (!data) {
    throw new Error('Task not found')
  }

  return transformTask(data as TaskRow)
}

/**
 * Create a new task
 *
 * @param input - Task creation data
 * @returns Newly created task
 * @throws Error if user not authenticated or creation fails
 *
 * @example
 * ```tsx
 * const task = await createTask({
 *   title: 'Complete project',
 *   priority: 'high',
 *   dueDate: '2026-02-15T00:00:00.000Z'
 * })
 * ```
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Insert task
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description || null,
      priority: input.priority || 'medium',
      due_date: input.dueDate || null,
      completed: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`)
  }

  if (!data) {
    throw new Error('Task creation failed - no data returned')
  }

  return transformTask(data as TaskRow)
}

/**
 * Update an existing task
 *
 * @param id - Task UUID
 * @param input - Fields to update
 * @returns Updated task
 * @throws Error if task not found or update fails
 *
 * @example
 * ```tsx
 * const task = await updateTask('uuid-here', {
 *   title: 'Updated title',
 *   completed: true
 * })
 * ```
 */
export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  // Build update object only with defined fields
  const updates: Record<string, any> = {}

  if (input.title !== undefined) updates.title = input.title
  if (input.description !== undefined) updates.description = input.description || null
  if (input.completed !== undefined) updates.completed = input.completed
  if (input.priority !== undefined) updates.priority = input.priority
  if (input.dueDate !== undefined) updates.due_date = input.dueDate || null

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`)
  }

  if (!data) {
    throw new Error('Task not found')
  }

  return transformTask(data as TaskRow)
}

/**
 * Delete a task
 *
 * @param id - Task UUID
 * @returns true if deleted successfully
 * @throws Error if deletion fails
 *
 * @example
 * ```tsx
 * await deleteTask('uuid-here')
 * ```
 */
export async function deleteTask(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`)
  }

  return true
}

/**
 * Toggle task completion status
 *
 * @param id - Task UUID
 * @returns Updated task
 * @throws Error if task not found or update fails
 *
 * @example
 * ```tsx
 * const task = await toggleTask('uuid-here')
 * ```
 */
export async function toggleTask(id: string): Promise<Task> {
  // First get current state
  const task = await getTask(id)

  // Toggle completion
  return updateTask(id, { completed: !task.completed })
}

/**
 * Clear all completed tasks
 *
 * @returns Number of tasks deleted
 * @throws Error if deletion fails
 *
 * @example
 * ```tsx
 * const count = await clearCompleted()
 * console.log(`Deleted ${count} tasks`)
 * ```
 */
export async function clearCompleted(): Promise<number> {
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Delete all completed tasks for this user
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('user_id', user.id)
    .eq('completed', true)
    .select()

  if (error) {
    throw new Error(`Failed to clear completed tasks: ${error.message}`)
  }

  return data?.length || 0
}

/**
 * Get task statistics for the current user
 *
 * @returns Task statistics
 * @throws Error if query fails
 *
 * @example
 * ```tsx
 * const stats = await getTaskStats()
 * console.log(`${stats.completed}/${stats.total} tasks completed`)
 * ```
 */
export async function getTaskStats(): Promise<TaskStats> {
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('completed, priority')
    .eq('user_id', user.id)

  if (error) {
    throw new Error(`Failed to fetch task stats: ${error.message}`)
  }

  const tasks = data || []

  const stats: TaskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    incomplete: tasks.filter(t => !t.completed).length,
    byPriority: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    },
  }

  return stats
}
