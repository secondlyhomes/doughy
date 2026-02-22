/**
 * Call Stream Types
 *
 * Discriminated union for unified call stream items — transcript lines
 * and AI suggestions interleave in a single sorted array.
 */

export interface TranscriptStreamItem {
  type: 'transcript'
  id: string
  order: number // lineIndex (integer)
  speaker: 'user' | 'contact'
  text: string
  timestamp: number
}

export interface SuggestionStreamItem {
  type: 'suggestion'
  id: string
  order: number // appearsAtLine + 0.5 (fractional, slots after triggering line)
  suggestionType: 'question' | 'info' | 'action' | 'response'
  text: string
  dismissed: boolean
}

export type StreamItem = TranscriptStreamItem | SuggestionStreamItem

export type StreamFilter = 'all' | 'suggestions' | 'transcript' | 'minimal'
