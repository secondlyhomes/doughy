/**
 * ChatInterface Component Module
 *
 * Exports:
 * - ChatInterface: Main chat UI component
 * - MessageBubble: Individual message display
 * - StreamingMessage: Streaming message with indicator
 * - ModelSelector: AI model selection
 * - ChatInput: Text input with send button
 * - CostSummary: Cost and token display
 * - useChatInterface: Hook for chat logic
 * - Types: All component prop types
 */

// Main component
export { ChatInterface } from './ChatInterface'

// Sub-components
export { MessageBubble, StreamingMessage } from './MessageBubble'
export { ModelSelector } from './ModelSelector'
export { ChatInput } from './ChatInput'
export { CostSummary } from './CostSummary'

// Hook
export { useChatInterface } from './useChatInterface'

// Types
export type {
  ChatInterfaceProps,
  MessageBubbleProps,
  StreamingMessageProps,
  ModelSelectorProps,
  ChatInputProps,
  CostSummaryProps,
  UseChatInterfaceReturn,
} from './types'

// Styles (for extending/customization)
export { styles } from './styles'
