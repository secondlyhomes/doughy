# Feature Development Template

Use this template when planning new features.

---

## Feature: [Name]

**Status:** [ ] Planning | [ ] In Progress | [ ] Review | [ ] Done
**Created:** YYYY-MM-DD
**Author:** [Name]

---

## Problem Statement

What user problem does this feature solve?

> [Describe the problem in 2-3 sentences]

## Proposed Solution

How will we solve it?

> [High-level description of the solution]

## User Stories

- As a [user type], I want [action] so that [benefit]
- As a [user type], I want [action] so that [benefit]

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Design

### UI/UX

[Link to Figma/sketches or describe the interface]

### Data Model

```typescript
// New types needed
interface NewFeatureItem {
  id: string;
  // ...
}
```

### API Changes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/feature` | POST | Create item |
| `/api/feature/:id` | GET | Get item |

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/feature.ts` | CREATE | Type definitions |
| `src/services/feature.ts` | CREATE | API service |
| `src/hooks/useFeature.ts` | CREATE | React hook |
| `src/screens/FeatureScreen.tsx` | CREATE | Main screen |
| `src/types/index.ts` | MODIFY | Export new types |

## Dependencies

- [ ] Requires backend changes (describe)
- [ ] Requires new npm packages (list)
- [ ] Requires database migration

## Test Plan

### Unit Tests

- [ ] Service functions tested
- [ ] Hook behavior tested

### Integration Tests

- [ ] API endpoints tested
- [ ] Database operations tested

### Manual Tests

- [ ] Happy path works
- [ ] Error states handled
- [ ] Edge cases covered
- [ ] Works on iOS
- [ ] Works on Android

## Rollout Plan

1. **Development** - Implement behind feature flag
2. **Internal Testing** - Team tests on TestFlight
3. **Beta** - Release to beta users
4. **Production** - Full rollout

## Rollback Plan

If issues arise:

1. Disable feature flag
2. Revert specific commits if needed
3. Document what went wrong

## Progress Tracker

### Phase 1: Setup
- [ ] Create types
- [ ] Create service
- [ ] Create hook

### Phase 2: UI
- [ ] Create screen
- [ ] Add navigation
- [ ] Style components

### Phase 3: Testing
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual testing

### Phase 4: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility
- [ ] Performance

---

## Notes

[Any additional context, decisions made, or things to remember]

---

## Code Review

**Reviewer:** [Name]
**Date:** YYYY-MM-DD

- [ ] Code follows style guide
- [ ] Types are correct
- [ ] Tests are adequate
- [ ] No security issues
- [ ] Performance is acceptable
