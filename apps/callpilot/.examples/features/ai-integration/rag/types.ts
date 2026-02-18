/**
 * RAG Context Types
 *
 * Type definitions for Retrieval-Augmented Generation (RAG)
 */

import type { AIModel } from '../AIContext'
import type { SimilarityResult } from './vectorStore'

/**
 * RAG search result with document context
 */
export interface RAGSearchResult {
  results: SimilarityResult[]
  queryCost: number
  totalResults: number
}

/**
 * RAG chat response with sources
 */
export interface RAGChatResponse {
  content: string
  sources: Array<{
    id: string
    content: string
    similarity: number
  }>
  model: AIModel
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  cost: number
  totalCost: number // Including embedding cost
}

/**
 * Parameters for ingesting a single document
 */
export interface IngestDocumentParams {
  content: string
  metadata?: Record<string, any>
  id?: string
}

/**
 * Parameters for ingesting a long document with chunking
 */
export interface IngestLongDocumentParams {
  content: string
  chunkSize?: number
  metadata?: Record<string, any>
  baseId?: string
}

/**
 * Parameters for semantic search
 */
export interface SearchParams {
  query: string
  limit?: number
  threshold?: number
  metadata?: Record<string, any>
  useHybrid?: boolean
}

/**
 * Parameters for chat with RAG context
 */
export interface ChatWithContextParams {
  query: string
  model?: AIModel
  maxContextDocs?: number
  systemPrompt?: string
}

/**
 * Parameters for finding related documents
 */
export interface FindRelatedParams {
  documentId: string
  limit?: number
  threshold?: number
}

/**
 * RAG Context value interface
 */
export interface RAGContextValue {
  /** Loading state */
  loading: boolean
  /** Error message */
  error: string | null
  /** Ingest a single document */
  ingestDocument: (params: IngestDocumentParams) => Promise<{ id: string; cost: number }>
  /** Ingest long document with chunking */
  ingestLongDocument: (params: IngestLongDocumentParams) => Promise<{ chunks: Array<{ id: string }>; cost: number }>
  /** Search documents semantically */
  search: (params: SearchParams) => Promise<RAGSearchResult>
  /** Chat with RAG (retrieves relevant context and generates response) */
  chatWithContext: (params: ChatWithContextParams) => Promise<RAGChatResponse>
  /** Find documents related to a given document */
  findRelated: (params: FindRelatedParams) => Promise<SimilarityResult[]>
}

/**
 * RAG Provider props
 */
export interface RAGProviderProps {
  children: React.ReactNode
  /** Default embedding model (default: text-embedding-3-small) */
  embeddingModel?: 'text-embedding-3-small' | 'text-embedding-3-large'
}

/**
 * Embedding model type
 */
export type EmbeddingModel = 'text-embedding-3-small' | 'text-embedding-3-large'
