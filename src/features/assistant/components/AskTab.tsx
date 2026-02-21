// src/features/assistant/components/AskTab.tsx
// Ask tab for AI assistant - chat interface

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { useKeyboardAvoidance } from '@/hooks';

import { useChat } from '../hooks/useChat';
import { useAssistantContext } from '../hooks/useAssistantContext';
import { SuggestionChips } from './SuggestionChips';
import { AskTabMessageBubble } from './AskTabMessageBubble';
import { ThinkingIndicator } from './ThinkingIndicator';
import { askTabStyles as styles } from './ask-tab-styles';
import { CONTEXTUAL_SUGGESTIONS } from './ask-tab-types';
import type { AskTabProps } from './ask-tab-types';

export function AskTab({ dealId }: AskTabProps) {
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasTabBar: true });
  const context = useAssistantContext();
  const { messages, sendMessage, isLoading, clearMessages } = useChat();

  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;

    // Include context snapshot with message for AI to use
    sendMessage(inputText, context);
    setInputText('');
  };

  const handleSuggestionPress = (suggestion: string) => {
    // Include context with suggestion prompts as well
    sendMessage(suggestion, context);
  };

  // Get contextual suggestions
  const suggestions =
    CONTEXTUAL_SUGGESTIONS[context.payload?.type as keyof typeof CONTEXTUAL_SUGGESTIONS] ||
    CONTEXTUAL_SUGGESTIONS.generic;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={keyboardProps.behavior}
      keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps={keyboardProps.keyboardShouldPersistTaps}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: withOpacity(colors.primary, 'muted') },
              ]}
            >
              <Sparkles size={ICON_SIZES['2xl']} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              How can I help?
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {context.summary.oneLiner}
            </Text>

            {/* Suggestion Chips */}
            <View style={styles.suggestionsContainer}>
              <SuggestionChips
                suggestions={suggestions}
                onPress={handleSuggestionPress}
                compact
              />
            </View>
          </View>
        ) : (
          messages.map((message) => (
            <AskTabMessageBubble key={message.id} message={message} />
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <View style={[styles.loadingContainer, { backgroundColor: colors.muted }]}>
            <ThinkingIndicator />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
        <View style={[styles.inputWrapper, { backgroundColor: colors.muted }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Ask me anything..."
            placeholderTextColor={colors.mutedForeground}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            accessibilityLabel="Message input"
            accessibilityHint="Type your question for the AI assistant"
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  inputText.trim() && !isLoading
                    ? colors.primary
                    : colors.muted,
              },
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !inputText.trim() || isLoading }}
          >
            <Send
              size={ICON_SIZES.ml}
              color={inputText.trim() && !isLoading ? colors.primaryForeground : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default AskTab;
