/**
 * useTasks Hook
 *
 * Core hook for accessing tasks context and managing task state
 */

import { useState, useEffect, useRef, useContext, createContext } from 'react'
import { supabase } from '@/services/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Task, TaskRow, TaskStats, TasksContextValue } from '../types'
import { transformTask } from '../types'
import * as TaskAPI from '../api'

export const TasksContext = createContext<TasksContextValue | undefined>(undefined)

const DEFAULT_STATS: TaskStats = {
  total: 0,
  completed: 0,
  incomplete: 0,
  byPriority: { high: 0, medium: 0, low: 0 },
}

interface UseTasksStateOptions {
  enableRealtime?: boolean
  enableRetry?: boolean
  maxRetries?: number
}

/**
 * Internal hook for managing tasks state
 */
export function useTasksState(options: UseTasksStateOptions = {}) {
  const { enableRealtime = true, enableRetry = true, maxRetries = 3 } = options

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TaskStats>(DEFAULT_STATS)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [])

  // Update stats whenever tasks change
  useEffect(() => {
    updateStats()
  }, [tasks])

  // Setup real-time subscription
  useEffect(() => {
    if (!enableRealtime) return

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => handleRealtimeEvent(payload)
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enableRealtime])

  // Cleanup retry timeout
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  function handleRealtimeEvent(payload: any) {
    try {
      if (payload.eventType === 'INSERT') {
        const newTask = transformTask(payload.new as TaskRow)
        setTasks(prev => {
          if (prev.some(t => t.id === newTask.id)) return prev
          return [newTask, ...prev]
        })
      } else if (payload.eventType === 'UPDATE') {
        const updatedTask = transformTask(payload.new as TaskRow)
        setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)))
      } else if (payload.eventType === 'DELETE') {
        setTasks(prev => prev.filter(t => t.id !== payload.old.id))
      }
    } catch (err) {
      console.error('Error handling realtime event:', err)
    }
  }

  async function loadTasks(retryCount = 0) {
    try {
      setLoading(true)
      setError(null)
      const loadedTasks = await TaskAPI.getTasks()
      setTasks(loadedTasks)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load tasks'
      setError(message)

      if (enableRetry && retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        retryTimeoutRef.current = setTimeout(() => loadTasks(retryCount + 1), delay)
      }
    } finally {
      setLoading(false)
    }
  }

  function updateStats() {
    setStats({
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      incomplete: tasks.filter(t => !t.completed).length,
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length,
      },
    })
  }

  return {
    tasks,
    setTasks,
    loading,
    error,
    setError,
    stats,
    refresh: loadTasks,
  }
}

/**
 * Hook to access tasks context
 */
export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
}
