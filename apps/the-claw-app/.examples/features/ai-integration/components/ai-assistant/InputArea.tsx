/**
 * Input Area Component
 *
 * Text input with send button for AI messages.
 */

import React from 'react'
import { View, TextInput, TouchableOpacity, Text } from 'react-native'
import { styles } from './ai-assistant.styles'
import type { InputAreaProps } from './types'

/**
 * Input area for typing messages to AI
 *
 * @example
 * ```tsx
 * <InputArea
 *   value={inputText}
 *   onChange={setInputText}
 *   onSend={handleSend}
 *   placeholder="Ask me anything..."
 *   disabled={loading}
 * />
 * ```
 */
export function InputArea({
  value,
  onChange,
  onSend,
  placeholder,
  disabled,
}: InputAreaProps) {
  const canSend = value.trim() && !disabled

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline
        maxLength={1000}
        editable={!disabled}
      />
      <TouchableOpacity
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={!canSend}
      >
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
  )
}
