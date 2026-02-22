// src/features/lead-inbox/components/ConversationCardTags.tsx
// Channel badge, source badge, and status badge row for LeadConversationCard

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { getChannelIcon, getChannelLabel } from './lead-conversation-card-helpers';
import { styles } from './lead-conversation-card-styles';
import type { InvestorChannel } from '../types';

interface ConversationCardTagsProps {
  channel: InvestorChannel;
  leadSource: string | undefined;
  leadStatus: string;
}

export function ConversationCardTags({
  channel,
  leadSource,
  leadStatus,
}: ConversationCardTagsProps) {
  const colors = useThemeColors();
  const ChannelIcon = getChannelIcon(channel);

  return (
    <View style={styles.tagsRow}>
      <View
        style={[
          styles.channelBadge,
          { backgroundColor: withOpacity(colors.info, 'light') },
        ]}
      >
        <ChannelIcon size={10} color={colors.info} />
        <Text style={[styles.channelText, { color: colors.info }]}>
          {getChannelLabel(channel)}
        </Text>
      </View>

      {leadSource && (
        <View
          style={[
            styles.sourceBadge,
            { backgroundColor: colors.muted },
          ]}
        >
          <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
            {leadSource}
          </Text>
        </View>
      )}

      {leadStatus && leadStatus !== 'new' && (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: withOpacity(
                leadStatus === 'active' ? colors.success : colors.warning,
                'light'
              ),
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: leadStatus === 'active' ? colors.success : colors.warning,
              },
            ]}
          >
            {leadStatus}
          </Text>
        </View>
      )}
    </View>
  );
}
