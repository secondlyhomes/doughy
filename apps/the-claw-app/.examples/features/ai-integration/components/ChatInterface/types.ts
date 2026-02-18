/**
 * Types for ChatInterface component
 */

import type { ChatMessage, AIModel } from '../../AIContext'

/**
 * Props for the ChatInterface component
 */
export interface ChatInterfaceProps {
  /**
   * Optional system prompt for the conversation
   */
  systemPrompt?: string

  /**
   * Enable streaming responses (default: true)
   */
  enableStreaming?: boolean

  /**
   * Show cost information (default: true)
   */
  showCost?: boolean

  /**
   * Show model selector (default: true)
   */
  showModelSelector?: boolean

  /**
   * Placeholder text for input
   */
  placeholder?: string
}

/**
 * Props for MessageBubble component
 */
export interface MessageBubbleProps {
  message: ChatMessage
  showCost: boolean
}

/**
 * Props for StreamingMessage component
 */
export interface StreamingMessageProps {
  content: string
}

/**
 * Props for ModelSelector component
 */
export interface ModelSelectorProps {
  model: AIModel
  onModelChange: (model: AIModel) => void
}

/**
 * Props for ChatInput component
 */
export interface ChatInputProps {
  value: string
  onChangeText: (text: string) => void
  onSend: () => void
  placeholder: string
  disabled: boolean
  loading: boolean
}

/**
 * Props for CostSummary component
 */
export interface CostSummaryProps {
  totalCost: number
  totalTokens: number
}

/**
 * Return type for useChatInterface hook
 */
export interface UseChatInterfaceReturn {
  inputText: string
  setInputText: (text: string) => void
  streamingMessage: string
  messages: ChatMessage[]
  conversation: {
    totalCost: number
    totalTokens: number
  } | null
  model: AIModel
  setModel: (model: AIModel) => void
  loading: boolean
  streaming: boolean
  handleSend: () => Promise<void>
  flatListRef: React.RefObject<any>
}
