import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { LoadingSpinner } from './LoadingSpinner';

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
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      className="absolute bottom-32 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
      style={[
        {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
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
