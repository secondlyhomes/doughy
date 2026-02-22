// Custom hook encapsulating conversation detail state and callbacks

import { useState, useCallback, useRef, useEffect } from 'react';
import { FlatList, TextInput, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';

import { haptic } from '@/lib/haptics';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { useConversation } from '../../hooks/useInbox';
import type { ApprovalMetadata } from '../../components/AIReviewCard';
import type { Message } from '@/stores/rental-conversations-store';

export function useConversationDetail(conversationId: string) {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Message>>(null);
  const inputRef = useRef<TextInput>(null);
  // No tab bar since this screen uses fullScreenModal presentation
  const keyboardProps = useKeyboardAvoidance({
    hasTabBar: false,
    hasNavigationHeader: false,
  });

  // State
  const [messageText, setMessageText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);

  // Data hooks
  const {
    conversation,
    messages,
    pendingResponse,
    isLoading,
    isSending,
    error,
    send,
    approve,
    reject,
    clearError,
    refetch,
  } = useConversation(conversationId);

  // Contact name
  const contactName = conversation?.contact
    ? `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim() || 'Unknown Contact'
    : 'Unknown Contact';

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Small delay to ensure list has rendered
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Handle send message
  const handleSend = useCallback(async () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isSending) return;

    haptic.light();
    setMessageText('');
    Keyboard.dismiss();

    const result = await send(trimmedMessage);
    if (!result) {
      // Restore message on failure
      setMessageText(trimmedMessage);
    }
  }, [messageText, isSending, send]);

  // Handle refresh - actually refetches conversation and messages
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch {
      // Error is already handled by the store and displayed via error state
      // This catch prevents unhandled rejection warnings
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // Handle AI response approval with metadata for adaptive learning
  const handleApprove = useCallback(
    async (metadata: ApprovalMetadata) => {
      const success = await approve(metadata);
      if (success) {
        haptic.success();
      } else {
        haptic.error();
      }
    },
    [approve]
  );

  // Handle AI response rejection with timing for adaptive learning
  const handleReject = useCallback(async (responseTimeSeconds: number) => {
    const success = await reject(responseTimeSeconds);
    if (success) {
      haptic.light();
    } else {
      haptic.error();
    }
  }, [reject]);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Safe back navigation with fallback
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/landlord-inbox');
    }
  }, [router]);

  return {
    // Refs
    flatListRef,
    inputRef,
    // Keyboard
    keyboardProps,
    // State
    messageText,
    setMessageText,
    isRefreshing,
    showSettingsSheet,
    setShowSettingsSheet,
    // Data
    conversation,
    messages,
    pendingResponse,
    isLoading,
    isSending,
    error,
    contactName,
    // Callbacks
    handleSend,
    handleRefresh,
    handleApprove,
    handleReject,
    keyExtractor,
    handleBack,
    clearError,
  };
}
