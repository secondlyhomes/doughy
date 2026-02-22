// src/features/public/components/useAssistantChat.ts
// State management hook for the SimpleAssistant chat widget
import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollView, Animated } from 'react-native';
import { callPublicAssistant } from '@/lib/openai';
import { Message, INITIAL_MESSAGE } from './simple-assistant-types';

export function useAssistantChat() {
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
    // Note: callPublicAssistant returns structured response, never throws
    const response = await callPublicAssistant(messageText);

    // Replace loading message with response (success or error message)
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === loadingId
          ? {
              ...msg,
              content: response.message,
              role: 'assistant' as const,
            }
          : msg
      )
    );

    // Log errors for debugging but don't need separate error handling
    // since the response already contains user-friendly error messages
    if (!response.success) {
      console.error('[SimpleAssistant] API error:', response.errorType);
    }

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

  return {
    isOpen,
    isMinimized,
    messages,
    inputValue,
    isLoading,
    scrollViewRef,
    scaleAnim,
    setInputValue,
    handleSendMessage,
    toggleOpen,
    toggleMinimize,
  };
}
