// src/components/ui/Progress.tsx
// React Native Progress component with NativeWind styling
import React from 'react';
import { View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface ProgressProps extends ViewProps {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({
  value = 0,
  max = 100,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <View
      className={cn(
        'h-4 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max,
        now: value,
      }}
      {...props}
    >
      <View
        className={cn('h-full bg-primary', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </View>
  );
}
