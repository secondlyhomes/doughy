// src/features/property-maintenance/components/MaintenanceTimeline.tsx
// Visual timeline showing maintenance work order status progression

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  AlertCircle,
  Calendar,
  PlayCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { MaintenanceWorkOrder, MaintenanceStatus } from '../types';

export interface MaintenanceTimelineProps {
  workOrder: MaintenanceWorkOrder;
}

interface TimelineStep {
  status: MaintenanceStatus;
  label: string;
  icon: React.ElementType;
  timestamp?: string | null;
}

export function MaintenanceTimeline({ workOrder }: MaintenanceTimelineProps) {
  const colors = useThemeColors();

  const steps: TimelineStep[] = [
    {
      status: 'reported',
      label: 'Reported',
      icon: AlertCircle,
      timestamp: workOrder.reported_at,
    },
    {
      status: 'scheduled',
      label: 'Scheduled',
      icon: Calendar,
      timestamp: workOrder.scheduled_at,
    },
    {
      status: 'in_progress',
      label: 'In Progress',
      icon: PlayCircle,
      timestamp: workOrder.started_at,
    },
    {
      status: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      timestamp: workOrder.completed_at,
    },
  ];

  // Find current step index
  const statusOrder: MaintenanceStatus[] = [
    'reported',
    'scheduled',
    'in_progress',
    'completed',
  ];
  const currentIndex = statusOrder.indexOf(workOrder.status);
  const isCancelled = workOrder.status === 'cancelled';

  const formatTimestamp = (timestamp: string | null | undefined): string => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex && !isCancelled;
        const isFuture = index > currentIndex || isCancelled;

        // Determine colors
        let iconColor = colors.mutedForeground;
        let lineColor = colors.border;
        let dotBackgroundColor = colors.muted;

        if (isPast) {
          iconColor = colors.success;
          lineColor = colors.success;
          dotBackgroundColor = withOpacity(colors.success, 'light');
        } else if (isCurrent) {
          iconColor = colors.primary;
          dotBackgroundColor = withOpacity(colors.primary, 'light');
        }

        return (
          <View key={step.status} style={styles.stepContainer}>
            {/* Left column: Icon and line */}
            <View style={styles.iconColumn}>
              {/* Icon circle */}
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: dotBackgroundColor,
                    borderColor: isCurrent ? colors.primary : 'transparent',
                    borderWidth: isCurrent ? 2 : 0,
                  },
                ]}
              >
                <Icon size={18} color={iconColor} />
              </View>

              {/* Connecting line (except for last item) */}
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: isPast ? colors.success : colors.border,
                    },
                  ]}
                />
              )}
            </View>

            {/* Right column: Label and timestamp */}
            <View style={styles.contentColumn}>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFuture
                      ? colors.mutedForeground
                      : colors.foreground,
                    fontWeight: isCurrent ? '600' : '400',
                  },
                ]}
              >
                {step.label}
              </Text>
              {step.timestamp && !isFuture && (
                <Text
                  style={[styles.timestamp, { color: colors.mutedForeground }]}
                >
                  {formatTimestamp(step.timestamp)}
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {/* Cancelled overlay */}
      {isCancelled && (
        <View
          style={[
            styles.cancelledOverlay,
            { backgroundColor: withOpacity(colors.destructive, 'subtle') },
          ]}
        >
          <XCircle size={24} color={colors.destructive} />
          <Text
            style={[styles.cancelledText, { color: colors.destructive }]}
          >
            Cancelled
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  stepContainer: {
    flexDirection: 'row',
    minHeight: 60,
  },
  iconColumn: {
    width: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  contentColumn: {
    flex: 1,
    paddingLeft: SPACING.md,
    paddingTop: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.base,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  cancelledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelledText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
});

export default MaintenanceTimeline;
