/**
 * useChatInterface Hook
 *
 * Manages chat state and message handling
 */

import { useState, useRef, useEffect } from 'react'
import { FlatList } from 'react-native'
import { useAI } from '../../AIContext'

interface UseChatInterfaceOptions {
  systemPrompt?: string
  enableStreaming?: boolean
}

/**
 * Hook for managing chat interface state and logic
 */
export function useChatInterface({ systemPrompt, enableStreaming = true }: UseChatInterfaceOptions) {
  const { conversation, createConversation, sendMessage, sendMessageStream, model, setModel, loading, streaming } =
    useAI()

  const [inputText, setInputText] = useState('')
  const [streamingMessage, setStreamingMessage] = useState('')
  const flatListRef = useRef<FlatList>(null)

  // Create conversation on mount if none exists
  useEffect(() => {
    if (!conversation) {
      createConversation('New Chat', systemPrompt).catch(console.error)
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversation?.messages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [conversation?.messages.length])

  const handleSend = async () => {
    if (!inputText.trim() || !conversation) return

    const message = inputText.trim()
    setInputText('')

    try {
      if (enableStreaming) {
        // Streaming mode
        setStreamingMessage('')
        await sendMessageStream(message, chunk => {
          if (!chunk.done) {
            setStreamingMessage(prev => prev + chunk.delta)
          } else {
            setStreamingMessage('')
          }
        })
      } else {
        // Standard mode
        await sendMessage(message)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // Filter out system messages for display
  const messages = conversation?.messages.filter(m => m.role !== 'system') || []

  return {
    inputText,
    setInputText,
    streamingMessage,
    messages,
    conversation: conversation
      ? {
          totalCost: conversation.totalCost,
          totalTokens: conversation.totalTokens,
        }
      : null,
    model,
    setModel,
    loading,
    streaming,
    handleSend,
    flatListRef,
  }
}
