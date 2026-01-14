// src/components/ui/Badge.tsx
// React Native Badge component with inline styles for dark mode support
import React from 'react';
import { View, Text, ViewProps, StyleSheet } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'danger' | 'info' | 'inactive';
type BadgeSize = 'default' | 'sm' | 'lg';

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
      {typeof children === 'string' ? (
        <Text
          className={cn('font-semibold', textClassName)}
          style={[getTextSize(), { color: getTextColor() }]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sizeDefault: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  sizeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sizeLg: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  textDefault: {
    fontSize: 12,
  },
  textLg: {
    fontSize: 14,
  },
});

export { Badge as default };
