# New Developer Guide

**Last Updated**: 2026-01-30
**Status**: Active Reference

Welcome to Doughy! This guide will help you get up to speed quickly.

---

## Table of Contents

1. [First Day Setup](#first-day-setup)
2. [Key Files to Understand](#key-files-to-understand)
3. [Before Writing Code](#before-writing-code)
4. [Development Workflow](#development-workflow)
5. [Code Review Checklist](#code-review-checklist)
6. [Common Gotchas](#common-gotchas)
7. [Getting Help](#getting-help)

---

## First Day Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repo-url>
cd doughy-app-mobile

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values
# Required:
#   EXPO_PUBLIC_SUPABASE_URL=<your-supabase-url>
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Start Development Server

```bash
# Start Expo dev server
npx expo start

# Or run on specific platform
npx expo run:ios      # iOS Simulator
npx expo run:android  # Android Emulator
npx expo start --web  # Web browser
```

### 4. Read Key Documentation

Spend your first few hours reading:

1. **This guide** (you're here!)
2. [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System structure
3. [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Code standards
4. [CODE_NAMING_CONVENTIONS.md](./CODE_NAMING_CONVENTIONS.md) - Naming rules

### 5. Explore the Codebase

```bash
# Get a feel for the structure
ls -la src/
ls -la src/features/
ls -la app/

# Find the largest files (these are refactoring targets)
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n | tail -20
```

---

## Key Files to Understand

Read these files to understand how the app works:

### Core Infrastructure

| File | Purpose | Priority |
|------|---------|----------|
| `src/lib/supabase.ts` | Database client configuration | High |
| `src/contexts/AuthContext.tsx` | Authentication flow | High |
| `src/contexts/PlatformContext.tsx` | Platform switching (Investor/Landlord) | High |
| `src/stores/index.ts` | All Zustand stores | High |
| `app/(tabs)/_layout.tsx` | Main tab navigation | Medium |

### Feature Example

Pick one feature to study in depth:

```
src/features/deals/
├── components/          # UI components
├── hooks/               # Data fetching hooks
├── screens/             # Screen components
├── services/            # Business logic
└── types/               # TypeScript types
```

### Configuration

| File | Purpose |
|------|---------|
| `app.config.ts` | Expo configuration |
| `tsconfig.json` | TypeScript configuration |
| `package.json` | Dependencies and scripts |

---

## Before Writing Code

### 1. Check if Similar Code Exists

Before writing new code, search for existing patterns:

```bash
# Search for similar components
grep -r "LeadCard" src/

# Search for similar hooks
grep -r "useLeads" src/

# Search for similar utilities
grep -r "formatCurrency" src/
```

### 2. Find the Right Location

| Type | Location | Naming |
|------|----------|--------|
| Screen | `app/(tabs)/<route>/` | `index.tsx`, `[id].tsx` |
| Feature component | `src/features/<feature>/components/` | `PascalCase.tsx` |
| Shared component | `src/components/ui/` | `PascalCase.tsx` |
| Feature hook | `src/features/<feature>/hooks/` | `use<Action>.ts` |
| Shared hook | `src/hooks/` | `use<Action>.ts` |
| Store | `src/stores/` | `<domain>-store.ts` |
| Types | `src/features/<feature>/types/` | `index.ts` |

### 3. Review Relevant Standards

- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - File size limits, naming
- [CODE_NAMING_CONVENTIONS.md](./CODE_NAMING_CONVENTIONS.md) - Naming patterns
- [CLEAN_CODE_PRACTICES.md](./CLEAN_CODE_PRACTICES.md) - Code quality

### 4. Understand the Data Flow

```
Screen → Hook → Store/Supabase → Database
```

Trace existing features to understand the pattern before adding new ones.

---

## Development Workflow

### Branch Naming

```
feature/add-deal-analytics
bugfix/lead-list-crash
refactor/split-large-store
docs/update-architecture
```

### Commit Messages

```
feat(deals): add ROI calculator to deal detail screen
fix(leads): prevent crash when lead has no address
refactor(stores): split conversations store by action type
docs: update architecture overview
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --testPathPattern="useDeals"

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Type Checking

```bash
# Check TypeScript compilation
npx tsc --noEmit
```

---

## Code Review Checklist

Before submitting a PR, verify:

### File Quality
- [ ] No files exceed 500 lines (300 for components)
- [ ] No duplicated code (> 3 occurrences)
- [ ] Imports are organized (external → internal → relative)

### Naming
- [ ] Types use domain prefixes where needed
- [ ] Functions describe WHAT they do
- [ ] No abbreviations in public APIs

### Safety
- [ ] No hardcoded strings (use constants)
- [ ] Error handling exists for async operations
- [ ] No `any` types (use specific types)
- [ ] No console.log in production code

### Testing
- [ ] Tests added for new logic
- [ ] Existing tests still pass
- [ ] Edge cases covered

### Documentation
- [ ] Complex logic has comments explaining WHY
- [ ] Public APIs have JSDoc (if exported)

---

## Common Gotchas

### 1. Expo Router Uses File-Based Routing

```
app/(tabs)/deals/index.tsx  → /deals
app/(tabs)/deals/[id].tsx   → /deals/123
app/(tabs)/deals/new.tsx    → /deals/new
```

Don't create components in `app/` - only route files!

### 2. Supabase RLS Requires Authentication

All database operations require an authenticated user. If queries return empty:

```typescript
// Check if user is authenticated
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // User not logged in - RLS will block all queries
}
```

### 3. Zustand Stores Persist to AsyncStorage

State persists across app restarts. Clear storage during development:

```typescript
// In development, you can clear persisted state
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.clear();
```

### 4. Use `@/` Alias for Imports

```typescript
// Good
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

// Avoid
import { Button } from '../../../components/ui';
```

### 5. Platform-Specific Code

Some code only runs on specific platforms:

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific code
}

// Or use platform-specific files
// Component.tsx       - default
// Component.ios.tsx   - iOS override
// Component.web.tsx   - Web override
```

### 6. Selectors Prevent Re-renders

```typescript
// Bad - re-renders on any store change
const { leads, isLoading } = useLeadsStore();

// Good - only re-renders when selected values change
const leads = useLeadsStore(selectLeads);
const isLoading = useLeadsStore(selectIsLoading);
```

### 7. Edge Functions Need CORS

All edge functions must include CORS headers:

```typescript
import { corsHeaders } from '../_shared/cors.ts';

// In your handler
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
```

---

## Getting Help

### Documentation

| Topic | Document |
|-------|----------|
| Architecture | [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) |
| Code standards | [CODING_STANDARDS.md](./CODING_STANDARDS.md) |
| Naming | [CODE_NAMING_CONVENTIONS.md](./CODE_NAMING_CONVENTIONS.md) |
| Clean code | [CLEAN_CODE_PRACTICES.md](./CLEAN_CODE_PRACTICES.md) |
| Database | [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) |
| Security | [RLS_SECURITY_MODEL.md](./RLS_SECURITY_MODEL.md) |
| Troubleshooting | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |

### Useful Commands

```bash
# Search the codebase
grep -r "searchTerm" src/

# Find files by name
find src -name "*Lead*"

# Check file line counts
wc -l src/features/deals/hooks/useDeals.ts

# List recent commits
git log --oneline -20

# See what changed in a file
git log -p --follow src/stores/leads-store.ts
```

### When Stuck

1. Search the codebase for similar patterns
2. Check the documentation links above
3. Read the tests for the feature you're working on
4. Ask a team member

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                    DOUGHY QUICK REF                     │
├─────────────────────────────────────────────────────────┤
│ Start dev server:     npx expo start                    │
│ Run tests:            npm test                          │
│ Type check:           npx tsc --noEmit                  │
├─────────────────────────────────────────────────────────┤
│ Max file lines:       500 (300 for components)          │
│ Import alias:         @/                                │
│ Store pattern:        Use selectors, not destructuring  │
├─────────────────────────────────────────────────────────┤
│ Feature location:     src/features/<feature>/           │
│ Screen location:      app/(tabs)/<route>/               │
│ Shared components:    src/components/ui/                │
├─────────────────────────────────────────────────────────┤
│ Database client:      src/lib/supabase.ts               │
│ Auth context:         src/contexts/AuthContext.tsx      │
│ Platform context:     src/contexts/PlatformContext.tsx  │
└─────────────────────────────────────────────────────────┘
```

---

## Related Documentation

- [DEVELOPER_QUICKSTART.md](./DEVELOPER_QUICKSTART.md) - Additional setup details
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - Coding standards
- [TECH_DEBT_GUIDE.md](./TECH_DEBT_GUIDE.md) - Managing technical debt
