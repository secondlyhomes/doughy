# Haptics & Audio Feedback Guide

> Creating satisfying tactile and audio feedback for ADHD-friendly UX.

## Overview

Haptic and audio feedback:
- Provides instant confirmation of actions
- Creates satisfying micro-interactions
- Helps users with attention challenges stay engaged
- Should be subtle, not overwhelming

## Haptic Feedback

### Setup

```bash
npx expo install expo-haptics
```

### Haptic Types

```typescript
// src/services/haptics.ts
import * as Haptics from 'expo-haptics';

// Impact feedback - for button taps, selections
export function impactLight() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function impactMedium() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function impactHeavy() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

// Notification feedback - for results/outcomes
export function notificationSuccess() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function notificationWarning() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

export function notificationError() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

// Selection feedback - for toggles, pickers
export function selectionChanged() {
  Haptics.selectionAsync();
}
```

### When to Use Each Type

| Action | Haptic Type | When |
|--------|-------------|------|
| Button tap | `impactLight` | Any interactive element |
| Important action | `impactMedium` | Submit, confirm |
| Destructive action | `impactHeavy` | Delete, discard |
| Task completed | `notificationSuccess` | Achievement, completion |
| Warning shown | `notificationWarning` | Validation error |
| Error occurred | `notificationError` | Failed action |
| Toggle switched | `selectionChanged` | On/off toggles |
| Picker changed | `selectionChanged` | Date/time picker |
| Long press | `impactMedium` | Context menu trigger |

### Haptic Button Component

```typescript
// src/components/shared/HapticButton.tsx
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettings } from '@/hooks/useSettings';

interface HapticButtonProps extends TouchableOpacityProps {
  hapticType?: 'light' | 'medium' | 'heavy' | 'selection';
}

export function HapticButton({
  hapticType = 'light',
  onPress,
  ...props
}: HapticButtonProps) {
  const { hapticsEnabled } = useSettings();

  const handlePress = (event: GestureResponderEvent) => {
    if (hapticsEnabled) {
      switch (hapticType) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
      }
    }
    onPress?.(event);
  };

  return <TouchableOpacity onPress={handlePress} {...props} />;
}
```

### Haptic Patterns

```typescript
// src/services/haptics.ts

// Task completion celebration
export async function celebrationPattern() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await delay(100);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await delay(50);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// Undo available (10 second warning)
export async function undoReminderPattern() {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  await delay(500);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// Error shake
export async function errorPattern() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  await delay(100);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

## Audio Feedback

### Setup

```bash
npx expo install expo-av
```

### Sound Service

```typescript
// src/services/audio.ts
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// Preload sounds
let successSound: Audio.Sound | null = null;
let errorSound: Audio.Sound | null = null;
let tapSound: Audio.Sound | null = null;

export async function loadSounds() {
  try {
    // Configure audio session
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false, // Respect silent mode
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Load sound files
    const [success, error, tap] = await Promise.all([
      Audio.Sound.createAsync(require('@/assets/sounds/success.wav')),
      Audio.Sound.createAsync(require('@/assets/sounds/error.wav')),
      Audio.Sound.createAsync(require('@/assets/sounds/tap.wav')),
    ]);

    successSound = success.sound;
    errorSound = error.sound;
    tapSound = tap.sound;
  } catch (e) {
    console.error('Failed to load sounds:', e);
  }
}

export async function playSuccess() {
  try {
    if (successSound) {
      await successSound.replayAsync();
    }
  } catch (e) {
    console.error('Failed to play success sound:', e);
  }
}

export async function playError() {
  try {
    if (errorSound) {
      await errorSound.replayAsync();
    }
  } catch (e) {
    console.error('Failed to play error sound:', e);
  }
}

export async function playTap() {
  try {
    if (tapSound) {
      await tapSound.replayAsync();
    }
  } catch (e) {
    console.error('Failed to play tap sound:', e);
  }
}

export async function unloadSounds() {
  await Promise.all([
    successSound?.unloadAsync(),
    errorSound?.unloadAsync(),
    tapSound?.unloadAsync(),
  ]);
}
```

### Load Sounds on App Start

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { loadSounds, unloadSounds } from '@/services/audio';

export default function RootLayout() {
  useEffect(() => {
    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  // ...
}
```

### Sound Design Guidelines

| Sound Type | Duration | Volume | Use Case |
|------------|----------|--------|----------|
| Tap | <100ms | Soft | Button press |
| Success | 200-400ms | Medium | Completion |
| Error | 200-300ms | Medium | Failure |
| Notification | 300-500ms | Medium | Alert |

**Best Practices:**
- Keep sounds **short** (<500ms)
- Use **pleasant**, non-harsh tones
- Respect **silent mode** (don't play in silent)
- Make sounds **optional** in settings
- Use **royalty-free** sounds

### Free Sound Resources

- [UI8.net](https://ui8.net/category/sound) - Premium UI sounds
- [Freesound.org](https://freesound.org) - Free sounds (check license)
- [Mixkit](https://mixkit.co/free-sound-effects/) - Free UI sounds
- [Zapsplat](https://www.zapsplat.com) - Free sounds

## Combined Feedback Hook

```typescript
// src/hooks/useFeedback.ts
import { useSettings } from '@/hooks/useSettings';
import * as Haptics from 'expo-haptics';
import { playSuccess, playError, playTap } from '@/services/audio';

export function useFeedback() {
  const { hapticsEnabled, soundsEnabled } = useSettings();

  const success = async () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (soundsEnabled) {
      await playSuccess();
    }
  };

  const error = async () => {
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    if (soundsEnabled) {
      await playError();
    }
  };

  const tap = () => {
    if (hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // Tap sound usually not needed - haptic is enough
  };

  const selection = () => {
    if (hapticsEnabled) {
      Haptics.selectionAsync();
    }
  };

  return { success, error, tap, selection };
}
```

### Usage

```typescript
function TaskItem({ task, onComplete }) {
  const { success, tap } = useFeedback();

  const handleComplete = async () => {
    tap(); // Immediate feedback
    await onComplete(task.id);
    await success(); // Celebration on completion
  };

  return (
    <HapticButton onPress={handleComplete}>
      <Text>{task.title}</Text>
    </HapticButton>
  );
}
```

## Settings Screen

```typescript
// src/screens/settings/feedback-settings.tsx
import { View, Text, Switch } from 'react-native';
import { useSettingsStore } from '@/stores/use-settings-store';
import * as Haptics from 'expo-haptics';

export function FeedbackSettings() {
  const { hapticsEnabled, soundsEnabled, setHaptics, setSounds } = useSettingsStore();

  return (
    <View>
      <Text style={styles.sectionTitle}>Feedback</Text>

      <View style={styles.row}>
        <Text>Haptic Feedback</Text>
        <Switch
          value={hapticsEnabled}
          onValueChange={(value) => {
            setHaptics(value);
            if (value) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
        />
      </View>

      <View style={styles.row}>
        <Text>Sound Effects</Text>
        <Switch
          value={soundsEnabled}
          onValueChange={setSounds}
        />
      </View>
    </View>
  );
}
```

## ADHD-Friendly Patterns

### Celebration on Completion

```typescript
// When task is marked complete
async function handleTaskComplete(taskId: string) {
  // Haptic celebration
  await celebrationPattern();

  // Optional: Confetti animation
  confettiRef.current?.start();

  // Mark task complete in database
  await markTaskComplete(taskId);
}
```

### Safety Net with Feedback

```typescript
// 10-second undo for impulsive actions
function useUndoableAction() {
  const { tap, error } = useFeedback();
  const [pendingAction, setPendingAction] = useState(null);

  const execute = (action: () => Promise<void>) => {
    tap(); // Acknowledge press

    // Show undo toast
    setPendingAction(action);

    // Execute after 10 seconds if not undone
    setTimeout(async () => {
      if (pendingAction) {
        await action();
        setPendingAction(null);
      }
    }, 10000);
  };

  const undo = () => {
    setPendingAction(null);
    error(); // Feedback that action was cancelled
  };

  return { execute, undo, hasPending: !!pendingAction };
}
```

## Checklist

- [ ] expo-haptics installed
- [ ] expo-av installed (if using sounds)
- [ ] Haptic feedback on interactive elements
- [ ] Sound effects loaded on app start
- [ ] Sounds respect silent mode
- [ ] User can disable haptics in settings
- [ ] User can disable sounds in settings
- [ ] Feedback timing is immediate (<100ms)
- [ ] Celebration pattern for completions
- [ ] Error feedback for failures

## Related Docs

- [Design Philosophy](../05-ui-ux/DESIGN-PHILOSOPHY.md) - ADHD-friendly UX
- [Animation Patterns](../05-ui-ux/ANIMATION-PATTERNS.md) - Visual feedback
- [Component Guidelines](../02-coding-standards/COMPONENT-GUIDELINES.md) - Component patterns
