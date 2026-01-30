// src/features/rental-inbox/components/ConversationCard.tsx
// Conversation list item card for inbox

import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  MessageSquare,
  Mail,
  Phone,
  Bot,
  Clock,
  Building2,
  AlertCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import type { ConversationWithRelations, Channel } from '@/stores/rental-conversations-store';

interface ConversationCardProps {
  conversation: ConversationWithRelations & { hasPendingResponse?: boolean };
  onPress: () => void;
}

// Channel icon mapping (matches rental_channel enum from database)
const CHANNEL_ICONS: Partial<Record<Channel, React.ComponentType<{ size: number; color: string }>>> = {
  whatsapp: MessageSquare,
  telegram: MessageSquare,
  email: Mail,
  sms: Phone,
  imessage: MessageSquare,
  discord: MessageSquare,
  webchat: MessageSquare,
  phone: Phone,
};

// Channel colors
const CHANNEL_COLORS: Partial<Record<Channel, string>> = {
  whatsapp: '#25D366',
  telegram: '#0088cc',
  email: '#EA4335',
  sms: '#5C6BC0',
  imessage: '#007AFF',
  discord: '#5865F2',
  webchat: '#6B7280',
  phone: '#10B981',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const ConversationCard = memo(function ConversationCard({
  conversation,
  onPress,
}: ConversationCardProps) {
  const colors = useThemeColors();
  const ChannelIcon = CHANNEL_ICONS[conversation.channel] || MessageSquare;
  const channelColor = CHANNEL_COLORS[conversation.channel] || colors.mutedForeground;

  const contactName = conversation.contact
    ? `${conversation.contact.first_name || ''} ${conversation.contact.last_name || ''}`.trim() || 'Unknown Contact'
    : 'Unknown Contact';
  const propertyName = conversation.property?.name || conversation.property?.address;
  const hasPending = conversation.hasPendingResponse;
  const isAIEnabled = conversation.is_ai_enabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        borderWidth: hasPending ? 2 : 1,
        borderColor: hasPending ? colors.warning : colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${contactName}${hasPending ? ', needs review' : ''}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Channel Icon */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: withOpacity(channelColor, 'light'),
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: SPACING.sm,
          }}
        >
          <ChannelIcon size={22} color={channelColor} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Header row: Name + Time */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SPACING.xs,
            }}
          >
            <Text
              style={{
                fontSize: FONT_SIZES.base,
                fontWeight: '600',
                color: colors.foreground,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {contactName}
            </Text>
            <Text
              style={{
                fontSize: FONT_SIZES.xs,
                color: colors.mutedForeground,
                marginLeft: SPACING.sm,
              }}
            >
              {formatTimeAgo(conversation.last_message_at)}
            </Text>
          </View>

          {/* Property (if linked) */}
          {propertyName && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: SPACING.xs,
              }}
            >
              <Building2 size={12} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: FONT_SIZES.xs,
                  color: colors.mutedForeground,
                  marginLeft: 4,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {propertyName}
              </Text>
            </View>
          )}

          {/* Bottom row: Status badges */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
              marginTop: SPACING.xs,
            }}
          >
            {/* Needs Review Badge */}
            {hasPending && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: withOpacity(colors.warning, 'light'),
                  paddingHorizontal: SPACING.sm,
                  paddingVertical: 2,
                  borderRadius: BORDER_RADIUS.sm,
                }}
              >
                <AlertCircle size={12} color={colors.warning} />
                <Text
                  style={{
                    fontSize: FONT_SIZES['2xs'],
                    fontWeight: '600',
                    color: colors.warning,
                    marginLeft: 4,
                  }}
                >
                  Needs Review
                </Text>
              </View>
            )}

            {/* AI Enabled Badge */}
            {isAIEnabled && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: withOpacity(colors.info, 'light'),
                  paddingHorizontal: SPACING.sm,
                  paddingVertical: 2,
                  borderRadius: BORDER_RADIUS.sm,
                }}
              >
                <Bot size={12} color={colors.info} />
                <Text
                  style={{
                    fontSize: FONT_SIZES['2xs'],
                    fontWeight: '500',
                    color: colors.info,
                    marginLeft: 4,
                  }}
                >
                  AI
                </Text>
              </View>
            )}

            {/* Message count */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MessageSquare size={12} color={colors.mutedForeground} />
              <Text
                style={{
                  fontSize: FONT_SIZES['2xs'],
                  color: colors.mutedForeground,
                  marginLeft: 4,
                }}
              >
                {conversation.message_count}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default ConversationCard;
