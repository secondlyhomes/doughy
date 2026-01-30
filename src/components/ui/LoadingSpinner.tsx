// src/components/ui/LoadingSpinner.tsx
// React Native Loading Spinner component
import React from 'react';
import { ActivityIndicator, View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';

export interface LoadingSpinnerProps extends ViewProps {
  /** Spinner size */
  size?: 'small' | 'large';
  /** Custom spinner color (defaults to theme primary) */
  color?: string;
  /** Optional loading text */
  text?: string;
  /** Full screen centered mode */
  fullScreen?: boolean;
  /** Container className */
  className?: string;
}

export function LoadingSpinner({
  size = 'large',
  color,
  text,
  fullScreen = false,
  className,
  ...props
}: LoadingSpinnerProps) {
  const colors = useThemeColors();
  return (
    <View
      className={cn(
        'items-center justify-center',
        fullScreen && 'flex-1',
        className
      )}
      {...props}
    >
      <ActivityIndicator size={size} color={color ?? colors.primary} />
      {text && (
        <Text className="mt-2" style={{ color: colors.mutedForeground }}>{text}</Text>
      )}
    </View>
  );
}
