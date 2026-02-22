// src/features/campaigns/screens/mail-history/MailHistoryCard.tsx
// Individual mail history entry card

import React from 'react';
import { View, Text } from 'react-native';
import { Badge } from '@/components/ui';
import { Mail, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES } from '@/constants/design-tokens';

import type { MailHistoryEntry } from '../../hooks/useMailHistory';
import { MAIL_PIECE_CONFIG, type MailPieceType } from '../../types';
import { STATUS_CONFIG } from './mail-history-constants';
import {
  getContactName,
  formatAddress,
  formatTimeAgo,
  formatDate,
  formatCost,
} from './mail-history-helpers';

interface MailHistoryCardProps {
  entry: MailHistoryEntry;
}

export const MailHistoryCard = React.memo(function MailHistoryCard({ entry }: MailHistoryCardProps) {
  const colors = useThemeColors();
  const statusConfig = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
  const mailPieceConfig = entry.mail_piece_type
    ? MAIL_PIECE_CONFIG[entry.mail_piece_type as MailPieceType]
    : null;

  return (
    <View
      className="rounded-xl p-4 mb-3"
      style={{ backgroundColor: colors.card }}
    >
      <View className="flex-row items-start">
        <View
          className="rounded-full p-2 mr-3"
          style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
        >
          <Mail size={ICON_SIZES.lg} color={colors.primary} />
        </View>

        <View className="flex-1">
          {/* Contact Name */}
          <Text
            className="text-base font-semibold mb-1"
            style={{ color: colors.foreground }}
            numberOfLines={1}
          >
            {getContactName(entry)}
          </Text>

          {/* Mail Piece Type & Status Badges */}
          <View className="flex-row items-center gap-2 mb-2">
            {mailPieceConfig && (
              <Badge variant="secondary" size="sm">
                {mailPieceConfig.label}
              </Badge>
            )}
            <Badge variant={statusConfig.color} size="sm">
              {statusConfig.label}
            </Badge>
          </View>

          {/* Address */}
          <Text
            className="text-sm mb-1"
            style={{ color: colors.mutedForeground }}
            numberOfLines={1}
          >
            {formatAddress(entry.recipient_address)}
          </Text>

          {/* Footer: Date & Cost */}
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center">
              <Clock size={12} color={colors.mutedForeground} />
              <Text className="text-xs ml-1" style={{ color: colors.mutedForeground }}>
                {entry.sent_at ? formatTimeAgo(entry.sent_at) : formatDate(entry.scheduled_at)}
              </Text>
            </View>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {formatCost(entry.mail_cost)}
            </Text>
          </View>

          {/* Error Message (if failed) */}
          {entry.error_message && (
            <View
              className="mt-2 p-2 rounded"
              style={{ backgroundColor: withOpacity(colors.destructive, 'light') }}
            >
              <Text
                className="text-xs"
                style={{ color: colors.destructive }}
                numberOfLines={2}
              >
                {entry.error_message}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});
