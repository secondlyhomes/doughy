/**
 * AI Assistant Types
 *
 * Type definitions for the AIAssistant component and related functionality.
 */

/**
 * Quick action button configuration
 */
export interface QuickAction {
  id: string
  label: string
  prompt: string
  icon?: string
}

/**
 * Props for the AIAssistant component
 */
export interface AIAssistantProps {
  /**
   * Quick action buttons
   */
  quickActions?: QuickAction[]

  /**
   * System prompt for the assistant
   */
  systemPrompt?: string

  /**
   * Position of floating button
   */
  position?: AIAssistantPosition
}

/**
 * Position options for the floating button
 */
export type AIAssistantPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

/**
 * State managed by the useAIAssistant hook
 */
export interface AIAssistantState {
  isOpen: boolean
  inputText: string
  response: string
  selectedAction: QuickAction | null
}

/**
 * Actions returned by the useAIAssistant hook
 */
export interface AIAssistantActions {
  setIsOpen: (isOpen: boolean) => void
  setInputText: (text: string) => void
  handleQuickAction: (action: QuickAction) => void
  handleSend: () => Promise<void>
  handleClose: () => void
}

/**
 * Props for the FloatingButton component
 */
export interface FloatingButtonProps {
  position: AIAssistantPosition
  onPress: () => void
}

/**
 * Props for the AssistantModal component
 */
export interface AssistantModalProps {
  isOpen: boolean
  onClose: () => void
  quickActions: QuickAction[]
  selectedAction: QuickAction | null
  onQuickAction: (action: QuickAction) => void
  response: string
  loading: boolean
  inputText: string
  onInputChange: (text: string) => void
  onSend: () => void
}

/**
 * Props for the QuickActionsBar component
 */
export interface QuickActionsBarProps {
  actions: QuickAction[]
  selectedAction: QuickAction | null
  onActionPress: (action: QuickAction) => void
}

/**
 * Props for the ResponseDisplay component
 */
export interface ResponseDisplayProps {
  response: string
}

/**
 * Props for the LoadingIndicator component
 */
export interface LoadingIndicatorProps {
  visible: boolean
}

/**
 * Props for the InputArea component
 */
export interface InputAreaProps {
  value: string
  onChange: (text: string) => void
  onSend: () => void
  placeholder: string
  disabled: boolean
}
