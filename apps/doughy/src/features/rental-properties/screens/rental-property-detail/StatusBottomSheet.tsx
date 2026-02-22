// src/features/rental-properties/screens/rental-property-detail/StatusBottomSheet.tsx
// Status change bottom sheet for rental property detail screen

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
} from '@/components/ui';
import { FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { getStatusInfo } from './utils';
import type { PropertyStatus } from '../../types';

export interface StatusBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  currentStatus: PropertyStatus;
  onStatusChange: (status: PropertyStatus) => void;
  isSaving: boolean;
}

export function StatusBottomSheet({
  visible,
  onClose,
  currentStatus,
  onStatusChange,
  isSaving,
}: StatusBottomSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Property Options"
    >
      <BottomSheetSection title="Status">
        <View className="gap-2">
          {(['active', 'inactive', 'maintenance'] as PropertyStatus[]).map(
            (status) => {
              const info = getStatusInfo(status);
              const isActive = currentStatus === status;
              const StatusIcon = info.icon;

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
                  disabled={isSaving}
                >
                  <StatusIcon
                    size={ICON_SIZES.lg}
                    color={isActive ? colors.primary : colors.foreground}
                  />
                  <Text
                    style={{
                      color: isActive ? colors.primary : colors.foreground,
                      fontSize: FONT_SIZES.base,
                      fontWeight: '500',
                      marginLeft: 12,
                    }}
                  >
                    {info.label}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      </BottomSheetSection>

      <View className="pt-4 pb-6">
        <Button
          variant="outline"
          onPress={onClose}
          className="w-full"
        >
          Cancel
        </Button>
      </View>
    </BottomSheet>
  );
}
