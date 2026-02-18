/**
 * MessageBubble Component
 *
 * Renders a single chat message with appropriate styling for user/assistant
 */

import React from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { styles } from './styles'
import type { MessageBubbleProps, StreamingMessageProps } from './types'

/**
 * Renders a chat message bubble
 */
export function MessageBubble({ message, showCost }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  // Don't show system messages in UI
  if (isSystem) {
    return null
  }

  return (
    <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.assistantMessage]}>
      <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
        {message.content}
      </Text>
      {showCost && message.cost && (
        <Text style={styles.costText}>
          ${message.cost.toFixed(6)} - {message.tokens?.total || 0} tokens
        </Text>
      )}
    </View>
  )
}

/**
 * Renders a streaming message with loading indicator
 */
export function StreamingMessage({ content }: StreamingMessageProps) {
  if (!content) {
    return null
  }

  return (
    <View style={[styles.messageContainer, styles.assistantMessage]}>
      <Text style={[styles.messageText, styles.assistantMessageText]}>{content}</Text>
      <View style={styles.streamingIndicator}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.streamingText}>Streaming...</Text>
      </View>
    </View>
  )
}
