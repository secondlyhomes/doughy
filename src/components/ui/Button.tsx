// src/components/ui/Button.tsx
// React Native Button component with NativeWind styling
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center gap-2 rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary',
        ghost: 'bg-transparent',
        link: 'bg-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      secondary: 'text-secondary-foreground',
      ghost: 'text-foreground',
      link: 'text-primary underline',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function Button({
  variant,
  size,
  onPress,
  disabled,
  loading,
  children,
  className,
  textClassName,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      className={cn(
        buttonVariants({ variant, size }),
        isDisabled && 'opacity-50',
        className
      )}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'default' || variant === 'destructive' ? '#fff' : '#000'}
          size="small"
        />
      ) : typeof children === 'string' ? (
        <Text className={cn(buttonTextVariants({ variant }), textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

export { buttonVariants };
