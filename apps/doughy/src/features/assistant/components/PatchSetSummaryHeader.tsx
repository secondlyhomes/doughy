// src/features/assistant/components/PatchSetSummaryHeader.tsx
// Summary card showing PatchSet confidence, description, and change count

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, ICON_SIZES } from '@/constants/design-tokens';

import { PatchSet, CONFIDENCE_COLORS } from '../types/patchset';

interface PatchSetSummaryHeaderProps {
  patchSet: PatchSet;
}

export function PatchSetSummaryHeader({ patchSet }: PatchSetSummaryHeaderProps) {
  const colors = useThemeColors();
  const confidenceColor = CONFIDENCE_COLORS[patchSet.confidence] || 'gray';

  return (
    <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
      <View style={styles.summaryRow}>
        <Sparkles size={ICON_SIZES.lg} color={colors.primary} />
        <Text style={[styles.summaryText, { color: colors.foreground }]}>
          {patchSet.summary}
        </Text>
      </View>
      <View style={styles.metaRow}>
        <View style={[styles.badge, { backgroundColor: `${confidenceColor}20` }]}>
          <Text style={[styles.badgeText, { color: confidenceColor }]}>
            {patchSet.confidence.toUpperCase()} confidence
          </Text>
        </View>
        <Text style={[styles.opCount, { color: colors.mutedForeground }]}>
          {patchSet.ops.length} change{patchSet.ops.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  opCount: {
    fontSize: 13,
  },
});
