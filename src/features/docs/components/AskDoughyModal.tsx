// src/features/docs/components/AskDoughyModal.tsx
// AI-powered documentation search modal
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Search, Send, X, Loader2 } from 'lucide-react-native';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { useThemeColors } from '@/contexts/ThemeContext';
import { callDocsAssistant, type ChatMessage } from '@/lib/openai';
import { BORDER_RADIUS, ICON_SIZES, SPACING } from '@/constants/design-tokens';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'thinking';
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: '1',
  content:
    "Hi there! I'm Doughy, your documentation assistant. Ask me anything about our platform, features, or how to use specific functionality.",
  role: 'assistant',
  timestamp: new Date(),
};

interface AskDoughyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AskDoughyModal({ visible, onClose }: AskDoughyModalProps) {
  const colors = useThemeColors();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [visible]);

  // Reset messages when modal closes
  useEffect(() => {
    if (!visible) {
      // Keep conversation history during session
      // setMessages([INITIAL_MESSAGE]);
    }
  }, [visible]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Add thinking message
    const thinkingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: thinkingId,
        content: '...',
        role: 'thinking',
        timestamp: new Date(),
      },
    ]);

    setIsProcessing(true);

    try {
      // Convert messages to ChatMessage format for the API
      const conversationHistory: ChatMessage[] = messages
        .filter((m) => m.role !== 'thinking')
        .map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

      const response = await callDocsAssistant(userMessage.content, conversationHistory);

      // Remove thinking message and add actual response
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== thinkingId)
          .concat({
            id: (Date.now() + 2).toString(),
            content: response.message,
            role: 'assistant',
            timestamp: new Date(),
          })
      );
    } catch (error) {
      console.error('[AskDoughy] Error getting response:', error);

      // Remove thinking message and add error message
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== thinkingId)
          .concat({
            id: (Date.now() + 2).toString(),
            content: "I'm sorry, I encountered an error processing your request. Please try again later.",
            role: 'assistant',
            timestamp: new Date(),
          })
      );
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, messages]);

  return (
    <Modal visible={visible} onClose={onClose} animationType="fade">
      <ModalContent
        className="w-full max-w-2xl"
        style={{ maxHeight: '80%' }}
        showCloseButton={false}
        onClose={onClose}
      >
        {/* Header */}
        <ModalHeader className="pb-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View className="flex-row items-center justify-between">
            <ModalTitle className="text-xl">Ask Doughy</ModalTitle>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={ICON_SIZES.lg} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="mt-4">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.muted,
                borderRadius: BORDER_RADIUS.md,
                paddingHorizontal: SPACING.md,
              }}
            >
              <Search size={ICON_SIZES.ml} color={colors.mutedForeground} />
              <TextInput
                ref={inputRef}
                value={inputValue}
                onChangeText={setInputValue}
                onSubmitEditing={handleSendMessage}
                placeholder="Ask Doughy about features, usage, or functionality..."
                placeholderTextColor={colors.mutedForeground}
                editable={!isProcessing}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: colors.foreground,
                }}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Send
                  size={ICON_SIZES.ml}
                  color={inputValue.trim() && !isProcessing ? colors.primary : colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ModalHeader>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, maxHeight: 400 }}
          contentContainerStyle={{ paddingVertical: 16, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={{
                flexDirection: 'row',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <View
                style={{
                  maxWidth: '80%',
                  borderRadius: BORDER_RADIUS.lg,
                  paddingHorizontal: SPACING.lg,
                  paddingVertical: SPACING.md,
                  backgroundColor:
                    message.role === 'user' ? colors.primary : colors.muted,
                  marginLeft: message.role === 'user' ? 48 : 0,
                  marginRight: message.role === 'assistant' || message.role === 'thinking' ? 48 : 0,
                }}
              >
                {message.role === 'thinking' ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14 }}>
                      Thinking
                    </Text>
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                  </View>
                ) : (
                  <Text
                    style={{
                      color:
                        message.role === 'user'
                          ? colors.primaryForeground
                          : colors.foreground,
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                  >
                    {message.content}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </ModalContent>
    </Modal>
  );
}
