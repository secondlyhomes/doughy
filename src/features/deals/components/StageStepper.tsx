// src/features/deals/components/StageStepper.tsx
// Visual Pipeline Progress Indicator - Zone G Week 7
// Shows deal stages as a stepper with completed/current/future states

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check, Circle, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Modal, ModalContent, ModalHeader, ModalTitle } from '@/components/ui';
import { DealStage, DEAL_STAGE_CONFIG } from '../types';

// ============================================
// Types
// ============================================

export interface StageStepperProps {
  currentStage: DealStage;
  onStagePress?: (stage: DealStage) => void;
  compact?: boolean;
}

// Define the ordered stages for the stepper
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

// Average days at each stage (example data)
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

// ============================================
// Stage Info Modal
// ============================================

interface StageInfoModalProps {
  visible: boolean;
  stage: DealStage | null;
  onClose: () => void;
}

function StageInfoModal({ visible, stage, onClose }: StageInfoModalProps) {
  const colors = useThemeColors();

  if (!stage) return null;

  const config = DEAL_STAGE_CONFIG[stage];
  const avgDays = STAGE_AVG_DAYS[stage];

  return (
    <Modal visible={visible} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{config?.label || stage}</ModalTitle>
        </ModalHeader>

        <View style={{ padding: SPACING.lg, gap: SPACING.md }}>
          <View
            style={{
              padding: SPACING.md,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: withOpacity(colors.primary, 'subtle'),
            }}
          >
            <Text style={{ fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
              {getStageDescription(stage)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
            }}
          >
            <Clock size={ICON_SIZES.sm} color={colors.mutedForeground} />
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
              Average time: {avgDays > 0 ? `${avgDays} days` : 'Final stage'}
            </Text>
          </View>
        </View>
      </ModalContent>
    </Modal>
  );
}

function getStageDescription(stage: DealStage): string {
  switch (stage) {
    case 'new':
      return 'A new lead has been added to the pipeline. Review the lead details and prepare for initial contact.';
    case 'contacted':
      return 'Initial contact has been made with the seller. Follow up to schedule an appointment to view the property.';
    case 'appointment_set':
      return 'An appointment is scheduled to view the property. Prepare your walkthrough checklist and camera.';
    case 'analyzing':
      return 'Property data has been collected. Run comps, estimate repairs, and determine your MAO and exit strategy.';
    case 'offer_sent':
      return 'An offer has been submitted to the seller. Follow up within 48-72 hours if no response.';
    case 'negotiating':
      return 'The seller has responded to your offer. Work through counter-offers to reach an agreement.';
    case 'under_contract':
      return 'A contract has been signed. Coordinate inspections, financing, and closing with the title company.';
    case 'closed_won':
      return 'Congratulations! The deal has been successfully closed. Time to execute your exit strategy.';
    case 'closed_lost':
      return 'This deal did not close. Consider following up in 3-6 months or if circumstances change.';
    default:
      return 'Review the deal details and determine the next action.';
  }
}

// ============================================
// Stage Step Component
// ============================================

interface StageStepProps {
  stage: DealStage;
  status: 'completed' | 'current' | 'future';
  isLast: boolean;
  compact: boolean;
  onPress: () => void;
}

function StageStep({ stage, status, isLast, compact, onPress }: StageStepProps) {
  const colors = useThemeColors();
  const config = DEAL_STAGE_CONFIG[stage];

  const scale = useSharedValue(1);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(1.1, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  }, [onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Colors based on status
  const bgColor =
    status === 'completed'
      ? colors.success
      : status === 'current'
        ? colors.primary
        : colors.muted;

  const iconColor =
    status === 'completed' || status === 'current'
      ? colors.primaryForeground
      : colors.mutedForeground;

  const labelColor =
    status === 'current'
      ? colors.foreground
      : colors.mutedForeground;

  const lineColor =
    status === 'completed'
      ? colors.success
      : colors.border;

  return (
    <View
      style={{
        alignItems: 'center',
        gap: compact ? SPACING.xs : SPACING.sm,
      }}
    >
      {/* Step Circle */}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Animated.View
          style={[
            {
              width: compact ? 24 : 32,
              height: compact ? 24 : 32,
              borderRadius: compact ? 12 : 16,
              backgroundColor: bgColor,
              alignItems: 'center',
              justifyContent: 'center',
              ...getShadowStyle(colors, { size: 'sm' }),
            },
            animatedStyle,
          ]}
        >
          {status === 'completed' ? (
            <Check size={compact ? 12 : 16} color={iconColor} strokeWidth={3} />
          ) : status === 'current' ? (
            <View
              style={{
                width: compact ? 8 : 10,
                height: compact ? 8 : 10,
                borderRadius: compact ? 4 : 5,
                backgroundColor: iconColor,
              }}
            />
          ) : (
            <Circle size={compact ? 8 : 10} color={iconColor} />
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Label */}
      {!compact && (
        <Text
          style={{
            fontSize: 10,
            fontWeight: status === 'current' ? '600' : '400',
            color: labelColor,
            textAlign: 'center',
            width: 56,
          }}
          numberOfLines={2}
        >
          {config?.label || stage}
        </Text>
      )}

      {/* Connector Line (not for last) */}
      {!isLast && (
        <View
          style={{
            position: 'absolute',
            top: compact ? 12 : 16,
            left: compact ? 24 : 32,
            width: compact ? 28 : 40,
            height: 2,
            backgroundColor: lineColor,
          }}
        />
      )}
    </View>
  );
}

// ============================================
// Main StageStepper Component
// ============================================

export function StageStepper({ currentStage, onStagePress, compact = false }: StageStepperProps) {
  const colors = useThemeColors();
  const [selectedStage, setSelectedStage] = useState<DealStage | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Get the index of the current stage
  const currentIndex = ORDERED_STAGES.indexOf(currentStage);

  // Handle stage press - show info modal or call handler
  const handleStagePress = useCallback((stage: DealStage) => {
    if (onStagePress) {
      onStagePress(stage);
    } else {
      setSelectedStage(stage);
      setShowModal(true);
    }
  }, [onStagePress]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedStage(null);
  }, []);

  // Determine status for each stage
  const getStageStatus = (stage: DealStage): 'completed' | 'current' | 'future' => {
    const stageIndex = ORDERED_STAGES.indexOf(stage);
    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'future';
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          gap: compact ? SPACING.lg : SPACING.xl,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        {ORDERED_STAGES.map((stage, index) => (
          <StageStep
            key={stage}
            stage={stage}
            status={getStageStatus(stage)}
            isLast={index === ORDERED_STAGES.length - 1}
            compact={compact}
            onPress={() => handleStagePress(stage)}
          />
        ))}
      </ScrollView>

      {/* Stage Info Modal */}
      <StageInfoModal
        visible={showModal}
        stage={selectedStage}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default StageStepper;
