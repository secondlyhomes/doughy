// src/features/conversations/components/DirectionToggle.tsx
// Inbound/outbound direction toggle for call logging

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';

interface DirectionToggleProps {
  value: 'inbound' | 'outbound';
  onChange: (direction: 'inbound' | 'outbound') => void;
}

export function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  const colors = useThemeColors();

  return (
    <View style={{ gap: SPACING.sm }}>
      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
        Direction
      </Text>
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <TouchableOpacity
          onPress={() => onChange('outbound')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            paddingVertical: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: value === 'outbound' ? withOpacity(colors.primary, 'light') : colors.muted,
            borderWidth: 1,
            borderColor: value === 'outbound' ? colors.primary : colors.border,
          }}
        >
          <ArrowUpRight size={18} color={value === 'outbound' ? colors.primary : colors.foreground} />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: value === 'outbound' ? colors.primary : colors.foreground,
            }}
          >
            Outbound
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onChange('inbound')}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            paddingVertical: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: value === 'inbound' ? withOpacity(colors.success, 'light') : colors.muted,
            borderWidth: 1,
            borderColor: value === 'inbound' ? colors.success : colors.border,
          }}
        >
          <ArrowDownLeft size={18} color={value === 'inbound' ? colors.success : colors.foreground} />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: value === 'inbound' ? colors.success : colors.foreground,
            }}
          >
            Inbound
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
