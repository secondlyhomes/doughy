// src/features/campaigns/screens/CampaignCard.tsx
// Campaign card component for the campaigns list

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Badge } from '@/components/ui';
import { getStatusBadgeVariant } from '@/lib/formatters';
import {
  ChevronRight,
  Users,
  MessageSquare,
  Target,
  Calendar,
  Mail,
  Phone,
  Instagram,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import type { DripCampaign } from '../types';
import { LEAD_TYPE_CONFIG, CHANNEL_CONFIG } from '../types';

// =============================================================================
// Campaign Card Component
// =============================================================================

export interface CampaignCardProps {
  campaign: DripCampaign;
  onPress: () => void;
}

export const CampaignCard = memo(function CampaignCard({ campaign, onPress }: CampaignCardProps) {
  const colors = useThemeColors();

  const leadTypeConfig = campaign.lead_type
    ? LEAD_TYPE_CONFIG[campaign.lead_type]
    : null;

  // Calculate conversion rate
  const conversionRate = campaign.enrolled_count > 0
    ? ((campaign.converted_count / campaign.enrolled_count) * 100).toFixed(1)
    : '0.0';

  // Format date relative
  const formatRelativeDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      className="rounded-xl p-4"
      style={{ backgroundColor: colors.card }}
      onPress={onPress}
      accessibilityLabel={`${campaign.name} campaign, ${campaign.status}`}
      accessibilityRole="button"
    >
      {/* Header: Status Badge + Name */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          <Badge variant={getStatusBadgeVariant(campaign.status)} size="sm" className="mr-2">
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </Badge>
          <Text
            className="text-base font-semibold flex-1 flex-shrink"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {campaign.name}
          </Text>
        </View>
        <ChevronRight size={20} color={colors.mutedForeground} />
      </View>

      {/* Lead Type Badge */}
      {leadTypeConfig && (
        <View className="flex-row items-center mb-3">
          <Target size={14} color={colors.primary} />
          <Text className="text-sm ml-1" style={{ color: colors.primary }}>
            {leadTypeConfig.label}
          </Text>
        </View>
      )}

      {/* Stats Row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Users size={14} color={colors.mutedForeground} />
          <Text className="text-sm ml-1" style={{ color: colors.foreground }}>
            {campaign.enrolled_count} enrolled
          </Text>
        </View>

        <View className="flex-row items-center">
          <MessageSquare size={14} color={colors.success} />
          <Text className="text-sm ml-1" style={{ color: colors.foreground }}>
            {campaign.responded_count} responded
          </Text>
        </View>

        <View className="flex-row items-center">
          <Target size={14} color={colors.info} />
          <Text className="text-sm ml-1" style={{ color: colors.foreground }}>
            {conversionRate}% conv
          </Text>
        </View>
      </View>

      {/* Campaign Steps Preview */}
      {campaign.steps && campaign.steps.length > 0 && (
        <View className="flex-row items-center gap-1 mb-2">
          {campaign.steps.slice(0, 5).map((step: { channel: string }, index: number) => {
            const channelConfig = CHANNEL_CONFIG[step.channel as keyof typeof CHANNEL_CONFIG];
            const ChannelIcon = step.channel === 'sms' ? MessageSquare
              : step.channel === 'email' ? Mail
              : step.channel === 'phone_reminder' ? Phone
              : step.channel === 'meta_dm' ? Instagram
              : Mail;

            return (
              <View
                key={index}
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: withOpacity(channelConfig?.color || colors.muted, 'light') }}
              >
                <ChannelIcon size={12} color={channelConfig?.color || colors.mutedForeground} />
              </View>
            );
          })}
          {campaign.steps.length > 5 && (
            <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
              +{campaign.steps.length - 5}
            </Text>
          )}
        </View>
      )}

      {/* Footer: Updated date */}
      <View className="flex-row items-center justify-end">
        <Calendar size={12} color={colors.mutedForeground} />
        <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
          {formatRelativeDate(campaign.updated_at)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.campaign.id === nextProps.campaign.id &&
    prevProps.campaign.status === nextProps.campaign.status &&
    prevProps.campaign.enrolled_count === nextProps.campaign.enrolled_count &&
    prevProps.campaign.updated_at === nextProps.campaign.updated_at &&
    prevProps.onPress === nextProps.onPress
  );
});
