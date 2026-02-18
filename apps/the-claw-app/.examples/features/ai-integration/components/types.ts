/**
 * Smart Search Types
 *
 * Type definitions for the SmartSearch component and related functionality.
 */

import type { SimilarityResult } from '../rag/vectorStore'

/**
 * Props for the SmartSearch component
 */
export interface SmartSearchProps {
  /**
   * Placeholder text for search input
   */
  placeholder?: string

  /**
   * Enable hybrid search (semantic + keyword)
   */
  enableHybrid?: boolean

  /**
   * Number of results to show
   */
  resultsLimit?: number

  /**
   * Similarity threshold (0-1)
   */
  similarityThreshold?: number

  /**
   * Show cost information
   */
  showCost?: boolean

  /**
   * Metadata filter for search
   */
  metadataFilter?: Record<string, unknown>

  /**
   * Callback when result is selected
   */
  onResultSelect?: (result: SimilarityResult) => void

  /**
   * Enable "Chat with context" feature
   */
  enableChat?: boolean
}

/**
 * State for the smart search hook
 */
export interface SmartSearchState {
  searchQuery: string
  results: SimilarityResult[]
  queryCost: number
  chatMode: boolean
  chatResponse: string
  chatSources: SimilarityResult[]
}

/**
 * Actions returned by the smart search hook
 */
export interface SmartSearchActions {
  setSearchQuery: (query: string) => void
  handleSearch: () => Promise<void>
  handleChatWithContext: () => Promise<void>
  handleResultPress: (result: SimilarityResult) => void
}

/**
 * Props for SearchResultCard component
 */
export interface SearchResultCardProps {
  result: SimilarityResult
  onPress: (result: SimilarityResult) => void
}

/**
 * Props for ChatResponse component
 */
export interface ChatResponseProps {
  response: string
  sources: SimilarityResult[]
  queryCost: number
  showCost: boolean
  onSourcePress: (source: SimilarityResult) => void
}

/**
 * Re-export SimilarityResult for convenience
 */
export type { SimilarityResult } from '../rag/vectorStore'
