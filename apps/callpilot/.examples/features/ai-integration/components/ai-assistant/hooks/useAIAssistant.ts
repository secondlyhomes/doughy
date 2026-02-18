/**
 * useAIAssistant Hook
 *
 * Manages state and logic for the AI Assistant component.
 */

import { useState, useCallback } from 'react'
import { useAI } from '../../../AIContext'
import type { QuickAction, AIAssistantState, AIAssistantActions } from '../types'

interface UseAIAssistantOptions {
  systemPrompt: string
}

interface UseAIAssistantReturn extends AIAssistantState, AIAssistantActions {
  loading: boolean
}

/**
 * Hook for managing AI Assistant state and interactions
 *
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   inputText,
 *   response,
 *   selectedAction,
 *   loading,
 *   setIsOpen,
 *   setInputText,
 *   handleQuickAction,
 *   handleSend,
 *   handleClose,
 * } = useAIAssistant({ systemPrompt: 'You are helpful.' })
 * ```
 */
export function useAIAssistant({ systemPrompt }: UseAIAssistantOptions): UseAIAssistantReturn {
  const { createConversation, sendMessage, loading } = useAI()

  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const [response, setResponse] = useState('')
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null)

  const handleQuickAction = useCallback((action: QuickAction) => {
    setSelectedAction(action)
    setResponse('')
  }, [])

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return

    try {
      setResponse('')

      // Create temporary conversation
      const conv = await createConversation('Quick Chat', systemPrompt)

      // Build prompt with action context
      const prompt = selectedAction ? `${selectedAction.prompt} ${inputText}` : inputText

      // Send message
      const message = await sendMessage(prompt)

      setResponse(message.content)
      setInputText('')
    } catch (error) {
      console.error('AI Assistant error:', error)
      setResponse('Sorry, I encountered an error. Please try again.')
    }
  }, [inputText, selectedAction, systemPrompt, createConversation, sendMessage])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    setResponse('')
    setInputText('')
    setSelectedAction(null)
  }, [])

  return {
    // State
    isOpen,
    inputText,
    response,
    selectedAction,
    loading,
    // Actions
    setIsOpen,
    setInputText,
    handleQuickAction,
    handleSend,
    handleClose,
  }
}
