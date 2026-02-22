// src/components/ui/ScrollArea.tsx
// Wrapper for ScrollView with consistent styling
import React from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';
import { cn } from '@/lib/utils';

export interface ScrollAreaProps extends ScrollViewProps {
  className?: string;
  contentClassName?: string;
  children?: React.ReactNode;
}

export function ScrollArea({
  className,
  contentClassName,
  children,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  ...props
}: ScrollAreaProps) {
  return (
    <ScrollView
      className={cn('flex-1', className)}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      {...props}
    >
      <View className={cn(contentClassName)}>{children}</View>
    </ScrollView>
  );
}
