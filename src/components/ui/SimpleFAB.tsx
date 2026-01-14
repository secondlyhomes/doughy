import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { LoadingSpinner } from './LoadingSpinner';
import { FAB_SIZE, FAB_BOTTOM_OFFSET, FAB_RIGHT_MARGIN, FAB_Z_INDEX } from './FloatingGlassTabBar';
import { getFABShadowStyle } from './fab-styles';

export interface SimpleFABProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Whether the FAB is in a loading state */
  loading?: boolean;
}

/**
 * Simple Floating Action Button with a + icon.
 * Consistent styling across all screens.
 */
export function SimpleFAB({
  loading = false,
  disabled,
  style,
  ...props
}: SimpleFABProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        {
          position: 'absolute',
          bottom: FAB_BOTTOM_OFFSET,
          right: FAB_RIGHT_MARGIN,
          width: FAB_SIZE,
          height: FAB_SIZE,
          borderRadius: FAB_SIZE / 2,
          backgroundColor: colors.primary,
          zIndex: FAB_Z_INDEX.SIMPLE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        getFABShadowStyle(colors),
        style,
      ]}
      disabled={disabled || loading}
      accessibilityRole="button"
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="small" color={colors.primaryForeground} />
      ) : (
        <Plus size={28} color={colors.primaryForeground} />
      )}
    </TouchableOpacity>
  );
}
