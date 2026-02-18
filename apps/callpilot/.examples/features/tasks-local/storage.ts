/**
 * Task Storage Service (AsyncStorage)
 *
 * CRUD operations for tasks using AsyncStorage
 * No database required - perfect for prototypes and offline-first apps
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Task, CreateTaskInput, UpdateTaskInput } from './types'

const TASKS_STORAGE_KEY = '@app/tasks'

/**
 * Generate a simple unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get all tasks from AsyncStorage
 */
export async function getTasks(): Promise<Task[]> {
  try {
    const data = await AsyncStorage.getItem(TASKS_STORAGE_KEY)
    if (!data) return []

    const tasks: Task[] = JSON.parse(data)

    // Sort by: incomplete first, then by createdAt (newest first)
    return tasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  } catch (error) {
    console.error('Error loading tasks:', error)
    return []
  }
}

/**
 * Get a single task by ID
 */
export async function getTask(id: string): Promise<Task | null> {
  const tasks = await getTasks()
  return tasks.find(task => task.id === id) ?? null
}

/**
 * Create a new task
 */
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const tasks = await getTasks()

  const newTask: Task = {
    id: generateId(),
    title: input.title,
    description: input.description,
    completed: false,
    priority: input.priority ?? 'medium',
    dueDate: input.dueDate,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const updatedTasks = [...tasks, newTask]
  await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks))

  return newTask
}

/**
 * Update an existing task
 */
export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task | null> {
  const tasks = await getTasks()
  const taskIndex = tasks.findIndex(task => task.id === id)

  if (taskIndex === -1) {
    return null
  }

  const updatedTask: Task = {
    ...tasks[taskIndex],
    ...input,
    updatedAt: new Date().toISOString(),
  }

  tasks[taskIndex] = updatedTask
  await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks))

  return updatedTask
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<boolean> {
  const tasks = await getTasks()
  const filteredTasks = tasks.filter(task => task.id !== id)

  if (filteredTasks.length === tasks.length) {
    return false // Task not found
  }

  await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(filteredTasks))
  return true
}

/**
 * Toggle task completion status
 */
export async function toggleTask(id: string): Promise<Task | null> {
  const task = await getTask(id)
  if (!task) return null

  return updateTask(id, { completed: !task.completed })
}

/**
 * Delete all completed tasks
 */
export async function clearCompleted(): Promise<number> {
  const tasks = await getTasks()
  const incompleteTasks = tasks.filter(task => !task.completed)
  const deletedCount = tasks.length - incompleteTasks.length

  await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(incompleteTasks))
  return deletedCount
}

/**
 * Get task statistics
 */
export async function getTaskStats() {
  const tasks = await getTasks()

  return {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    incomplete: tasks.filter(t => !t.completed).length,
    byPriority: {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    },
  }
}
