// useChat Hook - React Native
// Manages chat state and AI interactions

import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface UseChatReturn {
  messages: Message[];
  sendMessage: (content: string) => void;
  isLoading: boolean;
  error: Error | null;
  clearMessages: () => void;
}

// Mock AI responses for development
const mockResponses = [
  "I've analyzed your leads and found 3 that need immediate follow-up. Sarah Johnson from Acme Corp hasn't been contacted in 5 days and has a high engagement score.",
  "Based on your conversion data, your best performing channel is email with a 32% response rate. I recommend focusing your outreach efforts there.",
  "I can help you draft that email. Here's a suggested template:\n\nHi [Name],\n\nI hope this message finds you well. I wanted to follow up on our recent conversation about...",
  "Your analytics show a 15% increase in lead engagement this week. The most active time for responses is between 10 AM and 2 PM.",
  "I found 5 properties matching your client's criteria. Would you like me to summarize the key features of each?",
];

function getRandomResponse(): string {
  return mockResponses[Math.floor(Math.random() * mockResponses.length)];
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual AI API call
      // const response = await fetch('/api/chat', {
      //   method: 'POST',
      //   body: JSON.stringify({ message: content }),
      // });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Mock response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: getRandomResponse(),
        createdAt: new Date().toISOString(),
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
  }, []);

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
