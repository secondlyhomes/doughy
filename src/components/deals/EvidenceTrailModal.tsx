// src/components/deals/EvidenceTrailModal.tsx
// Evidence Trail Modal - Zone G
// Shows where each metric value came from with sources, confidence, and override capability

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { X, Check, Edit3, Clock, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Modal, ModalContent, ModalHeader, ModalTitle, Button, Badge } from '@/components/ui';

// ============================================
// Types
// ============================================

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface EvidenceSource {
  /** Unique identifier */
  id: string;

  /** Source name (e.g., "Zillow", "County Records", "AI Estimate") */
  source: string;

  /** Value from this source */
  value: string | number;

  /** Confidence level */
  confidence: ConfidenceLevel;

  /** When this data was retrieved */
  timestamp?: string;

  /** Whether this is the currently active/selected value */
  isActive?: boolean;

  /** Optional link to source */
  url?: string;
}

export interface EvidenceOverride {
  /** Original value */
  originalValue: string | number;

  /** Overridden value */
  overrideValue: string | number;

  /** When override was made */
  timestamp: string;

  /** Reason for override (optional) */
  reason?: string;
}

export interface EvidenceTrailModalProps {
  /** Whether modal is visible */
  visible: boolean;

  /** Close handler */
  onClose: () => void;

  /** Field name (e.g., "ARV", "Repair Cost") */
  fieldName: string;

  /** Current value */
  currentValue: string | number;

  /** Overall confidence level */
  confidence: ConfidenceLevel;

  /** Evidence sources for this field */
  sources: EvidenceSource[];

  /** Override history */
  overrides?: EvidenceOverride[];

  /** Callback when user overrides value */
  onOverride?: (newValue: string | number, reason?: string) => void;

  /** Callback when user selects a source */
  onSelectSource?: (sourceId: string) => void;
}

// ============================================
// Helper Functions
// ============================================

function getConfidenceConfig(confidence: ConfidenceLevel) {
  switch (confidence) {
    case 'high':
      return { label: 'High Confidence', variant: 'success' as const, icon: CheckCircle2 };
    case 'medium':
      return { label: 'Medium Confidence', variant: 'warning' as const, icon: AlertCircle };
    case 'low':
      return { label: 'Low Confidence', variant: 'destructive' as const, icon: AlertCircle };
  }
}

function formatValue(value: string | number): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return value;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ============================================
// EvidenceTrailModal Component
// ============================================

export function EvidenceTrailModal({
  visible,
  onClose,
  fieldName,
  currentValue,
  confidence,
  sources,
  overrides = [],
  onOverride,
  onSelectSource,
}: EvidenceTrailModalProps) {
  const colors = useThemeColors();
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [overrideValue, setOverrideValue] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const confidenceConfig = getConfidenceConfig(confidence);
  const ConfidenceIcon = confidenceConfig.icon;

  // Handle entering override mode
  const handleStartOverride = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOverrideMode(true);
    setOverrideValue(String(currentValue));
  }, [currentValue]);

  // Handle submitting override
  const handleSubmitOverride = useCallback(() => {
    if (!overrideValue.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onOverride?.(overrideValue, overrideReason || undefined);
    setIsOverrideMode(false);
    setOverrideValue('');
    setOverrideReason('');
  }, [overrideValue, overrideReason, onOverride]);

  // Handle canceling override
  const handleCancelOverride = useCallback(() => {
    setIsOverrideMode(false);
    setOverrideValue('');
    setOverrideReason('');
  }, []);

  // Handle selecting a source
  const handleSelectSource = useCallback((sourceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectSource?.(sourceId);
  }, [onSelectSource]);

  return (
    <Modal visible={visible} onClose={onClose}>
      <ModalContent>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <ModalHeader>
            <View style={{ flex: 1 }}>
              <ModalTitle>{fieldName}</ModalTitle>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xs }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>
                  {formatValue(currentValue)}
                </Text>
                <Badge variant={confidenceConfig.variant} size="sm">
                  <ConfidenceIcon size={12} />
                  <Text> {confidenceConfig.label}</Text>
                </Badge>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={ICON_SIZES.md} color={colors.mutedForeground} />
            </TouchableOpacity>
          </ModalHeader>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.lg }}
            showsVerticalScrollIndicator={false}
          >
            {/* Override Mode */}
            {isOverrideMode ? (
              <View
                style={{
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.lg,
                  backgroundColor: withOpacity(colors.primary, 'subtle'),
                  borderWidth: 1,
                  borderColor: withOpacity(colors.primary, 'light'),
                  gap: SPACING.md,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                  Override Value
                </Text>

                <TextInput
                  value={overrideValue}
                  onChangeText={setOverrideValue}
                  placeholder="Enter new value"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  style={{
                    padding: SPACING.md,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.foreground,
                  }}
                />

                <TextInput
                  value={overrideReason}
                  onChangeText={setOverrideReason}
                  placeholder="Reason for override (optional)"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={2}
                  style={{
                    padding: SPACING.md,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: colors.background,
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 14,
                    color: colors.foreground,
                    minHeight: 60,
                    textAlignVertical: 'top',
                  }}
                />

                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                  <Button variant="outline" onPress={handleCancelOverride} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                  <Button onPress={handleSubmitOverride} style={{ flex: 1 }}>
                    <Check size={16} color={colors.primaryForeground} />
                    <Text style={{ color: colors.primaryForeground }}> Save</Text>
                  </Button>
                </View>
              </View>
            ) : (
              <>
                {/* Evidence Sources */}
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
                    Evidence Sources
                  </Text>

                  {sources.map((source) => {
                    const sourceConfidence = getConfidenceConfig(source.confidence);
                    return (
                      <TouchableOpacity
                        key={source.id}
                        onPress={() => onSelectSource && handleSelectSource(source.id)}
                        disabled={!onSelectSource}
                        activeOpacity={onSelectSource ? 0.7 : 1}
                        style={{
                          padding: SPACING.md,
                          borderRadius: BORDER_RADIUS.md,
                          backgroundColor: source.isActive
                            ? withOpacity(colors.primary, 'light')
                            : colors.card,
                          borderWidth: source.isActive ? 2 : 1,
                          borderColor: source.isActive ? colors.primary : colors.border,
                          gap: SPACING.sm,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                            {source.isActive && (
                              <Check size={ICON_SIZES.sm} color={colors.primary} />
                            )}
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                              {source.source}
                            </Text>
                            {source.url && (
                              <ExternalLink size={12} color={colors.mutedForeground} />
                            )}
                          </View>
                          <Badge variant={sourceConfidence.variant} size="sm">
                            {sourceConfidence.label.split(' ')[0]}
                          </Badge>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
                            {formatValue(source.value)}
                          </Text>
                          {source.timestamp && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
                              <Clock size={12} color={colors.mutedForeground} />
                              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                                {formatTimestamp(source.timestamp)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Override History */}
                {overrides.length > 0 && (
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
                            "{override.reason}"
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Override Button */}
                {onOverride && (
                  <Button variant="outline" onPress={handleStartOverride}>
                    <Edit3 size={16} color={colors.foreground} />
                    <Text style={{ color: colors.foreground }}> Override Value</Text>
                  </Button>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </ModalContent>
    </Modal>
  );
}

export default EvidenceTrailModal;
