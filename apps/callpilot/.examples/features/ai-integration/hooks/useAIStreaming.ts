/**
 * AI Streaming Hook
 *
 * Hook for streaming AI chat responses
 */

import { useCallback, useRef } from 'react'
import { supabase } from '@/services/supabase'
import type { Conversation, ChatMessage, AIModel, StreamChunk } from '../types'

interface UseAIStreamingOptions {
  conversation: Conversation | null
  model: AIModel
  autoSave: boolean
  setConversation: (conv: Conversation | null) => void
  setStreaming: (streaming: boolean) => void
  setError: (error: string | null) => void
}

interface UseAIStreamingReturn {
  sendMessageStream: (
    content: string,
    onChunk: (chunk: StreamChunk) => void
  ) => Promise<ChatMessage>
}

/**
 * Hook for streaming AI messages
 */
export function useAIStreaming({
  conversation,
  model,
  autoSave,
  setConversation,
  setStreaming,
  setError,
}: UseAIStreamingOptions): UseAIStreamingReturn {
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessageStream = useCallback(
    async (content: string, onChunk: (chunk: StreamChunk) => void): Promise<ChatMessage> => {
      if (!conversation) throw new Error('No active conversation')

      try {
        setStreaming(true)
        setError(null)
        abortControllerRef.current = new AbortController()

        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        }

        const updatedMessages = [...conversation.messages, userMessage]
        setConversation({ ...conversation, messages: updatedMessages })

        const { data: session } = await supabase.auth.getSession()
        const token = session?.session?.access_token

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/ai-chat-stream`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
              model,
            }),
            signal: abortControllerRef.current.signal,
          }
        )

        if (!response.ok) throw new Error(`Stream failed: ${response.statusText}`)

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let fullContent = ''
        let tokens = { prompt: 0, completion: 0, total: 0 }
        let cost = 0

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              onChunk({ id: `msg-${Date.now() + 1}`, delta: '', done: true })
              break
            }

            const chunk = decoder.decode(value, { stream: true })
            for (const line of chunk.split('\n\n')) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6))
                if (data.delta) {
                  fullContent += data.delta
                  onChunk({ id: `msg-${Date.now() + 1}`, delta: data.delta, done: false })
                }
                if (data.tokens) tokens = data.tokens
                if (data.cost) cost = data.cost
              }
            }
          }
        }

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: fullContent,
          timestamp: new Date().toISOString(),
          model,
          tokens,
          cost,
        }

        const updatedConv: Conversation = {
          ...conversation,
          messages: [...updatedMessages, assistantMessage],
          totalTokens: conversation.totalTokens + tokens.total,
          totalCost: conversation.totalCost + cost,
          updatedAt: new Date().toISOString(),
        }

        setConversation(updatedConv)

        if (autoSave) {
          await supabase.from('ai_conversations').upsert({
            id: updatedConv.id,
            title: updatedConv.title,
            model: updatedConv.model,
            messages: updatedConv.messages,
            total_tokens: updatedConv.totalTokens,
            total_cost: updatedConv.totalCost,
            updated_at: updatedConv.updatedAt,
          })
        }

        return assistantMessage
      } catch (err) {
        if ((err as Error).name === 'AbortError') throw new Error('Stream cancelled')
        const message = err instanceof Error ? err.message : 'Failed to stream message'
        setError(message)
        throw new Error(message)
      } finally {
        setStreaming(false)
        abortControllerRef.current = null
      }
    },
    [conversation, model, autoSave, setConversation, setStreaming, setError]
  )

  return { sendMessageStream }
}
