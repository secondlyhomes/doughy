// src/features/deals/components/StageSelectionSheet.tsx
// Bottom sheet for selecting a deal stage

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, PRESS_OPACITY } from '@/constants/design-tokens';
import { BottomSheet } from '@/components/ui';
import { DealStage, DEAL_STAGE_CONFIG } from '../types';
import { haptic } from '@/lib/haptics';
import { ORDERED_STAGES, STAGE_AVG_DAYS, getStageDescription } from './stage-stepper-constants';

// ============================================
// Types
// ============================================

export interface StageSelectionSheetProps {
  visible: boolean;
  currentStage: DealStage;
  onClose: () => void;
  onSelectStage: (stage: DealStage) => void;
}

// ============================================
// Component
// ============================================

export function StageSelectionSheet({
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
              activeOpacity={PRESS_OPACITY.DEFAULT}
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
