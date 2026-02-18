/**
 * Similarity Search
 *
 * Utilities for semantic similarity search
 * Features:
 * - Cosine similarity calculation
 * - Semantic search with ranking
 * - Hybrid search (combining vector + keyword)
 * - Re-ranking strategies
 */

import { findSimilar, type SimilarityResult } from './vectorStore'
import { embedQuery } from './embeddings'

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Semantic search with query text
 *
 * @example
 * ```typescript
 * const results = await semanticSearch({
 *   query: 'How do I implement authentication?',
 *   limit: 5,
 *   threshold: 0.7,
 * })
 * ```
 */
export async function semanticSearch(params: {
  query: string
  limit?: number
  threshold?: number
  metadata?: Record<string, any>
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<
  Array<
    SimilarityResult & {
      queryCost: number
    }
  >
> {
  const { query, limit = 10, threshold = 0.5, metadata, model = 'text-embedding-3-small' } = params

  // Generate query embedding
  const { embedding, cost: queryCost } = await embedQuery({ query, model })

  // Search for similar documents
  const results = await findSimilar({
    embedding,
    limit,
    threshold,
    metadata,
  })

  // Add query cost to results
  return results.map(result => ({
    ...result,
    queryCost,
  }))
}

/**
 * Multi-query search (combines results from multiple queries)
 *
 * @example
 * ```typescript
 * const results = await multiQuerySearch({
 *   queries: [
 *     'React Native authentication',
 *     'Mobile app login flow',
 *     'User session management',
 *   ],
 *   limit: 10,
 * })
 * ```
 */
export async function multiQuerySearch(params: {
  queries: string[]
  limit?: number
  threshold?: number
  metadata?: Record<string, any>
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<SimilarityResult[]> {
  const { queries, limit = 10, threshold = 0.5, metadata, model = 'text-embedding-3-small' } = params

  // Search for each query
  const allResults = await Promise.all(
    queries.map(query => semanticSearch({ query, limit: limit * 2, threshold, metadata, model }))
  )

  // Flatten and deduplicate by ID
  const resultMap = new Map<string, SimilarityResult>()

  for (const results of allResults) {
    for (const result of results) {
      const existing = resultMap.get(result.id)
      if (!existing || result.similarity > existing.similarity) {
        resultMap.set(result.id, result)
      }
    }
  }

  // Sort by similarity and take top N
  return Array.from(resultMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

/**
 * Keyword search (simple text matching)
 * Used for hybrid search
 */
function keywordMatch(query: string, content: string): number {
  const queryLower = query.toLowerCase()
  const contentLower = content.toLowerCase()

  // Exact match
  if (contentLower === queryLower) return 1.0

  // Contains query
  if (contentLower.includes(queryLower)) return 0.8

  // Check for word matches
  const queryWords = queryLower.split(/\s+/)
  const contentWords = contentLower.split(/\s+/)
  const matchCount = queryWords.filter(word => contentWords.includes(word)).length

  return matchCount / queryWords.length
}

/**
 * Hybrid search (combines semantic + keyword search)
 *
 * @example
 * ```typescript
 * const results = await hybridSearch({
 *   query: 'React Native authentication',
 *   limit: 5,
 *   vectorWeight: 0.7,  // 70% weight on semantic similarity
 *   keywordWeight: 0.3, // 30% weight on keyword matching
 * })
 * ```
 */
export async function hybridSearch(params: {
  query: string
  limit?: number
  threshold?: number
  metadata?: Record<string, any>
  vectorWeight?: number
  keywordWeight?: number
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<Array<SimilarityResult & { hybridScore: number }>> {
  const {
    query,
    limit = 10,
    threshold = 0.3,
    metadata,
    vectorWeight = 0.7,
    keywordWeight = 0.3,
    model = 'text-embedding-3-small',
  } = params

  // Semantic search with lower threshold to get more candidates
  const semanticResults = await semanticSearch({
    query,
    limit: limit * 3,
    threshold,
    metadata,
    model,
  })

  // Calculate hybrid scores
  const hybridResults = semanticResults.map(result => {
    const keywordScore = keywordMatch(query, result.content)
    const hybridScore = vectorWeight * result.similarity + keywordWeight * keywordScore

    return {
      ...result,
      hybridScore,
    }
  })

  // Sort by hybrid score and take top N
  return hybridResults.sort((a, b) => b.hybridScore - a.hybridScore).slice(0, limit)
}

/**
 * Re-rank results using cross-encoder model
 * (Requires additional Edge Function)
 */
export async function reRankResults(params: {
  query: string
  results: SimilarityResult[]
  limit?: number
}): Promise<Array<SimilarityResult & { reRankScore: number }>> {
  const { query, results, limit = 10 } = params

  // This would call an Edge Function that uses a cross-encoder model
  // For now, return results as-is with similarity as reRankScore
  return results.slice(0, limit).map(result => ({
    ...result,
    reRankScore: result.similarity,
  }))
}

/**
 * Find related documents (documents similar to a given document)
 *
 * @example
 * ```typescript
 * const related = await findRelatedDocuments({
 *   documentId: 'doc-123',
 *   limit: 5,
 * })
 * ```
 */
export async function findRelatedDocuments(params: {
  documentId: string
  limit?: number
  threshold?: number
  metadata?: Record<string, any>
}): Promise<SimilarityResult[]> {
  const { documentId, limit = 10, threshold = 0.7, metadata } = params

  // Get the document
  const { getDocument } = await import('./vectorStore')
  const doc = await getDocument(documentId)

  if (!doc) {
    throw new Error(`Document not found: ${documentId}`)
  }

  // Find similar documents
  const results = await findSimilar({
    embedding: doc.embedding,
    limit: limit + 1, // +1 to account for self-match
    threshold,
    metadata,
  })

  // Filter out the original document
  return results.filter(result => result.id !== documentId).slice(0, limit)
}

/**
 * Group search results by metadata field
 */
export function groupByMetadata<T extends SimilarityResult>(
  results: T[],
  field: string
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const result of results) {
    const value = result.metadata?.[field]
    if (value !== undefined) {
      const key = String(value)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(result)
    }
  }

  return groups
}

/**
 * Filter results by metadata
 */
export function filterByMetadata<T extends SimilarityResult>(
  results: T[],
  filter: Record<string, any>
): T[] {
  return results.filter(result => {
    if (!result.metadata) return false

    return Object.entries(filter).every(([key, value]) => {
      return result.metadata![key] === value
    })
  })
}

/**
 * Deduplicate results by content similarity
 * Useful when you have chunks from the same document
 */
export function deduplicateResults<T extends SimilarityResult>(
  results: T[],
  similarityThreshold: number = 0.95
): T[] {
  const unique: T[] = []

  for (const result of results) {
    const isDuplicate = unique.some(existing => {
      // Simple text similarity check
      const similarity =
        existing.content.toLowerCase().includes(result.content.toLowerCase().slice(0, 100)) ||
        result.content.toLowerCase().includes(existing.content.toLowerCase().slice(0, 100))
      return similarity
    })

    if (!isDuplicate) {
      unique.push(result)
    }
  }

  return unique
}

/**
 * Score boosting based on metadata
 * Useful for promoting certain types of documents
 */
export function boostByMetadata<T extends SimilarityResult>(
  results: T[],
  boosts: Record<string, Record<string, number>>
): Array<T & { boostedScore: number }> {
  return results.map(result => {
    let boost = 1.0

    if (result.metadata) {
      for (const [field, valueBoosts] of Object.entries(boosts)) {
        const value = result.metadata[field]
        if (value !== undefined && valueBoosts[value] !== undefined) {
          boost *= valueBoosts[value]
        }
      }
    }

    return {
      ...result,
      boostedScore: result.similarity * boost,
    }
  })
}

/**
 * Example: Smart search with all optimizations
 */
export async function smartSearch(params: {
  query: string
  limit?: number
  metadata?: Record<string, any>
  useHybrid?: boolean
  deduplicate?: boolean
  boosts?: Record<string, Record<string, number>>
}): Promise<SimilarityResult[]> {
  const { query, limit = 10, metadata, useHybrid = true, deduplicate = true, boosts } = params

  // Get initial results
  let results: SimilarityResult[]

  if (useHybrid) {
    const hybridResults = await hybridSearch({
      query,
      limit: limit * 2,
      metadata,
    })
    // Convert hybrid scores back to similarity
    results = hybridResults.map(r => ({
      id: r.id,
      content: r.content,
      metadata: r.metadata,
      similarity: r.hybridScore,
    }))
  } else {
    results = await semanticSearch({
      query,
      limit: limit * 2,
      metadata,
    })
  }

  // Deduplicate if requested
  if (deduplicate) {
    results = deduplicateResults(results)
  }

  // Apply boosts if provided
  if (boosts) {
    const boosted = boostByMetadata(results, boosts)
    results = boosted
      .sort((a, b) => b.boostedScore - a.boostedScore)
      .map(r => ({
        id: r.id,
        content: r.content,
        metadata: r.metadata,
        similarity: r.boostedScore,
      }))
  }

  return results.slice(0, limit)
}
