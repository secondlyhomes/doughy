// src/features/turnovers/components/TurnoverCard.tsx
// Card component for displaying turnover summary

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CalendarClock, ChevronRight, User, Home } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, Badge } from '@/components/ui';
import { FONT_SIZES, SPACING } from '@/constants/design-tokens';
import { TurnoverWithRelations, TURNOVER_STATUS_CONFIG } from '../types';

export interface TurnoverCardProps {
  turnover: TurnoverWithRelations;
  onPress?: () => void;
  showProperty?: boolean;
}

export function TurnoverCard({ turnover, onPress, showProperty = false }: TurnoverCardProps) {
  const colors = useThemeColors();
  const statusConfig = TURNOVER_STATUS_CONFIG[turnover.status];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const guestName = turnover.booking?.contact
    ? `${turnover.booking.contact.first_name || ''} ${turnover.booking.contact.last_name || ''}`.trim()
    : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            {/* Property name (if showing) */}
            {showProperty && turnover.property && (
              <View className="flex-row items-center gap-2 mb-2">
                <Home size={14} color={colors.primary} />
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.sm,
                    fontWeight: '600',
                  }}
                  numberOfLines={1}
                >
                  {turnover.property.name}
                </Text>
              </View>
            )}

            {/* Checkout date */}
            <View className="flex-row items-center gap-2">
              <CalendarClock size={16} color={colors.mutedForeground} />
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: FONT_SIZES.base,
                  fontWeight: '500',
                }}
              >
                Checkout: {formatDate(turnover.checkout_at)}
              </Text>
            </View>

            {/* Next check-in (if available) */}
            {turnover.checkin_at && (
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: FONT_SIZES.sm,
                  marginTop: 4,
                  marginLeft: 24,
                }}
              >
                Next check-in: {formatDate(turnover.checkin_at)}
              </Text>
            )}

            {/* Guest name */}
            {guestName && (
              <View className="flex-row items-center gap-2 mt-2">
                <User size={14} color={colors.mutedForeground} />
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  {guestName}
                </Text>
              </View>
            )}

            {/* Cleaner info */}
            {turnover.cleaner && (
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: FONT_SIZES.xs,
                  marginTop: 4,
                }}
              >
                🧹 {turnover.cleaner.name}
                {turnover.cleaning_scheduled_at &&
                  ` • ${formatDate(turnover.cleaning_scheduled_at)}`}
              </Text>
            )}
          </View>

          <View className="flex-row items-center gap-2">
            <Badge variant={statusConfig.color} size="sm">
              {statusConfig.emoji} {statusConfig.label}
            </Badge>
            {onPress && <ChevronRight size={18} color={colors.mutedForeground} />}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default TurnoverCard;
