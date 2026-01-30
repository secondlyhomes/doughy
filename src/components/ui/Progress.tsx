// src/components/ui/Progress.tsx
// React Native Progress component with design system support
import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { BORDER_RADIUS } from '@/constants/design-tokens';

export interface ProgressProps extends ViewProps {
  /** Progress value (0-max) */
  value?: number;

  /** Maximum value (default: 100) */
  max?: number;

  /** Visual variant */
  variant?: 'default' | 'success' | 'warning' | 'destructive';

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Custom className for container */
  className?: string;

  /** Custom className for indicator */
  indicatorClassName?: string;
}

export function Progress({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const colors = useThemeColors();
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // Get variant colors
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          background: withOpacity(colors.success, 'muted'),
          indicator: colors.success,
        };
      case 'warning':
        return {
          background: withOpacity(colors.warning, 'muted'),
          indicator: colors.warning,
        };
      case 'destructive':
        return {
          background: withOpacity(colors.destructive, 'muted'),
          indicator: colors.destructive,
        };
      default:
        return {
          background: withOpacity(colors.primary, 'muted'),
          indicator: colors.primary,
        };
    }
  };

  // Get size height
  const getHeight = () => {
    switch (size) {
      case 'sm':
        return 6;
      case 'lg':
        return 12;
      default:
        return 8;
    }
  };

  const variantColors = getVariantColors();
  const height = getHeight();

  return (
    <View
      className={cn('w-full overflow-hidden', className)}
      style={{
        height,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: variantColors.background,
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max,
        now: value,
      }}
      {...props}
    >
      <View
        className={cn('h-full', indicatorClassName)}
        style={{
          width: `${percentage}%`,
          backgroundColor: variantColors.indicator,
          borderRadius: BORDER_RADIUS.full,
        }}
      />
    </View>
  );
}
