// src/features/property-maintenance/screens/maintenance-detail/StatusChangeSheet.tsx
// Bottom sheet for changing work order status

import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge, BottomSheet, BottomSheetSection } from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';
import { MaintenanceStatus, MAINTENANCE_STATUS_CONFIG } from '../../types';

const STATUS_OPTIONS: MaintenanceStatus[] = [
  'reported',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
];

export interface StatusChangeSheetProps {
  visible: boolean;
  currentStatus: MaintenanceStatus;
  isUpdating: boolean;
  onClose: () => void;
  onStatusChange: (status: MaintenanceStatus) => void;
}

export function StatusChangeSheet({
  visible,
  currentStatus,
  isUpdating,
  onClose,
  onStatusChange,
}: StatusChangeSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Update Status">
      <BottomSheetSection title="Select Status">
        <View className="gap-2">
          {STATUS_OPTIONS.map((status) => {
            const config = MAINTENANCE_STATUS_CONFIG[status];
            const isActive = currentStatus === status;

            return (
              <TouchableOpacity
                key={status}
                onPress={() => onStatusChange(status)}
                className="flex-row items-center p-4 rounded-xl"
                style={{
                  backgroundColor: isActive
                    ? withOpacity(colors.primary, 'light')
                    : colors.muted,
                  borderWidth: isActive ? 1 : 0,
                  borderColor: colors.primary,
                }}
                disabled={isUpdating}
              >
                <Badge variant={config.variant} size="sm">
                  {config.label}
                </Badge>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>
    </BottomSheet>
  );
}
