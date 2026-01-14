// src/features/assistant/components/PatchSetPreview.tsx
// Preview UI for PatchSets before applying

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
  ArrowRight,
  Sparkles,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';

import {
  PatchSet,
  PatchOperation,
  CONFIDENCE_COLORS,
  ENTITY_LABELS,
  OP_LABELS,
} from '../types/patchset';
import { useApplyPatchSet } from '../hooks/useApplyPatchSet';

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

  const confidenceColor = CONFIDENCE_COLORS[patchSet.confidence] || 'gray';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Preview Changes"
      snapPoints={['75%']}
    >
      <View style={styles.container}>
        {/* Summary Header */}
        <View style={[styles.summaryCard, { backgroundColor: colors.muted }]}>
          <View style={styles.summaryRow}>
            <Sparkles size={20} color={colors.primary} />
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
                  <FileText size={14} color={colors.mutedForeground} />
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
            <AlertCircle size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              Failed to apply {lastResult.failedOps} operation(s)
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
            disabled={isApplying}
            accessibilityRole="button"
            accessibilityLabel="Cancel and close preview"
          >
            <X size={18} color={colors.mutedForeground} />
            <Text style={[styles.buttonText, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.applyButton,
              { backgroundColor: colors.primary },
              isApplying && styles.buttonDisabled,
            ]}
            onPress={handleApply}
            disabled={isApplying}
            accessibilityRole="button"
            accessibilityLabel={`Apply ${patchSet.ops.length} change${patchSet.ops.length !== 1 ? 's' : ''}`}
            accessibilityState={{ disabled: isApplying }}
          >
            {isApplying ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={18} color="#fff" />
                <Text style={[styles.buttonText, { color: '#fff' }]}>
                  Apply Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

// Operation Card Component
interface OperationCardProps {
  operation: PatchOperation;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}

function OperationCard({ operation, index, expanded, onToggle }: OperationCardProps) {
  const colors = useThemeColors();

  const opLabel = OP_LABELS[operation.op] || operation.op;
  const entityLabel = ENTITY_LABELS[operation.entity] || operation.entity;

  // Get display values for before/after
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
          <ChevronUp size={18} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={colors.mutedForeground} />
        )}
      </View>

      {/* Expanded Content */}
      {expanded && (
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
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  opCount: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  opsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  opCard: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  opHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  opTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
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
  opDetails: {
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 8,
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
    marginTop: 4,
  },
  rationaleLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  rationaleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sourceText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  eventsCard: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventText: {
    fontSize: 13,
    flex: 1,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {
    borderWidth: 1,
  },
  applyButton: {},
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default PatchSetPreview;
