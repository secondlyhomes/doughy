// src/features/portfolio/components/PortfolioActionsSheet.tsx
// Bottom sheet with portfolio property actions (Remove from Portfolio)

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/context/ThemeContext';

interface PortfolioActionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onRemove: () => Promise<void>;
  isRemoving?: boolean;
  propertyAddress?: string;
}

export function PortfolioActionsSheet({
  isOpen,
  onClose,
  onRemove,
  isRemoving,
  propertyAddress,
}: PortfolioActionsSheetProps) {
  const colors = useThemeColors();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleRemovePress = useCallback(() => {
    // Close the bottom sheet first, then show confirmation
    handleClose();

    Alert.alert(
      'Remove from Portfolio?',
      `Are you sure you want to remove${propertyAddress ? ` "${propertyAddress}"` : ' this property'} from your portfolio? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await onRemove();
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to remove property from portfolio. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, [handleClose, onRemove, propertyAddress]);

  // Render action button
  const renderActionButton = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    options?: {
      destructive?: boolean;
      subtitle?: string;
      disabled?: boolean;
    }
  ) => {
    const textColor = options?.destructive ? colors.destructive : colors.foreground;
    const opacity = options?.disabled ? 0.5 : 1;

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={options?.disabled}
        className="flex-row items-center justify-between py-4 px-2 border-b"
        style={{ borderColor: colors.border, opacity }}
      >
        <View className="flex-row items-center flex-1">
          {icon}
          <View className="ml-3">
            <Text className="font-medium" style={{ color: textColor }}>{label}</Text>
            {options?.subtitle && (
              <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
                {options.subtitle}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet visible={isOpen} onClose={handleClose} title="Property Actions">
      <View className="pb-4">
        {/* Remove from Portfolio */}
        {renderActionButton(
          <Trash2 size={20} color={colors.destructive} />,
          'Remove from Portfolio',
          handleRemovePress,
          {
            destructive: true,
            subtitle: 'Property will be removed from your portfolio',
            disabled: isRemoving,
          }
        )}
      </View>
    </BottomSheet>
  );
}

export default PortfolioActionsSheet;
