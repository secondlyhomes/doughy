/**
 * AI Service
 *
 * Client-side service for AI operations
 * Features:
 * - Chat completions (standard and streaming)
 * - Embeddings generation
 * - Content moderation
 * - Cost calculation
 * - Error handling with retries
 */

import { supabase } from '@/services/supabase'
import type { AIModel } from './AIContext'

/**
 * Chat message for API
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
  content: string
  model: AIModel
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  cost: number
  usage: {
    remaining: number
    limit: number
  }
}

/**
 * Streaming callback
 */
export type StreamCallback = (chunk: { delta: string; done: boolean }) => void

/**
 * Embedding response
 */
export interface EmbeddingResponse {
  embedding: number[]
  model: string
  tokens: number
  cost: number
}

/**
 * Moderation response
 */
export interface ModerationResponse {
  flagged: boolean
  categories: {
    [key: string]: boolean
  }
  categoryScores: {
    [key: string]: number
  }
}

/**
 * Model pricing (per 1M tokens)
 */
const MODEL_PRICING: Record<AIModel, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'claude-3.5-sonnet': { input: 3.00, output: 15.00 },
  'claude-3-haiku': { input: 0.25, output: 1.25 },
}

/**
 * Calculate cost for given tokens
 */
export function calculateCost(model: AIModel, promptTokens: number, completionTokens: number): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) {
    console.warn(`No pricing found for model: ${model}`)
    return 0
  }

  const inputCost = (promptTokens / 1_000_000) * pricing.input
  const outputCost = (completionTokens / 1_000_000) * pricing.output

  return Number((inputCost + outputCost).toFixed(6))
}

/**
 * Estimate tokens for text (rough approximation)
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4)
}

/**
 * Estimate cost before making API call
 */
export function estimateCost(
  model: AIModel,
  promptText: string,
  maxCompletionTokens: number = 500
): { min: number; max: number } {
  const promptTokens = estimateTokens(promptText)
  const minCompletionTokens = Math.floor(maxCompletionTokens * 0.3) // Assume 30% of max
  const maxCompletionTokens_ = maxCompletionTokens

  return {
    min: calculateCost(model, promptTokens, minCompletionTokens),
    max: calculateCost(model, promptTokens, maxCompletionTokens_),
  }
}

/**
 * Chat completion (standard, non-streaming)
 *
 * @example
 * ```typescript
 * const response = await chatCompletion({
 *   messages: [
 *     { role: 'system', content: 'You are a helpful assistant.' },
 *     { role: 'user', content: 'What is the capital of France?' }
 *   ],
 *   model: 'gpt-4o-mini',
 *   temperature: 0.7,
 * })
 * ```
 */
export async function chatCompletion(params: {
  messages: ChatMessage[]
  model?: AIModel
  temperature?: number
  maxTokens?: number
}): Promise<ChatCompletionResponse> {
  const { messages, model = 'gpt-4o-mini', temperature = 0.7, maxTokens = 500 } = params

  const { data, error } = await supabase.functions.invoke<ChatCompletionResponse>('ai-chat', {
    body: {
      messages,
      model,
      temperature,
      maxTokens,
      stream: false,
    },
  })

  if (error) {
    throw new Error(`Chat completion failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('No response from AI service')
  }

  return data
}

/**
 * Chat completion with streaming
 *
 * @example
 * ```typescript
 * await streamCompletion({
 *   messages: [
 *     { role: 'user', content: 'Write a short story about a robot.' }
 *   ],
 *   model: 'gpt-4o',
 *   onChunk: (chunk) => {
 *     if (!chunk.done) {
 *       console.log(chunk.delta) // Print each word as it arrives
 *     }
 *   },
 * })
 * ```
 */
export async function streamCompletion(params: {
  messages: ChatMessage[]
  model?: AIModel
  temperature?: number
  maxTokens?: number
  onChunk: StreamCallback
  signal?: AbortSignal
}): Promise<ChatCompletionResponse> {
  const { messages, model = 'gpt-4o-mini', temperature = 0.7, maxTokens = 500, onChunk, signal } = params

  // Get auth token
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    throw new Error('Not authenticated')
  }

  // Make streaming request
  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages,
      model,
      temperature,
      maxTokens,
    }),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Stream failed: ${response.statusText} - ${errorText}`)
  }

  // Process stream
  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let tokens = { prompt: 0, completion: 0, total: 0 }
  let cost = 0
  let usage = { remaining: 0, limit: 0 }

  if (!reader) {
    throw new Error('No stream reader available')
  }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        onChunk({ delta: '', done: true })
        break
      }

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.delta) {
              fullContent += data.delta
              onChunk({ delta: data.delta, done: false })
            }

            if (data.tokens) tokens = data.tokens
            if (data.cost) cost = data.cost
            if (data.usage) usage = data.usage
          } catch (parseError) {
            console.error('Failed to parse stream chunk:', parseError)
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return {
    content: fullContent,
    model,
    tokens,
    cost,
    usage,
  }
}

/**
 * Generate text embedding
 *
 * @example
 * ```typescript
 * const embedding = await generateEmbedding({
 *   text: 'This is a document about machine learning.',
 *   model: 'text-embedding-3-small',
 * })
 * // embedding.embedding is a 1536-dimensional vector
 * ```
 */
export async function generateEmbedding(params: {
  text: string
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<EmbeddingResponse> {
  const { text, model = 'text-embedding-3-small' } = params

  const { data, error } = await supabase.functions.invoke<EmbeddingResponse>('ai-embedding', {
    body: {
      text,
      model,
    },
  })

  if (error) {
    throw new Error(`Embedding generation failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('No response from embedding service')
  }

  return data
}

/**
 * Generate embeddings for multiple texts (batch)
 *
 * @example
 * ```typescript
 * const embeddings = await generateEmbeddingsBatch({
 *   texts: [
 *     'First document',
 *     'Second document',
 *     'Third document',
 *   ],
 * })
 * ```
 */
export async function generateEmbeddingsBatch(params: {
  texts: string[]
  model?: 'text-embedding-3-small' | 'text-embedding-3-large'
}): Promise<EmbeddingResponse[]> {
  const { texts, model = 'text-embedding-3-small' } = params

  const { data, error } = await supabase.functions.invoke<{ embeddings: EmbeddingResponse[] }>(
    'ai-embedding-batch',
    {
      body: {
        texts,
        model,
      },
    }
  )

  if (error) {
    throw new Error(`Batch embedding generation failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('No response from embedding service')
  }

  return data.embeddings
}

/**
 * Moderate content for safety
 *
 * @example
 * ```typescript
 * const result = await moderateContent({
 *   text: 'User-generated content to check',
 * })
 *
 * if (result.flagged) {
 *   console.log('Content flagged:', result.categories)
 * }
 * ```
 */
export async function moderateContent(params: { text: string }): Promise<ModerationResponse> {
  const { text } = params

  const { data, error } = await supabase.functions.invoke<ModerationResponse>('ai-moderate', {
    body: { text },
  })

  if (error) {
    throw new Error(`Content moderation failed: ${error.message}`)
  }

  if (!data) {
    throw new Error('No response from moderation service')
  }

  return data
}

/**
 * Check if content is safe (wrapper around moderateContent)
 */
export async function isContentSafe(text: string): Promise<boolean> {
  try {
    const result = await moderateContent({ text })
    return !result.flagged
  } catch (error) {
    // If moderation fails, be conservative and return false
    console.error('Content moderation error:', error)
    return false
  }
}

/**
 * Retry wrapper for AI operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    retryDelay?: number
    backoffMultiplier?: number
  } = {}
): Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, backoffMultiplier = 2 } = options

  let lastError: Error | null = null
  let delay = retryDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Don't retry on certain errors
      if (
        lastError.message.includes('rate limit') ||
        lastError.message.includes('Unauthorized') ||
        lastError.message.includes('Invalid')
      ) {
        throw lastError
      }

      // Last attempt
      if (attempt === maxRetries) {
        break
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
      delay *= backoffMultiplier
    }
  }

  throw lastError || new Error('Operation failed')
}

/**
 * Example: Chat with auto-retry
 */
export async function chatWithRetry(params: {
  messages: ChatMessage[]
  model?: AIModel
  temperature?: number
  maxTokens?: number
}): Promise<ChatCompletionResponse> {
  return withRetry(() => chatCompletion(params), {
    maxRetries: 3,
    retryDelay: 1000,
  })
}
