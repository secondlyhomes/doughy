/**
 * RAG Module
 *
 * Retrieval-Augmented Generation for context-aware AI responses
 */

// Provider
export { RAGProvider, RAGContext } from './RAGProvider'

// Hook
export { useRAG } from './hooks/useRAG'

// Types
export type {
  RAGSearchResult,
  RAGChatResponse,
  RAGContextValue,
  RAGProviderProps,
  IngestDocumentParams,
  IngestLongDocumentParams,
  SearchParams,
  ChatWithContextParams,
  FindRelatedParams,
  EmbeddingModel,
} from './types'

// Utilities (for advanced use cases)
export {
  buildContextFromResults,
  buildSystemPrompt,
  buildChatMessages,
  mapResultsToSources,
  extractErrorMessage,
} from './utils'
