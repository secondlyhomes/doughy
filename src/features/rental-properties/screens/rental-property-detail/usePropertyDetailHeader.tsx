// src/features/rental-properties/screens/rental-property-detail/usePropertyDetailHeader.tsx
// Hook that builds native header options for the property detail screen

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Edit2, Trash2, Home, ChevronLeft } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HeaderActionMenu } from '@/components/ui';
import { FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import type { RentalProperty } from '../../types';

interface UsePropertyDetailHeaderOptions {
  property: RentalProperty | null | undefined;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: () => void;
}

export function usePropertyDetailHeader({
  property,
  onBack,
  onEdit,
  onDelete,
  onChangeStatus,
}: UsePropertyDetailHeaderOptions): NativeStackNavigationOptions {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return useMemo((): NativeStackNavigationOptions => ({
    headerShown: true,
    headerStyle: { backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    ...(Platform.OS === 'ios' ? { headerTransparent: true, headerBlurEffect: 'systemChromeMaterial' } : {}),
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {property?.name || 'Property Details'}
        </Text>
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity
        onPress={onBack}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${colors.muted}80`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChevronLeft size={ICON_SIZES.xl} color={colors.foreground} />
      </TouchableOpacity>
    ),
    headerRight: property
      ? () => (
          <HeaderActionMenu
            actions={[
              { label: 'Edit', icon: Edit2, onPress: () => onEdit() },
              { label: 'Change Status', icon: Home, onPress: () => onChangeStatus() },
              { label: 'Delete', icon: Trash2, onPress: () => onDelete(), destructive: true },
            ]}
          />
        )
      : undefined,
  }), [colors, insets.top, property, onBack, onEdit, onDelete, onChangeStatus]);
}
