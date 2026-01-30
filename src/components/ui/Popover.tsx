// src/components/ui/Popover.tsx
// Floating content positioned near a trigger element
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Modal as RNModal,
  TouchableWithoutFeedback,
  Dimensions,
  LayoutChangeEvent,
  ViewProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';
import { PRESS_OPACITY } from '@/constants/design-tokens';

// Types
export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Context
interface PopoverContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLayout: TriggerLayout | null;
  setTriggerLayout: (layout: TriggerLayout) => void;
}

const PopoverContext = createContext<PopoverContextType | null>(null);

function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('Popover components must be used within a Popover provider');
  }
  return context;
}

// Root
export interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

export function Popover({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  children,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [triggerLayout, setTriggerLayout] = useState<TriggerLayout | null>(null);

  const open = controlledOpen ?? internalOpen;

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      setInternalOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange]
  );

  return (
    <PopoverContext.Provider
      value={{ open, onOpenChange: handleOpenChange, triggerLayout, setTriggerLayout }}
    >
      {children}
    </PopoverContext.Provider>
  );
}

// Trigger
export interface PopoverTriggerProps {
  children?: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function PopoverTrigger({ children, asChild, className }: PopoverTriggerProps) {
  const { open, onOpenChange, setTriggerLayout } = usePopoverContext();
  const triggerRef = useRef<View>(null);

  const handlePress = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      onOpenChange(!open);
    });
  }, [open, onOpenChange, setTriggerLayout]);

  if (asChild && React.isValidElement(children)) {
    return (
      <View ref={triggerRef} collapsable={false}>
        {React.cloneElement(children as React.ReactElement<{ onPress?: () => void }>, {
          onPress: handlePress,
        })}
      </View>
    );
  }

  return (
    <View ref={triggerRef} collapsable={false}>
      <TouchableOpacity
        className={cn(className)}
        onPress={handlePress}
        activeOpacity={PRESS_OPACITY.DEFAULT}
      >
        {children}
      </TouchableOpacity>
    </View>
  );
}

// Content
export interface PopoverContentProps extends ViewProps {
  side?: PopoverSide;
  align?: PopoverAlign;
  sideOffset?: number;
  children?: React.ReactNode;
  className?: string;
}

export function PopoverContent({
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  children,
  className,
  ...props
}: PopoverContentProps) {
  const { open, onOpenChange, triggerLayout } = usePopoverContext();
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  React.useEffect(() => {
    if (open) {
      opacity.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
      scale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) });
    } else {
      opacity.value = withTiming(0, { duration: 100 });
      scale.value = withTiming(0.95, { duration: 100 });
    }
  }, [open, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setContentSize({ width, height });
  }, []);

  const getPosition = useCallback(() => {
    if (!triggerLayout) return { top: 0, left: 0 };

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    let top = 0;
    let left = 0;

    // Calculate position based on side
    switch (side) {
      case 'top':
        top = triggerLayout.y - contentSize.height - sideOffset;
        break;
      case 'bottom':
        top = triggerLayout.y + triggerLayout.height + sideOffset;
        break;
      case 'left':
        left = triggerLayout.x - contentSize.width - sideOffset;
        top = triggerLayout.y;
        break;
      case 'right':
        left = triggerLayout.x + triggerLayout.width + sideOffset;
        top = triggerLayout.y;
        break;
    }

    // Calculate horizontal alignment for top/bottom
    if (side === 'top' || side === 'bottom') {
      switch (align) {
        case 'start':
          left = triggerLayout.x;
          break;
        case 'center':
          left = triggerLayout.x + (triggerLayout.width - contentSize.width) / 2;
          break;
        case 'end':
          left = triggerLayout.x + triggerLayout.width - contentSize.width;
          break;
      }
    }

    // Calculate vertical alignment for left/right
    if (side === 'left' || side === 'right') {
      switch (align) {
        case 'start':
          top = triggerLayout.y;
          break;
        case 'center':
          top = triggerLayout.y + (triggerLayout.height - contentSize.height) / 2;
          break;
        case 'end':
          top = triggerLayout.y + triggerLayout.height - contentSize.height;
          break;
      }
    }

    // Clamp to screen bounds
    left = Math.max(8, Math.min(left, screenWidth - contentSize.width - 8));
    top = Math.max(8, Math.min(top, screenHeight - contentSize.height - 8));

    return { top, left };
  }, [triggerLayout, contentSize, side, align, sideOffset]);

  if (!open) return null;

  const position = getPosition();

  return (
    <RNModal visible={open} transparent animationType="none" onRequestClose={() => onOpenChange(false)}>
      <TouchableWithoutFeedback onPress={() => onOpenChange(false)}>
        <View className="flex-1">
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: position.top,
                  left: position.left,
                },
                animatedStyle,
              ]}
              onLayout={onLayout}
            >
              <View
                className={cn(
                  'rounded-md border border-border bg-popover p-4 shadow-md',
                  className
                )}
                {...props}
              >
                {children}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}
