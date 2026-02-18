/**
 * AI Mutation Hooks
 *
 * Hooks for creating, updating, and deleting AI conversations and messages
 */

import { useCallback } from 'react'
import { supabase } from '@/services/supabase'
import type { Conversation, ChatMessage, AIModel, UsageStats } from '../types'

interface UseAIMutationsOptions {
  conversation: Conversation | null
  model: AIModel
  autoSave: boolean
  setConversation: (conv: Conversation | null) => void
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUsage: React.Dispatch<React.SetStateAction<UsageStats | null>>
}

interface UseAIMutationsReturn {
  createConversation: (title: string, systemPrompt?: string) => Promise<Conversation>
  deleteConversation: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<ChatMessage>
  clearConversation: () => void
}

/**
 * Hook for AI mutation operations (non-streaming)
 */
export function useAIMutations({
  conversation,
  model,
  autoSave,
  setConversation,
  setConversations,
  setLoading,
  setError,
  setUsage,
}: UseAIMutationsOptions): UseAIMutationsReturn {
  const createConversation = useCallback(
    async (title: string, systemPrompt?: string): Promise<Conversation> => {
      try {
        setError(null)

        const newConversation: Conversation = {
          id: `conv-${Date.now()}`,
          userId: '',
          title,
          messages: systemPrompt
            ? [{
                id: `msg-${Date.now()}`,
                role: 'system',
                content: systemPrompt,
                timestamp: new Date().toISOString(),
              }]
            : [],
          model,
          totalTokens: 0,
          totalCost: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        setConversation(newConversation)
        setConversations(prev => [newConversation, ...prev])

        if (autoSave) {
          await supabase.from('ai_conversations').insert({
            id: newConversation.id,
            title: newConversation.title,
            model: newConversation.model,
            messages: newConversation.messages,
            total_tokens: 0,
            total_cost: 0,
          })
        }

        return newConversation
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create conversation'
        setError(message)
        throw new Error(message)
      }
    },
    [model, autoSave, setConversation, setConversations, setError]
  )

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null)
      setConversations(prev => prev.filter(c => c.id !== id))
      if (conversation?.id === id) setConversation(null)
      if (autoSave) await supabase.from('ai_conversations').delete().eq('id', id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete conversation'
      setError(message)
      throw new Error(message)
    }
  }, [conversation, autoSave, setConversation, setConversations, setError])

  const sendMessage = useCallback(
    async (content: string): Promise<ChatMessage> => {
      if (!conversation) throw new Error('No active conversation')

      try {
        setLoading(true)
        setError(null)

        const userMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        }

        const updatedMessages = [...conversation.messages, userMessage]
        setConversation({ ...conversation, messages: updatedMessages })

        const { data, error: functionError } = await supabase.functions.invoke('ai-chat', {
          body: {
            messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
            model,
            stream: false,
          },
        })

        if (functionError) throw functionError

        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date().toISOString(),
          model,
          tokens: data.tokens,
          cost: data.cost,
        }

        const finalMessages = [...updatedMessages, assistantMessage]
        const updatedConv: Conversation = {
          ...conversation,
          messages: finalMessages,
          totalTokens: conversation.totalTokens + data.tokens.total,
          totalCost: conversation.totalCost + data.cost,
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

        setUsage(prev => prev ? {
          ...prev,
          requestsRemaining: data.usage.remaining,
          costToday: prev.costToday + data.cost,
          tokensToday: prev.tokensToday + data.tokens.total,
        } : null)

        return assistantMessage
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message'
        setError(message)
        throw new Error(message)
      } finally {
        setLoading(false)
      }
    },
    [conversation, model, autoSave, setConversation, setLoading, setError, setUsage]
  )

  const clearConversation = useCallback(() => {
    setConversation(null)
    setError(null)
  }, [setConversation, setError])

  return { createConversation, deleteConversation, sendMessage, clearConversation }
}
