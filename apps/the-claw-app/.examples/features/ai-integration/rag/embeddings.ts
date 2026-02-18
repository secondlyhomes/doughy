/**
 * Embeddings
 *
 * Generate and store text embeddings for semantic search
 * Features:
 * - Generate embeddings via OpenAI
 * - Automatic chunking for long texts
 * - Batch processing
 * - Store in vector database
 */

import { generateEmbedding, generateEmbeddingsBatch } from '../aiService'
import { storeDocument, storeBatch } from './vectorStore'

/**
 * Chunk text into smaller pieces for embedding
 * Each chunk should be < 8000 tokens (roughly 32000 characters)
 */
export function chunkText(text: string, maxChunkSize: number = 1000): string[] {
  const sentences = text.split(/[.!?]+\s+/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (!trimmed) continue

    // If adding this sentence would exceed max size, start new chunk
    if (currentChunk.length + trimmed.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }
      currentChunk = trimmed
    } else {
      currentChunk += (currentChunk ? '. ' : '') + trimmed
    }
  }

  // Add remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}

/**
 * Generate and store embedding for a single document
 *
 * @example
 * ```typescript
 * const doc = await embedAndStore({
 *   content: 'This is a long document about AI...',
 *   metadata: { category: 'ai', author: 'Alice' },
 * })
 * ```
 */
export async function embedAndStore(params: {
  content: string
  metadata?: Record<string, any>
  id?: string
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<{ id: string; embedding: number[]; cost: number }> {
  const { content, metadata, id, model = 'text-embedding-3-small' } = params

  // Generate embedding
  const { embedding, cost } = await generateEmbedding({ text: content, model })

  // Store in vector database
  const doc = await storeDocument({
    id,
    content,
    embedding,
    metadata,
  })

  return {
    id: doc.id,
    embedding: doc.embedding,
    cost,
  }
}

/**
 * Generate and store embeddings for long text (with chunking)
 *
 * @example
 * ```typescript
 * const chunks = await embedAndStoreChunked({
 *   content: 'This is a very long document that needs to be split...',
 *   chunkSize: 1000,
 *   metadata: { documentId: 'doc-123', category: 'tech' },
 * })
 * ```
 */
export async function embedAndStoreChunked(params: {
  content: string
  chunkSize?: number
  metadata?: Record<string, any>
  baseId?: string
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<{ chunks: Array<{ id: string; content: string }>; totalCost: number }> {
  const { content, chunkSize = 1000, metadata, baseId, model = 'text-embedding-3-small' } = params

  // Split into chunks
  const chunks = chunkText(content, chunkSize)

  // Generate embeddings for all chunks
  const embeddingResponses = await generateEmbeddingsBatch({ texts: chunks, model })

  // Prepare documents for batch storage
  const documents = chunks.map((chunk, index) => ({
    id: baseId ? `${baseId}-chunk-${index}` : undefined,
    content: chunk,
    embedding: embeddingResponses[index].embedding,
    metadata: {
      ...metadata,
      chunkIndex: index,
      totalChunks: chunks.length,
      ...(baseId && { baseId }),
    },
  }))

  // Store all chunks
  const storedDocs = await storeBatch(documents)

  // Calculate total cost
  const totalCost = embeddingResponses.reduce((sum, resp) => sum + resp.cost, 0)

  return {
    chunks: storedDocs.map(doc => ({ id: doc.id, content: doc.content })),
    totalCost,
  }
}

/**
 * Batch embed and store multiple documents
 *
 * @example
 * ```typescript
 * const results = await embedAndStoreBatch([
 *   { content: 'Document 1', metadata: { category: 'tech' } },
 *   { content: 'Document 2', metadata: { category: 'science' } },
 *   { content: 'Document 3', metadata: { category: 'health' } },
 * ])
 * ```
 */
export async function embedAndStoreBatch(
  documents: Array<{
    content: string
    metadata?: Record<string, any>
    id?: string
  }>,
  model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small'
): Promise<{
  documents: Array<{ id: string; content: string }>
  totalCost: number
}> {
  // Extract contents for batch embedding
  const contents = documents.map(doc => doc.content)

  // Generate embeddings
  const embeddingResponses = await generateEmbeddingsBatch({ texts: contents, model })

  // Prepare documents with embeddings
  const docsToStore = documents.map((doc, index) => ({
    id: doc.id,
    content: doc.content,
    embedding: embeddingResponses[index].embedding,
    metadata: doc.metadata,
  }))

  // Store all documents
  const storedDocs = await storeBatch(docsToStore)

  // Calculate total cost
  const totalCost = embeddingResponses.reduce((sum, resp) => sum + resp.cost, 0)

  return {
    documents: storedDocs.map(doc => ({ id: doc.id, content: doc.content })),
    totalCost,
  }
}

/**
 * Re-embed existing document (update embedding)
 *
 * @example
 * ```typescript
 * await reEmbedDocument({
 *   id: 'doc-123',
 *   content: 'Updated content for the document',
 * })
 * ```
 */
export async function reEmbedDocument(params: {
  id: string
  content: string
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<{ id: string; embedding: number[]; cost: number }> {
  const { id, content, model = 'text-embedding-3-small' } = params

  // Generate new embedding
  const { embedding, cost } = await generateEmbedding({ text: content, model })

  // Update document in vector database
  const { updateDocument } = await import('./vectorStore')
  await updateDocument({ id, content, embedding })

  return { id, embedding, cost }
}

/**
 * Embed query text for searching
 * (Convenience wrapper around generateEmbedding)
 */
export async function embedQuery(params: {
  query: string
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<{ embedding: number[]; cost: number }> {
  const { query, model = 'text-embedding-3-small' } = params

  const { embedding, cost } = await generateEmbedding({ text: query, model })

  return { embedding, cost }
}

/**
 * Process and embed markdown document
 * Splits by headers and embeds each section separately
 */
export async function embedMarkdown(params: {
  markdown: string
  metadata?: Record<string, any>
  baseId?: string
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<{ sections: Array<{ id: string; title: string; content: string }>; totalCost: number }> {
  const { markdown, metadata, baseId, model = 'text-embedding-3-small' } = params

  // Split by headers (## or ###)
  const sections = markdown.split(/^(#{2,3}\s+.+)$/gm).filter(s => s.trim())

  const documents: Array<{ content: string; metadata: Record<string, any>; id?: string }> = []
  let currentTitle = 'Introduction'
  let sectionIndex = 0

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i].trim()

    // Check if this is a header
    if (section.match(/^#{2,3}\s+/)) {
      currentTitle = section.replace(/^#{2,3}\s+/, '').trim()
    } else if (section) {
      // This is content
      documents.push({
        content: section,
        metadata: {
          ...metadata,
          sectionTitle: currentTitle,
          sectionIndex,
          ...(baseId && { baseId }),
        },
        id: baseId ? `${baseId}-section-${sectionIndex}` : undefined,
      })
      sectionIndex++
    }
  }

  // Embed and store all sections
  const result = await embedAndStoreBatch(documents, model)

  return {
    sections: result.documents.map((doc, index) => ({
      id: doc.id,
      title: documents[index].metadata.sectionTitle as string,
      content: doc.content,
    })),
    totalCost: result.totalCost,
  }
}

/**
 * Estimate cost before embedding
 */
export function estimateEmbeddingCost(params: {
  text: string
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): number {
  const { text, model = 'text-embedding-3-small' } = params

  // Rough token estimate: 1 token ≈ 4 characters
  const estimatedTokens = Math.ceil(text.length / 4)

  // Pricing per 1M tokens
  const pricing = {
    'text-embedding-3-small': 0.02, // $0.02 per 1M tokens
    'text-embedding-3-large': 0.13, // $0.13 per 1M tokens
  }

  return (estimatedTokens / 1_000_000) * pricing[model]
}

/**
 * Estimate cost for batch embedding
 */
export function estimateBatchEmbeddingCost(params: {
  texts: string[]
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): { total: number; perDocument: number[] } {
  const { texts, model = 'text-embedding-3-small' } = params

  const perDocument = texts.map(text => estimateEmbeddingCost({ text, model }))
  const total = perDocument.reduce((sum, cost) => sum + cost, 0)

  return { total, perDocument }
}
