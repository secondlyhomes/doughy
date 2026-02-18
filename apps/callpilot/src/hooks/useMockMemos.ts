/**
 * Mock Voice Memos Hook
 *
 * Provides voice memo and call summary data.
 * Will be replaced with real recording + AI analysis in Phase 2.
 */

import { useState, useCallback } from 'react'
import type { VoiceMemo, CallSummary } from '@/types'
import { mockVoiceMemos, mockCallSummaries } from '@/mocks'

export interface UseMockMemosReturn {
  voiceMemos: VoiceMemo[]
  callSummaries: CallSummary[]
  getMemoForCall: (callId: string) => VoiceMemo | undefined
  getSummaryForCall: (callId: string) => CallSummary | undefined
  isRecording: boolean
  recordingDuration: number
  startRecording: () => void
  stopRecording: () => void
}

export function useMockMemos(): UseMockMemosReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const voiceMemos = mockVoiceMemos
  const callSummaries = mockCallSummaries

  const getMemoForCall = useCallback(
    (callId: string) => voiceMemos.find((m) => m.callId === callId),
    [voiceMemos]
  )

  const getSummaryForCall = useCallback(
    (callId: string) => callSummaries.find((s) => s.callId === callId),
    [callSummaries]
  )

  const startRecording = useCallback(() => {
    setIsRecording(true)
    setRecordingDuration(0)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
  }, [])

  return {
    voiceMemos,
    callSummaries,
    getMemoForCall,
    getSummaryForCall,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
  }
}
