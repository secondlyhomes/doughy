/**
 * useCallStream
 *
 * Merges transcript lines and AI suggestions from useMockCallSimulation
 * into a single sorted StreamItem[] for the unified call stream.
 *
 * Transcript lines get integer orders (0, 1, 2...).
 * Suggestions get fractional orders (3.5, 5.51, 5.52...) so they slot in
 * right after the line that triggered them.
 */

import { useState, useMemo, useCallback } from 'react'
import { useMockCallSimulation } from './useMockCallSimulation'
import type { StreamItem, StreamFilter } from '@/types/callStream'

export interface UseCallStreamReturn {
  stream: StreamItem[]
  filteredStream: StreamItem[]
  filter: StreamFilter
  setFilter: (filter: StreamFilter) => void
  isSimulating: boolean
  isComplete: boolean
  dismissSuggestion: (id: string) => void
  extractedData: ReturnType<typeof useMockCallSimulation>['extractedData']
  counts: { transcript: number; suggestions: number; active: number }
}

export function useCallStream(
  enabled: boolean = true,
  intervalMs: number = 3000,
): UseCallStreamReturn {
  const { transcript, suggestions, isSimulating, isComplete, extractedData } =
    useMockCallSimulation(enabled, intervalMs)

  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<StreamFilter>('all')

  const dismissSuggestion = useCallback((id: string) => {
    setDismissed(prev => new Set(prev).add(id))
  }, [])

  const stream = useMemo<StreamItem[]>(() => {
    const items: StreamItem[] = []

    for (const line of transcript) {
      const lineIndex = parseInt(line.id.replace('line-', ''), 10)
      items.push({
        type: 'transcript',
        id: line.id,
        order: lineIndex,
        speaker: line.speaker,
        text: line.text,
        timestamp: line.timestamp,
      })
    }

    // Group suggestions by appearsAtLine for stable multi-suggestion ordering
    for (let i = 0; i < suggestions.length; i++) {
      const s = suggestions[i]!
      // Find how many earlier suggestions share the same appearsAtLine
      const sameLineBefore = suggestions
        .slice(0, i)
        .filter(prev => prev.appearsAtLine === s.appearsAtLine).length
      items.push({
        type: 'suggestion',
        id: s.id,
        order: s.appearsAtLine + 0.5 + sameLineBefore * 0.01,
        suggestionType: s.type,
        text: s.text,
        dismissed: dismissed.has(s.id),
      })
    }

    items.sort((a, b) => a.order - b.order)
    return items
  }, [transcript, suggestions, dismissed])

  const filteredStream = useMemo(() => {
    if (filter === 'all') return stream
    if (filter === 'minimal') return []
    if (filter === 'transcript') return stream.filter(i => i.type === 'transcript')
    if (filter === 'suggestions') return stream.filter(i => i.type === 'suggestion')
    return stream
  }, [stream, filter])

  const counts = useMemo(() => {
    const transcriptCount = stream.filter(i => i.type === 'transcript').length
    const suggestionCount = stream.filter(i => i.type === 'suggestion').length
    const activeCount = stream.filter(
      i => i.type === 'suggestion' && !i.dismissed,
    ).length
    return { transcript: transcriptCount, suggestions: suggestionCount, active: activeCount }
  }, [stream])

  return {
    stream,
    filteredStream,
    filter,
    setFilter,
    isSimulating,
    isComplete,
    dismissSuggestion,
    extractedData,
    counts,
  }
}
