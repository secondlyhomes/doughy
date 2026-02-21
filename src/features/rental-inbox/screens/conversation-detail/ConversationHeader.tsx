// Conversation detail header configuration

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import {
  MessageSquare,
  ArrowLeft,
  MoreVertical,
  Sparkles,
} from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { CHANNEL_ICONS } from './conversation-detail-types';
import type { ConversationWithRelations } from '@/stores/rental-conversations-store';

interface UseConversationHeaderOptions {
  contactName: string;
  conversation: ConversationWithRelations | undefined;
  insetsTop: number;
  handleBack: () => void;
  setShowSettingsSheet: (show: boolean) => void;
}

export function useConversationHeader({
  contactName,
  conversation,
  insetsTop,
  handleBack,
  setShowSettingsSheet,
}: UseConversationHeaderOptions): NativeStackNavigationOptions {
  const colors = useThemeColors();

  return useMemo((): NativeStackNavigationOptions => {
    // Derive channel icon inside useMemo to avoid stale closure issues
    const ChannelIcon = conversation
      ? CHANNEL_ICONS[conversation.channel] || MessageSquare
      : MessageSquare;

    return {
      headerShown: true,
      headerStyle: { backgroundColor: colors.background },
      headerShadowVisible: false,
      headerStatusBarHeight: insetsTop,
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
  }, [colors, insetsTop, contactName, conversation, handleBack, setShowSettingsSheet]);
}
