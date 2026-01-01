// src/components/ui/Badge.tsx
// React Native Badge component with NativeWind styling
import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'flex-row items-center rounded-full border',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary',
        secondary: 'border-transparent bg-secondary',
        destructive: 'border-transparent bg-destructive',
        outline: 'border-foreground',
        success: 'border-transparent bg-green-100',
        warning: 'border-transparent bg-yellow-100',
        danger: 'border-transparent bg-red-100',
        inactive: 'border-transparent bg-gray-100',
      },
      size: {
        default: 'px-2.5 py-0.5',
        sm: 'px-2 py-0.5',
        lg: 'px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const badgeTextVariants = cva('font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      success: 'text-green-800',
      warning: 'text-yellow-800',
      danger: 'text-red-800',
      inactive: 'text-gray-600',
    },
    size: {
      default: 'text-xs',
      sm: 'text-xs',
      lg: 'text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export interface BadgeProps
  extends ViewProps,
    VariantProps<typeof badgeVariants> {
  className?: string;
  textClassName?: string;
  children?: React.ReactNode;
}

export function Badge({
  className,
  textClassName,
  variant,
  size,
  children,
  ...props
}: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {typeof children === 'string' ? (
        <Text className={cn(badgeTextVariants({ variant, size }), textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

export { badgeVariants };
