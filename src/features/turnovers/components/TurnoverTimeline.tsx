// src/features/turnovers/components/TurnoverTimeline.tsx
// Visual timeline showing turnover progress

import React from 'react';
import { View, Text } from 'react-native';
import { Check, Circle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { FONT_SIZES, SPACING } from '@/constants/design-tokens';
import { TurnoverStatus, TURNOVER_STATUS_CONFIG } from '../types';

export interface TurnoverTimelineProps {
  currentStatus: TurnoverStatus;
  cleaningScheduledAt?: string | null;
  cleaningCompletedAt?: string | null;
  inspectionCompletedAt?: string | null;
}

interface TimelineStep {
  status: TurnoverStatus;
  label: string;
  timestamp?: string | null;
}

export function TurnoverTimeline({
  currentStatus,
  cleaningScheduledAt,
  cleaningCompletedAt,
  inspectionCompletedAt,
}: TurnoverTimelineProps) {
  const colors = useThemeColors();

  const statusOrder: TurnoverStatus[] = [
    'pending',
    'cleaning_scheduled',
    'cleaning_done',
    'inspected',
    'ready',
  ];

  const currentIndex = statusOrder.indexOf(currentStatus);

  const steps: TimelineStep[] = [
    { status: 'pending', label: 'Pending' },
    { status: 'cleaning_scheduled', label: 'Cleaning Scheduled', timestamp: cleaningScheduledAt },
    { status: 'cleaning_done', label: 'Cleaning Done', timestamp: cleaningCompletedAt },
    { status: 'inspected', label: 'Inspected', timestamp: inspectionCompletedAt },
    { status: 'ready', label: 'Ready for Guest' },
  ];

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View className="py-4">
      {steps.map((step, index) => {
        const stepIndex = statusOrder.indexOf(step.status);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <View key={step.status} className="flex-row">
            {/* Timeline indicator */}
            <View className="items-center mr-4" style={{ width: 24 }}>
              {/* Circle/Check icon */}
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isCompleted
                    ? colors.success
                    : isCurrent
                    ? colors.primary
                    : colors.muted,
                }}
              >
                {isCompleted ? (
                  <Check size={14} color="white" strokeWidth={3} />
                ) : (
                  <Circle
                    size={8}
                    color={isCurrent ? 'white' : colors.mutedForeground}
                    fill={isCurrent ? 'white' : 'transparent'}
                  />
                )}
              </View>

              {/* Connecting line */}
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    height: 32,
                    backgroundColor: isCompleted ? colors.success : colors.muted,
                  }}
                />
              )}
            </View>

            {/* Step content */}
            <View className="flex-1 pb-4" style={{ minHeight: 48 }}>
              <Text
                style={{
                  color: isCurrent || isCompleted ? colors.foreground : colors.mutedForeground,
                  fontSize: FONT_SIZES.base,
                  fontWeight: isCurrent ? '600' : '400',
                }}
              >
                {TURNOVER_STATUS_CONFIG[step.status].emoji} {step.label}
              </Text>

              {step.timestamp && (
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.xs,
                    marginTop: 2,
                  }}
                >
                  {formatTimestamp(step.timestamp)}
                </Text>
              )}

              {isCurrent && (
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: FONT_SIZES.xs,
                    fontWeight: '500',
                    marginTop: 2,
                  }}
                >
                  Current Step
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default TurnoverTimeline;
