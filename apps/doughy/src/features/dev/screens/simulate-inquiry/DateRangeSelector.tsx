// src/features/dev/screens/simulate-inquiry/DateRangeSelector.tsx
// Check-in / Check-out date selector row

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';

import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

interface DateRangeSelectorProps {
  checkInDate: Date;
  checkOutDate: Date;
  onOpenCheckInPicker: () => void;
  onOpenCheckOutPicker: () => void;
}

export function DateRangeSelector({
  checkInDate,
  checkOutDate,
  onOpenCheckInPicker,
  onOpenCheckOutPicker,
}: DateRangeSelectorProps) {
  const colors = useThemeColors();

  return (
    <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
          Check-in
        </Text>
        <TouchableOpacity
          onPress={onOpenCheckInPicker}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.xs }} />
          <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>
            {checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
          Check-out
        </Text>
        <TouchableOpacity
          onPress={onOpenCheckOutPicker}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.xs }} />
          <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>
            {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
