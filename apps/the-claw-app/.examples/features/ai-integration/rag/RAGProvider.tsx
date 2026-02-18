/**
 * RAG Provider
 *
 * React Context Provider for Retrieval-Augmented Generation (RAG)
 */

import React, { createContext, useState, useCallback } from 'react'
import { embedAndStore, embedAndStoreChunked, embedQuery } from './embeddings'
import { semanticSearch, hybridSearch, findRelatedDocuments } from './similarity'
import { chatCompletion } from '../aiService'
import type { SimilarityResult } from './vectorStore'
import type {
  RAGContextValue,
  RAGProviderProps,
  RAGSearchResult,
  RAGChatResponse,
  IngestDocumentParams,
  IngestLongDocumentParams,
  SearchParams,
  ChatWithContextParams,
  FindRelatedParams,
} from './types'
import {
  buildContextFromResults,
  buildSystemPrompt,
  buildChatMessages,
  mapResultsToSources,
  extractErrorMessage,
} from './utils'

export const RAGContext = createContext<RAGContextValue | undefined>(undefined)

/**
 * RAG Provider Component
 *
 * @example
 * ```tsx
 * import { RAGProvider } from '@/features/ai-integration/rag'
 *
 * export default function RootLayout() {
 *   return (
 *     <RAGProvider embeddingModel="text-embedding-3-small">
 *       <Stack />
 *     </RAGProvider>
 *   )
 * }
 * ```
 */
export function RAGProvider({ children, embeddingModel = 'text-embedding-3-small' }: RAGProviderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ingestDocument = useCallback(
    async (params: IngestDocumentParams): Promise<{ id: string; cost: number }> => {
      try {
        setLoading(true)
        setError(null)
        const result = await embedAndStore({ ...params, model: embeddingModel })
        return { id: result.id, cost: result.cost }
      } catch (err) {
        const message = extractErrorMessage(err, 'Failed to ingest document')
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [embeddingModel]
  )

  const ingestLongDocument = useCallback(
    async (params: IngestLongDocumentParams): Promise<{ chunks: Array<{ id: string }>; cost: number }> => {
      try {
        setLoading(true)
        setError(null)
        const result = await embedAndStoreChunked({ ...params, model: embeddingModel })
        return {
          chunks: result.chunks.map((chunk) => ({ id: chunk.id })),
          cost: result.totalCost,
        }
      } catch (err) {
        const message = extractErrorMessage(err, 'Failed to ingest long document')
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [embeddingModel]
  )

  const search = useCallback(
    async (params: SearchParams): Promise<RAGSearchResult> => {
      try {
        setLoading(true)
        setError(null)

        const { query, limit = 10, threshold = 0.5, metadata, useHybrid = false } = params
        let results: SimilarityResult[]
        let queryCost = 0

        if (useHybrid) {
          const hybridResults = await hybridSearch({ query, limit, threshold, metadata, model: embeddingModel })
          results = hybridResults.map((r) => ({
            id: r.id,
            content: r.content,
            metadata: r.metadata,
            similarity: r.hybridScore,
          }))
          const { cost } = await embedQuery({ query, model: embeddingModel })
          queryCost = cost
        } else {
          const semanticResults = await semanticSearch({ query, limit, threshold, metadata, model: embeddingModel })
          results = semanticResults
          queryCost = semanticResults[0]?.queryCost || 0
        }

        return { results, queryCost, totalResults: results.length }
      } catch (err) {
        const message = extractErrorMessage(err, 'Search failed')
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [embeddingModel]
  )

  const chatWithContext = useCallback(
    async (params: ChatWithContextParams): Promise<RAGChatResponse> => {
      try {
        setLoading(true)
        setError(null)

        const { query, model = 'gpt-4o-mini', maxContextDocs = 3, systemPrompt } = params

        const searchResults = await semanticSearch({
          query,
          limit: maxContextDocs,
          threshold: 0.5,
          model: embeddingModel,
        })

        const context = buildContextFromResults(searchResults)
        const finalSystemPrompt = buildSystemPrompt(context, systemPrompt)
        const messages = buildChatMessages(finalSystemPrompt, query)

        const completion = await chatCompletion({ messages, model, temperature: 0.7, maxTokens: 500 })

        const queryCost = searchResults[0]?.queryCost || 0
        const totalCost = queryCost + completion.cost

        return {
          content: completion.content,
          sources: mapResultsToSources(searchResults),
          model,
          tokens: completion.tokens,
          cost: completion.cost,
          totalCost,
        }
      } catch (err) {
        const message = extractErrorMessage(err, 'Chat with context failed')
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [embeddingModel]
  )

  const findRelated = useCallback(async (params: FindRelatedParams): Promise<SimilarityResult[]> => {
    try {
      setLoading(true)
      setError(null)
      return await findRelatedDocuments(params)
    } catch (err) {
      const message = extractErrorMessage(err, 'Failed to find related documents')
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const value: RAGContextValue = {
    loading,
    error,
    ingestDocument,
    ingestLongDocument,
    search,
    chatWithContext,
    findRelated,
  }

  return <RAGContext.Provider value={value}>{children}</RAGContext.Provider>
}
