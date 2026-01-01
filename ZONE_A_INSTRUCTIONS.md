# ZONE A: Core/Shared Infrastructure

**Instance 1 Assignment**

## Your Responsibility
You are converting the core shared infrastructure that ALL other zones depend on.

**Total Files: ~193 files**

## Your Directories (from doughy-ai-web-backup)

| Directory | Files | Priority |
|-----------|-------|----------|
| `src/components/` | 83 | HIGH - Other zones need these |
| `src/utils/` | 45 | HIGH |
| `src/integrations/` | 33 | HIGH - Supabase client |
| `src/lib/` | 12 | MEDIUM |
| `src/hooks/` | 11 | MEDIUM |
| `src/services/` | 3 | MEDIUM |
| `src/config/` | 2 | HIGH |
| `src/store/` | 1 | HIGH |
| `src/routes/` | 1 | HIGH - Navigation setup |
| `src/data/` | 1 | LOW |
| `src/scheduler/` | 1 | LOW |

## Priority Order

### Phase 1: Foundation (Do First)
1. **Set up NativeWind** - Configure Tailwind for React Native
2. **Supabase Client** - Update `src/integrations/supabase/` for RN (use AsyncStorage)
3. **Type Definitions** - Create `src/types/index.ts` with shared types
4. **Navigation Setup** - Create navigation structure in `src/routes/`

### Phase 2: UI Components
5. **Base UI Components** - Convert `src/components/ui/`:
   - Button, Card, Input, TextArea
   - Select, Checkbox, Switch
   - Dialog, Modal, Sheet
   - Tabs, Accordion
   - Toast notifications
   - Loading spinners

### Phase 3: Utilities & Hooks
6. **Utility Functions** - Most of `src/utils/` should work as-is
7. **Custom Hooks** - Convert `src/hooks/`
8. **Services** - Convert `src/services/`

## Key Conversions for Your Zone

### Supabase Client (src/integrations/supabase/client.ts)
```tsx
// WEB VERSION
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);

// EXPO UNIVERSAL VERSION
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for mobile
  },
});
```

### NativeWind Setup (tailwind.config.js)
```js
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Navigation Structure (src/routes/)
```tsx
// src/routes/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PropertyDetail: { id: string };
  LeadDetail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Component Conversion Example

### Button Component
```tsx
// SOURCE: src/components/ui/button.tsx (web)
// TARGET: src/components/ui/Button.tsx (expo universal)

import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        destructive: 'bg-destructive',
        outline: 'border border-input bg-background',
        secondary: 'bg-secondary',
        ghost: '',
        link: '',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant,
  size,
  onPress,
  disabled,
  loading,
  children
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={buttonVariants({ variant, size })}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-primary-foreground font-medium">
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
```

## Files to Create First

1. `src/types/index.ts` - Shared TypeScript types
2. `src/lib/supabase.ts` - Supabase client setup
3. `src/components/ui/Button.tsx`
4. `src/components/ui/Card.tsx`
5. `src/components/ui/Input.tsx`
6. `src/routes/RootNavigator.tsx`

## Notes for Other Zones

When other zones need your components, they should import:
```tsx
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
```

Mark any components you haven't converted yet with:
```tsx
// TODO: Zone A - Not yet converted
export const Placeholder = () => <View><Text>Placeholder</Text></View>;
```
