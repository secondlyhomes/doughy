// src/features/deals/components/StageStepper.tsx
// Compact Progress Pill - Deal Stage Indicator
// Shows progress dots + stage name + step count with expandable stage selector

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { DEAL_STAGE_CONFIG } from '../types';
import { haptic } from '@/lib/haptics';
import { ORDERED_STAGES } from './stage-stepper-constants';
import { ProgressDot } from './ProgressDot';
import { StageSelectionSheet } from './StageSelectionSheet';

export type { StageStepperProps } from './stage-stepper-constants';
import type { StageStepperProps } from './stage-stepper-constants';

// ============================================
// Main StageStepper Component - Compact Progress Pill
// ============================================

export function StageStepper({
  currentStage,
  onStagePress,
}: StageStepperProps) {
  const colors = useThemeColors();
  const [showSheet, setShowSheet] = useState(false);

  // Get the index of the current stage
  const currentIndex = ORDERED_STAGES.indexOf(currentStage);
  const totalStages = ORDERED_STAGES.length;

  // Handle pill press - open selection sheet
  const handlePillPress = useCallback(() => {
    haptic.selection();
    setShowSheet(true);
  }, []);

  // Handle stage selection from sheet
  const handleSelectStage = useCallback(
    (stage: typeof currentStage) => {
      if (onStagePress) {
        onStagePress(stage);
      }
    },
    [onStagePress]
  );

  const handleCloseSheet = useCallback(() => {
    setShowSheet(false);
  }, []);

  // Determine status for each stage
  const getStageStatus = (index: number): 'completed' | 'current' | 'future' => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'future';
  };

  const currentConfig = DEAL_STAGE_CONFIG[currentStage];
  const stepDisplay = `${currentIndex + 1} of ${totalStages}`;

  return (
    <>
      <TouchableOpacity
        onPress={handlePillPress}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        accessibilityRole="button"
        accessibilityLabel={`Current stage: ${currentConfig?.label || currentStage}. ${stepDisplay}. Tap to change stage.`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.sm,
          marginHorizontal: SPACING.lg,
          marginTop: SPACING.sm,
          borderRadius: BORDER_RADIUS.xl,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* Progress dots */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: SPACING.md,
          }}
        >
          {ORDERED_STAGES.map((_, index) => (
            <ProgressDot key={index} status={getStageStatus(index)} />
          ))}
        </View>

        {/* Stage name */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {currentConfig?.label || currentStage}
        </Text>

        {/* Step count */}
        <Text
          style={{
            fontSize: 12,
            color: colors.mutedForeground,
            marginRight: SPACING.sm,
          }}
        >
          {stepDisplay}
        </Text>

        {/* Chevron */}
        <ChevronDown size={ICON_SIZES.md} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Stage Selection Sheet */}
      <StageSelectionSheet
        visible={showSheet}
        currentStage={currentStage}
        onClose={handleCloseSheet}
        onSelectStage={handleSelectStage}
      />
    </>
  );
}

export default StageStepper;
