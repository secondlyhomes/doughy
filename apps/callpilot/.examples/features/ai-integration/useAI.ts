/**
 * useAI Hook
 *
 * Hook to access AI context
 */

import { useContext } from 'react'
import { AIContext } from './AIProvider'
import type { AIContextValue } from './types'

/**
 * Hook to access AI context
 *
 * @example
 * ```tsx
 * import { useAI } from '@/features/ai-integration'
 *
 * function ChatScreen() {
 *   const { conversation, sendMessage, loading } = useAI()
 *
 *   const handleSend = async (text: string) => {
 *     await sendMessage(text)
 *   }
 *
 *   return <ChatInterface conversation={conversation} onSend={handleSend} />
 * }
 * ```
 */
export function useAI(): AIContextValue {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}
