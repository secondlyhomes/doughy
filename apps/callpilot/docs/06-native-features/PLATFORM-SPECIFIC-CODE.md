# Platform-Specific Code Patterns

> Writing code that adapts to iOS and Android differences.

## Overview

React Native provides several ways to handle platform differences:

| Method | Use Case |
|--------|----------|
| `Platform.OS` | Simple conditionals |
| `Platform.select` | Platform-specific values |
| `.ios.tsx` / `.android.tsx` | Entire component differences |

## Platform.OS

Simple conditional logic:

```typescript
import { Platform, View, Text } from 'react-native';

function PlatformExample() {
  return (
    <View>
      <Text>
        {Platform.OS === 'ios' ? 'iPhone' : 'Android'}
      </Text>
      {Platform.OS === 'ios' && <IOSOnlyComponent />}
    </View>
  );
}
```

## Platform.select

Return different values per platform:

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
});

// For values
const statusBarHeight = Platform.select({
  ios: 44,
  android: 24,
  default: 0,
});
```

## File Extensions

For completely different implementations, use platform-specific files:

```
src/components/
├── DatePicker.tsx        # Shared types/exports
├── DatePicker.ios.tsx    # iOS implementation
└── DatePicker.android.tsx # Android implementation
```

```typescript
// DatePicker.tsx (shared interface)
export interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

// DatePicker.ios.tsx
import DateTimePicker from '@react-native-community/datetimepicker';

export function DatePicker({ value, onChange }: DatePickerProps) {
  return (
    <DateTimePicker
      value={value}
      mode="date"
      display="spinner" // iOS style
      onChange={(_, date) => date && onChange(date)}
    />
  );
}

// DatePicker.android.tsx
export function DatePicker({ value, onChange }: DatePickerProps) {
  const [show, setShow] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setShow(true)}>
        <Text>{value.toDateString()}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="calendar" // Android style
          onChange={(_, date) => {
            setShow(false);
            date && onChange(date);
          }}
        />
      )}
    </>
  );
}
```

## Common Platform Differences

### Shadows

```typescript
// iOS uses shadow* properties
const iosShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
};

// Android uses elevation
const androidShadow = {
  elevation: 5,
};

// Combined
const shadow = Platform.select({
  ios: iosShadow,
  android: androidShadow,
});
```

### Safe Area

```typescript
import { SafeAreaView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Screen({ children }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      // Android StatusBar needs explicit handling sometimes
      ...(Platform.OS === 'android' && {
        paddingTop: StatusBar.currentHeight,
      }),
    }}>
      {children}
    </View>
  );
}
```

### Keyboard Behavior

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

function FormScreen() {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Form content */}
    </KeyboardAvoidingView>
  );
}
```

### Status Bar

```typescript
import { StatusBar, Platform } from 'react-native';

function App() {
  return (
    <>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor={Platform.OS === 'android' ? '#000' : undefined}
        translucent={Platform.OS === 'android'}
      />
      {/* App content */}
    </>
  );
}
```

### Fonts

```typescript
const fontFamily = Platform.select({
  ios: 'System', // San Francisco
  android: 'Roboto',
});

// Font weights work differently
const fontWeight = Platform.select({
  ios: '600' as const,
  android: '700' as const, // Android needs higher for similar appearance
});
```

### Hit Slop

```typescript
// Android needs larger touch targets
const hitSlop = Platform.select({
  ios: { top: 10, bottom: 10, left: 10, right: 10 },
  android: { top: 15, bottom: 15, left: 15, right: 15 },
});

<TouchableOpacity hitSlop={hitSlop}>
  <Icon />
</TouchableOpacity>
```

### Back Button (Android)

```typescript
import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

function Screen() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        // Return true to prevent default behavior
        // Return false to allow default back navigation
        return false;
      }
    );

    return () => backHandler.remove();
  }, []);
}
```

### Text Alignment

```typescript
// Android TextInput has default padding
const textInputStyle = Platform.select({
  ios: {},
  android: {
    paddingVertical: 0, // Remove default padding
    textAlignVertical: 'center',
  },
});
```

## Platform-Specific Hooks

```typescript
// src/hooks/usePlatform.ts
import { Platform, Dimensions, StatusBar } from 'react-native';

export function usePlatform() {
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';

  const statusBarHeight = Platform.select({
    ios: 44, // Approximate, use SafeAreaContext for accuracy
    android: StatusBar.currentHeight ?? 24,
    default: 0,
  });

  const { width, height } = Dimensions.get('window');
  const isSmallScreen = width < 375;

  return {
    isIOS,
    isAndroid,
    statusBarHeight,
    isSmallScreen,
    screenWidth: width,
    screenHeight: height,
  };
}
```

## Platform-Specific Config

```typescript
// src/config/platform.ts
import { Platform } from 'react-native';

export const config = {
  animations: {
    duration: Platform.select({ ios: 300, android: 250 }),
    useNativeDriver: true,
  },

  haptics: {
    enabled: Platform.OS === 'ios', // Better haptic support on iOS
  },

  permissions: {
    // iOS specific permissions
    photoLibraryAddOnly: Platform.OS === 'ios',
  },

  layout: {
    headerHeight: Platform.select({ ios: 44, android: 56 }),
    tabBarHeight: Platform.select({ ios: 83, android: 56 }),
  },
};
```

## Testing Both Platforms

### In Development

```bash
# Run iOS
npx expo start --ios

# Run Android
npx expo start --android

# Run both
npx expo start
```

### Platform-Specific Tests

```typescript
// __tests__/PlatformComponent.test.tsx
import { Platform } from 'react-native';

// Mock Platform.OS
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

describe('iOS behavior', () => {
  it('renders iOS-specific UI', () => {
    // Test iOS behavior
  });
});

// In separate file or describe block for Android
describe('Android behavior', () => {
  beforeAll(() => {
    Platform.OS = 'android';
  });

  it('renders Android-specific UI', () => {
    // Test Android behavior
  });
});
```

## Checklist

- [ ] Shadows work on both platforms
- [ ] Safe areas handled correctly
- [ ] Keyboard behavior configured per platform
- [ ] Status bar styled per platform
- [ ] Back button handled (Android)
- [ ] Touch targets large enough on Android
- [ ] Fonts render similarly across platforms
- [ ] Tested on physical devices for both platforms

## Related Docs

- [Permissions Handling](./PERMISSIONS-HANDLING.md) - Platform permission differences
- [Component Guidelines](../02-coding-standards/COMPONENT-GUIDELINES.md) - Component patterns
