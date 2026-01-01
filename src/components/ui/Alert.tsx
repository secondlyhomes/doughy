// src/components/ui/Alert.tsx
// React Native Alert component with NativeWind styling
import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('relative w-full rounded-lg border p-4', {
  variants: {
    variant: {
      default: 'bg-background border-border',
      destructive: 'bg-destructive/10 border-destructive/50',
      success: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const alertTextVariants = cva('', {
  variants: {
    variant: {
      default: 'text-foreground',
      destructive: 'text-destructive',
      success: 'text-green-800',
      warning: 'text-yellow-800',
      info: 'text-blue-800',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface AlertProps
  extends ViewProps,
    VariantProps<typeof alertVariants> {
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export function Alert({
  className,
  variant,
  children,
  icon,
  ...props
}: AlertProps) {
  return (
    <View
      className={cn(alertVariants({ variant }), className)}
      accessibilityRole="alert"
      {...props}
    >
      <View className="flex-row">
        {icon && <View className="mr-3">{icon}</View>}
        <View className="flex-1">{children}</View>
      </View>
    </View>
  );
}

export interface AlertTitleProps
  extends TextProps,
    VariantProps<typeof alertTextVariants> {
  className?: string;
  children?: React.ReactNode;
}

export function AlertTitle({
  className,
  variant,
  children,
  ...props
}: AlertTitleProps) {
  return (
    <Text
      className={cn(
        'mb-1 font-medium',
        alertTextVariants({ variant }),
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}

export interface AlertDescriptionProps
  extends TextProps,
    VariantProps<typeof alertTextVariants> {
  className?: string;
  children?: React.ReactNode;
}

export function AlertDescription({
  className,
  variant,
  children,
  ...props
}: AlertDescriptionProps) {
  return (
    <Text
      className={cn('text-sm', alertTextVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Text>
  );
}
