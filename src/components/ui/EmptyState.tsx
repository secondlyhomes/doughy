// src/components/ui/EmptyState.tsx
// React Native EmptyState component for displaying empty states
import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface EmptyStateProps extends ViewProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View
      className={cn('flex-1 items-center justify-center p-8 gap-4', className)}
      {...props}
    >
      {icon}
      <Text className="text-center text-lg font-semibold text-foreground">
        {title}
      </Text>
      {description && (
        <Text className="text-center text-sm text-muted-foreground">
          {description}
        </Text>
      )}
      {action && (
        <Button className="mt-2" onPress={action.onPress}>{action.label}</Button>
      )}
    </View>
  );
}
