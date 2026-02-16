# Doughy Coding Standards

**Last Updated**: 2026-01-30
**Status**: Active Standard

This document defines the coding standards for the doughy-app codebase. These standards ensure consistency, maintainability, and efficient collaboration for both human developers and AI assistants.

---

## Table of Contents

1. [File Size Limits](#file-size-limits)
2. [Naming Conventions](#naming-conventions)
3. [Self-Documenting Code](#self-documenting-code)
4. [Module Structure](#module-structure)
5. [When to Split a File](#when-to-split-a-file)
6. [Import Organization](#import-organization)
7. [Error Handling](#error-handling)
8. [Testing Standards](#testing-standards)

---

## File Size Limits

Keeping files small improves readability, testability, and AI context efficiency.

| File Type | Max Lines | Recommended |
|-----------|-----------|-------------|
| **Non-generated files** | 500 | 300-400 |
| **React components** | 300 | 150-200 |
| **Hooks** | 200 | 100-150 |
| **Utility files** | 300 | 150-200 |
| **Store files** | 400 | 250-300 |
| **Test files** | 500 | 300-400 |

**If approaching the limit, split by responsibility.** See [When to Split a File](#when-to-split-a-file).

### Exceptions

- Auto-generated files (e.g., `types/generated.ts`, `supabase.ts`)
- Data files with large constant arrays (e.g., `documentation-content.ts`)
- Migration files

---

## Naming Conventions

For detailed naming conventions, see [CODE_NAMING_CONVENTIONS.md](./CODE_NAMING_CONVENTIONS.md).

### Quick Reference

| File Type | Convention | Example |
|-----------|------------|---------|
| **Components** | PascalCase | `LeadCard.tsx` |
| **Screens** | PascalCase + Screen | `LeadsListScreen.tsx` |
| **Hooks** | camelCase with `use` prefix | `useLeads.ts`, `useDealQueries.ts` |
| **Stores** | kebab-case with `-store` suffix | `rental-conversations-store.ts` |
| **Services** | kebab-case | `api-key-health-service.ts` |
| **Utilities** | kebab-case | `design-utils.ts` |
| **Contexts** | PascalCase + Context | `ThemeContext.tsx` |

### Types

- Domain-prefixed types prevent collisions: `InvestorLead`, `LandlordConversation`
- Store selectors use `select` prefix: `selectLeads`, `selectIsLoading`
- Boolean variables use `is`/`has`/`can` prefix: `isLoading`, `hasError`

---

## Self-Documenting Code

Code should be readable without excessive comments.

### Function Names

Names should describe **WHAT** + **WHY**, not HOW:

```typescript
// Bad - describes HOW
function loopThroughUsersAndFilter(users: User[]) { }

// Good - describes WHAT
function getActiveUsers(users: User[]): User[] { }

// Bad - vague
function processData(data: any) { }

// Good - specific
function calculateDealROI(deal: Deal): number { }
```

### No Abbreviations in Public APIs

```typescript
// Bad
function getProp(id: string) { }
function calcARV(comps: Comp[]) { }
const usrData = fetchUser();

// Good
function getProperty(propertyId: string) { }
function calculateAfterRepairValue(comps: Comparable[]): number { }
const userData = fetchUser();
```

### Constants Over Magic Numbers

```typescript
// Bad
if (retries > 3) { }
const delay = 5000;

// Good
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;

if (retries > MAX_RETRY_ATTEMPTS) { }
const delay = RETRY_DELAY_MS;
```

### Type Names Express Business Domain

```typescript
// Bad - generic
interface Data { }
type Item = { };
type Response = { };

// Good - domain-specific
interface DealMetrics { }
type PropertyListing = { };
type AIResponseDraft = { };
```

---

## Module Structure

### Index Files

`index.ts` files re-export the **public API only**. Internal helpers stay in separate files.

```typescript
// src/features/deals/hooks/index.ts
export { useDeals } from './useDeals';
export { useDealQueries } from './useDealQueries';
export { useDealMutations } from './useDealMutations';

// Don't export internal utilities
// import { formatDealDate } from './utils'; // Not exported
```

### One Concept Per File

Each file should have a single, clear responsibility:

```
// Bad - mixed concerns
dealHelpers.ts  // Contains formatting, validation, API calls, constants

// Good - separated concerns
deal-formatters.ts      // Date/currency formatting
deal-validators.ts      // Validation logic
deal-api.ts             // API calls
deal-constants.ts       // Constants
```

### Feature Folder Structure

```
src/features/<feature>/
├── components/           # Feature-specific components
│   ├── FeatureCard.tsx
│   └── FeatureList.tsx
├── hooks/                # Feature-specific hooks
│   ├── useFeatureQueries.ts
│   └── useFeatureMutations.ts
├── screens/              # Feature screens
│   └── FeatureScreen.tsx
├── services/             # Business logic
│   └── feature-service.ts
├── types/                # Feature types
│   └── index.ts
└── index.ts              # Public API exports
```

---

## When to Split a File

Split a file when ANY of these apply:

### 1. Multiple Unrelated Responsibilities

```typescript
// Before: dealHelpers.ts (500 lines)
// - Deal formatting (100 lines)
// - Deal validation (150 lines)
// - Deal API calls (250 lines)

// After: Split into 3 files
// deal-formatters.ts (100 lines)
// deal-validators.ts (150 lines)
// deal-api.ts (250 lines)
```

### 2. Hard to Name the File

If you struggle to name a file or use vague names like `helpers.ts` or `utils.ts`, it likely contains mixed concerns.

### 3. Scrolling to Find Code

If you frequently scroll to find specific functions, the file is too large.

### 4. Tests Are Hard to Write

Large files with many dependencies are difficult to test. Smaller, focused modules are easier to mock and test in isolation.

### 5. Approaching Line Limits

When a file reaches 80% of its type limit, proactively split it.

---

## Import Organization

Organize imports in this order, separated by blank lines:

```typescript
// 1. External packages
import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';

// 2. Internal aliases (@/)
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card } from '@/components/ui';

// 3. Relative imports (same feature)
import { useDealQueries } from '../hooks';
import { DealCard } from './DealCard';

// 4. Types (if separate)
import type { Deal, DealStatus } from '../types';
```

---

## Error Handling

### Handle Errors at Boundaries

```typescript
// Screen/component level - show user feedback
try {
  await createDeal(dealData);
  showToast({ type: 'success', message: 'Deal created' });
} catch (error) {
  logError('createDeal', error, { dealData });
  showToast({ type: 'error', message: 'Failed to create deal' });
}
```

### Log with Context

```typescript
// Bad - no context
console.error(error);

// Good - with context
logError('fetchLeads', error, {
  userId: currentUser.id,
  filters: appliedFilters,
  page: currentPage,
});
```

### Never Swallow Errors Silently

```typescript
// Bad - silent failure
try {
  await saveData();
} catch (e) {
  // Nothing happens
}

// Good - at minimum, log
try {
  await saveData();
} catch (error) {
  logError('saveData', error);
  // Optionally re-throw or handle gracefully
}
```

---

## Testing Standards

### Test File Location

Tests live next to the code they test:

```
src/features/deals/hooks/
├── useDeals.ts
├── useDeals.test.ts      # Unit test
├── useDealQueries.ts
└── useDealQueries.test.ts
```

Or in `__tests__` folder for larger test suites:

```
src/features/deals/
├── hooks/
├── __tests__/
│   ├── useDeals.test.ts
│   └── integration.test.ts
```

### Test Naming

```typescript
describe('useDeals', () => {
  describe('fetchDeals', () => {
    it('returns deals for the current user', async () => { });
    it('handles empty results gracefully', async () => { });
    it('throws on network error', async () => { });
  });
});
```

### Coverage Expectations

- **New code**: 80%+ coverage
- **Critical paths** (auth, payments): 95%+ coverage
- **UI components**: Snapshot + interaction tests

---

## Quick Checklist

Before committing, verify:

- [ ] No files exceed their type limit
- [ ] Types use domain-specific prefixes where needed
- [ ] No hardcoded strings (use constants)
- [ ] Error handling exists for async operations
- [ ] Tests added for new logic
- [ ] Imports are organized correctly
- [ ] Function/variable names are self-documenting

---

## Related Documentation

- [CODE_NAMING_CONVENTIONS.md](./CODE_NAMING_CONVENTIONS.md) - Detailed naming rules
- [TECH_DEBT_GUIDE.md](./TECH_DEBT_GUIDE.md) - Managing technical debt
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System structure
- [CLEAN_CODE_PRACTICES.md](./CLEAN_CODE_PRACTICES.md) - Code quality patterns
