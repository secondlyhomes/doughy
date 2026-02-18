/**
 * Hook for fetching and managing audit logs
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../../../services/supabase'
import { AuditLog, FilterOptions, AuditStatistics } from '../types'

export interface UseAuditLogsReturn {
  logs: AuditLog[]
  loading: boolean
  refreshing: boolean
  statistics: AuditStatistics
  fetchLogs: () => Promise<void>
}

export function useAuditLogs(filters: FilterOptions): UseAuditLogsReturn {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('audit_logs')
        .select(
          `
          *,
          user:auth.users(email)
        `
        )
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.resourceType) {
        query = query.eq('resource_type', filters.resourceType)
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString())
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      setLogs(data || [])
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Real-time updates subscription
  useEffect(() => {
    const subscription = supabase
      .channel('audit_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          setLogs((prev) => [payload.new as AuditLog, ...prev])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Compute statistics from logs
  const statistics = useMemo<AuditStatistics>(() => {
    return {
      total: logs.length,
      byAction: logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      bySeverity: logs.reduce((acc, log) => {
        acc[log.severity] = (acc[log.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      criticalEvents: logs.filter((l) => l.severity === 'critical').length,
      errorEvents: logs.filter((l) => l.severity === 'error').length,
    }
  }, [logs])

  return {
    logs,
    loading,
    refreshing,
    statistics,
    fetchLogs,
  }
}
