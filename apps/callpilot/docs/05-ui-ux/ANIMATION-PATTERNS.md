# Animation Patterns

## Overview

Animations provide feedback, guide attention, and create delight. For ADHD-friendly apps, animations should be purposeful, not distracting.

## Core Principles

### 1. Purpose Over Polish

Every animation should serve a function:
- **Feedback** - Confirm user actions
- **Orientation** - Show spatial relationships
- **Attention** - Guide focus to important elements
- **Delight** - Celebrate achievements (sparingly)

### 2. Respect User Preferences

```typescript
import { useReducedMotion } from 'react-native-reanimated';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <StaticVersion />;
  }

  return <AnimatedVersion />;
}
```

### 3. Duration Guidelines

| Animation Type | Duration | Use Case |
|---------------|----------|----------|
| Micro | 100-200ms | Button press, toggle |
| Standard | 200-300ms | Page transitions, modals |
| Complex | 300-500ms | Multi-step animations |
| Celebration | 500-800ms | Achievement unlocked |

## Spring Physics

Prefer spring animations over linear/easing for natural feel:

```typescript
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const SPRING_CONFIG = {
  // Snappy - for small UI elements
  snappy: {
    damping: 15,
    stiffness: 300,
    mass: 0.5,
  },
  // Bouncy - for playful interactions
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
  // Smooth - for larger movements
  smooth: {
    damping: 20,
    stiffness: 150,
    mass: 1,
  },
};

function AnimatedButton() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.95, SPRING_CONFIG.snappy);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG.snappy);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
        <Text>Press Me</Text>
      </Pressable>
    </Animated.View>
  );
}
```

## Common Patterns

### 1. Button Press Feedback

```typescript
// src/components/shared/animations/PressableScale.tsx
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableScale({ children, onPress, ...props }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
```

### 2. Checkbox Animation

```typescript
// src/components/shared/animations/AnimatedCheckbox.tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export function AnimatedCheckbox({ checked, onChange }) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(checked ? 1 : 0);

  const handleToggle = () => {
    const newChecked = !checked;

    // Haptic feedback
    if (newChecked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Bounce animation
    scale.value = withSequence(
      withSpring(0.85, { damping: 10, stiffness: 400 }),
      withSpring(1.05, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );

    // Checkmark animation
    checkScale.value = withSpring(newChecked ? 1 : 0, {
      damping: 12,
      stiffness: 200,
    });

    onChange(newChecked);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <Pressable onPress={handleToggle}>
      <Animated.View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.check, checkStyle]}>
          <CheckIcon />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}
```

### 3. List Item Entry

```typescript
// src/components/shared/animations/FadeInUp.tsx
import Animated, {
  FadeInUp,
  FadeOutDown,
} from 'react-native-reanimated';

export function AnimatedListItem({ index, children }) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).springify()}
      exiting={FadeOutDown.springify()}
    >
      {children}
    </Animated.View>
  );
}

// Usage
function TaskList({ tasks }) {
  return (
    <FlatList
      data={tasks}
      renderItem={({ item, index }) => (
        <AnimatedListItem index={index}>
          <TaskCard task={item} />
        </AnimatedListItem>
      )}
    />
  );
}
```

### 4. Celebration Animation

```typescript
// src/components/shared/animations/CelebrationBurst.tsx
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export function useCelebration() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const celebrate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    scale.value = 0;
    opacity.value = 1;

    scale.value = withSpring(1, {
      damping: 8,
      stiffness: 100,
    });

    opacity.value = withDelay(
      400,
      withSpring(0, { damping: 20, stiffness: 100 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { celebrate, animatedStyle };
}
```

### 5. Page Transitions

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        animationDuration: 250,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    />
  );
}

// For modals
<Stack.Screen
  name="modal"
  options={{
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>
```

### 6. Skeleton Loading

```typescript
// src/components/shared/Skeleton.tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export function Skeleton({ width, height, style }) {
  const translateX = useSharedValue(-width);

  React.useEffect(() => {
    translateX.value = withRepeat(
      withTiming(width, {
        duration: 1000,
        easing: Easing.ease,
      }),
      -1, // Infinite
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.skeleton, { width, height }, style]}>
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
```

## Performance Tips

### Use Native Driver

```typescript
// Always use native driver when possible
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Required for 60fps
}).start();
```

### Avoid Layout Animations on Large Lists

```typescript
// BAD - Causes jank with many items
<FlatList
  data={items}
  renderItem={({ item }) => (
    <Animated.View layout={Layout.springify()}>
      <Item {...item} />
    </Animated.View>
  )}
/>

// GOOD - Only animate visible items
<FlatList
  data={items}
  renderItem={({ item, index }) => (
    <Animated.View entering={FadeIn.delay(Math.min(index, 10) * 50)}>
      <Item {...item} />
    </Animated.View>
  )}
/>
```

### Memoize Animated Styles

```typescript
// Use useAnimatedStyle, not inline styles
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

return <Animated.View style={animatedStyle} />;
```

## Anti-Patterns

### Don't Over-Animate

```typescript
// BAD - Too much movement
<Animated.View entering={BounceIn} exiting={BounceOut}>
  <Animated.Text entering={FadeIn} exiting={FadeOut}>
    {text}
  </Animated.Text>
</Animated.View>

// GOOD - Subtle and purposeful
<Animated.View entering={FadeInUp.springify()}>
  <Text>{text}</Text>
</Animated.View>
```

### Don't Block Interactions

```typescript
// BAD - User can't interact during animation
setDisabled(true);
animate().finally(() => setDisabled(false));

// GOOD - User can interact immediately
animate();
```

## Checklist

- [ ] Animations use spring physics
- [ ] Reduce Motion preference respected
- [ ] Haptic feedback on interactions
- [ ] Native driver used where possible
- [ ] No animations longer than 800ms
- [ ] Celebrations are brief and meaningful
- [ ] Loading states use skeletons, not spinners
- [ ] Page transitions feel native
