// src/components/ui/LoadingSpinner.tsx
// React Native Loading Spinner component
import React from 'react';
import { ActivityIndicator, View, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

export interface LoadingSpinnerProps extends ViewProps {
  size?: 'small' | 'large';
  color?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'large',
  color,
  className,
  ...props
}: LoadingSpinnerProps) {
  const colors = useThemeColors();
  return (
    <View
      className={cn('items-center justify-center', className)}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      {...props}
    >
      <ActivityIndicator size={size} color={color ?? colors.primary} />
    </View>
  );
}
