// src/components/ui/Label.tsx
// React Native Label component with NativeWind styling
import React from 'react';
import { Text, TextProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface LabelProps extends TextProps {
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function Label({ className, children, disabled, ...props }: LabelProps) {
  return (
    <Text
      className={cn(
        'text-sm font-medium leading-none text-foreground',
        disabled && 'opacity-70',
        className
      )}
      {...props}
    >
      {children}
    </Text>
  );
}
