// src/features/turnovers/screens/turnover-detail/ScheduleCard.tsx
// Schedule card showing checkout/checkin dates and guest info

import React from 'react';
import { View, Text } from 'react-native';
import { CalendarClock, User } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { formatDateTime } from './utils';

interface ScheduleCardProps {
  checkoutAt: string;
  checkinAt?: string | null;
  guestName?: string | null;
}

export function ScheduleCard({ checkoutAt, checkinAt, guestName }: ScheduleCardProps) {
  const colors = useThemeColors();

  return (
    <Card className="mb-4">
      <Text
        style={{
          color: colors.foreground,
          fontSize: FONT_SIZES.lg,
          fontWeight: '600',
          marginBottom: SPACING.md,
        }}
      >
        Schedule
      </Text>

      <View className="flex-row items-center gap-3 mb-3">
        <CalendarClock size={20} color={colors.primary} />
        <View>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
            }}
          >
            Checkout
          </Text>
          <Text
            style={{
              color: colors.foreground,
              fontSize: FONT_SIZES.base,
              fontWeight: '500',
            }}
          >
            {formatDateTime(checkoutAt)}
          </Text>
        </View>
      </View>

      {checkinAt && (
        <View className="flex-row items-center gap-3">
          <CalendarClock size={20} color={colors.success} />
          <View>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.xs,
              }}
            >
              Next Check-in
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
                fontWeight: '500',
              }}
            >
              {formatDateTime(checkinAt)}
            </Text>
          </View>
        </View>
      )}

      {guestName && (
        <View className="flex-row items-center gap-3 mt-3 pt-3 border-t border-border">
          <User size={20} color={colors.mutedForeground} />
          <View>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.xs,
              }}
            >
              Departing Guest
            </Text>
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
              }}
            >
              {guestName}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}
