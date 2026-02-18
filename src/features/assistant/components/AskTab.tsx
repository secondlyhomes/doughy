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
  Animated,
} from 'react-native';
import { Send, Sparkles, User, Loader2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, FONT_SIZES, LINE_HEIGHTS, FONT_WEIGHTS, ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useKeyboardAvoidance } from '@/hooks';

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
              size={ICON_SIZES.ml}
              color={inputText.trim() && !isLoading ? colors.primaryForeground : colors.mutedForeground}
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
            ? withOpacity(colors.destructive, 'light')
            : colors.muted,
        },
      ]}
    >
      {!isUser && (
        <View style={styles.avatarContainer}>
          {isSystem ? (
            <View
              style={[styles.avatar, { backgroundColor: withOpacity(colors.destructive, 'medium') }]}
            >
              <Text style={{ fontSize: FONT_SIZES.xs, fontWeight: FONT_WEIGHTS.bold }}>!</Text>
            </View>
          ) : (
            <View style={[styles.avatar, { backgroundColor: withOpacity(colors.primary, 'light') }]}>
              <Sparkles size={ICON_SIZES.sm} color={colors.primary} />
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
                ? colors.primaryForeground
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
          <View style={[styles.avatar, { backgroundColor: withOpacity(colors.primaryForeground, 'light') }]}>
            <User size={ICON_SIZES.sm} color={colors.primaryForeground} />
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
    padding: SPACING.lg,
    paddingBottom: TAB_BAR_SAFE_PADDING,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING['4xl'],
    paddingHorizontal: SPACING['2xl'],
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS['36'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    marginBottom: SPACING['2xl'],
  },
  suggestionsContainer: {
    width: '100%',
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    maxWidth: '90%',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: SPACING.xs,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: SPACING.xs,
  },
  avatarContainer: {
    marginHorizontal: SPACING.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS['14'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
    paddingHorizontal: SPACING.sm,
  },
  messageText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    borderBottomLeftRadius: SPACING.xs,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  dot: {
    width: BORDER_RADIUS.sm,
    height: BORDER_RADIUS.sm,
    borderRadius: 3,
  },
  inputContainer: {
    padding: SPACING.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BORDER_RADIUS['24'],
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    maxHeight: 100,
    paddingVertical: SPACING.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS['18'],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
});

export default AskTab;
