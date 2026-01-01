// src/components/ui/LoadingSpinner.tsx
// React Native Loading Spinner component
import React from 'react';
import { ActivityIndicator, View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps extends ViewProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'large',
  color = '#2563eb', // primary color
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <View
      className={cn('items-center justify-center', className)}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      {...props}
    >
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
