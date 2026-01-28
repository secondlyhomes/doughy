// src/features/rental-inbox/screens/ConversationDetailScreen.tsx
// Conversation detail screen showing full message thread and message input

import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Mail,
  Phone,
  Building2,
  Bot,
  ChevronRight,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { GlassView, LoadingSpinner, ListEmptyState } from '@/components/ui';
import { GlassButton } from '@/components/ui/GlassButton';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
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

// Channel colors
const CHANNEL_COLORS: Partial<Record<Channel, string>> = {
  whatsapp: '#25D366',
  telegram: '#0088cc',
  email: '#EA4335',
  sms: '#5C6BC0',
  imessage: '#007AFF',
  discord: '#5865F2',
  webchat: '#6B7280',
  phone: '#10B981',
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
  const keyboardProps = useKeyboardAvoidance({
    hasTabBar: true,
    hasNavigationHeader: false,
  });

  // State
  const [messageText, setMessageText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  } = useConversation(conversationId);

  // Get channel icon and color
  const ChannelIcon = conversation
    ? CHANNEL_ICONS[conversation.channel] || MessageSquare
    : MessageSquare;
  const channelColor = conversation
    ? CHANNEL_COLORS[conversation.channel] || colors.mutedForeground
    : colors.mutedForeground;

  // Contact and property info
  const contactName = conversation?.contact
    ? `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim() || 'Unknown Contact'
    : 'Unknown Contact';
  const propertyName =
    conversation?.property?.name || conversation?.property?.address;

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

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // The hook will refetch when conversationId changes
    // For now, we simulate a refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  }, []);

  // Handle AI response approval with metadata for adaptive learning
  const handleApprove = useCallback(
    async (metadata: ApprovalMetadata) => {
      haptic.light();
      await approve(metadata);
    },
    [approve]
  );

  // Handle AI response rejection with timing for adaptive learning
  const handleReject = useCallback(async (responseTimeSeconds: number) => {
    haptic.light();
    await reject(responseTimeSeconds);
  }, [reject]);

  // Navigate to property
  const handlePropertyPress = useCallback(() => {
    if (conversation?.property_id) {
      router.push(`/(tabs)/properties/${conversation.property_id}`);
    }
  }, [conversation?.property_id, router]);

  // Render message item
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    return <MessageBubble message={item} />;
  }, []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  // Show loading state
  if (isLoading && !conversation) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading conversation..." />
      </ThemedSafeAreaView>
    );
  }

  // Show error state
  if (!conversation && !isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={styles.errorContainer}>
          <ListEmptyState
            state="error"
            title="Conversation Not Found"
            description={error || 'Unable to load conversation.'}
            primaryAction={{
              label: 'Go Back',
              onPress: () => router.back(),
            }}
          />
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
      >
        {/* Header */}
        <GlassView effect="regular" intensity={40} style={styles.header}>
          <View style={styles.headerContent}>
            {/* Back button */}
            <GlassButton
              icon={<ArrowLeft size={24} color={colors.foreground} />}
              onPress={() => router.back()}
              size={40}
              effect="clear"
              containerStyle={{ marginRight: SPACING.sm }}
              accessibilityLabel="Go back"
            />

            {/* Channel icon */}
            <View
              style={[
                styles.channelIcon,
                { backgroundColor: withOpacity(channelColor, 'light') },
              ]}
            >
              <ChannelIcon size={18} color={channelColor} />
            </View>

            {/* Contact info */}
            <View style={styles.headerInfo}>
              <Text
                style={[styles.contactName, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {contactName}
              </Text>
              {propertyName && (
                <TouchableOpacity
                  onPress={handlePropertyPress}
                  style={styles.propertyLink}
                  accessibilityRole="link"
                  accessibilityLabel={`View property ${propertyName}`}
                >
                  <Building2 size={12} color={colors.mutedForeground} />
                  <Text
                    style={[
                      styles.propertyName,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {propertyName}
                  </Text>
                  <ChevronRight size={12} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* AI status badge */}
            {conversation?.ai_enabled && (
              <View
                style={[
                  styles.aiBadge,
                  { backgroundColor: withOpacity(colors.info, 'light') },
                ]}
              >
                <Bot size={14} color={colors.info} />
              </View>
            )}
          </View>
        </GlassView>

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
              paddingBottom: Math.max(insets.bottom, SPACING.md),
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
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.tight,
  },
  propertyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  propertyName: {
    fontSize: FONT_SIZES.xs,
    flex: 1,
  },
  aiBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
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
