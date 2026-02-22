// src/features/lead-inbox/components/ComposeSheet.tsx
// Bottom sheet for composing new messages to leads

import React, { memo, useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, Sparkles, User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet, Button } from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';
import { ChannelSelector } from './ChannelSelector';
import type { InvestorChannel, LeadInfo } from '../types';

interface ComposeSheetProps {
  visible: boolean;
  onClose: () => void;
  onSend: (content: string, channel: InvestorChannel) => Promise<void>;
  lead?: LeadInfo | null;
  defaultChannel?: InvestorChannel;
  isSending?: boolean;
  conversationChannel?: InvestorChannel;
}

export const ComposeSheet = memo(function ComposeSheet({
  visible,
  onClose,
  onSend,
  lead,
  defaultChannel = 'sms',
  isSending = false,
  conversationChannel,
}: ComposeSheetProps) {
  const colors = useThemeColors();
  const [message, setMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<InvestorChannel>(
    conversationChannel || defaultChannel
  );

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending) return;

    await onSend(message.trim(), selectedChannel);
    setMessage('');
    onClose();
  }, [message, selectedChannel, isSending, onSend, onClose]);

  const handleClose = useCallback(() => {
    setMessage('');
    onClose();
  }, [onClose]);

  const leadName = lead?.name || 'Lead';
  const canSend = message.trim().length > 0 && !isSending;

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title={`Message ${leadName}`}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Lead info header */}
        <View style={styles.leadHeader}>
          <View
            style={[
              styles.leadAvatar,
              { backgroundColor: colors.muted },
            ]}
          >
            <User size={20} color={colors.foreground} />
          </View>
          <View style={styles.leadInfo}>
            <Text style={[styles.leadName, { color: colors.foreground }]}>
              {leadName}
            </Text>
            <View style={styles.leadDetails}>
              {lead?.phone && (
                <Text style={[styles.leadDetail, { color: colors.mutedForeground }]}>
                  {lead.phone}
                </Text>
              )}
              {lead?.phone && lead?.email && (
                <Text style={{ color: colors.mutedForeground }}> | </Text>
              )}
              {lead?.email && (
                <Text style={[styles.leadDetail, { color: colors.mutedForeground }]}>
                  {lead.email}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Channel selector (only show if not in existing conversation) */}
        {!conversationChannel && (
          <ChannelSelector
            selectedChannel={selectedChannel}
            onSelectChannel={setSelectedChannel}
            leadOptStatus={lead?.opt_status}
            leadPhone={lead?.phone}
            leadEmail={lead?.email}
            disabled={isSending}
          />
        )}

        {/* Message input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { color: colors.foreground },
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder={`Type your message...`}
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={1000}
            editable={!isSending}
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
              {message.length}/1000
            </Text>
          </View>
        </View>

        {/* AI suggestion hint */}
        <View style={styles.aiHint}>
          <Sparkles size={14} color={colors.info} />
          <Text style={[styles.aiHintText, { color: colors.mutedForeground }]}>
            OpenClaw will learn from your messages to improve future suggestions
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={handleClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSend}
            disabled={!canSend}
            loading={isSending}
          >
            <Send size={16} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, marginLeft: 6 }}>
              Send
            </Text>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.lg,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  leadAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  leadDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  leadDetail: {
    fontSize: FONT_SIZES.sm,
  },
  inputContainer: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  input: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
    minHeight: 100,
    maxHeight: 200,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  charCount: {
    fontSize: FONT_SIZES.xs,
  },
  aiHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  aiHintText: {
    fontSize: FONT_SIZES.xs,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
});

export default ComposeSheet;
