/**
 * Chat Interface Component
 *
 * Complete chat UI with streaming support
 *
 * Features:
 * - Message list with auto-scroll
 * - Streaming message display
 * - Input field with send button
 * - Loading states
 * - Cost display
 * - Model selector
 *
 * @example
 * ```tsx
 * import { ChatInterface } from '@/features/ai-integration/components/ChatInterface'
 *
 * function ChatScreen() {
 *   return (
 *     <ChatInterface
 *       systemPrompt="You are a helpful coding assistant."
 *       enableStreaming={true}
 *       showCost={true}
 *     />
 *   )
 * }
 * ```
 */

import React from 'react'
import { View, FlatList } from 'react-native'
import type { ChatMessage } from '../../AIContext'
import { styles } from './styles'
import type { ChatInterfaceProps } from './types'
import { useChatInterface } from './useChatInterface'
import { MessageBubble, StreamingMessage } from './MessageBubble'
import { ModelSelector } from './ModelSelector'
import { ChatInput } from './ChatInput'
import { CostSummary } from './CostSummary'

/**
 * Main ChatInterface component
 */
export function ChatInterface({
  systemPrompt,
  enableStreaming = true,
  showCost = true,
  showModelSelector = true,
  placeholder = 'Type your message...',
}: ChatInterfaceProps) {
  const {
    inputText,
    setInputText,
    streamingMessage,
    messages,
    conversation,
    model,
    setModel,
    loading,
    streaming,
    handleSend,
    flatListRef,
  } = useChatInterface({ systemPrompt, enableStreaming })

  const renderMessage = ({ item }: { item: ChatMessage }) => <MessageBubble message={item} showCost={showCost} />

  return (
    <View style={styles.container}>
      {/* Model Selector */}
      {showModelSelector && <ModelSelector model={model} onModelChange={setModel} />}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        ListFooterComponent={<StreamingMessage content={streamingMessage} />}
        showsVerticalScrollIndicator={false}
      />

      {/* Cost Summary */}
      {showCost && conversation && (
        <CostSummary totalCost={conversation.totalCost} totalTokens={conversation.totalTokens} />
      )}

      {/* Input */}
      <ChatInput
        value={inputText}
        onChangeText={setInputText}
        onSend={handleSend}
        placeholder={placeholder}
        disabled={loading || streaming}
        loading={loading || streaming}
      />
    </View>
  )
}
