// src/features/lead-inbox/screens/lead-conversation/ConversationSettingsSheet.tsx
// Settings bottom sheet for lead conversation AI and lead info

import React from 'react';
import { View, Text } from 'react-native';
import { Phone, Mail } from 'lucide-react-native';

import { Button, BottomSheet, BottomSheetSection } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';

import type { InvestorConversationWithRelations } from '../../types';

interface ConversationSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  conversation: InvestorConversationWithRelations | null | undefined;
  onSetAIEnabled: (enabled: boolean) => void;
  onSetAutoRespond: (enabled: boolean) => void;
}

export function ConversationSettingsSheet({
  visible,
  onClose,
  conversation,
  onSetAIEnabled,
  onSetAutoRespond,
}: ConversationSettingsSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
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
              onPress={() => onSetAIEnabled(!conversation?.is_ai_enabled)}
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
                onPress={() => onSetAutoRespond(!conversation?.is_ai_auto_respond)}
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
        <Button onPress={onClose}>
          Done
        </Button>
      </View>
    </BottomSheet>
  );
}
