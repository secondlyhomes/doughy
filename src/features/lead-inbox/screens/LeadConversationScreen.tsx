// src/features/lead-inbox/screens/LeadConversationScreen.tsx
// Conversation detail screen for lead communication inbox
// Displays message thread with AI review capabilities

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send,
  ArrowLeft,
  MoreVertical,
  Bot,
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Settings,
  AlertCircle,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { Button, BottomSheet, BottomSheetSection, Alert, AlertDescription } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { useInvestorConversationsStore } from '@/stores/investor-conversations-store';

import { useLeadConversation } from '../hooks/useLeadInbox';
import { LeadMessageBubble } from '../components/LeadMessageBubble';
import { LeadAIReviewCard } from '../components/LeadAIReviewCard';
import type { InvestorMessage, InvestorChannel } from '../types';

function getChannelIcon(channel: InvestorChannel) {
  switch (channel) {
    case 'email':
      return Mail;
    case 'sms':
    case 'whatsapp':
      return MessageSquare;
    case 'phone':
      return Phone;
    default:
      return MessageSquare;
  }
}

export function LeadConversationScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const [messageText, setMessageText] = useState('');
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const {
    conversation,
    messages,
    pendingResponse,
    confidenceRecord,
    leadSituation,
    isLoading,
    isSending,
    error,
    send,
    approve,
    reject,
    giveFeedback,
    setAIEnabled,
    setAutoRespond,
    clearError,
    refetch,
  } = useLeadConversation(conversationId || '');

  const { toggleAutoSendForSituation } = useInvestorConversationsStore();

  const leadName = conversation?.lead?.name || 'Lead';
  const ChannelIcon = conversation ? getChannelIcon(conversation.channel) : MessageSquare;

  const handleSend = useCallback(async () => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isSending) return;

    haptic.light();
    setMessageText('');
    const result = await send(trimmedMessage);
    if (!result) {
      // Restore message on failure
      setMessageText(trimmedMessage);
    }
  }, [messageText, isSending, send]);

  const handleApprove = useCallback(
    async (metadata: Parameters<typeof approve>[0]) => {
      const success = await approve(metadata);
      if (success) {
        haptic.success();
      } else {
        haptic.error();
      }
    },
    [approve]
  );

  const handleReject = useCallback(
    async (responseTimeSeconds: number) => {
      const success = await reject(responseTimeSeconds);
      if (success) {
        haptic.light();
      } else {
        haptic.error();
      }
    },
    [reject]
  );

  const handleToggleAutoSend = useCallback(
    async (enabled: boolean) => {
      haptic.light();
      await toggleAutoSendForSituation(leadSituation, enabled);
    },
    [toggleAutoSendForSituation, leadSituation]
  );

  const handleFeedback = useCallback(
    async (messageId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
      await giveFeedback(messageId, feedback);
    },
    [giveFeedback]
  );

  const renderMessage = useCallback(
    ({ item }: { item: InvestorMessage }) => (
      <LeadMessageBubble
        message={item}
        onFeedback={handleFeedback}
        showFeedback={item.sent_by === 'ai'}
        leadName={leadName}
      />
    ),
    [handleFeedback, leadName]
  );

  const keyExtractor = useCallback((item: InvestorMessage) => item.id, []);

  // Header component for FlatList (appears at bottom due to inverted list)
  const ListHeaderComponent = useCallback(() => {
    if (!pendingResponse) return null;

    return (
      <View style={{ paddingBottom: SPACING.md }}>
        <LeadAIReviewCard
          pendingResponse={pendingResponse}
          confidenceRecord={confidenceRecord}
          leadSituation={leadSituation}
          onApprove={handleApprove}
          onReject={handleReject}
          onToggleAutoSend={handleToggleAutoSend}
          isProcessing={isSending}
          showAutoSendToggle={pendingResponse.confidence >= 0.85}
        />
      </View>
    );
  }, [pendingResponse, confidenceRecord, leadSituation, handleApprove, handleReject, handleToggleAutoSend, isSending]);

  // Memoize header options to prevent infinite re-renders (per UI_CONVENTIONS.md)
  const headerOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerShadowVisible: false,
    // Explicitly set status bar height for fullScreenModal presentation
    headerStatusBarHeight: insets.top,
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {leadName}
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
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ padding: SPACING.sm }}
      >
        <ArrowLeft size={24} color={colors.foreground} />
      </TouchableOpacity>
    ),
    headerRight: () => (
      <TouchableOpacity
        onPress={() => setShowSettingsSheet(true)}
        style={{ padding: SPACING.sm }}
      >
        <MoreVertical size={24} color={colors.foreground} />
      </TouchableOpacity>
    ),
  }), [colors, insets.top, leadName, conversation, ChannelIcon, router]);

  return (
    <>
      <Stack.Screen options={headerOptions} />

      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={90}
        >
          {/* Error Banner */}
          {error && (
            <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
              <Alert variant="destructive" icon={<AlertCircle size={18} color={colors.destructive} />}>
                <AlertDescription variant="destructive">{error}</AlertDescription>
                <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
                  <Button size="sm" variant="outline" onPress={refetch}>
                    Try Again
                  </Button>
                  <Button size="sm" variant="ghost" onPress={clearError}>
                    Dismiss
                  </Button>
                </View>
              </Alert>
            </View>
          )}

          {/* Messages List */}
          {isLoading && messages.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              inverted
              contentContainerStyle={{
                paddingTop: SPACING.md,
                paddingBottom: SPACING.md,
              }}
              ListHeaderComponent={ListHeaderComponent}
              refreshControl={
                <RefreshControl
                  refreshing={false}
                  onRefresh={refetch}
                  tintColor={colors.info}
                />
              }
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={10}
            />
          )}

          {/* Input Area */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              paddingHorizontal: SPACING.md,
              paddingVertical: SPACING.sm,
              paddingBottom: insets.bottom + SPACING.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'flex-end',
                backgroundColor: colors.muted,
                borderRadius: BORDER_RADIUS.lg,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm,
                marginRight: SPACING.sm,
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  color: colors.foreground,
                  fontSize: FONT_SIZES.base,
                  maxHeight: 100,
                }}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                editable={!isSending}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!messageText.trim() || isSending}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: messageText.trim() ? colors.primary : colors.muted,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Send
                  size={20}
                  color={messageText.trim() ? colors.primaryForeground : colors.mutedForeground}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Settings Bottom Sheet */}
        <BottomSheet
          visible={showSettingsSheet}
          onClose={() => setShowSettingsSheet(false)}
          title="Conversation Settings"
        >
          <BottomSheetSection title="AI Assistant">
            <View style={{ gap: SPACING.md }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontWeight: '500' }}>
                    AI Suggestions
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}>
                    OpenClaw will suggest responses
                  </Text>
                </View>
                <Button
                  variant={conversation?.is_ai_enabled ? 'default' : 'outline'}
                  size="sm"
                  onPress={() => setAIEnabled(!conversation?.is_ai_enabled)}
                >
                  {conversation?.is_ai_enabled ? 'On' : 'Off'}
                </Button>
              </View>

              {conversation?.is_ai_enabled && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontWeight: '500' }}>
                      Auto-respond
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}>
                      Automatically send high-confidence responses
                    </Text>
                  </View>
                  <Button
                    variant={conversation?.is_ai_auto_respond ? 'default' : 'outline'}
                    size="sm"
                    onPress={() => setAutoRespond(!conversation?.is_ai_auto_respond)}
                  >
                    {conversation?.is_ai_auto_respond ? 'On' : 'Off'}
                  </Button>
                </View>
              )}
            </View>
          </BottomSheetSection>

          <BottomSheetSection title="Lead Info">
            <View style={{ gap: SPACING.sm }}>
              {conversation?.lead?.phone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Phone size={16} color={colors.mutedForeground} />
                  <Text style={{ color: colors.foreground }}>{conversation.lead.phone}</Text>
                </View>
              )}
              {conversation?.lead?.email && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Mail size={16} color={colors.mutedForeground} />
                  <Text style={{ color: colors.foreground }}>{conversation.lead.email}</Text>
                </View>
              )}
              {conversation?.lead?.source && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Text style={{ color: colors.mutedForeground }}>Source:</Text>
                  <Text style={{ color: colors.foreground }}>{conversation.lead.source}</Text>
                </View>
              )}
              {conversation?.lead?.opt_status && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Text style={{ color: colors.mutedForeground }}>SMS Status:</Text>
                  <Text
                    style={{
                      color:
                        conversation.lead.opt_status === 'opted_in'
                          ? colors.success
                          : conversation.lead.opt_status === 'opted_out'
                          ? colors.destructive
                          : colors.warning,
                      fontWeight: '500',
                    }}
                  >
                    {conversation.lead.opt_status.replace('_', ' ')}
                  </Text>
                </View>
              )}
            </View>
          </BottomSheetSection>

          <View style={{ paddingTop: SPACING.md, paddingBottom: SPACING.lg }}>
            <Button onPress={() => setShowSettingsSheet(false)}>
              Done
            </Button>
          </View>
        </BottomSheet>
      </ThemedSafeAreaView>
    </>
  );
}

export default LeadConversationScreen;
