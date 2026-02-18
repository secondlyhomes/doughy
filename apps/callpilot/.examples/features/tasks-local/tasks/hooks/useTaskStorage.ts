/**
 * useTaskStorage Hook
 *
 * Manages AsyncStorage operations for tasks
 * Handles loading, error states, and stats computation
 */

import { useState, useEffect, useCallback } from 'react'
import type { Task } from '../../types'
import type { TaskStats, TasksState } from '../types'
import * as TaskStorage from '../../storage'

const DEFAULT_STATS: TaskStats = {
  total: 0,
  completed: 0,
  incomplete: 0,
  byPriority: { high: 0, medium: 0, low: 0 },
}

interface UseTaskStorageReturn extends TasksState {
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setError: React.Dispatch<React.SetStateAction<string | null>>
  loadTasks: () => Promise<void>
}

/**
 * Hook for managing task storage state
 *
 * @returns Task state and storage operations
 */
export function useTaskStorage(): UseTaskStorageReturn {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TaskStats>(DEFAULT_STATS)

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const loadedTasks = await TaskStorage.getTasks()
      setTasks(loadedTasks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateStats = useCallback(async () => {
    const newStats = await TaskStorage.getTaskStats()
    setStats(newStats)
  }, [])

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Update stats whenever tasks change
  useEffect(() => {
    updateStats()
  }, [tasks, updateStats])

  return {
    tasks,
    loading,
    error,
    stats,
    setTasks,
    setError,
    loadTasks,
  }
}
