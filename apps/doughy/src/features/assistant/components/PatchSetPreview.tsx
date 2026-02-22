// src/features/assistant/components/PatchSetPreview.tsx
// Preview UI for PatchSets before applying

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BORDER_RADIUS, SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';

import { PatchSet } from '../types/patchset';
import { useApplyPatchSet } from '../hooks/useApplyPatchSet';
import { OperationCard } from './OperationCard';
import { PatchSetSummaryHeader } from './PatchSetSummaryHeader';
import { PatchSetActionButtons } from './PatchSetActionButtons';

interface PatchSetPreviewProps {
  visible: boolean;
  patchSet: PatchSet | null;
  onClose: () => void;
  onApplied?: () => void;
}

export function PatchSetPreview({
  visible,
  patchSet,
  onClose,
  onApplied,
}: PatchSetPreviewProps) {
  const colors = useThemeColors();
  const { toast } = useToast();
  const { apply, isApplying, lastResult } = useApplyPatchSet();
  const [expandedOps, setExpandedOps] = useState<Set<number>>(new Set());

  if (!patchSet) return null;

  const toggleOpExpanded = (index: number) => {
    const newExpanded = new Set(expandedOps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedOps(newExpanded);
  };

  const handleApply = async () => {
    try {
      const result = await apply(patchSet);
      if (result.success) {
        toast({
          type: 'success',
          title: 'Changes applied',
          description: `${result.appliedOps} change${result.appliedOps !== 1 ? 's' : ''} applied successfully`,
        });
        onApplied?.();
        onClose();
      } else {
        toast({
          type: 'error',
          title: 'Some changes failed',
          description: `${result.failedOps} of ${result.appliedOps + result.failedOps} changes failed`,
        });
      }
    } catch (error) {
      console.error('Failed to apply PatchSet:', error);
      toast({
        type: 'error',
        title: 'Failed to apply changes',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Preview Changes"
      snapPoints={['75%']}
    >
      <View style={styles.container}>
        <PatchSetSummaryHeader patchSet={patchSet} />

        {/* Operations List */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          WHAT WILL CHANGE
        </Text>

        <ScrollView style={styles.opsList} showsVerticalScrollIndicator={false}>
          {patchSet.ops.map((op, index) => (
            <OperationCard
              key={index}
              operation={op}
              index={index}
              expanded={expandedOps.has(index)}
              onToggle={() => toggleOpExpanded(index)}
            />
          ))}
        </ScrollView>

        {/* Timeline Events Preview */}
        {patchSet.willCreateTimelineEvents.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              TIMELINE EVENTS
            </Text>
            <View style={[styles.eventsCard, { backgroundColor: colors.muted }]}>
              {patchSet.willCreateTimelineEvents.map((event, index) => (
                <View key={index} style={styles.eventRow}>
                  <FileText size={ICON_SIZES.sm} color={colors.mutedForeground} />
                  <Text style={[styles.eventText, { color: colors.foreground }]}>
                    {event.title}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Error Display */}
        {lastResult && !lastResult.success && (
          <View style={[styles.errorCard, { backgroundColor: colors.destructive + '20' }]}>
            <AlertCircle size={ICON_SIZES.md} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              Failed to apply {lastResult.failedOps} operation(s)
            </Text>
          </View>
        )}

        <PatchSetActionButtons
          opsCount={patchSet.ops.length}
          isApplying={isApplying}
          onCancel={onClose}
          onApply={handleApply}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  opsList: {
    maxHeight: 200,
    marginBottom: SPACING.lg,
  },
  eventsCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS['10'],
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  eventText: {
    fontSize: 13,
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS['10'],
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
});

export default PatchSetPreview;
