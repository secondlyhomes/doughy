# ADR-002: State Management Approach

**Status:** Accepted
**Date:** 2026-02-05
**Deciders:** Project team

## Context

We need a state management solution that:
- Handles local UI state efficiently
- Shares state between components within features
- Manages global app state (auth, theme)
- Syncs with server state (Supabase)
- Supports offline persistence
- Has minimal boilerplate

## Decision

**We will use React Context for global state and Zustand for feature-level state.**

### State Hierarchy

| Layer | Tool | Scope |
|-------|------|-------|
| Component | `useState` | Single component |
| Feature | Zustand | Feature screens/components |
| Global | React Context | Entire app |
| Server | Supabase + subscriptions | Remote data |

## Consequences

### Positive

| Benefit | Description |
|---------|-------------|
| **Lightweight** | Zustand is ~1KB, no dependencies |
| **No boilerplate** | No reducers, action types, or dispatchers |
| **Easy persistence** | AsyncStorage middleware built-in |
| **TypeScript friendly** | Full type inference |
| **Selective subscriptions** | Components only re-render on subscribed state changes |
| **DevTools support** | Redux DevTools compatible |

### Negative

| Tradeoff | Mitigation |
|----------|------------|
| **Two patterns** | Clear guidelines on when to use each |
| **Less structure** | Feature folder conventions provide structure |
| **No time-travel debugging** | Zustand DevTools middleware for debugging |

## Alternatives Considered

### Redux Toolkit

**Pros:**
- Industry standard
- Excellent DevTools
- Time-travel debugging
- Large ecosystem

**Cons:**
- More boilerplate (slices, reducers, selectors)
- Heavier bundle size
- Steeper learning curve

**Why rejected:** Overkill for our app size. Benefits don't outweigh the added complexity.

### Zustand Only (No Context)

**Pros:**
- Single pattern
- Simpler mental model

**Cons:**
- Auth state requires special handling
- Theme state re-renders would be inefficient

**Why rejected:** Context is more appropriate for truly global, rarely-changing state like auth.

### MobX

**Pros:**
- Minimal boilerplate
- Automatic reactivity
- Class-based option

**Cons:**
- Implicit subscriptions harder to debug
- Proxies can be confusing
- Different mental model from React

**Why rejected:** Implicit reactivity makes debugging harder; team prefers explicit state updates.

### Jotai/Recoil

**Pros:**
- Atomic state model
- Fine-grained subscriptions

**Cons:**
- Newer, smaller community
- Atom proliferation can get messy
- Different paradigm

**Why rejected:** Zustand's store-based approach is more familiar and organized.

## Implementation Notes

### When to Use Context

```typescript
// Use Context for:
// - Auth state (user, session)
// - Theme (dark/light mode)
// - User preferences (language, notifications)
// - Feature flags

// src/contexts/AuthContext.tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // ...
}
```

### When to Use Zustand

```typescript
// Use Zustand for:
// - Feature-specific state (task list, filters)
// - Complex forms with multiple steps
// - Local data that needs persistence

// src/screens/tasks/use-task-store.tsx
export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      filter: 'all',
      // ...
    }),
    { name: 'task-storage' }
  )
);
```

### When to Use useState

```typescript
// Use useState for:
// - Form inputs before submission
// - UI state (modal open, loading)
// - Derived/computed values
// - Temporary state that doesn't persist

function TaskForm() {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
}
```

## Decision Tree

```
Is this state needed by multiple components?
├── No → useState
└── Yes → Is it truly global (auth, theme)?
    ├── Yes → React Context
    └── No → Is it within a single feature?
        ├── Yes → Zustand (feature store)
        └── No → Consider refactoring features or use Context
```

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Context Best Practices](https://react.dev/learn/passing-data-deeply-with-context)
- [State Management Comparison](https://leerob.io/blog/react-state-management)

## Related ADRs

- [ADR-001: Technology Stack](./ADR-001-TECH-STACK.md)

## Related Docs

- [State Management](./STATE-MANAGEMENT.md) - Detailed patterns
- [Hook Conventions](../02-coding-standards/HOOK-CONVENTIONS.md)
