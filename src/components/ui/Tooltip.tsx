// src/components/ui/Tooltip.tsx
// Shows on long press (mobile) or hover (web)
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal as RNModal,
  Dimensions,
  Platform,
  ViewProps,
  TextProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';

// Types
export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TriggerLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Context
interface TooltipContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerLayout: TriggerLayout | null;
  setTriggerLayout: (layout: TriggerLayout) => void;
  delayDuration: number;
}

const TooltipContext = createContext<TooltipContextType | null>(null);

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a Tooltip provider');
  }
  return context;
}

// Provider (optional, for configuration)
export interface TooltipProviderProps {
  delayDuration?: number;
  children?: React.ReactNode;
}

export function TooltipProvider({
  delayDuration = 400,
  children,
}: TooltipProviderProps) {
  return <>{children}</>;
}

// Root
export interface TooltipProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  delayDuration?: number;
  children?: React.ReactNode;
}

export function Tooltip({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  delayDuration = 400,
  children,
}: TooltipProps) {
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
    <TooltipContext.Provider
      value={{ open, onOpenChange: handleOpenChange, triggerLayout, setTriggerLayout, delayDuration }}
    >
      {children}
    </TooltipContext.Provider>
  );
}

// Trigger
export interface TooltipTriggerProps {
  children?: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

export function TooltipTrigger({ children, asChild, className }: TooltipTriggerProps) {
  const { open, onOpenChange, setTriggerLayout, delayDuration } = useTooltipContext();
  const triggerRef = useRef<View>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const measureAndOpen = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setTriggerLayout({ x, y, width, height });
      onOpenChange(true);
    });
  }, [onOpenChange, setTriggerLayout]);

  const handleLongPress = useCallback(() => {
    measureAndOpen();
    // Auto-hide after 2 seconds on mobile
    timeoutRef.current = setTimeout(() => {
      onOpenChange(false);
    }, 2000);
  }, [measureAndOpen, onOpenChange]);

  const handlePressOut = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Web: use hover
  const handleHoverIn = useCallback(() => {
    if (Platform.OS === 'web') {
      timeoutRef.current = setTimeout(() => {
        measureAndOpen();
      }, delayDuration);
    }
  }, [measureAndOpen, delayDuration]);

  const handleHoverOut = useCallback(() => {
    if (Platform.OS === 'web') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onOpenChange(false);
    }
  }, [onOpenChange]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const pressableProps = {
    onLongPress: Platform.OS !== 'web' ? handleLongPress : undefined,
    onPressOut: Platform.OS !== 'web' ? handlePressOut : undefined,
    onHoverIn: Platform.OS === 'web' ? handleHoverIn : undefined,
    onHoverOut: Platform.OS === 'web' ? handleHoverOut : undefined,
  };

  if (asChild && React.isValidElement(children)) {
    return (
      <View ref={triggerRef} collapsable={false}>
        <Pressable {...pressableProps}>
          {children}
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      ref={triggerRef}
      className={cn(className)}
      {...pressableProps}
      collapsable={false}
    >
      {children}
    </Pressable>
  );
}

// Content
export interface TooltipContentProps extends ViewProps {
  children?: React.ReactNode;
  side?: TooltipSide;
  sideOffset?: number;
  className?: string;
}

export function TooltipContent({
  children,
  side = 'top',
  sideOffset = 4,
  className,
  ...props
}: TooltipContentProps) {
  const { open, onOpenChange, triggerLayout } = useTooltipContext();
  const [contentSize, setContentSize] = useState({ width: 0, height: 0 });
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (open) {
      opacity.value = withDelay(50, withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) }));
    } else {
      opacity.value = withTiming(0, { duration: 100 });
    }
  }, [open, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getPosition = useCallback(() => {
    if (!triggerLayout) return { top: 0, left: 0 };

    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    let top = 0;
    let left = 0;

    switch (side) {
      case 'top':
        top = triggerLayout.y - contentSize.height - sideOffset;
        left = triggerLayout.x + (triggerLayout.width - contentSize.width) / 2;
        break;
      case 'bottom':
        top = triggerLayout.y + triggerLayout.height + sideOffset;
        left = triggerLayout.x + (triggerLayout.width - contentSize.width) / 2;
        break;
      case 'left':
        top = triggerLayout.y + (triggerLayout.height - contentSize.height) / 2;
        left = triggerLayout.x - contentSize.width - sideOffset;
        break;
      case 'right':
        top = triggerLayout.y + (triggerLayout.height - contentSize.height) / 2;
        left = triggerLayout.x + triggerLayout.width + sideOffset;
        break;
    }

    // Clamp to screen bounds
    left = Math.max(8, Math.min(left, screenWidth - contentSize.width - 8));
    top = Math.max(8, Math.min(top, screenHeight - contentSize.height - 8));

    return { top, left };
  }, [triggerLayout, contentSize, side, sideOffset]);

  if (!open) return null;

  const position = getPosition();

  return (
    <RNModal visible={open} transparent animationType="none" onRequestClose={() => onOpenChange(false)}>
      <Pressable className="flex-1" onPress={() => onOpenChange(false)}>
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: position.top,
              left: position.left,
            },
            animatedStyle,
          ]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setContentSize({ width, height });
            }
          }}
        >
          <View
            className={cn(
              'rounded-md bg-popover px-3 py-1.5 shadow-md',
              'border border-border',
              className
            )}
            {...props}
          >
            {typeof children === 'string' ? (
              <Text className="text-sm text-popover-foreground">{children}</Text>
            ) : (
              children
            )}
          </View>
        </Animated.View>
      </Pressable>
    </RNModal>
  );
}
