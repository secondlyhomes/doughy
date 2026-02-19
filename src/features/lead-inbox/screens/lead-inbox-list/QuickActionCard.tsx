// src/features/lead-inbox/screens/lead-inbox-list/QuickActionCard.tsx
// Quick action card component for AI responses awaiting approval

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, Check } from 'lucide-react-native';

import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import type { ThemeColors } from '@/contexts/ThemeContext';
import type { InvestorAIQueueItem, InvestorConversationWithRelations } from '../../types';

export interface QuickActionCardProps {
  conversation: InvestorConversationWithRelations;
  pendingResponse?: InvestorAIQueueItem;
  onPress: () => void;
  onQuickApprove: () => void;
  colors: ThemeColors;
}

export function QuickActionCard({
  conversation,
  pendingResponse,
  onPress,
  onQuickApprove,
  colors,
}: QuickActionCardProps) {
  const leadName = conversation.lead?.name || 'Unknown Lead';
  const confidence = pendingResponse?.confidence || 0;
  const confidencePercent = Math.round(confidence * 100);
  const isHighConfidence = confidence >= 0.85;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: withOpacity(isHighConfidence ? colors.success : colors.warning, 'medium'),
      }}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${leadName}, ${confidencePercent}% confidence`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm }}>
        {/* Avatar */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.muted,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>
            {leadName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
              {leadName}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: SPACING.xs,
                backgroundColor: withOpacity(isHighConfidence ? colors.success : colors.warning, 'light'),
                paddingHorizontal: SPACING.sm,
                paddingVertical: SPACING.xxs,
                borderRadius: BORDER_RADIUS.full,
              }}
            >
              <Sparkles size={12} color={isHighConfidence ? colors.success : colors.warning} />
              <Text
                style={{
                  color: isHighConfidence ? colors.success : colors.warning,
                  fontSize: FONT_SIZES['2xs'],
                  fontWeight: '600',
                }}
              >
                {confidencePercent}%
              </Text>
            </View>
          </View>

          {/* Channel and tags */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xxs }}>
            <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
              {conversation.channel.toUpperCase()}
            </Text>
            {conversation.lead?.source && (
              <View
                style={{
                  backgroundColor: colors.muted,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: BORDER_RADIUS.sm,
                }}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES['2xs'] }}>
                  {conversation.lead.source}
                </Text>
              </View>
            )}
          </View>

          {/* AI suggested response preview */}
          {pendingResponse && (
            <Text
              numberOfLines={2}
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.sm,
                marginTop: SPACING.xs,
                fontStyle: 'italic',
              }}
            >
              {'"'}{pendingResponse.suggested_response.slice(0, 100)}...{'"'}
            </Text>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm }}>
        <TouchableOpacity
          onPress={onPress}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: colors.muted,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>View</Text>
        </TouchableOpacity>

        {isHighConfidence && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onQuickApprove();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.xs,
              paddingVertical: 6,
              paddingHorizontal: SPACING.md,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: colors.primary,
            }}
          >
            <Check size={14} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
              Quick Approve
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
