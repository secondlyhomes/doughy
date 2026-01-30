# Code Naming Conventions

**Last Updated**: 2026-01-30
**Status**: Active Standard

This document defines the naming conventions for the doughy-ai codebase, based on 2025 industry best practices from React/React Native, TypeScript, and Expo communities.

---

## Table of Contents

1. [File Naming](#file-naming)
2. [Type Naming](#type-naming)
3. [Directory Structure](#directory-structure)
4. [Variables and Functions](#variables-and-functions)
5. [Examples](#examples)

---

## File Naming

### By File Type

| File Type | Convention | Example |
|-----------|------------|---------|
| **Components** | PascalCase | `LeadCard.tsx`, `PropertyDetail.tsx` |
| **Screens** | PascalCase + Screen suffix | `LeadsListScreen.tsx`, `DashboardScreen.tsx` |
| **Hooks** | camelCase with `use` prefix | `useLeads.ts`, `useRentalProperties.ts` |
| **Stores** | kebab-case with `-store` suffix | `rental-properties-store.ts`, `app-store.ts` |
| **Services** | kebab-case | `api-key-health-service.ts`, `property-importer.ts` |
| **Utilities** | kebab-case | `design-utils.ts`, `crypto-native.ts` |
| **Contexts** | PascalCase + Context suffix | `ThemeContext.tsx`, `PlatformContext.tsx` |
| **Types** | `index.ts` in types folder | `features/leads/types/index.ts` |
| **Tests** | Match source + `.test` | `useLeads.test.ts`, `LeadCard.test.tsx` |

### Rules

1. **No spaces or special characters** - Use hyphens for multi-word files
2. **File extension matches content** - `.tsx` for JSX, `.ts` for pure TypeScript
3. **Index files** - Use `index.ts` for barrel exports from folders

---

## Type Naming

### Domain-Prefixed Types

Types that exist in multiple domains should use domain-specific prefixes for clarity:

| Domain | Prefix | Example Types |
|--------|--------|---------------|
| **AI Assistant** | `Assistant` | `AssistantConversation`, `AssistantMessage` |
| **RE Investor** | `Investor` | `InvestorProperty`, `InvestorLead` |
| **Landlord** | `Landlord` | `LandlordConversation`, `LandlordMessage` |
| **Lead-related** | `Lead` | `LeadContact`, `LeadProperty` |
| **Database** | `DB` | `DBProperty`, `DBPropertyInsert` |

### When to Use Prefixes

**Use prefixes when:**
- The same concept exists in multiple domains (e.g., `Conversation` in both Assistant and Landlord)
- The type represents a domain-specific entity
- Clarity is needed to prevent import confusion

**Don't use prefixes when:**
- The type is truly generic and shared (`User`, `Session`, `ApiError`)
- The type is only used within one feature folder
- The prefix would be redundant with the file location

### Namespace Imports (Alternative)

For heavy type usage from a single domain, use namespace imports:

```typescript
// Instead of importing many prefixed types:
import { LandlordConversation, LandlordMessage, LandlordBooking } from '@/stores';

// Use namespace import:
import * as Landlord from '@/stores/rental-conversations-store';
// Then: Landlord.Conversation, Landlord.Message
```

### What NOT to Do

```typescript
// DON'T: Use I prefix for interfaces
interface IUser { }  // Bad

// DON'T: Use arbitrary prefixes
interface TProperty { }  // Bad

// DON'T: Have duplicate type names in global scope
// src/types/index.ts
export interface Lead { }  // Conflicts with...
// features/leads/types/index.ts
export interface Lead { }  // ...this!

// DO: Use domain-specific names
export interface InvestorLead { }  // Clear and non-conflicting
```

---

## Directory Structure

### Standard Directories

| Directory | Convention | Purpose |
|-----------|------------|---------|
| `/src/stores/` | **plural** | Zustand stores |
| `/src/contexts/` | **plural** | React contexts |
| `/src/hooks/` | **plural** | Shared hooks |
| `/src/components/` | **plural** | Shared components |
| `/src/features/` | **plural** | Feature modules |
| `/src/services/` | **plural** | Business logic services |
| `/src/lib/` | **singular** | Utility libraries |
| `/src/types/` | **plural** | Shared type definitions |

### Feature Folder Structure

```
src/features/leads/
├── components/          # Feature-specific components
│   ├── LeadCard.tsx
│   └── LeadForm.tsx
├── hooks/               # Feature-specific hooks
│   └── useLeads.ts
├── screens/             # Feature screens
│   ├── LeadsListScreen.tsx
│   └── LeadDetailScreen.tsx
├── services/            # Feature services (optional)
│   └── lead-service.ts
├── types/               # Feature types
│   └── index.ts
└── index.ts             # Barrel export
```

---

## Variables and Functions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Variables** | camelCase | `userData`, `isLoading` |
| **Constants** | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| **Functions** | camelCase | `fetchUserData()`, `handleSubmit()` |
| **React Components** | PascalCase | `UserProfile`, `LeadCard` |
| **Hooks** | camelCase with `use` prefix | `useAuth()`, `useLeads()` |
| **Event Handlers** | camelCase with `handle` prefix | `handleClick`, `handleSubmit` |
| **Boolean Variables** | camelCase with `is`/`has`/`can` prefix | `isLoading`, `hasError`, `canEdit` |

### Store Selectors

Store selectors should use `select` prefix:

```typescript
export const selectLeads = (state: LeadsState) => state.leads;
export const selectIsLoading = (state: LeadsState) => state.isLoading;
export const selectLeadById = (id: string) => (state: LeadsState) =>
  state.leads.find(l => l.id === id);
```

---

## Examples

### Correct Naming

```typescript
// File: src/features/leads/types/index.ts
export interface InvestorLead {
  id: string;
  name: string;
  status: LeadStatus;
}

export interface LeadContact {
  id: string;
  first_name: string;
  last_name: string;
}

// File: src/stores/rental-conversations-store.ts
export interface LandlordConversation {
  id: string;
  contact_id: string;
  channel: Channel;
}

export interface LandlordMessage {
  id: string;
  conversation_id: string;
  content: string;
}

// File: src/features/leads/hooks/useLeads.ts
export function useLeads() {
  const [isLoading, setIsLoading] = useState(false);
  // ...
}

// File: src/stores/app-store.ts (kebab-case)
export const useAppStore = create<AppState>()(...);
```

### Import Examples

```typescript
// Importing domain-specific types
import { InvestorLead, LeadContact } from '@/features/leads/types';
import { LandlordConversation, LandlordMessage } from '@/stores';
import { AssistantConversation, AssistantMessage } from '@/types';

// Using namespace import for heavy usage
import * as Landlord from '@/stores/rental-conversations-store';
const conversation: Landlord.Conversation = { ... };
```

---

## References

- [React Folder Structure 2025 - Robin Wieruch](https://www.robinwieruch.de/react-folder-structure/)
- [Expo App Folder Structure Best Practices](https://expo.dev/blog/expo-app-folder-structure-best-practices)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [TypeScript Style Guide - ts.dev](https://ts.dev/style/)
