// src/components/ui/Badge.tsx
// React Native Badge component with inline styles for dark mode support
import React from 'react';
import { View, Text, ViewProps, StyleSheet } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'inactive';
export type BadgeSize = 'default' | 'sm' | 'lg';

export interface BadgeProps extends ViewProps {
  className?: string;
  textClassName?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  children?: React.ReactNode;
}

export function Badge({
  className,
  textClassName,
  variant = 'default',
  size = 'default',
  children,
  style,
  ...props
}: BadgeProps) {
  const colors = useThemeColors();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'default':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'destructive':
        return colors.destructive;
      case 'outline':
        return 'transparent';
      case 'success':
        return withOpacity(colors.success, 'medium');
      case 'warning':
        return withOpacity(colors.warning, 'medium');
      case 'danger':
        return withOpacity(colors.destructive, 'medium');
      case 'info':
        return withOpacity(colors.info, 'medium');
      case 'inactive':
        return colors.muted;
      default:
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'outline':
        return colors.foreground;
      default:
        return 'transparent';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'default':
        return colors.primaryForeground;
      case 'secondary':
        return colors.mutedForeground;
      case 'destructive':
        return colors.destructiveForeground;
      case 'outline':
        return colors.foreground;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.destructive;
      case 'info':
        return colors.info;
      case 'inactive':
        return colors.mutedForeground;
      default:
        return colors.primaryForeground;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      default:
        return styles.sizeDefault;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'lg':
        return styles.textLg;
      default:
        return styles.textDefault;
    }
  };

  return (
    <View
      className={cn('flex-row items-center rounded-full', className)}
      style={[
        getSizeStyles(),
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: 1,
          borderColor: getBorderColor(),
        },
        style,
      ]}
      {...props}
    >
      {(() => {
        // If children is a single string or number, wrap in Text
        if (typeof children === 'string' || typeof children === 'number') {
          return (
            <Text
              className={cn('font-semibold', textClassName)}
              style={[getTextSize(), { color: getTextColor() }]}
            >
              {children}
            </Text>
          );
        }

        // If children is an array, check if all elements are text-like
        if (Array.isArray(children)) {
          const allText = children.every(
            (child) => typeof child === 'string' || typeof child === 'number'
          );
          if (allText) {
            return (
              <Text
                className={cn('font-semibold', textClassName)}
                style={[getTextSize(), { color: getTextColor() }]}
              >
                {children}
              </Text>
            );
          }
        }

        // Otherwise render children as-is (assumes caller handles Text wrapping)
        return children;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  sizeSm: {
    paddingHorizontal: SPACING.sm,    // 8
    paddingVertical: SPACING.xs,      // 4
  },
  sizeDefault: {
    paddingHorizontal: SPACING.md,    // 12
    paddingVertical: SPACING.xs,      // 4
  },
  sizeLg: {
    paddingHorizontal: SPACING.lg,    // 16
    paddingVertical: SPACING.sm,      // 8
  },
  textDefault: {
    fontSize: FONT_SIZES.xs,          // 12
  },
  textLg: {
    fontSize: FONT_SIZES.sm,          // 14
  },
});

export { Badge as default };
