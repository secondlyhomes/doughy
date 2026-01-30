// src/features/deals/components/StageStepper.tsx
// Compact Progress Pill - Deal Stage Indicator
// Shows progress dots + stage name + step count with expandable stage selector

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { BottomSheet } from '@/components/ui';
import { DealStage, DEAL_STAGE_CONFIG } from '../types';
import { haptic } from '@/lib/haptics';

// ============================================
// Types
// ============================================

export interface StageStepperProps {
  currentStage: DealStage;
  /** Deal ID for context (used for stage updates) */
  dealId?: string;
  onStagePress?: (stage: DealStage) => void;
  /** @deprecated No longer used - compact pill is always shown */
  compact?: boolean;
  /** @deprecated No longer used - stage label is always displayed in pill */
  showCurrentStageLabel?: boolean;
}

// Define the ordered stages for the stepper (excludes closed_lost which is a terminal state)
const ORDERED_STAGES: DealStage[] = [
  'new',
  'contacted',
  'appointment_set',
  'analyzing',
  'offer_sent',
  'negotiating',
  'under_contract',
  'closed_won',
];

// Average days at each stage (for stage info)
const STAGE_AVG_DAYS: Record<DealStage, number> = {
  initial_contact: 2,
  new: 1,
  contacted: 3,
  appointment_set: 5,
  analyzing: 7,
  offer_sent: 10,
  negotiating: 14,
  under_contract: 21,
  closed_won: 0,
  closed_lost: 0,
};

// Stage descriptions for the selection sheet
function getStageDescription(stage: DealStage): string {
  switch (stage) {
    case 'new':
      return 'New lead added to pipeline';
    case 'contacted':
      return 'Initial contact made with seller';
    case 'appointment_set':
      return 'Property viewing scheduled';
    case 'analyzing':
      return 'Running comps and estimating repairs';
    case 'offer_sent':
      return 'Offer submitted to seller';
    case 'negotiating':
      return 'Working through counter-offers';
    case 'under_contract':
      return 'Contract signed, coordinating close';
    case 'closed_won':
      return 'Deal successfully closed';
    case 'closed_lost':
      return 'Deal did not close';
    default:
      return 'Review deal details';
  }
}

// ============================================
// Progress Dot Component
// ============================================

interface ProgressDotProps {
  status: 'completed' | 'current' | 'future';
}

const DOT_SIZE = 6;
const DOT_GAP = 4;

function ProgressDot({ status }: ProgressDotProps) {
  const colors = useThemeColors();

  const dotColor =
    status === 'completed'
      ? colors.success
      : status === 'current'
        ? colors.primary
        : colors.muted;

  return (
    <View
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: dotColor,
        marginHorizontal: DOT_GAP / 2,
      }}
    />
  );
}

// ============================================
// Stage Selection Sheet
// ============================================

interface StageSelectionSheetProps {
  visible: boolean;
  currentStage: DealStage;
  onClose: () => void;
  onSelectStage: (stage: DealStage) => void;
}

function StageSelectionSheet({
  visible,
  currentStage,
  onClose,
  onSelectStage,
}: StageSelectionSheetProps) {
  const colors = useThemeColors();
  const currentIndex = ORDERED_STAGES.indexOf(currentStage);

  const handleStagePress = useCallback(
    (stage: DealStage) => {
      haptic.selection();
      onSelectStage(stage);
      onClose();
    },
    [onSelectStage, onClose]
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Change Stage"
      snapPoints={['60%']}
    >
      <View style={{ paddingTop: SPACING.md, gap: SPACING.xs }}>
        {ORDERED_STAGES.map((stage, index) => {
          const config = DEAL_STAGE_CONFIG[stage];
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const avgDays = STAGE_AVG_DAYS[stage];

          return (
            <TouchableOpacity
              key={stage}
              onPress={() => handleStagePress(stage)}
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.md,
                borderRadius: BORDER_RADIUS.lg,
                backgroundColor: isCurrent
                  ? withOpacity(colors.primary, 'light')
                  : 'transparent',
              }}
              accessibilityRole="button"
              accessibilityLabel={`${config?.label || stage} stage`}
              accessibilityState={{ selected: isCurrent }}
            >
              {/* Status indicator */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: isCompleted
                    ? colors.success
                    : isCurrent
                      ? colors.primary
                      : colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: SPACING.md,
                }}
              >
                {isCompleted ? (
                  <Check size={14} color={colors.primaryForeground} strokeWidth={3} />
                ) : (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: isCurrent ? colors.primaryForeground : colors.mutedForeground,
                    }}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>

              {/* Stage info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: isCurrent ? '600' : '500',
                    color: isCurrent ? colors.primary : colors.foreground,
                  }}
                >
                  {config?.label || stage}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.mutedForeground,
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {getStageDescription(stage)}
                </Text>
              </View>

              {/* Average days badge */}
              {avgDays > 0 && (
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: BORDER_RADIUS.sm,
                    backgroundColor: withOpacity(colors.mutedForeground, 'muted'),
                  }}
                >
                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
                    ~{avgDays}d
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}

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
    (stage: DealStage) => {
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
        activeOpacity={0.7}
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
