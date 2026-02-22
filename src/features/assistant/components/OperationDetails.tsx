// src/features/assistant/components/OperationDetails.tsx
// Expanded details section for a PatchSet operation (before/after diff, rationale, source)

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';

import { PatchOperation } from '../types/patchset';

interface OperationDetailsProps {
  operation: PatchOperation;
}

export function OperationDetails({ operation }: OperationDetailsProps) {
  const colors = useThemeColors();

  const beforeDisplay = operation.before
    ? Object.entries(operation.before)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : null;

  const afterDisplay = operation.after
    ? Object.entries(operation.after)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
    : null;

  return (
    <View style={[styles.opDetails, { borderTopColor: colors.border }]}>
      {/* Before/After */}
      {beforeDisplay && (
        <View style={styles.diffRow}>
          <Text style={[styles.diffLabel, { color: colors.mutedForeground }]}>
            Before:
          </Text>
          <Text style={[styles.diffValue, { color: colors.destructive }]}>
            {beforeDisplay}
          </Text>
        </View>
      )}

      {afterDisplay && (
        <View style={styles.diffRow}>
          <Text style={[styles.diffLabel, { color: colors.mutedForeground }]}>
            After:
          </Text>
          <Text style={[styles.diffValue, { color: colors.success }]}>
            {afterDisplay}
          </Text>
        </View>
      )}

      {/* Rationale */}
      <View style={styles.rationaleRow}>
        <Text style={[styles.rationaleLabel, { color: colors.mutedForeground }]}>
          Why:
        </Text>
        <Text style={[styles.rationaleText, { color: colors.foreground }]}>
          {operation.rationale}
        </Text>
      </View>

      {/* Source */}
      {operation.source && (
        <View style={styles.sourceRow}>
          <Text style={[styles.sourceLabel, { color: colors.mutedForeground }]}>
            Source:
          </Text>
          <Text style={[styles.sourceText, { color: colors.primary }]}>
            {operation.source}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  opDetails: {
    padding: SPACING.md,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  diffRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  diffLabel: {
    fontSize: 12,
    fontWeight: '500',
    width: 50,
  },
  diffValue: {
    fontSize: 12,
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rationaleRow: {
    marginTop: SPACING.xs,
  },
  rationaleLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  rationaleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sourceText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
