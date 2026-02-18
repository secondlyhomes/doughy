/**
 * AI Query Hooks
 *
 * Hooks for loading and fetching AI conversation data
 */

import { useCallback } from 'react'
import { supabase } from '@/services/supabase'
import type {
  Conversation,
  ChatMessage,
  AIModel,
  UsageStats,
} from '../types'

interface UseAIQueriesOptions {
  setConversation: (conv: Conversation | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setUsage: (usage: UsageStats | null) => void
}

interface UseAIQueriesReturn {
  loadConversation: (id: string) => Promise<void>
  refreshUsage: () => Promise<void>
}

/**
 * Hook for AI query operations (loading conversations, fetching usage)
 */
export function useAIQueries({
  setConversation,
  setLoading,
  setError,
  setUsage,
}: UseAIQueriesOptions): UseAIQueriesReturn {
  /**
   * Load conversation by ID
   */
  const loadConversation = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const loadedConversation: Conversation = {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        messages: data.messages as ChatMessage[],
        model: data.model as AIModel,
        totalTokens: data.total_tokens,
        totalCost: data.total_cost,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }

      setConversation(loadedConversation)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversation'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [setConversation, setLoading, setError])

  /**
   * Refresh usage stats
   */
  const refreshUsage = useCallback(async (): Promise<void> => {
    try {
      const { data, error: fetchError } = await supabase.functions.invoke('ai-usage')

      if (fetchError) throw fetchError

      setUsage(data)
    } catch (err) {
      console.error('Failed to refresh usage:', err)
    }
  }, [setUsage])

  return {
    loadConversation,
    refreshUsage,
  }
}
