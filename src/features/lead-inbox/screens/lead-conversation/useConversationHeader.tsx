// src/features/lead-inbox/screens/lead-conversation/useConversationHeader.tsx
// Custom hook for conversation screen header options
// Uses .tsx extension because it returns JSX in header render functions

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, MoreVertical, Sparkles } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';

import type { InvestorConversationWithRelations, InvestorChannel } from '../../types';
import { getChannelIcon } from './conversation-helpers';

interface UseConversationHeaderParams {
  leadName: string;
  conversation: InvestorConversationWithRelations | null | undefined;
  topInset: number;
  onSettingsPress: () => void;
}

export function useConversationHeader({
  leadName,
  conversation,
  topInset,
  onSettingsPress,
}: UseConversationHeaderParams) {
  const router = useRouter();
  const colors = useThemeColors();

  const ChannelIcon = conversation ? getChannelIcon(conversation.channel) : getChannelIcon('sms');

  const headerOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerShadowVisible: false,
    // Explicitly set status bar height for fullScreenModal presentation
    headerStatusBarHeight: topInset,
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
        onPress={onSettingsPress}
        style={{ padding: SPACING.sm }}
      >
        <MoreVertical size={24} color={colors.foreground} />
      </TouchableOpacity>
    ),
  }), [colors, topInset, leadName, conversation, ChannelIcon, router, onSettingsPress]);

  return headerOptions;
}
