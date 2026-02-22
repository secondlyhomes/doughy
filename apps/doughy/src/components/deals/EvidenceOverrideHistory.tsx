// src/components/deals/EvidenceOverrideHistory.tsx
// Override history list for EvidenceTrailModal

import React from 'react';
import { View, Text } from 'react-native';
import { Edit3 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { formatValue, formatTimestamp } from './evidence-trail-helpers';
import type { EvidenceOverride } from './evidence-trail-types';

interface EvidenceOverrideHistoryProps {
  overrides: EvidenceOverride[];
}

export function EvidenceOverrideHistory({ overrides }: EvidenceOverrideHistoryProps) {
  const colors = useThemeColors();

  if (overrides.length === 0) return null;

  return (
    <View style={{ gap: SPACING.md }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: colors.mutedForeground,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        Override History
      </Text>

      {overrides.map((override, index) => (
        <View
          key={index}
          style={{
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: withOpacity(colors.warning, 'subtle'),
            borderWidth: 1,
            borderColor: withOpacity(colors.warning, 'light'),
            gap: SPACING.xs,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Edit3 size={ICON_SIZES.sm} color={colors.warning} />
            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
              {formatTimestamp(override.timestamp)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textDecorationLine: 'line-through' }}>
              {formatValue(override.originalValue)}
            </Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground }}>→</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
              {formatValue(override.overrideValue)}
            </Text>
          </View>
          {override.reason && (
            <Text style={{ fontSize: 13, color: colors.mutedForeground, fontStyle: 'italic' }}>
              {'"'}{override.reason}{'"'}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
