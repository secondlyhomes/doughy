// src/features/property-inventory/screens/inventory-detail/InventoryDetailActions.tsx
// Bottom action buttons for inventory detail screen

import React from 'react';
import { View, Text } from 'react-native';
import { Wrench } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button, ConfirmButton } from '@/components/ui';

export interface InventoryDetailActionsProps {
  onLogMaintenance: () => void;
  onDelete: () => void;
}

export function InventoryDetailActions({
  onLogMaintenance,
  onDelete,
}: InventoryDetailActionsProps) {
  const colors = useThemeColors();

  return (
    <View className="gap-3 mb-6">
      <Button
        variant="outline"
        onPress={onLogMaintenance}
        className="flex-row items-center justify-center gap-2"
      >
        <Wrench size={18} color={colors.primary} />
        <Text style={{ color: colors.primary, fontWeight: '600' }}>
          Log Maintenance
        </Text>
      </Button>

      <ConfirmButton
        label="Delete Item"
        onConfirm={onDelete}
      />
    </View>
  );
}
