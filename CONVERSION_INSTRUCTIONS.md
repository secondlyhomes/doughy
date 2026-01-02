# Doughy AI - Expo Universal Conversion Guide

## Overview

This document provides instructions for converting the Doughy AI React web application to **Expo Universal** - a single codebase that builds to **Web, iOS, and Android**.

The work is divided into **4 zones** for parallel development by 4 Claude instances.

**Source (web backup):** `/Users/dinosaur/Documents/doughy-ai-web-backup`
**Target (Expo Universal project):** `/Users/dinosaur/Documents/doughy-ai`

### Platform Commands
```bash
npx expo start --web    # Run on web browser
npx expo start --ios    # Run on iOS simulator
npx expo start --android # Run on Android emulator
```

---

## Quick Reference: Component Mappings

| Web (React DOM) | React Native |
|-----------------|--------------|
| `<div>` | `<View>` |
| `<span>`, `<p>`, `<h1-h6>` | `<Text>` |
| `<button>` | `<TouchableOpacity>` or `<Pressable>` |
| `<input type="text">` | `<TextInput>` |
| `<input type="checkbox">` | `<Switch>` or custom |
| `<img>` | `<Image>` |
| `<a href>` | `<TouchableOpacity>` + navigation |
| `<ul>`, `<ol>` | `<FlatList>` or `<ScrollView>` |
| `<form>` | `<View>` (no form element in RN) |
| `<svg>` | `react-native-svg` |
| `<table>` | Custom `<View>` layout or `<FlatList>` |

---

## Library Replacements

| Web Library | React Native Replacement |
|-------------|-------------------------|
| `react-router-dom` | `@react-navigation/native` |
| `@radix-ui/*` | Custom components or `react-native-paper` |
| `tailwindcss` (CSS) | `nativewind` (already installed) |
| `lucide-react` | `lucide-react-native` or `@expo/vector-icons` |
| `framer-motion` | `react-native-reanimated` |
| `recharts` | `react-native-chart-kit` or `victory-native` |
| `react-leaflet` | `react-native-maps` |
| `sonner` (toasts) | `react-native-toast-message` |
| `react-day-picker` | `react-native-calendars` |
| `cmdk` | Custom search/command palette |
| `vaul` (drawer) | `@gorhom/bottom-sheet` |
| `xlsx` | `react-native-fs` + custom parsing |
| CSS files | StyleSheet or NativeWind |

**Libraries that work as-is:**
- `@supabase/supabase-js` ✅
- `zustand` ✅
- `@tanstack/react-query` ✅
- `zod` ✅
- `date-fns` ✅
- `uuid` ✅
- `clsx` ✅

---

## Styling Conversion

### Option A: NativeWind (Tailwind for RN) - RECOMMENDED
```tsx
// Web
<div className="flex items-center p-4 bg-white rounded-lg shadow">

// React Native with NativeWind
<View className="flex-row items-center p-4 bg-white rounded-lg shadow">
```

**Key NativeWind differences:**
- `flex` → `flex-row` (RN defaults to column)
- No `hover:` states (use Pressable with style functions)
- No `grid` (use `flex-wrap` or `FlatList`)
- `gap-*` works in RN

### Option B: StyleSheet
```tsx
import { StyleSheet, View, Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
});

<View style={styles.container}>
```

---

## Navigation Conversion

### Web (react-router-dom)
```tsx
import { useNavigate, useParams, Link } from 'react-router-dom';

function Component() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <Link to="/dashboard">Go to Dashboard</Link>
    <button onClick={() => navigate('/properties')}>View Properties</button>
  );
}
```

### React Native (react-navigation)
```tsx
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Dashboard: undefined;
  Properties: undefined;
  PropertyDetail: { id: string };
};

function Component() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { id } = route.params as { id: string };

  return (
    <>
      <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
        <Text>Go to Dashboard</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Properties')}>
        <Text>View Properties</Text>
      </TouchableOpacity>
    </>
  );
}
```

---

## Form Handling

### Web (react-hook-form + HTML)
```tsx
<form onSubmit={handleSubmit(onSubmit)}>
  <input {...register('email')} type="email" />
  <button type="submit">Submit</button>
</form>
```

### React Native (react-hook-form + RN components)
```tsx
import { Controller } from 'react-hook-form';

<View>
  <Controller
    control={control}
    name="email"
    render={({ field: { onChange, value } }) => (
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="email-address"
        autoCapitalize="none"
      />
    )}
  />
  <TouchableOpacity onPress={handleSubmit(onSubmit)}>
    <Text>Submit</Text>
  </TouchableOpacity>
</View>
```

---

## Common Patterns

### Conditional Rendering with Text
```tsx
// WRONG - Will crash in RN
<View>
  {isLoading && 'Loading...'}
</View>

// CORRECT
<View>
  {isLoading && <Text>Loading...</Text>}
</View>
```

### Event Handlers
```tsx
// Web
onClick={() => {}}
onChange={(e) => setValue(e.target.value)}
onSubmit={(e) => { e.preventDefault(); }}

// React Native
onPress={() => {}}
onChangeText={(text) => setValue(text)}
// No onSubmit - handle button press directly
```

### Scroll Views
```tsx
// Web - automatic scrolling
<div style={{ overflow: 'auto' }}>

// React Native - explicit ScrollView needed
<ScrollView>
  <View>{/* content */}</View>
</ScrollView>
```

---

## File Structure (Target)

```
doughy-ai/
├── app/                    # Expo Router (file-based routing)
│   ├── (auth)/            # Auth group (login, signup)
│   ├── (tabs)/            # Main tab navigation
│   │   ├── index.tsx      # Dashboard
│   │   ├── properties.tsx
│   │   ├── leads.tsx
│   │   └── settings.tsx
│   ├── property/[id].tsx  # Dynamic routes
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/        # Shared UI components
│   │   └── ui/           # Base components (Button, Card, etc.)
│   ├── features/         # Feature modules (same structure as web)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Utilities
│   ├── services/         # API services
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript types
├── assets/               # Images, fonts
└── CONVERSION_INSTRUCTIONS.md
```

---

## Zone Assignments

### ZONE A: Core/Shared Infrastructure (Instance 1)
**~193 files** - This zone should be done first or provide interfaces.

**Directories:**
- `src/components/` (83 files) → Convert UI components
- `src/lib/` (12 files) → Utility functions (mostly reusable)
- `src/utils/` (45 files) → Helper functions
- `src/hooks/` (11 files) → Custom hooks (most work as-is)
- `src/services/` (3 files) → API services
- `src/store/` (1 file) → Zustand stores (works as-is)
- `src/integrations/` (33 files) → Supabase client (minor changes)
- `src/config/` (2 files)
- `src/routes/` (1 file) → Convert to RN navigation
- `src/data/` (1 file)
- `src/scheduler/` (1 file)

**Priority Tasks:**
1. Set up NativeWind configuration
2. Create base UI components (Button, Card, Input, etc.)
3. Set up Supabase client for RN
4. Set up navigation structure
5. Create shared types

---

### ZONE B: Auth & Admin (Instance 2)
**~188 files**

**Directories:**
- `src/features/auth/` (86 files)
- `src/features/admin/` (58 files)
- `src/features/billing/` (20 files)
- `src/features/teams/` (8 files)
- `src/features/settings/` (7 files)
- `src/features/pricing/` (8 files)
- `src/features/notifications/` (1 file)

**Priority Tasks:**
1. Auth flow (login, signup, password reset)
2. Session management with SecureStore
3. Settings screens
4. Admin panels
5. Billing/subscription screens

**Dependencies:** Requires Zone A UI components

---

### ZONE C: Real Estate (Instance 3)
**~254 files**

**Directories:**
- `src/features/real-estate/` (254 files)

**Priority Tasks:**
1. Property list view with FlatList
2. Property detail screens
3. Property forms (add/edit)
4. Image handling with expo-image-picker
5. Map integration with react-native-maps
6. Property search/filter

**Dependencies:** Requires Zone A UI components

---

### ZONE D: Business Features (Instance 4)
**~346 files**

**Directories:**
- `src/features/leads/` (95 files)
- `src/features/assistant/` (81 files)
- `src/features/conversations/` (39 files)
- `src/features/core/` (43 files)
- `src/features/dashboard/` (7 files)
- `src/features/transcripts/` (19 files)
- `src/features/analytics/` (23 files)
- `src/features/calls/` (6 files)
- `src/features/resources/` (12 files)
- `src/features/layout/` (16 files)
- `src/features/scenario/` (3 files)
- `src/features/actions/` (2 files)

**Priority Tasks:**
1. Dashboard home screen
2. Leads management
3. AI Assistant chat interface
4. Conversations list/detail
5. Analytics charts with react-native-chart-kit
6. Layout components (headers, sidebars → bottom tabs)

**Dependencies:** Requires Zone A UI components

---

## Conversion Workflow for Each Instance

1. **Read source file** from `doughy-ai-web-backup`
2. **Create target file** in `doughy-ai/src/`
3. **Apply transformations:**
   - Replace DOM elements with RN components
   - Convert CSS/Tailwind to NativeWind
   - Replace router hooks with navigation
   - Update event handlers
   - Wrap strings in `<Text>` components
4. **Handle imports:**
   - Remove web-specific imports
   - Add RN imports (`View`, `Text`, `TouchableOpacity`, etc.)
5. **Test compilation** with `npx tsc --noEmit`

---

## Important Notes

### Do NOT Convert:
- Server-side code (edge functions stay in Supabase)
- Vite/build configuration
- Web-only features (will be removed or redesigned for mobile)

### iOS-Specific Considerations:
- Safe area insets (use `react-native-safe-area-context`)
- Keyboard avoiding views for forms
- iOS-style navigation patterns
- App Store requirements (privacy, permissions)

### State Management:
- Zustand stores work exactly the same
- React Query works exactly the same
- Use `@react-native-async-storage/async-storage` for persistence
- Use `expo-secure-store` for sensitive data (tokens)

---

## Commands Reference

```bash
# Start development
cd /Users/dinosaur/Documents/doughy-ai
npx expo start

# iOS simulator
npx expo start --ios

# Type check
npx tsc --noEmit

# Install new package
npx expo install <package-name>

# Build for iOS
npx eas build --platform ios
```

---

## Coordination Between Instances

Each instance should:
1. Work only in their assigned zone directories
2. Create placeholder imports for cross-zone dependencies
3. Use TypeScript interfaces for shared types
4. Comment `// TODO: Integrate with Zone X` for cross-dependencies
5. Check `doughy-ai/src/types/` for shared type definitions

**Shared Types File:** Create types in `src/types/index.ts` that all zones can import.

---

## Getting Started Command for Each Instance

```
I am Instance [1-4], working on Zone [A-D].

My task is to convert the Doughy AI web app to React Native.

Source files: /Users/dinosaur/Documents/doughy-ai-web-backup
Target project: /Users/dinosaur/Documents/doughy-ai

I will read CONVERSION_INSTRUCTIONS.md for guidance and work only on my assigned directories.

My zone: [ZONE LETTER]
My directories: [LIST FROM ABOVE]

I will:
1. Read source files from the backup
2. Convert to React Native following the guide
3. Write converted files to the target project
4. Skip files that depend on other zones (mark with TODO)
```
