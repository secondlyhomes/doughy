/**
 * RAG Utilities
 *
 * Helper functions for RAG operations
 */

import type { ChatMessage } from '../aiService'
import type { SimilarityResult } from './vectorStore'

/**
 * Build context string from search results
 */
export function buildContextFromResults(results: SimilarityResult[]): string {
  return results.map((result, i) => `[${i + 1}] ${result.content}`).join('\n\n')
}

/**
 * Build default system prompt with context
 */
export function buildSystemPrompt(context: string, customPrompt?: string): string {
  if (customPrompt) {
    return customPrompt
  }

  return `You are a helpful assistant. Answer the user's question based on the provided context.

Context:
${context}

Instructions:
- Use the context above to answer the question
- If the context doesn't contain relevant information, say so
- Cite sources by their numbers [1], [2], etc.
- Be concise and accurate`
}

/**
 * Build chat messages for RAG completion
 */
export function buildChatMessages(systemPrompt: string, userQuery: string): ChatMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userQuery },
  ]
}

/**
 * Map search results to source format
 */
export function mapResultsToSources(
  results: SimilarityResult[]
): Array<{ id: string; content: string; similarity: number }> {
  return results.map((result) => ({
    id: result.id,
    content: result.content,
    similarity: result.similarity,
  }))
}

/**
 * Extract error message from unknown error
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}
