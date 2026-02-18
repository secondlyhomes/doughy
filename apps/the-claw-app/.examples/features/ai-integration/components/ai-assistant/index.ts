/**
 * AI Assistant Components - Re-exports
 */

// Main component
export { AIAssistant } from './AIAssistant'

// Sub-components
export { FloatingButton } from './FloatingButton'
export { ModalHeader } from './ModalHeader'
export { QuickActionsBar } from './QuickActionsBar'
export { ResponseDisplay } from './ResponseDisplay'
export { LoadingIndicator } from './LoadingIndicator'
export { InputArea } from './InputArea'

// Hook
export { useAIAssistant } from './hooks/useAIAssistant'

// Types
export type {
  QuickAction,
  AIAssistantProps,
  AIAssistantPosition,
  AIAssistantState,
  AIAssistantActions,
  FloatingButtonProps,
  AssistantModalProps,
  QuickActionsBarProps,
  ResponseDisplayProps,
  LoadingIndicatorProps,
  InputAreaProps,
} from './types'

// Constants
export { DEFAULT_QUICK_ACTIONS, DEFAULT_SYSTEM_PROMPT, DEFAULT_POSITION } from './constants'

// Styles (for customization)
export { styles as aiAssistantStyles, getPositionStyles } from './ai-assistant.styles'
