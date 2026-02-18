# Project Folder Structure

> Feature-first architecture for scalable React Native + Expo development.

## Overview

This project uses a **feature-oriented architecture** where each feature is self-contained with its screens, components, API calls, and state management. This approach promotes:

- **Feature isolation** - Changes in one feature don't affect others
- **Better scalability** - Easy to add/remove features
- **Improved maintainability** - Related code lives together
- **Team collaboration** - Multiple developers can work on different features

## Directory Layout

```
mobile-app-blueprint/
├── src/
│   ├── components/       # Shared UI components
│   │   ├── shared/       # Base components (Button, Input, Card)
│   │   └── index.ts      # Barrel export
│   ├── contexts/         # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── index.ts
│   ├── hooks/            # Custom React hooks
│   │   ├── useDebounce.ts
│   │   ├── useAsyncStorage.ts
│   │   └── index.ts
│   ├── screens/          # Screen components (one per route)
│   │   ├── home-screen.tsx
│   │   ├── settings-screen.tsx
│   │   └── [feature]/
│   │       ├── feature-screen.tsx
│   │       ├── components/    # Feature-specific components
│   │       ├── api.ts         # Feature API calls
│   │       └── use-feature-store.tsx
│   ├── services/         # Business logic and API calls
│   │   ├── supabase.ts
│   │   ├── storage.ts
│   │   └── aiClient.ts
│   ├── types/            # TypeScript types
│   │   ├── database.ts
│   │   ├── api.ts
│   │   └── index.ts      # Re-export all types
│   ├── utils/            # Pure utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── index.ts
│   └── theme/            # Design tokens and theming
│       ├── tokens.ts
│       ├── colors.ts
│       └── index.ts
├── app/                  # Expo Router pages
│   ├── (tabs)/           # Tab navigation group
│   ├── (auth)/           # Auth screens group
│   └── _layout.tsx       # Root layout
├── assets/               # Static assets (images, fonts)
├── docs/                 # Documentation
├── templates/            # Config file templates
└── __tests__/            # Test files
```

## Feature-First vs Layer-First

### Why Feature-First?

| Approach | Pros | Cons |
|----------|------|------|
| **Feature-First** (our choice) | Related code together, easy to delete features, parallel development | Potential duplication between features |
| Layer-First | Clear separation of concerns | Jumping between folders, hard to remove features |

### Feature Folder Pattern

Each feature follows this structure:

```
src/screens/tasks/
├── tasks-screen.tsx       # Main screen
├── task-detail-screen.tsx # Detail screen
├── components/            # Feature-specific components
│   ├── TaskCard.tsx
│   ├── TaskList.tsx
│   └── index.ts
├── api.ts                 # API calls with React Query
├── use-task-store.tsx     # Zustand store for feature state
└── types.ts               # Feature-specific types (if needed)
```

## Directory Descriptions

### src/components/

Shared UI components used across multiple features.

```typescript
// src/components/shared/Button.tsx
export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  // Implementation
}

// src/components/index.ts
export { Button } from './shared/Button';
export { Input } from './shared/Input';
export { Card } from './shared/Card';
```

**Rules:**
- Maximum 200 lines per component (target 150)
- Named exports only
- Storybook stories for complex components

### src/contexts/

React Context providers for truly global state (auth, theme, user preferences).

```typescript
// src/contexts/AuthContext.tsx
export function AuthProvider({ children }: PropsWithChildren) {
  // Auth state management
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Rules:**
- Only for app-wide state
- Always export custom hook (useAuth, useTheme)
- Include error boundary for missing provider

### src/hooks/

Custom React hooks for reusable stateful logic.

```typescript
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  // Debounce implementation
}
```

**Naming:** Always prefix with `use` (useDebounce, useAsyncStorage)

### src/screens/

Screen components, one per route. Use Expo Router's file-based routing.

**Naming:** Suffix with `-screen.tsx` for clarity:
- `home-screen.tsx`
- `settings-screen.tsx`
- `task-detail-screen.tsx`

### src/services/

Business logic, API clients, and external service integrations.

```typescript
// src/services/supabase.ts
export const supabase = createClient(url, anonKey);

// src/services/aiClient.ts
export async function generateSuggestion(prompt: string): Promise<string> {
  // AI API call
}
```

**Rules:**
- No React dependencies (pure TypeScript)
- Can be used in contexts, hooks, or directly

### src/types/

TypeScript types and interfaces. Always export from `index.ts`.

```typescript
// src/types/database.ts
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  user_id: string;
  created_at: string;
}

// src/types/index.ts
export * from './database';
export * from './api';
```

### src/utils/

Pure utility functions with no side effects.

```typescript
// src/utils/formatters.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}
```

**Rules:**
- Must be pure functions (same input = same output)
- No async operations
- No external dependencies (except date libraries)

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TaskCard.tsx` |
| Screens | kebab-case + `-screen` | `task-detail-screen.tsx` |
| Hooks | camelCase + `use` prefix | `useTaskOperations.ts` |
| Services | camelCase | `storage.ts`, `aiClient.ts` |
| Types | PascalCase interfaces | `types/index.ts` |
| Utils | camelCase | `formatters.ts` |
| Stores | camelCase + `use-*-store` | `use-task-store.tsx` |
| Contexts | PascalCase + `Context` | `AuthContext.tsx` |

## Import Aliases

Configure path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/theme/*": ["src/theme/*"]
    }
  }
}
```

Usage:

```typescript
// Instead of
import { Button } from '../../../components/Button';

// Use
import { Button } from '@/components';
```

## Barrel Exports

Every directory should have an `index.ts` that re-exports public API:

```typescript
// src/components/index.ts
export { Button } from './shared/Button';
export { Input } from './shared/Input';
export { Card } from './shared/Card';

// src/hooks/index.ts
export { useDebounce } from './useDebounce';
export { useAsyncStorage } from './useAsyncStorage';
```

**Benefits:**
- Clean imports
- Easy refactoring
- Control what's public vs internal

## Checklist

- [ ] All components under 200 lines (target 150)
- [ ] Types exported from `types/index.ts`
- [ ] Hooks prefixed with `use`
- [ ] Screen files use `-screen.tsx` suffix
- [ ] Feature folders are self-contained
- [ ] Barrel exports in each directory
- [ ] Path aliases configured and used
- [ ] No circular dependencies

## Related Docs

- [Component Guidelines](../02-coding-standards/COMPONENT-GUIDELINES.md)
- [Hook Conventions](../02-coding-standards/HOOK-CONVENTIONS.md)
- [State Management](./STATE-MANAGEMENT.md)
