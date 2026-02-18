// useChat Hook - React Native
// Manages chat state and AI interactions with enhanced deal-aware AI

import { useState, useCallback } from 'react';
import { callDealAssistant, AIMessage } from '@/lib/ai/dealAssistant';
import { AssistantContextSnapshot } from '../types/context';
import { validateMessage } from '@/lib/ai/validation';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  suggestedActions?: string[];
  confidence?: 'high' | 'medium' | 'low';
}

interface UseChatReturn {
  messages: Message[];
  sendMessage: (content: string, context?: AssistantContextSnapshot) => void;
  isLoading: boolean;
  error: Error | null;
  clearMessages: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (content: string, context?: AssistantContextSnapshot) => {
    // Validate input
    const validation = validateMessage(content);
    if (!validation.isValid) {
      setError(new Error(validation.error || 'Invalid message'));
      return;
    }

    const sanitized = validation.sanitized || content;

    // Add user message with context metadata
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: sanitized,
      createdAt: new Date().toISOString(),
      metadata: context ? {
        screen: context.screen.name,
        dealId: context.selection.dealId,
        payload: context.payload,
      } : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for AI (last 5 messages for context)
      const conversationHistory: AIMessage[] = messages
        .slice(-5)
        .map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        }));

      // Call enhanced AI service with full context (use sanitized input)
      const response = context
        ? await callDealAssistant(sanitized, context, conversationHistory)
        : { content: "I need more context to help you. Please try opening the assistant from a deal or property screen." };

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        createdAt: new Date().toISOString(),
        suggestedActions: response.suggestedActions,
        confidence: response.confidence,
        metadata: {
          contextUsed: !!context,
          screenName: context?.screen.name,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));

      // Add error message to chat
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearMessages,
  };
}

export default useChat;
