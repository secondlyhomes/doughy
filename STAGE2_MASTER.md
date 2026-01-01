# Stage 2: Full Feature Implementation - Master Coordination

## Overview

Stage 1 created the React Native foundation with basic navigation and placeholder screens.
Stage 2 implements all features from the original web app.

---

## Zone Assignments

| Zone | Instance | Focus Area | Files to Convert | Priority |
|------|----------|------------|------------------|----------|
| A | Instance 1 | UI Components & Theme | 67 components | HIGH |
| B | Instance 2 | Auth, Admin, Settings | 144 files | HIGH |
| C | Instance 3 | Real Estate Features | 254 files | CRITICAL |
| D | Instance 4 | Dashboard, Leads, Chat | 157 files | CRITICAL |

---

## Execution Order

### Week 1: Foundation (Zones A + B)

**Zone A must deliver first:**
1. Core form components (Button, Input, Select, Checkbox)
2. Layout components (Dialog, Sheet, Card enhancements)
3. Feedback components (Toast, Alert, Loader)

**Zone B can start immediately on:**
1. Complete auth flow (verification, onboarding)
2. Profile management
3. Settings screens

### Week 2: Core Features (Zones C + D)

**Zone C (Real Estate):**
1. Property list with filters
2. Property detail view
3. Add/Edit property forms
4. Comps and analysis

**Zone D (Leads & Chat):**
1. Dashboard with real data
2. Leads list and detail
3. AI chat interface
4. Activity timeline

---

## How to Run Parallel Instances

### Instance Activation

Copy and paste to each Claude instance:

**Instance 1 (Zone A):**
```
You are Instance 1, working on ZONE A (UI Components).
Read: /Users/dinosaur/Documents/doughy-ai-mobile/ZONE_A_STAGE2.md
Source files: /Users/dinosaur/Documents/doughy-ai-web-backup/src/components/ui/
Target: /Users/dinosaur/Documents/doughy-ai-mobile/src/components/ui/

Your job: Convert all web UI components to React Native with NativeWind.
Start with Phase 1 (Core Form Components).
```

**Instance 2 (Zone B):**
```
You are Instance 2, working on ZONE B (Auth/Admin).
Read: /Users/dinosaur/Documents/doughy-ai-mobile/ZONE_B_STAGE2.md
Source files: /Users/dinosaur/Documents/doughy-ai-web-backup/src/features/auth/
Target: /Users/dinosaur/Documents/doughy-ai-mobile/src/features/

Your job: Complete all auth flows and admin features.
Start with Phase 1 (Complete Auth Flow).
```

**Instance 3 (Zone C):**
```
You are Instance 3, working on ZONE C (Real Estate).
Read: /Users/dinosaur/Documents/doughy-ai-mobile/ZONE_C_STAGE2.md
Source files: /Users/dinosaur/Documents/doughy-ai-web-backup/src/features/real-estate/
Target: /Users/dinosaur/Documents/doughy-ai-mobile/src/features/real-estate/

Your job: Implement all property management features.
Start with Phase 1 (Property List & Grid).
```

**Instance 4 (Zone D):**
```
You are Instance 4, working on ZONE D (Dashboard/Leads/Chat).
Read: /Users/dinosaur/Documents/doughy-ai-mobile/ZONE_D_STAGE2.md
Source files: /Users/dinosaur/Documents/doughy-ai-web-backup/src/features/
Target: /Users/dinosaur/Documents/doughy-ai-mobile/src/features/

Your job: Implement dashboard, leads, and conversation features.
Start with Phase 1 (Dashboard).
```

---

## Shared Dependencies

All zones should use these shared resources:

### From Zone A (UI Components)
```tsx
import { Button, Input, Card, Dialog, Toast } from '@/components/ui';
```

### From Zone B (Auth)
```tsx
import { useAuth, usePermissions } from '@/features/auth/hooks';
```

### Shared Utilities
```tsx
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/utils/formatters';
```

---

## Conversion Patterns

### Web to React Native

| Web | React Native |
|-----|--------------|
| `<div>` | `<View>` |
| `<span>`, `<p>` | `<Text>` |
| `<button>` | `<TouchableOpacity>` or `<Pressable>` |
| `<input>` | `<TextInput>` |
| `<img>` | `<Image>` |
| `onClick` | `onPress` |
| `className="..."` | `className="..."` (NativeWind) |
| `router.push()` | `navigation.navigate()` |
| `useRouter()` | `useNavigation()` |
| `<Link>` | `<TouchableOpacity onPress={() => navigate()}>` |

### State Management
- Web uses React Query + Zustand
- Mobile uses same: React Query + Zustand
- No changes needed for hooks using these

### API Calls
- Web uses Supabase client
- Mobile uses same Supabase client
- Minor adjustments for auth storage (AsyncStorage)

---

## Testing Each Zone

After implementing a phase, verify:

```bash
# TypeScript check
npx tsc --noEmit

# Start dev server
npx expo start --web

# Test on iOS simulator (if available)
npx expo start --ios

# Test on Android emulator (if available)
npx expo start --android
```

---

## File Structure After Stage 2

```
src/
├── components/
│   └── ui/                    # Zone A: 40+ components
├── features/
│   ├── auth/                  # Zone B
│   │   ├── screens/           # 5+ screens
│   │   ├── components/        # 10+ components
│   │   ├── hooks/             # 5+ hooks
│   │   └── services/          # 2+ services
│   ├── admin/                 # Zone B
│   │   ├── screens/           # 5+ screens
│   │   └── components/        # 10+ components
│   ├── settings/              # Zone B
│   │   └── screens/           # 5+ screens
│   ├── billing/               # Zone B
│   │   └── screens/           # 3+ screens
│   ├── real-estate/           # Zone C
│   │   ├── screens/           # 10+ screens
│   │   ├── components/        # 30+ components
│   │   ├── hooks/             # 10+ hooks
│   │   └── services/          # 5+ services
│   ├── dashboard/             # Zone D
│   │   ├── screens/           # 1 screen
│   │   └── components/        # 10+ components
│   ├── leads/                 # Zone D
│   │   ├── screens/           # 4+ screens
│   │   ├── components/        # 15+ components
│   │   └── hooks/             # 5+ hooks
│   └── conversations/         # Zone D
│       ├── screens/           # 2 screens
│       ├── components/        # 15+ components
│       └── hooks/             # 5+ hooks
├── lib/
│   └── supabase.ts            # Already done
├── routes/                    # Already done
├── store/                     # Zustand stores
└── utils/                     # Utility functions
```

---

## Completion Checklist

### Zone A
- [ ] All form components converted
- [ ] All layout components converted
- [ ] Theme system implemented
- [ ] Toast/notification system working

### Zone B
- [ ] Complete auth flow (signup → verify → onboard)
- [ ] Profile editing works
- [ ] Admin dashboard (role-gated)
- [ ] Settings all functional

### Zone C
- [ ] Property CRUD complete
- [ ] Property search & filters
- [ ] Comps & analysis working
- [ ] Maps displaying correctly

### Zone D
- [ ] Dashboard with real stats
- [ ] Leads CRUD complete
- [ ] AI chat functional
- [ ] Activity timelines working

---

## Estimated Effort

| Zone | Components | Screens | Hooks | Est. Time |
|------|------------|---------|-------|-----------|
| A | 40 | 0 | 0 | 2-3 days |
| B | 25 | 15 | 10 | 2-3 days |
| C | 35 | 12 | 12 | 3-4 days |
| D | 35 | 10 | 12 | 2-3 days |

**Total parallel time: 3-4 days with 4 instances**
**Total sequential time: 10-12 days with 1 instance**

---

## Communication Between Zones

If Zone C or D needs a UI component that Zone A hasn't delivered yet:

1. Create a temporary placeholder in your zone
2. Mark it with `// TODO: Replace with Zone A component`
3. Continue with your implementation
4. Replace when Zone A delivers

Example:
```tsx
// Temporary until Zone A delivers
const TempDialog = ({ children, open, onClose }) => (
  <Modal visible={open} onRequestClose={onClose}>
    {children}
  </Modal>
);

// TODO: Replace with Zone A component
// import { Dialog } from '@/components/ui';
```
