// src/features/public/components/SimpleAssistant.tsx
// Floating chat assistant for public marketing pages
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { MessageSquare, X, Send, ChevronDown, ChevronUp, Loader2 } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { callPublicAssistant } from '@/lib/openai';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'loading';
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  content:
    "Hi, I'm Doughy! I can help streamline your real estate business with AI-powered lead management. Ask me how our platform can boost your productivity or inquire about our pricing plans.",
  role: 'assistant',
  timestamp: new Date(),
};

// Extracted component for message bubbles - easier to modify and extend
interface MessageBubbleProps {
  message: Message;
  colors: ReturnType<typeof useThemeColors>;
}

function MessageBubble({ message, colors }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isLoading = message.role === 'loading';

  return (
    <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
      <View
        style={[
          bubbleStyles.bubble,
          { backgroundColor: isUser ? colors.primary : colors.muted },
        ]}
      >
        <Text
          style={[
            bubbleStyles.text,
            { color: isUser ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.content}
        </Text>
        {isLoading && <Loader2 size={16} color={colors.mutedForeground} />}
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
});

export function SimpleAssistant() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current && isOpen && !isMinimized) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isOpen, isMinimized]);

  // Pulse animation for the button
  useEffect(() => {
    if (!isOpen) {
      const pulse = Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);

      // Pulse once after 3 seconds
      const timer = setTimeout(() => {
        pulse.start();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, scaleAnim]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: loadingId,
        content: 'Thinking...',
        role: 'loading',
        timestamp: new Date(),
      },
    ]);

    // Get response from assistant API
    const assistantResponse = await callPublicAssistant(messageText);

    // Replace loading message with actual response
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === loadingId
          ? {
              ...msg,
              content: assistantResponse,
              role: 'assistant' as const,
            }
          : msg
      )
    );

    setIsLoading(false);
  }, [inputValue, isLoading]);

  const toggleOpen = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [isOpen]);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  // Chat panel width - responsive
  const panelWidth = Math.min(width - 32, 384);

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 50,
        alignItems: 'flex-end',
      }}
    >
      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ marginBottom: 8 }}
        >
          <View
            style={{
              width: panelWidth,
              maxHeight: 500,
              backgroundColor: colors.background,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 8,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 16,
                  color: colors.foreground,
                }}
              >
                Doughy Assistant
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={toggleMinimize}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ChevronDown size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleOpen}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={{ flex: 1, maxHeight: 350 }}
              contentContainerStyle={{ padding: 16, gap: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} colors={colors} />
              ))}
            </ScrollView>

            {/* Input */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderTopWidth: 1,
                borderTopColor: colors.border,
              }}
            >
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleSendMessage}
                placeholder="Type your message..."
                placeholderTextColor={colors.mutedForeground}
                editable={!isLoading}
                style={{
                  flex: 1,
                  backgroundColor: colors.muted,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: colors.foreground,
                }}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: inputValue.trim() && !isLoading ? colors.primary : colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send
                  size={18}
                  color={inputValue.trim() && !isLoading ? colors.primaryForeground : colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Minimized State */}
      {isOpen && isMinimized && (
        <TouchableOpacity
          onPress={toggleMinimize}
          style={{
            marginBottom: 8,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <MessageSquare size={20} color={colors.primary} />
          <Text style={{ color: colors.foreground, fontWeight: '500' }}>
            Chat with Doughy
          </Text>
          <ChevronUp size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Toggle Button */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={toggleOpen}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 6,
          }}
          accessibilityLabel="Chat with assistant"
        >
          {isOpen && isMinimized ? (
            <ChevronUp size={24} color={colors.primaryForeground} />
          ) : (
            <MessageSquare size={24} color={colors.primaryForeground} />
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
