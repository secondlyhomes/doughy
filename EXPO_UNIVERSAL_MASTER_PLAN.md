# Expo Universal Migration - Master Plan

## Project Overview

**Goal:** Combine `doughy-ai` (React + Vite web app) and `doughy-ai` (Expo mobile app) into a **single Expo Universal codebase** that deploys to iOS, Android, and Web from one source.

**Source Web App:** `/Users/dinosaur/Documents/doughy-ai-vite-old` (172,255 LOC, 788 files)
**Target Universal App:** `/Users/dinosaur/Documents/doughy-ai`

---

## Why Expo Universal?

| Before (Two Codebases) | After (One Codebase) |
|------------------------|----------------------|
| 172K LOC web + 19K LOC mobile | ~100K LOC total |
| Fix bugs twice | Fix once, deploy everywhere |
| Separate UI components | Shared component library |
| Different state management | Unified stores |
| Separate deployments | Single CI/CD pipeline |
| 2x maintenance cost | 1x maintenance cost |

---

## Architecture Overview

```
doughy-ai/                    # Expo Universal Project
├── src/
│   ├── components/
│   │   └── ui/                      # ZONE A: Universal UI components
│   │       ├── Button.tsx           # Works on iOS, Android, Web
│   │       ├── Card.tsx
│   │       ├── Dialog.tsx
│   │       └── ...                  # 67 total components
│   │
│   ├── features/
│   │   ├── auth/                    # ZONE B: Authentication
│   │   ├── admin/                   # ZONE B: Admin panel
│   │   ├── settings/                # ZONE B: Settings
│   │   ├── billing/                 # ZONE B: Billing/Stripe
│   │   ├── teams/                   # ZONE B: Team management
│   │   │
│   │   ├── real-estate/             # ZONE C: Property management
│   │   │
│   │   ├── dashboard/               # ZONE D: Dashboard
│   │   ├── leads/                   # ZONE D: Lead management
│   │   ├── conversations/           # ZONE D: AI chat
│   │   ├── analytics/               # ZONE D: Analytics
│   │   └── assistant/               # ZONE D: AI assistant
│   │
│   ├── lib/                         # Shared utilities
│   │   ├── supabase.ts              # Database client
│   │   └── utils.ts                 # Helper functions
│   │
│   ├── store/                       # Zustand stores
│   ├── hooks/                       # Shared hooks
│   ├── types/                       # TypeScript types
│   └── routes/                      # Navigation
│
├── assets/                          # Images, fonts
├── app.json                         # Expo config
├── tailwind.config.js               # NativeWind config
└── package.json
```

---

## Zone Assignments

| Zone | Owner | Scope | Priority |
|------|-------|-------|----------|
| **A** | Instance 1 | UI Components, Theme System, Shared Packages | CRITICAL (must go first) |
| **B** | Instance 2 | Auth, Admin, Settings, Billing, Teams | HIGH |
| **C** | Instance 3 | Real Estate (Properties, Comps, Analysis) | HIGH |
| **D** | Instance 4 | Dashboard, Leads, Conversations, Analytics | HIGH |

---

## Execution Order

### Phase 1: Foundation (Zone A leads)

**Zone A must complete first:**
1. Core UI components (Button, Input, Card, Dialog, Select)
2. Theme system (colors, dark mode)
3. Shared hooks and utilities
4. Export index files for other zones

**Zones B, C, D can start in parallel on:**
- Business logic (hooks, services)
- Type definitions
- Non-UI code

### Phase 2: Feature Implementation (All zones parallel)

Once Zone A delivers core components:
- Zone B: Complete auth flows, admin screens
- Zone C: Complete property management
- Zone D: Complete dashboard, leads, chat

### Phase 3: Integration & Polish

- Cross-feature integration
- Testing on all platforms
- Performance optimization
- Bug fixes

---

## Technology Stack

### Core
- **Framework:** Expo SDK 54 (React Native 0.81, React 19.1)
- **Styling:** NativeWind 4.2 (Tailwind for React Native)
- **State:** Zustand 5
- **Data:** TanStack Query 5 + Supabase
- **Navigation:** React Navigation 7

### Platform Targets
- **iOS:** Native app via Expo
- **Android:** Native app via Expo
- **Web:** React Native Web via Expo

---

## Key Conversion Rules

### Element Mapping
```tsx
// Web (React DOM)          →  React Native
<div>                       →  <View>
<span>, <p>, <h1-h6>       →  <Text>
<button>                    →  <Pressable> or <TouchableOpacity>
<input type="text">         →  <TextInput>
<img>                       →  <Image>
<a href>                    →  <Pressable> + navigation
<ul>, <ol>                  →  <FlatList> or <ScrollView>
<table>                     →  <FlatList> with custom rows
<form>                      →  <View> (no form element)
```

### Event Handler Mapping
```tsx
// Web                      →  React Native
onClick                     →  onPress
onChange={(e) => e.target.value}  →  onChangeText={(text) => text}
onSubmit                    →  Handle via button onPress
onMouseEnter/Leave          →  Not supported (use Pressable states)
```

### Styling with NativeWind
```tsx
// Web Tailwind             →  NativeWind
<div className="flex">      →  <View className="flex-row">  // RN defaults to column
<div className="grid">      →  <View className="flex-wrap"> // No CSS grid
hover:bg-gray-100           →  Use Pressable with style function
<div className="gap-4">     →  <View className="gap-4">  // Works in RN!
```

### Navigation
```tsx
// Web (react-router)       →  React Native (react-navigation)
useNavigate()               →  useNavigation()
useParams()                 →  useRoute().params
<Link to="/path">           →  <Pressable onPress={() => navigation.navigate('Screen')}>
navigate('/path')           →  navigation.navigate('Screen')
```

---

## Shared Resources (All Zones Use)

### Supabase Client
```tsx
import { supabase } from '@/lib/supabase';
```

### Type Definitions
```tsx
import { Property, Lead, User } from '@/types';
```

### UI Components (after Zone A delivers)
```tsx
import {
  Button, Card, Input, Dialog, Select,
  Toast, Badge, Avatar, Tabs
} from '@/components/ui';
```

### Hooks
```tsx
import { useAuth } from '@/features/auth/hooks';
import { useDebounce, useRefresh } from '@/hooks';
```

### Utilities
```tsx
import { formatCurrency, formatDate, cn } from '@/lib/utils';
```

---

## Cross-Zone Dependencies

```
Zone A (UI Components)
   ↓ exports components
   ├─→ Zone B (Auth/Admin)
   ├─→ Zone C (Real Estate)
   └─→ Zone D (Dashboard/Leads)

Zone B (Auth)
   ↓ exports useAuth, usePermissions
   ├─→ Zone C (role-gated features)
   └─→ Zone D (role-gated features)
```

### Handling Dependencies

If you need something from another zone that isn't ready yet:

1. **Create a placeholder:**
```tsx
// TODO: Replace with Zone A component when ready
const TempButton = ({ children, onPress }) => (
  <Pressable onPress={onPress}>
    <Text>{children}</Text>
  </Pressable>
);
```

2. **Document the dependency:**
```tsx
// DEPENDS ON: Zone A - Button, Card, Dialog
// DEPENDS ON: Zone B - useAuth hook
```

3. **Continue with your implementation**

4. **Replace when available**

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Screens | `*Screen.tsx` | `PropertyListScreen.tsx` |
| Components | `PascalCase.tsx` | `PropertyCard.tsx` |
| Hooks | `use*.ts` | `useProperties.ts` |
| Services | `*Service.ts` | `propertyService.ts` |
| Stores | `*Store.ts` | `propertyStore.ts` |
| Types | `index.ts` or domain | `types/property.ts` |
| Platform-specific | `*.web.tsx`, `*.native.tsx` | `Map.web.tsx` |

---

## Platform-Specific Code

When behavior differs by platform:

### Option 1: Platform Extension Files
```
PropertyMap.tsx         # Shared logic/fallback
PropertyMap.web.tsx     # Web-specific (Leaflet)
PropertyMap.native.tsx  # Native-specific (react-native-maps)
```

### Option 2: Platform.select()
```tsx
import { Platform } from 'react-native';

const styles = {
  container: Platform.select({
    ios: { paddingTop: 44 },
    android: { paddingTop: 0 },
    web: { paddingTop: 0 },
  }),
};
```

### Option 3: Platform.OS Check
```tsx
if (Platform.OS === 'web') {
  // Web-specific code
} else {
  // Native-specific code
}
```

---

## Testing Commands

```bash
# Start development server
npx expo start

# Test on specific platform
npx expo start --web        # Web browser
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator

# Type checking
npx tsc --noEmit

# Build for production
npx eas build --platform ios
npx eas build --platform android
npx expo export --platform web
```

---

## Documentation Protocol

### Before Starting Work

1. Read this master plan (`EXPO_UNIVERSAL_MASTER_PLAN.md`)
2. Read your zone document (`ZONE_[A-D]_STAGE3.md`)
3. Check the current status of dependencies

### During Work

1. Update your zone checklist as you complete items
2. Document any blockers or cross-zone dependencies
3. Add comments for any temporary implementations

### After Completing a Phase

1. Update your zone document status
2. Export components/hooks for other zones to use
3. Note any issues in the "Known Issues" section

---

## Known Issues Log

| Issue | Zone | Status | Notes |
|-------|------|--------|-------|
| (Add issues here) | | | |

---

## Communication Protocol

### Naming Pattern for TODOs
```tsx
// TODO(Zone-A): Need Button component with variants
// TODO(Zone-B): Need useAuth hook for role checking
// TODO(Zone-C): Need PropertyCard component
// FIXME: This is a temporary implementation
// BLOCKED: Waiting for Zone A Dialog component
```

### Status Updates
Update your zone document's status section when:
- Completing a phase
- Hitting a blocker
- Delivering shared components

---

## Success Criteria

### Per Zone
- [ ] All screens render on iOS, Android, and Web
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] No console errors/warnings
- [ ] Features match web app functionality
- [ ] Dark mode works (where applicable)

### Overall Project
- [ ] All 4 zones complete
- [ ] Cross-zone integration works
- [ ] App runs on all 3 platforms
- [ ] Performance is acceptable
- [ ] No critical bugs

---

## Quick Reference Commands

```bash
# Navigate to project
cd /Users/dinosaur/Documents/doughy-ai

# Install dependencies
npm install

# Start dev server
npx expo start

# Check types
npx tsc --noEmit

# Install new Expo-compatible package
npx expo install <package-name>

# Clear cache if issues
npx expo start --clear
```

---

## Instance Activation Commands

Copy-paste to activate each Claude instance:

### Instance 1 (Zone A)
```
You are Instance 1, the Zone A Lead for UI Components.

Read these files in order:
1. /Users/dinosaur/Documents/doughy-ai/EXPO_UNIVERSAL_MASTER_PLAN.md
2. /Users/dinosaur/Documents/doughy-ai/ZONE_A_STAGE3.md

Your job: Build the universal UI component library that all other zones depend on.
Priority: CRITICAL - other zones are blocked until you deliver core components.

Start with Phase 1 (Core Form Components).
Document your progress in ZONE_A_STAGE3.md.
```

### Instance 2 (Zone B)
```
You are Instance 2, the Zone B Lead for Auth & Admin.

Read these files in order:
1. /Users/dinosaur/Documents/doughy-ai/EXPO_UNIVERSAL_MASTER_PLAN.md
2. /Users/dinosaur/Documents/doughy-ai/ZONE_B_STAGE3.md

Your job: Complete all authentication, admin, settings, billing, and team features.

Start with Phase 1 (Complete Auth Flow).
Document your progress in ZONE_B_STAGE3.md.
```

### Instance 3 (Zone C)
```
You are Instance 3, the Zone C Lead for Real Estate.

Read these files in order:
1. /Users/dinosaur/Documents/doughy-ai/EXPO_UNIVERSAL_MASTER_PLAN.md
2. /Users/dinosaur/Documents/doughy-ai/ZONE_C_STAGE3.md

Your job: Implement all property management, comps, analysis, and financing features.

Start with Phase 1 (Property List & Detail).
Document your progress in ZONE_C_STAGE3.md.
```

### Instance 4 (Zone D)
```
You are Instance 4, the Zone D Lead for Dashboard & Leads.

Read these files in order:
1. /Users/dinosaur/Documents/doughy-ai/EXPO_UNIVERSAL_MASTER_PLAN.md
2. /Users/dinosaur/Documents/doughy-ai/ZONE_D_STAGE3.md

Your job: Implement dashboard, leads management, AI conversations, and analytics.

Start with Phase 1 (Dashboard).
Document your progress in ZONE_D_STAGE3.md.
```

---

## Estimated Timeline (4 Claude Instances in Parallel)

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | Days 1-3 | Core UI components, auth, basic screens |
| Phase 2: Features | Days 4-8 | All feature screens implemented |
| Phase 3: Integration | Days 9-10 | Cross-feature integration, polish |
| Phase 4: Testing | Days 11-12 | Platform testing, bug fixes |

**Total: 10-12 working days with 4 parallel instances**

---

*Last Updated: Stage 3 Migration Plan*
*Version: 3.0*
