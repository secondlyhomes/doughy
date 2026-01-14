// src/features/assistant/components/AskTab.tsx
// Ask tab for AI assistant - chat interface

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Send, Sparkles, User, Loader2 } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';

import { useChat, Message } from '../hooks/useChat';
import { useAssistantContext } from '../hooks/useAssistantContext';
import { SuggestionChips } from './SuggestionChips';

interface AskTabProps {
  dealId?: string;
}

// Suggestion prompts based on context
const CONTEXTUAL_SUGGESTIONS = {
  deal_cockpit: [
    'What should I focus on?',
    'Summarize this deal',
    'What\'s missing?',
    'Draft a follow-up',
  ],
  property_detail: [
    'Analyze this property',
    'What\'s the MAO?',
    'Compare to comps',
    'Estimate repairs',
  ],
  generic: [
    'What can you help with?',
    'Show me my top deals',
    'What\'s overdue?',
    'Draft an email',
  ],
};

export function AskTab({ dealId }: AskTabProps) {
  const colors = useThemeColors();
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: colors.primary + '15' },
              ]}
            >
              <Sparkles size={32} color={colors.primary} />
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
            <MessageBubble key={message.id} message={message} />
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
              size={18}
              color={inputText.trim() && !isLoading ? '#fff' : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: Message }) {
  const colors = useThemeColors();
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <View
      style={[
        styles.messageBubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        {
          backgroundColor: isUser
            ? colors.primary
            : isSystem
            ? colors.destructive + '20'
            : colors.muted,
        },
      ]}
    >
      {!isUser && (
        <View style={styles.avatarContainer}>
          {isSystem ? (
            <View
              style={[styles.avatar, { backgroundColor: colors.destructive + '30' }]}
            >
              <Text style={{ fontSize: 12 }}>!</Text>
            </View>
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
              <Sparkles size={14} color={colors.primary} />
            </View>
          )}
        </View>
      )}
      <View style={styles.messageContent}>
        <Text
          style={[
            styles.messageText,
            {
              color: isUser
                ? '#fff'
                : isSystem
                ? colors.destructive
                : colors.foreground,
            },
          ]}
        >
          {message.content}
        </Text>
      </View>
      {isUser && (
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <User size={14} color="#fff" />
          </View>
        </View>
      )}
    </View>
  );
}

// Thinking Indicator Component
function ThinkingIndicator() {
  const colors = useThemeColors();
  const dots = [1, 2, 3];
  const animations = useRef(dots.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animateDots = () => {
      const staggeredAnimations = animations.map((anim, index) =>
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.loop(
            Animated.sequence([
              Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.timing(anim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          ),
        ])
      );
      Animated.parallel(staggeredAnimations).start();
    };

    animateDots();

    return () => {
      animations.forEach((anim) => anim.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.thinkingDots}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            { backgroundColor: colors.primary },
            {
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -4],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  suggestionsContainer: {
    width: '100%',
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    maxWidth: '90%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  avatarContainer: {
    marginHorizontal: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
    paddingHorizontal: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default AskTab;
