/**
 * Vector Store
 *
 * Supabase pgvector integration for storing and querying embeddings
 * Features:
 * - Store document embeddings
 * - Similarity search with cosine distance
 * - Batch operations
 * - Metadata filtering
 */

import { supabase } from '@/services/supabase'

/**
 * Document with embedding
 */
export interface VectorDocument {
  id: string
  content: string
  embedding: number[]
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

/**
 * Similarity search result
 */
export interface SimilarityResult {
  id: string
  content: string
  metadata?: Record<string, any>
  similarity: number
}

/**
 * Store a document with its embedding
 *
 * @example
 * ```typescript
 * await storeDocument({
 *   id: 'doc-123',
 *   content: 'This is a document about machine learning.',
 *   embedding: [0.1, 0.2, ...], // 1536-dimensional vector
 *   metadata: { category: 'tech', author: 'Alice' },
 * })
 * ```
 */
export async function storeDocument(document: {
  id?: string
  content: string
  embedding: number[]
  metadata?: Record<string, any>
}): Promise<VectorDocument> {
  const { id, content, embedding, metadata } = document

  const { data, error } = await supabase
    .from('embeddings')
    .insert({
      id: id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      content,
      embedding,
      metadata: metadata || {},
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to store document: ${error.message}`)
  }

  return {
    id: data.id,
    content: data.content,
    embedding: data.embedding,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Store multiple documents in batch
 *
 * @example
 * ```typescript
 * await storeBatch([
 *   { content: 'Doc 1', embedding: [...] },
 *   { content: 'Doc 2', embedding: [...] },
 *   { content: 'Doc 3', embedding: [...] },
 * ])
 * ```
 */
export async function storeBatch(
  documents: Array<{
    id?: string
    content: string
    embedding: number[]
    metadata?: Record<string, any>
  }>
): Promise<VectorDocument[]> {
  const docsToInsert = documents.map(doc => ({
    id: doc.id || `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    content: doc.content,
    embedding: doc.embedding,
    metadata: doc.metadata || {},
  }))

  const { data, error } = await supabase.from('embeddings').insert(docsToInsert).select()

  if (error) {
    throw new Error(`Failed to store documents: ${error.message}`)
  }

  return data.map(doc => ({
    id: doc.id,
    content: doc.content,
    embedding: doc.embedding,
    metadata: doc.metadata,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  }))
}

/**
 * Find similar documents using cosine similarity
 *
 * @example
 * ```typescript
 * const results = await findSimilar({
 *   embedding: queryEmbedding,
 *   limit: 5,
 *   threshold: 0.7,
 * })
 *
 * results.forEach(result => {
 *   console.log(`${result.content} (${result.similarity})`)
 * })
 * ```
 */
export async function findSimilar(params: {
  embedding: number[]
  limit?: number
  threshold?: number
  metadata?: Record<string, any>
}): Promise<SimilarityResult[]> {
  const { embedding, limit = 10, threshold = 0.5, metadata } = params

  // Call RPC function for similarity search
  const { data, error } = await supabase.rpc('match_embeddings', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
    filter_metadata: metadata || {},
  })

  if (error) {
    throw new Error(`Similarity search failed: ${error.message}`)
  }

  return data.map((row: any) => ({
    id: row.id,
    content: row.content,
    metadata: row.metadata,
    similarity: row.similarity,
  }))
}

/**
 * Get document by ID
 */
export async function getDocument(id: string): Promise<VectorDocument | null> {
  const { data, error } = await supabase.from('embeddings').select('*').eq('id', id).single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    throw new Error(`Failed to get document: ${error.message}`)
  }

  return {
    id: data.id,
    content: data.content,
    embedding: data.embedding,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Update document content and/or embedding
 */
export async function updateDocument(params: {
  id: string
  content?: string
  embedding?: number[]
  metadata?: Record<string, any>
}): Promise<VectorDocument> {
  const { id, content, embedding, metadata } = params

  const updates: any = {}
  if (content !== undefined) updates.content = content
  if (embedding !== undefined) updates.embedding = embedding
  if (metadata !== undefined) updates.metadata = metadata

  const { data, error } = await supabase.from('embeddings').update(updates).eq('id', id).select().single()

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`)
  }

  return {
    id: data.id,
    content: data.content,
    embedding: data.embedding,
    metadata: data.metadata,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * Delete document by ID
 */
export async function deleteDocument(id: string): Promise<boolean> {
  const { error } = await supabase.from('embeddings').delete().eq('id', id)

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`)
  }

  return true
}

/**
 * Delete all documents matching metadata filter
 */
export async function deleteByMetadata(metadata: Record<string, any>): Promise<number> {
  // Note: This requires a custom RPC function for JSON matching
  const { data, error } = await supabase.rpc('delete_by_metadata', {
    filter_metadata: metadata,
  })

  if (error) {
    throw new Error(`Failed to delete documents: ${error.message}`)
  }

  return data as number
}

/**
 * Count total documents
 */
export async function countDocuments(metadata?: Record<string, any>): Promise<number> {
  let query = supabase.from('embeddings').select('id', { count: 'exact', head: true })

  if (metadata) {
    // Note: Metadata filtering requires custom implementation
    query = query.contains('metadata', metadata)
  }

  const { count, error } = await query

  if (error) {
    throw new Error(`Failed to count documents: ${error.message}`)
  }

  return count || 0
}

/**
 * List all documents with pagination
 */
export async function listDocuments(params: {
  offset?: number
  limit?: number
  metadata?: Record<string, any>
}): Promise<VectorDocument[]> {
  const { offset = 0, limit = 50, metadata } = params

  let query = supabase
    .from('embeddings')
    .select('*')
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })

  if (metadata) {
    query = query.contains('metadata', metadata)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to list documents: ${error.message}`)
  }

  return data.map(doc => ({
    id: doc.id,
    content: doc.content,
    embedding: doc.embedding,
    metadata: doc.metadata,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  }))
}

/**
 * Clear all documents (use with caution!)
 */
export async function clearAll(): Promise<number> {
  const { data, error } = await supabase.rpc('clear_all_embeddings')

  if (error) {
    throw new Error(`Failed to clear documents: ${error.message}`)
  }

  return data as number
}
