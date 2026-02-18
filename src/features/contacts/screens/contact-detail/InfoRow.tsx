// src/features/contacts/screens/contact-detail/InfoRow.tsx
// Reusable info row component for contact details

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import type { InfoRowProps } from './types';

export function InfoRow({ icon: Icon, label, value, onPress }: InfoRowProps) {
  const colors = useThemeColors();

  const content = (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: withOpacity(colors.primary, 'light') }]}>
        <Icon size={16} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: onPress ? colors.primary : colors.foreground }]}>
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <View style={styles.infoRowTouchable}>
        {content}
        <Button variant="outline" size="sm" onPress={onPress}>
          Open
        </Button>
      </View>
    );
  }

  return content;
}

const styles = {
  infoRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
  infoRowTouchable: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: SPACING.md,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
  },
};
