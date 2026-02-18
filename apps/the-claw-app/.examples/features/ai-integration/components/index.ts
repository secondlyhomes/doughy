/**
 * AI Integration Components - Re-exports
 */

// AI Assistant
export { AIAssistant } from './ai-assistant'
export type { AIAssistantProps, QuickAction } from './ai-assistant'

// Chat Interface
export { ChatInterface, MessageBubble, StreamingMessage, ModelSelector, ChatInput, CostSummary, useChatInterface } from './ChatInterface'
export type { ChatInterfaceProps, MessageBubbleProps, StreamingMessageProps, ModelSelectorProps, ChatInputProps, CostSummaryProps } from './ChatInterface'

// Smart Search
export { SmartSearch } from './SmartSearch'

// Sub-components
export { SearchResultCard } from './SearchResultCard'
export { ChatResponse } from './ChatResponse'
export { SearchInput, SearchOptions, CostDisplay, EmptyState } from './SearchInputComponents'

// Hook
export { useSmartSearch } from './hooks/useSmartSearch'

// Types
export type {
  SmartSearchProps,
  SmartSearchState,
  SmartSearchActions,
  SearchResultCardProps,
  ChatResponseProps,
  SimilarityResult,
} from './types'

// Styles (for customization)
export { styles as smartSearchStyles } from './smart-search.styles'
