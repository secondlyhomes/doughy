// src/features/property-maintenance/screens/maintenance-detail/GuestChargeSheet.tsx
// Bottom sheet for setting guest charge amount

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button, Input, FormField, BottomSheet } from '@/components/ui';

export interface GuestChargeSheetProps {
  visible: boolean;
  amount: string;
  isUpdating: boolean;
  onClose: () => void;
  onAmountChange: (text: string) => void;
  onSubmit: () => void;
}

export function GuestChargeSheet({
  visible,
  amount,
  isUpdating,
  onClose,
  onAmountChange,
  onSubmit,
}: GuestChargeSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Set Guest Charge">
      <View className="py-4">
        <FormField label="Charge Amount" required>
          <Input
            value={amount}
            onChangeText={onAmountChange}
            placeholder="0.00"
            keyboardType="decimal-pad"
            leftIcon={<Text style={{ color: colors.mutedForeground }}>$</Text>}
            autoFocus
          />
        </FormField>
      </View>

      <View className="flex-row gap-3 pt-4 pb-6">
        <Button variant="outline" onPress={onClose} className="flex-1" disabled={isUpdating}>
          Cancel
        </Button>
        <Button onPress={onSubmit} className="flex-1" disabled={isUpdating || !amount}>
          {isUpdating ? 'Saving...' : 'Set Charge'}
        </Button>
      </View>
    </BottomSheet>
  );
}
