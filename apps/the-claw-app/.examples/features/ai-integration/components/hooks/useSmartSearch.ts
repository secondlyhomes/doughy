/**
 * useSmartSearch Hook
 *
 * Manages search state and logic for the SmartSearch component.
 * Handles both semantic search and chat-with-context functionality.
 */

import { useState, useCallback } from 'react'
import { useRAG } from '../../rag/RAGContext'
import type {
  SmartSearchProps,
  SmartSearchState,
  SmartSearchActions,
  SimilarityResult,
} from '../types'

type UseSmartSearchOptions = Pick<
  SmartSearchProps,
  'resultsLimit' | 'similarityThreshold' | 'metadataFilter' | 'enableHybrid' | 'onResultSelect'
>

interface UseSmartSearchReturn extends SmartSearchState, SmartSearchActions {
  loading: boolean
}

/**
 * Hook for managing smart search functionality
 *
 * @example
 * ```tsx
 * const {
 *   searchQuery,
 *   setSearchQuery,
 *   results,
 *   handleSearch,
 *   loading,
 * } = useSmartSearch({
 *   resultsLimit: 10,
 *   enableHybrid: true,
 * })
 * ```
 */
export function useSmartSearch({
  resultsLimit = 10,
  similarityThreshold = 0.5,
  metadataFilter,
  enableHybrid = true,
  onResultSelect,
}: UseSmartSearchOptions): UseSmartSearchReturn {
  const { search, chatWithContext, loading } = useRAG()

  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SimilarityResult[]>([])
  const [queryCost, setQueryCost] = useState(0)
  const [chatMode, setChatMode] = useState(false)
  const [chatResponse, setChatResponse] = useState('')
  const [chatSources, setChatSources] = useState<SimilarityResult[]>([])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return

    try {
      setChatMode(false)
      setChatResponse('')
      setChatSources([])

      const searchResults = await search({
        query: searchQuery,
        limit: resultsLimit,
        threshold: similarityThreshold,
        metadata: metadataFilter,
        useHybrid: enableHybrid,
      })

      setResults(searchResults.results)
      setQueryCost(searchResults.queryCost)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    }
  }, [searchQuery, search, resultsLimit, similarityThreshold, metadataFilter, enableHybrid])

  const handleChatWithContext = useCallback(async () => {
    if (!searchQuery.trim()) return

    try {
      setChatMode(true)
      setResults([])

      const response = await chatWithContext({
        query: searchQuery,
        maxContextDocs: 3,
      })

      setChatResponse(response.content)
      setChatSources(response.sources)
      setQueryCost(response.totalCost)
    } catch (error) {
      console.error('Chat with context failed:', error)
      setChatResponse('Sorry, I encountered an error. Please try again.')
    }
  }, [searchQuery, chatWithContext])

  const handleResultPress = useCallback(
    (result: SimilarityResult) => {
      onResultSelect?.(result)
    },
    [onResultSelect]
  )

  return {
    // State
    searchQuery,
    results,
    queryCost,
    chatMode,
    chatResponse,
    chatSources,
    loading,
    // Actions
    setSearchQuery,
    handleSearch,
    handleChatWithContext,
    handleResultPress,
  }
}
