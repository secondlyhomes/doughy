// src/components/deals/EvidenceTrailModal.tsx
// Evidence Trail Modal - Zone G
// Shows where each metric value came from with sources, confidence, and override capability

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, Edit3 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { Modal, ModalContent, ModalHeader, ModalTitle, Badge, Button } from '@/components/ui';
import { getConfidenceConfig, formatValue } from './evidence-trail-helpers';
import { EvidenceOverrideForm } from './EvidenceOverrideForm';
import { EvidenceSourceCard } from './EvidenceSourceCard';
import { EvidenceOverrideHistory } from './EvidenceOverrideHistory';
import type { EvidenceTrailModalProps } from './evidence-trail-types';

// Re-export types for backwards compatibility
export type { ConfidenceLevel, EvidenceSource, EvidenceOverride, EvidenceTrailModalProps } from './evidence-trail-types';

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
              <EvidenceOverrideForm
                overrideValue={overrideValue}
                overrideReason={overrideReason}
                onChangeValue={setOverrideValue}
                onChangeReason={setOverrideReason}
                onSubmit={handleSubmitOverride}
                onCancel={handleCancelOverride}
              />
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

                  {sources.map((source) => (
                    <EvidenceSourceCard
                      key={source.id}
                      source={source}
                      onSelect={onSelectSource ? handleSelectSource : undefined}
                    />
                  ))}
                </View>

                {/* Override History */}
                <EvidenceOverrideHistory overrides={overrides} />

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
