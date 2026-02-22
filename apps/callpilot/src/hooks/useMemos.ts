/**
 * Memos Hook
 *
 * Production hook that loads voice memos and call summaries from memosService.
 * Supports on-demand server loading for individual call summaries.
 */

import { useState, useEffect, useCallback } from 'react'
import type { VoiceMemo, CallSummary } from '@/types'
import * as memosService from '@/services/memosService'

export interface UseMemosReturn {
  voiceMemos: VoiceMemo[]
  callSummaries: CallSummary[]
  getMemoForCall: (callId: string) => VoiceMemo | undefined
  getSummaryForCall: (callId: string) => CallSummary | undefined
  loadSummaryForCall: (callId: string) => Promise<CallSummary | undefined>
  isRecording: boolean
  recordingDuration: number
  startRecording: () => void
  stopRecording: () => void
  isLoading: boolean
  error: string | null
}

export function useMemos(): UseMemosReturn {
  const [voiceMemos, setVoiceMemos] = useState<VoiceMemo[]>([])
  const [callSummaries, setCallSummaries] = useState<CallSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load(): Promise<void> {
      try {
        const [memos, summaries] = await Promise.all([
          memosService.getVoiceMemos(),
          memosService.getCallSummaries(),
        ])
        if (!cancelled) {
          setVoiceMemos(memos)
          setCallSummaries(summaries)
          setIsLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load memos')
          setIsLoading(false)
        }
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const getMemoForCall = useCallback(
    (callId: string): VoiceMemo | undefined =>
      voiceMemos.find((m) => m.callId === callId),
    [voiceMemos]
  )

  const getSummaryForCall = useCallback(
    (callId: string): CallSummary | undefined =>
      callSummaries.find((s) => s.callId === callId),
    [callSummaries]
  )

  const loadSummaryForCall = useCallback(
    async (callId: string): Promise<CallSummary | undefined> => {
      // Check local cache first
      const cached = callSummaries.find((s) => s.callId === callId)
      if (cached) return cached

      // Fetch from server
      const summary = await memosService.getSummaryForCall(callId)
      if (summary) {
        // Add to local cache
        setCallSummaries((prev) => {
          if (prev.some((s) => s.callId === callId)) return prev
          return [...prev, summary]
        })
      }
      return summary
    },
    [callSummaries]
  )

  const startRecording = useCallback((): void => {
    setIsRecording(true)
    setRecordingDuration(0)
  }, [])

  const stopRecording = useCallback((): void => {
    setIsRecording(false)
  }, [])

  return {
    voiceMemos,
    callSummaries,
    getMemoForCall,
    getSummaryForCall,
    loadSummaryForCall,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    isLoading,
    error,
  }
}
