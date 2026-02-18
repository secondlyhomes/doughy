/**
 * AI Assistant Component
 *
 * Floating AI assistant that can be triggered from anywhere.
 *
 * Features:
 * - Floating button to open/close
 * - Quick actions
 * - Context-aware suggestions
 * - Voice input support (future)
 *
 * @example
 * ```tsx
 * import { AIAssistant } from '@/features/ai-integration/components/ai-assistant'
 *
 * function App() {
 *   return (
 *     <>
 *       {/* Your app content *\/}
 *       <AIAssistant
 *         position="bottom-right"
 *         quickActions={[
 *           { id: 'help', label: 'Help', prompt: 'Help me with:' },
 *         ]}
 *       />
 *     </>
 *   )
 * }
 * ```
 */

import React from 'react'
import { View, Modal } from 'react-native'
import { useAIAssistant } from './hooks/useAIAssistant'
import { FloatingButton } from './FloatingButton'
import { ModalHeader } from './ModalHeader'
import { QuickActionsBar } from './QuickActionsBar'
import { ResponseDisplay } from './ResponseDisplay'
import { LoadingIndicator } from './LoadingIndicator'
import { InputArea } from './InputArea'
import { styles } from './ai-assistant.styles'
import { DEFAULT_QUICK_ACTIONS, DEFAULT_SYSTEM_PROMPT, DEFAULT_POSITION } from './constants'
import type { AIAssistantProps } from './types'

/**
 * AI Assistant - Floating assistant component
 */
export function AIAssistant({
  quickActions = DEFAULT_QUICK_ACTIONS,
  systemPrompt = DEFAULT_SYSTEM_PROMPT,
  position = DEFAULT_POSITION,
}: AIAssistantProps) {
  const {
    isOpen,
    inputText,
    response,
    selectedAction,
    loading,
    setIsOpen,
    setInputText,
    handleQuickAction,
    handleSend,
    handleClose,
  } = useAIAssistant({ systemPrompt })

  const placeholder = selectedAction ? selectedAction.prompt : 'Ask me anything...'

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <FloatingButton position={position} onPress={() => setIsOpen(true)} />
      )}

      {/* Modal */}
      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ModalHeader title="AI Assistant" onClose={handleClose} />

            <QuickActionsBar
              actions={quickActions}
              selectedAction={selectedAction}
              onActionPress={handleQuickAction}
            />

            <ResponseDisplay response={response} />

            <LoadingIndicator visible={loading} />

            <InputArea
              value={inputText}
              onChange={setInputText}
              onSend={handleSend}
              placeholder={placeholder}
              disabled={loading}
            />
          </View>
        </View>
      </Modal>
    </>
  )
}
