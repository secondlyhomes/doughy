// src/features/campaigns/screens/campaign-detail/SequencePreview.tsx
// Preview of campaign sequence steps

import React from 'react';
import { View, Text } from 'react-native';
import { MessageSquare, Mail, Phone, Send, Instagram } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { CampaignStep } from '../../types';
import { CHANNEL_CONFIG } from '../../types';

interface SequencePreviewProps {
  steps: CampaignStep[];
}

const CHANNEL_ICONS = {
  sms: MessageSquare,
  email: Mail,
  phone_reminder: Phone,
  direct_mail: Send,
  meta_dm: Instagram,
} as const;

export function SequencePreview({ steps }: SequencePreviewProps) {
  const colors = useThemeColors();

  return (
    <View className="px-4 pb-4">
      <Text
        className="text-lg font-semibold mb-3"
        style={{ color: colors.foreground }}
      >
        Sequence ({steps.length} steps)
      </Text>

      <View className="rounded-xl p-4" style={{ backgroundColor: colors.card }}>
        {steps.map((step, index) => {
          const channelConfig = CHANNEL_CONFIG[step.channel];
          const ChannelIcon = CHANNEL_ICONS[step.channel] || MessageSquare;

          return (
            <View
              key={step.id}
              className={`flex-row items-center py-2 ${
                index < steps.length - 1 ? 'border-b' : ''
              }`}
              style={{ borderBottomColor: colors.border }}
            >
              <View
                className="w-6 h-6 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: withOpacity(channelConfig.color, 'light') }}
              >
                <ChannelIcon size={12} color={channelConfig.color} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-sm font-medium"
                  style={{ color: colors.foreground }}
                >
                  Day {step.delay_days}
                </Text>
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  {channelConfig.label}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
