// src/components/ui/Accordion.tsx
// Accordion component - multiple collapsible sections
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, ViewProps, LayoutChangeEvent } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';
import { cn } from '@/lib/utils';

// Types
type AccordionType = 'single' | 'multiple';
type AccordionValue<T extends AccordionType> = T extends 'single' ? string : string[];

// Accordion Context
interface AccordionContextType {
  type: AccordionType;
  value: string[];
  onValueChange: (itemValue: string) => void;
  collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion provider');
  }
  return context;
}

// Item Context
interface AccordionItemContextType {
  value: string;
  isOpen: boolean;
  disabled: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextType | null>(null);

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionItem components must be used within an AccordionItem');
  }
  return context;
}

// Accordion Root
export interface AccordionSingleProps extends ViewProps {
  type: 'single';
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  collapsible?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface AccordionMultipleProps extends ViewProps {
  type: 'multiple';
  value?: string[];
  onValueChange?: (value: string[]) => void;
  defaultValue?: string[];
  className?: string;
  children?: React.ReactNode;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export function Accordion(props: AccordionProps) {
  const {
    type,
    defaultValue,
    className,
    children,
    ...viewProps
  } = props;

  const [internalValue, setInternalValue] = useState<string[]>(
    type === 'single'
      ? defaultValue ? [defaultValue as string] : []
      : (defaultValue as string[]) ?? []
  );

  const controlledValue = props.value;
  const value = controlledValue !== undefined
    ? (type === 'single' ? (controlledValue ? [controlledValue as string] : []) : controlledValue as string[])
    : internalValue;

  const collapsible = type === 'single' ? (props as AccordionSingleProps).collapsible ?? false : true;

  const handleValueChange = useCallback(
    (itemValue: string) => {
      let newValue: string[];

      if (type === 'single') {
        if (value.includes(itemValue)) {
          newValue = collapsible ? [] : value;
        } else {
          newValue = [itemValue];
        }
        setInternalValue(newValue);
        (props as AccordionSingleProps).onValueChange?.(newValue[0] ?? '');
      } else {
        if (value.includes(itemValue)) {
          newValue = value.filter((v) => v !== itemValue);
        } else {
          newValue = [...value, itemValue];
        }
        setInternalValue(newValue);
        (props as AccordionMultipleProps).onValueChange?.(newValue);
      }
    },
    [type, value, collapsible, props]
  );

  return (
    <AccordionContext.Provider
      value={{ type, value, onValueChange: handleValueChange, collapsible }}
    >
      <View className={cn('w-full', className)} {...viewProps}>
        {children}
      </View>
    </AccordionContext.Provider>
  );
}

// Accordion Item
export interface AccordionItemProps extends ViewProps {
  value: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function AccordionItem({
  value,
  disabled = false,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const { value: accordionValue } = useAccordionContext();
  const colors = useThemeColors();
  const isOpen = accordionValue.includes(value);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen, disabled }}>
      <View
        className={cn('', className)}
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        {...props}
      >
        {children}
      </View>
    </AccordionItemContext.Provider>
  );
}

// Accordion Trigger
export interface AccordionTriggerProps {
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function AccordionTrigger({
  children,
  className,
  textClassName,
}: AccordionTriggerProps) {
  const { onValueChange } = useAccordionContext();
  const { value, isOpen, disabled } = useAccordionItemContext();
  const colors = useThemeColors();

  const rotation = useSharedValue(isOpen ? 180 : 0);

  React.useEffect(() => {
    rotation.value = withTiming(isOpen ? 180 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isOpen, rotation]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <TouchableOpacity
      className={cn(
        'flex-row items-center justify-between py-4',
        disabled && 'opacity-50',
        className
      )}
      onPress={() => !disabled && onValueChange(value)}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen, disabled }}
      accessibilityLabel={typeof children === 'string' ? children : undefined}
    >
      {typeof children === 'string' ? (
        <Text
          className={cn('flex-1 text-sm font-medium', textClassName)}
          style={{ color: colors.foreground }}
        >
          {children}
        </Text>
      ) : (
        <View className="flex-1">{children}</View>
      )}
      <Animated.View style={iconStyle}>
        <ChevronDown size={16} color={colors.mutedForeground} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// Accordion Content
export interface AccordionContentProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function AccordionContent({
  children,
  className,
  ...props
}: AccordionContentProps) {
  const { isOpen } = useAccordionItemContext();
  const height = useSharedValue(0);
  const animatedHeight = useSharedValue(isOpen ? 1 : 0);
  const [measured, setMeasured] = useState(false);
  // Track previous height on JS thread to avoid reading shared value in callback
  const previousHeightRef = useRef(0);

  React.useEffect(() => {
    animatedHeight.value = withTiming(isOpen ? 1 : 0, {
      duration: 200,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isOpen, animatedHeight]);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const measuredHeight = event.nativeEvent.layout.height;
      // Update height when content changes (e.g., response time appearing)
      if (measuredHeight > 0 && previousHeightRef.current !== measuredHeight) {
        previousHeightRef.current = measuredHeight;
        height.value = measuredHeight;
        if (!measured) {
          setMeasured(true);
        }
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

  // Render hidden to measure initially
  if (!measured) {
    return (
      <View
        style={{ position: 'absolute', opacity: 0 }}
        onLayout={onLayout}
        pointerEvents="none"
      >
        <View className={cn('pb-4 pt-0', className)} {...props}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      <View className={cn('pb-4 pt-0', className)} onLayout={onLayout} {...props}>
        {children}
      </View>
    </Animated.View>
  );
}
