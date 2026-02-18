/**
 * ChatInput Component
 *
 * Text input and send button for composing messages.
 */

import React from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import type { ChatInputProps } from '../types';
import { styles } from '../styles';

export function ChatInput({ value, onChangeText, onSend, isSending }: ChatInputProps) {
  const isDisabled = !value.trim() || isSending;

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSend}
        returnKeyType="send"
        editable={!isSending}
        multiline
        maxLength={500}
      />
      <TouchableOpacity
        style={[styles.sendButton, isDisabled && styles.sendButtonDisabled]}
        onPress={onSend}
        disabled={isDisabled}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.sendButtonText}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
