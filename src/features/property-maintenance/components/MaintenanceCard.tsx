// src/features/property-maintenance/components/MaintenanceCard.tsx
// Card component for displaying a maintenance work order in a list

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ChevronRight,
  Wrench,
  AlertTriangle,
  Clock,
  DollarSign,
  User,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { SPACING, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import {
  MaintenanceWorkOrder,
  MAINTENANCE_STATUS_CONFIG,
  MAINTENANCE_PRIORITY_CONFIG,
  MAINTENANCE_CATEGORY_LABELS,
} from '../types';

export interface MaintenanceCardProps {
  workOrder: MaintenanceWorkOrder;
  onPress: () => void;
  compact?: boolean;
}

export function MaintenanceCard({
  workOrder,
  onPress,
  compact = false,
}: MaintenanceCardProps) {
  const colors = useThemeColors();
  const statusConfig = MAINTENANCE_STATUS_CONFIG[workOrder.status];
  const priorityConfig = MAINTENANCE_PRIORITY_CONFIG[workOrder.priority];

  const formattedDate = new Date(workOrder.reported_at).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
    }
  );

  const isUrgent =
    workOrder.priority === 'emergency' || workOrder.priority === 'high';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        className="mb-2"
        style={[
          { overflow: 'hidden' },
          isUrgent && {
            borderLeftWidth: 4,
            borderLeftColor: priorityConfig.color,
          },
        ]}
      >
        <View className={compact ? 'p-3' : 'p-4'}>
          {/* Header Row: Title + Status */}
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <Text
                style={[styles.title, { color: colors.foreground }]}
                numberOfLines={compact ? 1 : 2}
              >
                {workOrder.title}
              </Text>
              <Text
                style={[styles.workOrderNumber, { color: colors.mutedForeground }]}
              >
                {workOrder.work_order_number}
              </Text>
            </View>
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </Badge>
          </View>

          {/* Info Row */}
          <View className="flex-row items-center flex-wrap gap-3">
            {/* Priority */}
            <View className="flex-row items-center">
              {workOrder.priority === 'emergency' ? (
                <AlertTriangle size={14} color={priorityConfig.color} />
              ) : (
                <Wrench size={14} color={colors.mutedForeground} />
              )}
              <Text
                style={[
                  styles.infoText,
                  {
                    color:
                      isUrgent
                        ? priorityConfig.color
                        : colors.mutedForeground,
                    fontWeight: isUrgent ? '600' : '400',
                  },
                ]}
              >
                {priorityConfig.label}
              </Text>
            </View>

            {/* Category */}
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              {MAINTENANCE_CATEGORY_LABELS[workOrder.category]}
            </Text>

            {/* Date */}
            <View className="flex-row items-center">
              <Clock size={12} color={colors.mutedForeground} />
              <Text
                style={[styles.infoText, { color: colors.mutedForeground }]}
              >
                {formattedDate}
              </Text>
            </View>
          </View>

          {/* Additional Info (non-compact) */}
          {!compact && (
            <>
              {/* Location */}
              {workOrder.location && (
                <Text
                  style={[styles.location, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  Location: {workOrder.location}
                </Text>
              )}

              {/* Cost and Guest Charge Info */}
              <View className="flex-row items-center mt-2 gap-3">
                {workOrder.actual_cost && (
                  <View className="flex-row items-center">
                    <DollarSign size={14} color={colors.success} />
                    <Text
                      style={[styles.infoText, { color: colors.success }]}
                    >
                      ${workOrder.actual_cost.toFixed(0)}
                    </Text>
                  </View>
                )}

                {workOrder.is_guest_chargeable && (
                  <View
                    className="flex-row items-center px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: withOpacity(colors.warning, 'light'),
                    }}
                  >
                    <User size={12} color={colors.warning} />
                    <Text
                      style={{
                        color: colors.warning,
                        fontSize: FONT_SIZES.xs,
                        fontWeight: '600',
                        marginLeft: 4,
                      }}
                    >
                      Guest Charge
                    </Text>
                  </View>
                )}

                {workOrder.vendor_name && (
                  <Text
                    style={[
                      styles.infoText,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {workOrder.vendor_name}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Chevron for navigation hint */}
          <View
            style={{
              position: 'absolute',
              right: SPACING.md,
              top: '50%',
              transform: [{ translateY: -10 }],
            }}
          >
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    paddingRight: 24, // Space for chevron
  },
  workOrderNumber: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    marginLeft: 4,
  },
  location: {
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
  },
});

export default MaintenanceCard;
