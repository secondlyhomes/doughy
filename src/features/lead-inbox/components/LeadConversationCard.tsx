// src/features/lead-inbox/components/LeadConversationCard.tsx
// Card component for displaying lead conversations in the inbox list

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { formatRelativeTime } from '@/utils/format';
import type { LeadConversationListItem, InvestorChannel } from '../types';

interface LeadConversationCardProps {
  conversation: LeadConversationListItem;
  onPress: () => void;
}

function getChannelIcon(channel: InvestorChannel) {
  switch (channel) {
    case 'email':
      return Mail;
    case 'sms':
    case 'whatsapp':
      return MessageSquare;
    case 'phone':
      return Phone;
    default:
      return MessageSquare;
  }
}

function getChannelLabel(channel: InvestorChannel): string {
  switch (channel) {
    case 'email':
      return 'Email';
    case 'sms':
      return 'SMS';
    case 'whatsapp':
      return 'WhatsApp';
    case 'phone':
      return 'Phone';
    default:
      return channel;
  }
}

export const LeadConversationCard = memo(function LeadConversationCard({
  conversation,
  onPress,
}: LeadConversationCardProps) {
  const colors = useThemeColors();

  const leadName = conversation.lead?.name || 'Unknown Lead';
  const leadInitial = leadName.charAt(0).toUpperCase();
  const ChannelIcon = getChannelIcon(conversation.channel);
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
      <View style={styles.avatarContainer}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.muted },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.foreground }]}>
            {leadInitial}
          </Text>
        </View>
        {(hasUnread || hasPending) && (
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: hasPending ? colors.warning : colors.primary,
              },
            ]}
          />
        )}
      </View>

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
        <View style={styles.tagsRow}>
          <View
            style={[
              styles.channelBadge,
              { backgroundColor: withOpacity(colors.info, 'light') },
            ]}
          >
            <ChannelIcon size={10} color={colors.info} />
            <Text style={[styles.channelText, { color: colors.info }]}>
              {getChannelLabel(conversation.channel)}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: FONT_SIZES.base,
    flex: 1,
    marginRight: SPACING.sm,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: FONT_SIZES.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  channelText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  sourceText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  preview: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * 1.4,
  },
  pendingRow: {
    marginTop: SPACING.xs,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
  },
  pendingText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: SPACING.sm,
    alignSelf: 'center',
  },
  unreadText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '700',
  },
});

export default LeadConversationCard;
