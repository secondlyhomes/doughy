/**
 * OverrideWarningBanner
 * Warning card shown when user is about to override an AI calculation.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { Card } from './Card';

export function OverrideWarningBanner() {
  const colors = useThemeColors();

  return (
    <Card variant="default" style={{ backgroundColor: withOpacity(colors.warning, 'subtle') }}>
      <View
        style={{
          padding: SPACING.md,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: SPACING.sm,
        }}
      >
        <AlertTriangle size={ICON_SIZES.md} color={colors.warning} />
        <Text style={{ flex: 1, fontSize: 13, color: colors.foreground, lineHeight: 18 }}>
          Overriding AI calculations may affect accuracy. Please provide a detailed reason for
          this change.
        </Text>
      </View>
    </Card>
  );
}
