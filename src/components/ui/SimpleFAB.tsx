// src/components/ui/SimpleFAB.tsx
// Simple Floating Action Button using GlassButton for consistency

import React from 'react';
import { TouchableOpacityProps, ViewStyle } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import { LoadingSpinner } from './LoadingSpinner';
import { GlassButton } from './GlassButton';
import { FAB_SIZE, FAB_BOTTOM_OFFSET, FAB_RIGHT_MARGIN, FAB_Z_INDEX } from './FloatingGlassTabBar';

export interface SimpleFABProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Whether the FAB is in a loading state */
  loading?: boolean;
  /** Custom icon to display. Default: Plus icon */
  icon?: React.ReactNode;
}

/**
 * Simple Floating Action Button with liquid glass effect.
 * Uses GlassButton internally with FAB-specific positioning and styling.
 * Automatically uses iOS 26+ native liquid glass with fallbacks for older platforms.
 */
export function SimpleFAB({
  loading = false,
  disabled,
  icon,
  style,
  ...props
}: SimpleFABProps) {
  const colors = useThemeColors();
  const { buttonBottom } = useTabBarPadding();

  const positioningStyle: ViewStyle = {
    position: 'absolute',
    bottom: buttonBottom + FAB_BOTTOM_OFFSET,  // Dynamic: adapts to device safe area
    right: FAB_RIGHT_MARGIN,
    zIndex: FAB_Z_INDEX.SIMPLE,
  };

  const content = loading ? (
    <LoadingSpinner size="small" color="white" />
  ) : (
    icon || <Plus size={28} color="white" />
  );

  return (
    <GlassButton
      icon={content}
      onPress={props.onPress || (() => {})}
      size={FAB_SIZE}
      effect="regular"
      containerStyle={[positioningStyle, style]}
      disabled={disabled || loading}
      accessibilityLabel={props.accessibilityLabel || 'Floating action button'}
      {...props}
    />
  );
}
