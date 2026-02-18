/**
 * useRAG Hook
 *
 * Hook to access RAG context for document ingestion, search, and chat
 */

import { useContext } from 'react'
import { RAGContext } from '../RAGProvider'
import type { RAGContextValue } from '../types'

/**
 * Hook to access RAG context
 *
 * @example
 * ```tsx
 * import { useRAG } from '@/features/ai-integration/rag'
 *
 * function SearchScreen() {
 *   const { search, chatWithContext } = useRAG()
 *
 *   const handleSearch = async (query: string) => {
 *     const results = await search({ query, limit: 5 })
 *     console.log(`Found ${results.totalResults} documents`)
 *   }
 *
 *   const handleChat = async (query: string) => {
 *     const response = await chatWithContext({ query })
 *     console.log(response.content)
 *     console.log(`Sources: ${response.sources.length}`)
 *   }
 *
 *   return <SearchInterface onSearch={handleSearch} onChat={handleChat} />
 * }
 * ```
 */
export function useRAG(): RAGContextValue {
  const context = useContext(RAGContext)
  if (!context) {
    throw new Error('useRAG must be used within a RAGProvider')
  }
  return context
}
