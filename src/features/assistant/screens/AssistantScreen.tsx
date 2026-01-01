// AI Assistant Chat Screen - React Native
// Converted from web app src/features/assistant/

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, Sparkles, RefreshCw } from 'lucide-react-native';

// Zone A UI Components
import { LoadingSpinner } from '@/components/ui';

import { MessageBubble } from '../components/MessageBubble';
import { SuggestionChips } from '../components/SuggestionChips';
import { useChat, Message } from '../hooks/useChat';

export function AssistantScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [input, setInput] = useState('');
  const { messages, sendMessage, isLoading, clearMessages } = useChat();

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, isLoading, sendMessage]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    sendMessage(suggestion);
  }, [sendMessage]);

  const scrollToEnd = useCallback(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const suggestions = [
    "What are my top leads?",
    "Show me today's activities",
    "Help me draft a follow-up email",
    "Analyze my conversion rate",
  ];

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageBubble message={item} />
  ), []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          contentContainerStyle={{
            padding: 16,
            flexGrow: 1,
          }}
          onContentSizeChange={scrollToEnd}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-8">
              <View className="bg-primary/10 rounded-full p-4 mb-4">
                <Sparkles size={32} color="#3b82f6" />
              </View>
              <Text className="text-lg font-semibold text-foreground mb-2">
                AI Assistant
              </Text>
              <Text className="text-sm text-muted-foreground text-center px-8 mb-6">
                Ask me anything about your leads, properties, or get help with tasks
              </Text>

              {/* Suggestions */}
              <SuggestionChips
                suggestions={suggestions}
                onPress={handleSuggestionPress}
              />
            </View>
          }
          ListFooterComponent={
            isLoading ? (
              <View className="flex-row items-center py-4">
                <View className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#3b82f6" />
                    <Text className="text-muted-foreground ml-2">Thinking...</Text>
                  </View>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Bar */}
        <View className="border-t border-border px-4 py-3 bg-background">
          {/* Quick Suggestions when there are messages */}
          {messages.length > 0 && !isLoading && (
            <View className="mb-3">
              <SuggestionChips
                suggestions={["Continue", "Explain more", "What else?"]}
                onPress={handleSuggestionPress}
                compact
              />
            </View>
          )}

          <View className="flex-row items-end gap-2">
            <View className="flex-1 bg-muted rounded-2xl px-4 py-2 min-h-[44px] max-h-32">
              <TextInput
                className="text-foreground text-base leading-5"
                placeholder="Ask me anything..."
                placeholderTextColor="#9ca3af"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={2000}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={handleSend}
              />
            </View>
            <TouchableOpacity
              className={`w-11 h-11 rounded-full items-center justify-center ${
                input.trim() && !isLoading ? 'bg-primary' : 'bg-muted'
              }`}
              onPress={handleSend}
              disabled={!input.trim() || isLoading}
              activeOpacity={0.7}
            >
              <Send
                size={20}
                color={input.trim() && !isLoading ? 'white' : '#9ca3af'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default AssistantScreen;
