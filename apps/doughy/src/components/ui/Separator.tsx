// src/components/ui/Separator.tsx
// React Native Separator component with NativeWind styling
import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Separator({
  orientation = 'horizontal',
  className,
  ...props
}: SeparatorProps) {
  return (
    <View
      className={cn(
        'bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
}
