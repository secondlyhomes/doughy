// src/components/ui/Carousel.tsx
// Horizontal swipeable list with dots indicator
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TouchableOpacity,
  ViewProps,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

// Carousel Root
export interface CarouselProps extends ViewProps {
  children?: React.ReactNode;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  loop?: boolean;
  className?: string;
}

export function Carousel({
  children,
  autoPlay = false,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = false,
  loop = false,
  className,
  ...props
}: CarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const colors = useThemeColors();

  const items = React.Children.toArray(children);
  const itemCount = items.length;

  // Handle scroll
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / containerWidth);
      setCurrentIndex(Math.max(0, Math.min(index, itemCount - 1)));
    },
    [containerWidth, itemCount]
  );

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number, animated = true) => {
      let targetIndex = index;

      if (loop) {
        if (index < 0) targetIndex = itemCount - 1;
        if (index >= itemCount) targetIndex = 0;
      } else {
        targetIndex = Math.max(0, Math.min(index, itemCount - 1));
      }

      scrollViewRef.current?.scrollTo({
        x: targetIndex * containerWidth,
        animated,
      });
      setCurrentIndex(targetIndex);
    },
    [containerWidth, itemCount, loop]
  );

  // Auto play - use functional update to avoid recreating interval on every slide
  useEffect(() => {
    if (!autoPlay || itemCount <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        const targetIndex = loop ? (next >= itemCount ? 0 : next) : Math.min(next, itemCount - 1);
        scrollViewRef.current?.scrollTo({
          x: targetIndex * containerWidth,
          animated: true,
        });
        return targetIndex;
      });
    }, autoPlayInterval);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, itemCount, loop, containerWidth]);

  // Stop auto play on interaction
  const handleScrollBeginDrag = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  }, []);

  return (
    <View
      className={cn('relative', className)}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      {...props}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {items.map((child, index) => (
          <View
            key={index}
            style={{ width: containerWidth }}
            className="flex-1"
          >
            {child}
          </View>
        ))}
      </ScrollView>

      {/* Arrows */}
      {showArrows && itemCount > 1 && (
        <>
          <TouchableOpacity
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-sm',
              currentIndex === 0 && !loop && 'opacity-50'
            )}
            onPress={() => scrollToIndex(currentIndex - 1)}
            disabled={currentIndex === 0 && !loop}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Previous slide"
            accessibilityState={{ disabled: currentIndex === 0 && !loop }}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-sm',
              currentIndex === itemCount - 1 && !loop && 'opacity-50'
            )}
            onPress={() => scrollToIndex(currentIndex + 1)}
            disabled={currentIndex === itemCount - 1 && !loop}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Next slide"
            accessibilityState={{ disabled: currentIndex === itemCount - 1 && !loop }}
          >
            <ChevronRight size={20} color={colors.foreground} />
          </TouchableOpacity>
        </>
      )}

      {/* Dots */}
      {showDots && itemCount > 1 && (
        <CarouselDots
          count={itemCount}
          activeIndex={currentIndex}
          onDotPress={scrollToIndex}
        />
      )}
    </View>
  );
}

// Carousel Item
export interface CarouselItemProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function CarouselItem({ children, className, ...props }: CarouselItemProps) {
  return (
    <View className={cn('flex-1', className)} {...props}>
      {children}
    </View>
  );
}

// Dots indicator
interface CarouselDotsProps {
  count: number;
  activeIndex: number;
  onDotPress?: (index: number) => void;
}

function CarouselDots({ count, activeIndex, onDotPress }: CarouselDotsProps) {
  return (
    <View className="absolute bottom-4 left-0 right-0 flex-row items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <CarouselDot
          key={index}
          isActive={index === activeIndex}
          onPress={() => onDotPress?.(index)}
        />
      ))}
    </View>
  );
}

// Individual dot
interface CarouselDotProps {
  isActive: boolean;
  onPress?: () => void;
}

function CarouselDot({ isActive, onPress }: CarouselDotProps) {
  const scale = useSharedValue(isActive ? 1.2 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.5);

  useEffect(() => {
    scale.value = withTiming(isActive ? 1.2 : 1, { duration: 200 });
    opacity.value = withTiming(isActive ? 1 : 0.5, { duration: 200 });
  }, [isActive, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View
        style={animatedStyle}
        className={cn(
          'h-2 w-2 rounded-full',
          isActive ? 'bg-primary' : 'bg-muted-foreground'
        )}
      />
    </TouchableOpacity>
  );
}

// Export components for composition
export { CarouselDots, CarouselDot };
