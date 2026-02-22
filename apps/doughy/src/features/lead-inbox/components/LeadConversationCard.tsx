// src/features/lead-inbox/components/LeadConversationCard.tsx
// Card component for displaying lead conversations in the inbox list

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { formatRelativeTime } from '@/utils/format';
import { ConversationCardAvatar } from './ConversationCardAvatar';
import { ConversationCardTags } from './ConversationCardTags';
import { styles } from './lead-conversation-card-styles';
import type { LeadConversationListItem } from '../types';

interface LeadConversationCardProps {
  conversation: LeadConversationListItem;
  onPress: () => void;
}

export const LeadConversationCard = memo(function LeadConversationCard({
  conversation,
  onPress,
}: LeadConversationCardProps) {
  const colors = useThemeColors();

  const leadName = conversation.lead?.name || 'Unknown Lead';
  const leadInitial = leadName.charAt(0).toUpperCase();
  const hasUnread = conversation.unread_count > 0;
  const hasPending = conversation.hasPendingResponse;

  // Lead status tag
  const leadStatus = conversation.lead?.status || 'new';
  const leadSource = conversation.lead?.source;

  // Format time
  const timeAgo = conversation.last_message_at
    ? formatRelativeTime(new Date(conversation.last_message_at))
    : 'No messages';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: hasPending
            ? withOpacity(colors.warning, 'medium')
            : hasUnread
            ? withOpacity(colors.primary, 'medium')
            : colors.border,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${leadName}${hasUnread ? ', has unread messages' : ''}${hasPending ? ', AI response waiting' : ''}`}
    >
      {/* Avatar and status indicator */}
      <ConversationCardAvatar
        initial={leadInitial}
        hasUnread={hasUnread}
        hasPending={hasPending}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Name and time row */}
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.name,
              {
                color: colors.foreground,
                fontWeight: hasUnread || hasPending ? '700' : '600',
              },
            ]}
            numberOfLines={1}
          >
            {leadName}
          </Text>
          <View style={styles.timeRow}>
            <Clock size={12} color={colors.mutedForeground} />
            <Text style={[styles.time, { color: colors.mutedForeground }]}>
              {timeAgo}
            </Text>
          </View>
        </View>

        {/* Channel and tags row */}
        <ConversationCardTags
          channel={conversation.channel}
          leadSource={leadSource}
          leadStatus={leadStatus}
        />

        {/* Message preview */}
        <Text
          style={[
            styles.preview,
            {
              color: hasUnread || hasPending
                ? colors.foreground
                : colors.mutedForeground,
              fontWeight: hasUnread || hasPending ? '500' : '400',
            },
          ]}
          numberOfLines={2}
        >
          {conversation.last_message_preview || 'No messages yet'}
        </Text>

        {/* Pending AI indicator */}
        {hasPending && (
          <View style={styles.pendingRow}>
            <View
              style={[
                styles.pendingBadge,
                { backgroundColor: withOpacity(colors.warning, 'light') },
              ]}
            >
              <Sparkles size={12} color={colors.warning} />
              <Text style={[styles.pendingText, { color: colors.warning }]}>
                AI response ready for review
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Unread count badge */}
      {hasUnread && !hasPending && (
        <View
          style={[
            styles.unreadBadge,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[styles.unreadText, { color: colors.primaryForeground }]}>
            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default LeadConversationCard;
