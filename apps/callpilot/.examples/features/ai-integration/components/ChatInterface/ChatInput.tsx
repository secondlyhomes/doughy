/**
 * ChatInput Component
 *
 * Text input with send button for chat messages
 */

import React from 'react'
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native'
import { styles } from './styles'
import type { ChatInputProps } from './types'

/**
 * Chat input component with send button
 */
export function ChatInput({ value, onChangeText, onSend, placeholder, disabled, loading }: ChatInputProps) {
  const canSend = value.trim() && !disabled

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline
        maxLength={2000}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.sendButtonText}>Send</Text>}
      </TouchableOpacity>
    </View>
  )
}
