// src/components/ui/Skeleton.tsx
// React Native Skeleton loading component with NativeWind styling
import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends ViewProps {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={cn('rounded-md bg-muted', className)}
      style={{ opacity }}
      accessibilityLabel="Loading content"
      accessibilityRole="progressbar"
      {...props}
    />
  );
}
