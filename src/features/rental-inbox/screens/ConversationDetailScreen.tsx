// src/features/rental-inbox/screens/ConversationDetailScreen.tsx
// Conversation detail screen showing full message thread and message input

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  RefreshControl,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import {
  Send,
  MessageSquare,
  Mail,
  Phone,
  AlertCircle,
  ArrowLeft,
  MoreVertical,
  Sparkles,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, ListEmptyState, Alert, AlertDescription, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  LINE_HEIGHTS,
} from '@/constants/design-tokens';
import { haptic } from '@/lib/haptics';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';

import { useConversation } from '../hooks/useInbox';
import { MessageBubble } from '../components/MessageBubble';
import { AIReviewCard, ApprovalMetadata } from '../components/AIReviewCard';
import type { Message, Channel } from '@/stores/rental-conversations-store';

// Channel icon mapping
const CHANNEL_ICONS: Partial<
  Record<Channel, React.ComponentType<{ size: number; color: string }>>
> = {
  whatsapp: MessageSquare,
  telegram: MessageSquare,
  email: Mail,
  sms: Phone,
  imessage: MessageSquare,
  discord: MessageSquare,
  webchat: MessageSquare,
  phone: Phone,
};

interface ConversationDetailScreenProps {
  conversationId: string;
}

export function ConversationDetailScreen({
  conversationId,
}: ConversationDetailScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
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

  // Render message item
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    return <MessageBubble message={item} />;
  }, []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Safe back navigation with fallback
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/landlord-inbox');
    }
  }, [router]);

  // Native header options for consistent iOS styling
  const headerOptions = useMemo((): NativeStackNavigationOptions => {
    // Derive channel icon inside useMemo to avoid stale closure issues
    const ChannelIcon = conversation
      ? CHANNEL_ICONS[conversation.channel] || MessageSquare
      : MessageSquare;

    return {
      headerShown: true,
      headerStyle: { backgroundColor: colors.background },
      headerShadowVisible: false,
      headerStatusBarHeight: insets.top,
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
            {contactName}
          </Text>
          {conversation && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <ChannelIcon size={12} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
                {conversation.channel.toUpperCase()}
              </Text>
              {conversation.is_ai_enabled && (
                <>
                  <Text style={{ color: colors.mutedForeground }}> | </Text>
                  <Sparkles size={12} color={colors.info} />
                  <Text style={{ color: colors.info, fontSize: FONT_SIZES.xs }}>AI</Text>
                </>
              )}
            </View>
          )}
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} style={{ padding: SPACING.sm }}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => setShowSettingsSheet(true)} style={{ padding: SPACING.sm }}>
          <MoreVertical size={24} color={colors.foreground} />
        </TouchableOpacity>
      ),
    };
  }, [colors, insets.top, contactName, conversation, handleBack]);

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
          <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
            <Alert variant="destructive" icon={<AlertCircle size={18} color={colors.destructive} />}>
              <AlertDescription variant="destructive">{error}</AlertDescription>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
                <Button size="sm" variant="outline" onPress={handleRefresh}>
                  Try Again
                </Button>
                <Button size="sm" variant="ghost" onPress={clearError}>
                  Dismiss
                </Button>
              </View>
            </Alert>
          </View>
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
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              // Use safe area bottom for home indicator, with minimum padding
              paddingBottom: insets.bottom > 0 ? insets.bottom : SPACING.sm,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.foreground }]}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={2000}
              returnKeyType="default"
              blurOnSubmit={false}
              accessibilityLabel="Message input"
              accessibilityHint="Type your message here"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim() || isSending}
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    messageText.trim() && !isSending
                      ? colors.primary
                      : colors.muted,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !messageText.trim() || isSending }}
            >
              <Send
                size={18}
                color={
                  messageText.trim() && !isSending
                    ? colors.primaryForeground
                    : colors.mutedForeground
                }
              />
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </ThemedSafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
    paddingTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    transform: [{ scaleY: -1 }], // Flip because list is inverted
  },
  inputContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    paddingLeft: SPACING.md,
    paddingRight: SPACING.xs,
    paddingVertical: SPACING.xs,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
    maxHeight: 120,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : SPACING.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

export default ConversationDetailScreen;
