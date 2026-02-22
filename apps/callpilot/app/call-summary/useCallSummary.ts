/**
 * Call Summary — Data Hook
 *
 * All state management, data fetching, and callbacks for the call summary screen.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { triggerImpact } from '@/utils/haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { useMemos } from '@/hooks'
import { getSuggestedUpdates, approveUpdates } from '@/services/callsService'
import type { SuggestedUpdate } from '@/services/callsService'
import { isMockMode } from '@/services/supabaseClient'
import { getMockCallResult, clearMockCallResult } from '@/services/mockCallStore'
import type { ExtractionField, ExtractionGroup, CallSummary } from '@/types'
import { generateMockSummary, generateMockExtractionGroups } from './call-summary-helpers'

export function useCallSummary() {
  const { callId } = useLocalSearchParams<{ callId: string }>()
  const router = useRouter()
  const { getSummaryForCall, loadSummaryForCall, isLoading: memosLoading } = useMemos()

  // ALL hooks must be declared before any conditional returns
  const cachedSummary = getSummaryForCall(callId ?? '')
  const [asyncSummary, setAsyncSummary] = useState<CallSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(!cachedSummary && !!callId)
  const [extractionGroups, setExtractionGroups] = useState<ExtractionGroup[]>([])
  const [rawUpdates, setRawUpdates] = useState<SuggestedUpdate[]>([])
  const rawUpdatesRef = useRef(rawUpdates)
  rawUpdatesRef.current = rawUpdates
  const [crmLoading, setCrmLoading] = useState(false)
  const [crmSynced, setCrmSynced] = useState(false)
  const [crmError, setCrmError] = useState<string | null>(null)

  // Check for mock call result
  const mockResult = useMemo(() => {
    if (!callId) return undefined
    return getMockCallResult(callId)
  }, [callId])

  // Generate mock summary if we have a mock call result
  const mockSummary = useMemo(() => {
    if (!mockResult) return undefined
    return generateMockSummary(
      callId ?? '',
      mockResult.contactId,
      mockResult.contactName,
      mockResult.duration,
      mockResult.extractedData,
    )
  }, [callId, mockResult])

  // Load async summary if needed
  useEffect(() => {
    if (cachedSummary || mockSummary || !callId) {
      setSummaryLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      try {
        const result = await loadSummaryForCall(callId!)
        if (!cancelled) setAsyncSummary(result || null)
      } catch (err) {
        if (__DEV__) console.warn('[CallSummary] async load failed:', err)
      } finally {
        if (!cancelled) setSummaryLoading(false)
      }
    }
    load().catch(() => {})
    return () => { cancelled = true }
  }, [callId, cachedSummary, mockSummary, loadSummaryForCall])

  // Set up mock extraction groups
  useEffect(() => {
    if (mockResult && !crmSynced) {
      const groups = generateMockExtractionGroups(
        mockResult.contactName,
        mockResult.extractedData,
      )
      setExtractionGroups(groups)
    }
  }, [mockResult, crmSynced])

  // Load real CRM suggestions (non-mock mode)
  useEffect(() => {
    if (!callId || isMockMode || mockResult) {
      return
    }
    setCrmLoading(true)
    let cancelled = false
    async function load() {
      try {
        const updates = await getSuggestedUpdates(callId!)
        if (cancelled) return
        setRawUpdates(updates)
        const groupMap = new Map<string, { fields: ExtractionField[]; table: string }>()
        for (const u of updates) {
          const key = u.target_table || 'Other'
          if (!groupMap.has(key)) groupMap.set(key, { fields: [], table: key })
          groupMap.get(key)!.fields.push({
            field: u.field_name,
            value: u.suggested_value,
            confidence: (u.confidence === 'high' || u.confidence === 'medium' || u.confidence === 'low')
              ? u.confidence : 'medium',
            sourceQuote: u.source_quote || '',
            targetTable: u.target_table,
            targetColumn: u.field_name,
            targetPath: null,
            currentValue: u.current_value ?? null,
            action: (u.current_value !== null && u.current_value !== undefined) ? 'overwrite' : 'fill_empty',
          })
        }
        const groups: ExtractionGroup[] = Array.from(groupMap.entries()).map(([table, data]) => ({
          label: table.includes('properties') ? 'Property' : table.includes('leads') ? 'Contact' : table,
          icon: table.includes('properties') ? '\uD83C\uDFE0' : '\uD83D\uDC64',
          entityId: null,
          fields: data.fields,
        }))
        setExtractionGroups(groups)
      } catch (err) {
        console.error('[CallSummary] getSuggestedUpdates failed:', err)
        if (!cancelled) setCrmError(err instanceof Error ? err.message : 'Failed to load CRM suggestions')
      } finally {
        if (!cancelled) setCrmLoading(false)
      }
    }
    load().catch(() => {})
    return () => { cancelled = true }
  }, [callId, mockResult])

  const summary = cachedSummary || mockSummary || asyncSummary

  // Sync crmSynced from summary
  useEffect(() => {
    if (summary?.crmSynced) setCrmSynced(true)
  }, [summary?.crmSynced])

  const handleApproveField = useCallback(async (field: ExtractionField) => {
    if (mockResult) {
      // Mock mode: just remove the field from the UI
      triggerImpact(ImpactFeedbackStyle.Medium)
      setExtractionGroups((prev) =>
        prev.map((g) => ({ ...g, fields: g.fields.filter((f) => f.field !== field.field) }))
          .filter((g) => g.fields.length > 0)
      )
      return
    }
    if (!callId) return
    const update = rawUpdatesRef.current.find((u) => u.field_name === field.field)
    if (!update) return
    try {
      await approveUpdates(callId, [update.id])
      triggerImpact(ImpactFeedbackStyle.Medium)
      setRawUpdates((prev) => prev.filter((u) => u.id !== update.id))
      setExtractionGroups((prev) =>
        prev.map((g) => ({ ...g, fields: g.fields.filter((f) => f.field !== field.field) }))
          .filter((g) => g.fields.length > 0)
      )
    } catch (err) {
      Alert.alert('Push Failed', err instanceof Error ? err.message : 'Could not push to CRM.')
    }
  }, [callId, mockResult])

  const handleSkipField = useCallback((_field: ExtractionField) => {
    setExtractionGroups((prev) =>
      prev.map((g) => ({ ...g, fields: g.fields.filter((f) => f.field !== _field.field) }))
        .filter((g) => g.fields.length > 0)
    )
  }, [])

  const handleApproveAllEmpty = useCallback(async () => {
    if (mockResult) {
      // Mock mode: mark all as synced
      triggerImpact(ImpactFeedbackStyle.Heavy)
      setCrmSynced(true)
      setExtractionGroups([])
      clearMockCallResult(callId ?? '')
      return
    }
    if (!callId) return
    const pendingIds = rawUpdatesRef.current.filter((u) => u.status !== 'approved').map((u) => u.id)
    if (pendingIds.length === 0) return
    try {
      await approveUpdates(callId, pendingIds)
      triggerImpact(ImpactFeedbackStyle.Heavy)
      setCrmSynced(true)
      setExtractionGroups([])
      setRawUpdates([])
    } catch (err) {
      Alert.alert('Push Failed', err instanceof Error ? err.message : 'Could not push to CRM.')
    }
  }, [callId, mockResult])

  const handleDone = useCallback(() => {
    if (mockResult) clearMockCallResult(callId ?? '')
    router.dismissAll()
  }, [router, callId, mockResult])

  return {
    callId,
    summary,
    summaryLoading,
    memosLoading,
    extractionGroups,
    crmLoading,
    crmSynced,
    crmError,
    handleApproveField,
    handleSkipField,
    handleApproveAllEmpty,
    handleDone,
  }
}
