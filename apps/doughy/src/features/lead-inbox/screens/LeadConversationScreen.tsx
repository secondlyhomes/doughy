// src/features/lead-inbox/screens/LeadConversationScreen.tsx
// Conversation detail screen for lead communication inbox
// Displays message thread with AI review capabilities

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle } from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { useInvestorConversationsStore } from '@/stores/investor-conversations-store';

import { useLeadConversation } from '../hooks/useLeadInbox';
import { LeadMessageBubble } from '../components/LeadMessageBubble';
import { LeadAIReviewCard } from '../components/LeadAIReviewCard';
import type { InvestorMessage } from '../types';

import {
  ConversationComposer,
  ConversationSettingsSheet,
  useConversationHeader,
} from './lead-conversation';

export function LeadConversationScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
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

  const headerOptions = useConversationHeader({
    leadName,
    conversation,
    topInset: insets.top,
    onSettingsPress: () => setShowSettingsSheet(true),
  });

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
          <ConversationComposer
            messageText={messageText}
            onChangeText={setMessageText}
            onSend={handleSend}
            isSending={isSending}
            paddingBottom={insets.bottom}
          />
        </KeyboardAvoidingView>

        {/* Settings Bottom Sheet */}
        <ConversationSettingsSheet
          visible={showSettingsSheet}
          onClose={() => setShowSettingsSheet(false)}
          conversation={conversation}
          onSetAIEnabled={setAIEnabled}
          onSetAutoRespond={setAutoRespond}
        />
      </ThemedSafeAreaView>
    </>
  );
}

export default LeadConversationScreen;
