/**
 * useCost Hook
 *
 * Wraps the cost store with gateway adapter calls.
 * Loads cost data on mount when adapter is available.
 */

import { useCallback, useEffect } from 'react'
import { useCostStore } from '@/stores/useCostStore'
import { useConnectionContext } from '@/contexts/ConnectionContext'

export const useCost = () => {
  const { summary, loading, error, setSummary, setLoading, setError } = useCostStore()

  const { adapter } = useConnectionContext()

  const loadCost = useCallback(async () => {
    if (!adapter) return
    setLoading(true)
    try {
      const data = await adapter.getMonthlyCost()
      setSummary(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cost')
    } finally {
      setLoading(false)
    }
  }, [adapter, setSummary, setLoading, setError])

  useEffect(() => {
    loadCost()
  }, [loadCost])

  return { summary, loading, error, loadCost }
}
