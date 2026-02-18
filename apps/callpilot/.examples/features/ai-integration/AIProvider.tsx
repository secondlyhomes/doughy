/**
 * AI Provider
 *
 * React Context provider for AI chat functionality
 */

import React, { createContext, useState } from 'react'
import { useAIQueries } from './hooks/useAIQueries'
import { useAIMutations } from './hooks/useAIMutations'
import { useAIStreaming } from './hooks/useAIStreaming'
import type {
  Conversation,
  AIModel,
  UsageStats,
  AIProviderProps,
  AIContextValue,
} from './types'

export const AIContext = createContext<AIContextValue | undefined>(undefined)

/**
 * AI Provider Component
 *
 * @example
 * ```tsx
 * import { AIProvider } from '@/features/ai-integration'
 *
 * export default function RootLayout() {
 *   return (
 *     <AIProvider defaultModel="gpt-4o-mini">
 *       <Stack />
 *     </AIProvider>
 *   )
 * }
 * ```
 */
export function AIProvider({
  children,
  defaultModel = 'gpt-4o-mini',
  autoSave = true,
}: AIProviderProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [model, setModel] = useState<AIModel>(defaultModel)

  const { loadConversation, refreshUsage } = useAIQueries({
    setConversation,
    setLoading,
    setError,
    setUsage,
  })

  const {
    createConversation,
    deleteConversation,
    sendMessage,
    clearConversation,
  } = useAIMutations({
    conversation,
    model,
    autoSave,
    setConversation,
    setConversations,
    setLoading,
    setError,
    setUsage,
  })

  const { sendMessageStream } = useAIStreaming({
    conversation,
    model,
    autoSave,
    setConversation,
    setStreaming,
    setError,
  })

  const value: AIContextValue = {
    conversation,
    conversations,
    loading,
    streaming,
    error,
    usage,
    model,
    setModel,
    createConversation,
    loadConversation,
    deleteConversation,
    sendMessage,
    sendMessageStream,
    clearConversation,
    refreshUsage,
  }

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}
