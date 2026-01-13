// src/components/ui/Collapsible.tsx
// Animated collapsible component
import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, TouchableOpacity, ViewProps, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';

// Context
interface CollapsibleContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CollapsibleContext = createContext<CollapsibleContextType | null>(null);

function useCollapsibleContext() {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('Collapsible components must be used within a Collapsible provider');
  }
  return context;
}

// Root component
export interface CollapsibleProps extends ViewProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Collapsible({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setInternalOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <CollapsibleContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      <View className={cn('w-full', className)} {...props}>
        {children}
      </View>
    </CollapsibleContext.Provider>
  );
}

// Trigger
export interface CollapsibleTriggerProps {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

export function CollapsibleTrigger({
  children,
  className,
  asChild,
}: CollapsibleTriggerProps) {
  const { open, onOpenChange } = useCollapsibleContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
      onPress: () => onOpenChange(!open),
    });
  }

  return (
    <TouchableOpacity
      className={cn(className)}
      onPress={() => onOpenChange(!open)}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );
}

// Content with animation
export interface CollapsibleContentProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function CollapsibleContent({
  children,
  className,
  ...props
}: CollapsibleContentProps) {
  const { open } = useCollapsibleContext();
  const height = useSharedValue(0);
  const animatedHeight = useSharedValue(open ? 1 : 0);
  const [measured, setMeasured] = useState(false);

  // Animate when open changes
  React.useEffect(() => {
    animatedHeight.value = withTiming(open ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
  }, [open, animatedHeight]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const measuredHeight = event.nativeEvent.layout.height;
      if (measuredHeight > 0 && !measured) {
        height.value = measuredHeight;
        setMeasured(true);
      }
    },
    [height, measured]
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (!measured) {
      return { opacity: 0 };
    }
    return {
      height: interpolate(animatedHeight.value, [0, 1], [0, height.value]),
      opacity: animatedHeight.value,
      overflow: 'hidden',
    };
  });

  // Render hidden to measure, then animate
  if (!measured) {
    return (
      <View
        style={{ position: 'absolute', opacity: 0 }}
        onLayout={onLayout}
        pointerEvents="none"
      >
        <View className={cn(className)} {...props}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <View className={cn(className)} {...props}>
        {children}
      </View>
    </Animated.View>
  );
}
