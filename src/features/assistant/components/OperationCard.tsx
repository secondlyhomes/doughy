// src/features/assistant/components/OperationCard.tsx
// Expandable card showing a single PatchSet operation with before/after diff

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, ICON_SIZES } from '@/constants/design-tokens';

import {
  PatchOperation,
  OP_LABELS,
  ENTITY_LABELS,
} from '../types/patchset';
import { OperationDetails } from './OperationDetails';

interface OperationCardProps {
  operation: PatchOperation;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

export function OperationCard({ operation, index, expanded, onToggle }: OperationCardProps) {
  const colors = useThemeColors();

  const opLabel = OP_LABELS[operation.op] || operation.op;
  const entityLabel = ENTITY_LABELS[operation.entity] || operation.entity;

  return (
    <TouchableOpacity
      style={[styles.opCard, { backgroundColor: colors.muted, borderColor: colors.border }]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View style={styles.opHeader}>
        <View style={styles.opTitleRow}>
          <View
            style={[
              styles.opBadge,
              {
                backgroundColor:
                  operation.op === 'create'
                    ? colors.success + '20'
                    : operation.op === 'delete'
                    ? colors.destructive + '20'
                    : colors.warning + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.opBadgeText,
                {
                  color:
                    operation.op === 'create'
                      ? colors.success
                      : operation.op === 'delete'
                      ? colors.destructive
                      : colors.warning,
                },
              ]}
            >
              {opLabel}
            </Text>
          </View>
          <Text style={[styles.opEntity, { color: colors.foreground }]}>
            {entityLabel}
          </Text>
        </View>
        {expanded ? (
          <ChevronUp size={ICON_SIZES.ml} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={ICON_SIZES.ml} color={colors.mutedForeground} />
        )}
      </View>

      {/* Expanded Content */}
      {expanded && <OperationDetails operation={operation} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  opCard: {
    borderRadius: BORDER_RADIUS['10'],
    borderWidth: 1,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  opHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  opTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  opBadge: {
    paddingHorizontal: 8,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  opBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  opEntity: {
    fontSize: 14,
    fontWeight: '500',
  },
});
