// src/features/rental-inbox/screens/ConversationDetailScreen.tsx
// Conversation detail screen — thin orchestrator
// Extracted modules: conversation-detail/

import React, { useCallback } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { MessageSquare } from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, ListEmptyState } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';

import { MessageBubble } from '../components/MessageBubble';
import { AIReviewCard } from '../components/AIReviewCard';
import type { Message } from '@/stores/rental-conversations-store';

import {
  useConversationDetail,
  useConversationHeader,
  MessageInputBar,
  ConversationErrorBanner,
  styles,
} from './conversation-detail';
import type { ConversationDetailScreenProps } from './conversation-detail';

export function ConversationDetailScreen({
  conversationId,
}: ConversationDetailScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const {
    flatListRef,
    inputRef,
    keyboardProps,
    messageText,
    setMessageText,
    isRefreshing,
    setShowSettingsSheet,
    conversation,
    messages,
    pendingResponse,
    isLoading,
    isSending,
    error,
    contactName,
    handleSend,
    handleRefresh,
    handleApprove,
    handleReject,
    keyExtractor,
    handleBack,
    clearError,
  } = useConversationDetail(conversationId);

  const headerOptions = useConversationHeader({
    contactName,
    conversation,
    insetsTop: insets.top,
    handleBack,
    setShowSettingsSheet,
  });

  // Render message item
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    return <MessageBubble message={item} />;
  }, []);

  // Show loading state
  if (isLoading && !conversation) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading conversation..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  // Show error state
  if (!conversation && !isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View style={styles.errorContainer}>
            <ListEmptyState
              state="error"
              title="Conversation Not Found"
              description={error || 'Unable to load conversation.'}
              primaryAction={{
                label: 'Go Back',
                onPress: handleBack,
              }}
            />
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={keyboardProps.behavior}
          keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
        >

        {/* Error Banner - shows transient errors without replacing the whole screen */}
        {error && conversation && (
          <ConversationErrorBanner
            error={error}
            onRetry={handleRefresh}
            onDismiss={clearError}
          />
        )}

        {/* Message list */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          inverted
          style={styles.messageList}
          contentContainerStyle={[
            styles.messageListContent,
            { paddingBottom: SPACING.md },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.info}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ListEmptyState
                state="empty"
                icon={MessageSquare}
                title="No Messages Yet"
                description="Start the conversation by sending a message below."
              />
            </View>
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* AI Review Card - appears when there's a pending response */}
        {pendingResponse && (
          <AIReviewCard
            pendingResponse={pendingResponse}
            onApprove={handleApprove}
            onReject={handleReject}
            isProcessing={isSending}
          />
        )}

        {/* Message input */}
        <MessageInputBar
          inputRef={inputRef}
          messageText={messageText}
          setMessageText={setMessageText}
          handleSend={handleSend}
          isSending={isSending}
          bottomInset={insets.bottom}
        />
        </KeyboardAvoidingView>
      </ThemedSafeAreaView>
    </>
  );
}

export default ConversationDetailScreen;
