# Tech Debt Management

**Last Updated**: 2026-01-30
**Status**: Active Standard

This guide defines how to identify, categorize, and address technical debt in the doughy-ai codebase.

---

## Table of Contents

1. [Identifying Tech Debt](#identifying-tech-debt)
2. [Debt Categories](#debt-categories)
3. [Refactoring Checklist](#refactoring-checklist)
4. [When NOT to Refactor](#when-not-to-refactor)
5. [Debt Documentation](#debt-documentation)
6. [Review Process](#review-process)

---

## Identifying Tech Debt

### Automatic Indicators

| Indicator | Threshold | Action |
|-----------|-----------|--------|
| Files > 500 lines | Any non-generated file | Split by responsibility |
| Files > 1000 lines | Any file | Immediate refactor |
| Duplicated logic | > 3 occurrences | Extract shared utility |
| TODO comments | > 30 days old | Address or remove |
| Functions with > 5 params | Any occurrence | Use options object |
| Nested callbacks | > 2 levels deep | Refactor to async/await |
| Cyclomatic complexity | > 10 | Split into smaller functions |

### Code Smell Checklist

- [ ] **Large files** - Hard to navigate and understand
- [ ] **Long functions** - > 50 lines likely doing too much
- [ ] **Deep nesting** - > 3 levels of if/for/try blocks
- [ ] **Magic numbers** - Unexplained numeric constants
- [ ] **God objects** - Classes/objects that know too much
- [ ] **Feature envy** - Functions that use other modules' data excessively
- [ ] **Shotgun surgery** - Changes require edits in many files
- [ ] **Dead code** - Unused exports, unreachable branches

### Finding Tech Debt

```bash
# Find large files
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -n | tail -20

# Find TODO comments
grep -r "TODO" src --include="*.ts" --include="*.tsx" | wc -l

# Find files with many imports (potential god objects)
grep -c "^import" src/**/*.ts | sort -t: -k2 -n | tail -10
```

---

## Debt Categories

| Category | Priority | SLA | Examples |
|----------|----------|-----|----------|
| **Security** | P0 | Fix immediately | SQL injection, XSS, auth bypass, exposed secrets |
| **Data integrity** | P1 | Fix this sprint | Race conditions, missing validation, data loss risks |
| **Performance** | P2 | Schedule soon | N+1 queries, memory leaks, slow renders |
| **Code quality** | P3 | Refactor when touched | Large files, duplication, poor naming |
| **Style/naming** | P4 | Fix opportunistically | Inconsistent formatting, minor naming issues |

### Priority Definitions

**P0 - Security**: Could lead to data breach, unauthorized access, or compliance violations.
- Action: Stop other work. Fix immediately.
- Example: Hardcoded API key, missing RLS policy

**P1 - Data Integrity**: Could cause data loss, corruption, or incorrect business logic.
- Action: Fix within current sprint.
- Example: Missing database constraint, race condition in booking

**P2 - Performance**: Causes noticeable slowdown or resource waste.
- Action: Schedule in next 2-3 sprints.
- Example: Missing database index, unoptimized query

**P3 - Code Quality**: Makes code harder to maintain but doesn't affect users.
- Action: Fix when modifying related code.
- Example: 700-line file, duplicated validation logic

**P4 - Style/Naming**: Minor inconsistencies that don't impact functionality.
- Action: Fix opportunistically during related changes.
- Example: Inconsistent import ordering, minor naming deviations

---

## Refactoring Checklist

Follow this process when refactoring:

### Before Starting

- [ ] Read existing tests first (understand expected behavior)
- [ ] Ensure adequate test coverage (add tests if < 60%)
- [ ] Create a branch for the refactor
- [ ] Document the refactoring goal

### During Refactoring

- [ ] Create new module structure
- [ ] Move code piece by piece (small commits)
- [ ] Keep re-exports for backward compatibility
- [ ] Run tests after each move
- [ ] Update imports incrementally

### After Refactoring

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] App runs without runtime errors
- [ ] No broken imports (grep for old paths)
- [ ] Remove temporary re-exports once all imports updated
- [ ] Update documentation if patterns changed

### Example: Splitting a Large Store

```typescript
// Before: rental-conversations-store.ts (1200 lines)

// Step 1: Create new directory structure
// src/stores/rental-conversations/
//   ├── index.ts          # Re-exports for backward compat
//   ├── store.ts          # Main store
//   ├── types.ts          # State types
//   ├── actions/
//   │   ├── conversations.ts
//   │   ├── messages.ts
//   │   └── ai-queue.ts
//   └── selectors.ts

// Step 2: Move types first (low risk)
// Step 3: Move selectors (medium risk)
// Step 4: Move actions one group at a time
// Step 5: Update main store to import from modules
// Step 6: Create index.ts that re-exports everything

// index.ts - maintains backward compatibility
export * from './store';
export * from './types';
export * from './selectors';
```

---

## When NOT to Refactor

### Avoid Refactoring When

1. **Before a critical deadline**
   - Ship first, refactor after
   - Document the debt for later

2. **Without test coverage**
   - Write tests first, then refactor
   - No tests = no safety net

3. **Multiple unrelated changes at once**
   - One refactor per PR
   - Easier to review and revert

4. **During active feature development**
   - Finish the feature first
   - Refactor in a separate PR

5. **For code that will be deleted soon**
   - Don't polish code marked for removal
   - Focus on new implementation

### Red Flags - Stop and Reconsider

- "While I'm here, let me also..."
- "This should be quick..."
- "Let me refactor this first before adding the feature"
- Making changes to code you don't understand

---

## Debt Documentation

### In-Code Documentation

Use standardized TODO comments:

```typescript
// TODO(P2): Extract email templates to separate file
// Reason: File is 800 lines, templates are 400 lines
// Ticket: DOUGHY-1234

// FIXME(P1): Race condition when updating booking status
// Two concurrent updates can both succeed
// Ticket: DOUGHY-1235

// HACK(P3): Workaround for react-native gesture handler bug
// Remove when upgrading to v3.0
// Issue: https://github.com/software-mansion/react-native-gesture-handler/issues/XXXX
```

### Debt Tracking

For larger debt items, create a ticket with:

1. **Description**: What's the problem?
2. **Impact**: How does it affect development/users?
3. **Proposed Solution**: How would you fix it?
4. **Effort Estimate**: T-shirt size (S/M/L/XL)
5. **Priority**: P0-P4

---

## Review Process

### Code Review Checklist

When reviewing PRs, check for new debt:

- [ ] No files exceed 500 lines
- [ ] No duplicated logic (> 3 occurrences)
- [ ] No magic numbers
- [ ] Error handling exists
- [ ] Types are specific (no `any`)
- [ ] Tests cover new code

### Debt Review Cadence

| Frequency | Action |
|-----------|--------|
| Every PR | Check for new debt |
| Weekly | Review TODO comments |
| Monthly | Audit large files |
| Quarterly | Review debt backlog |

### Metrics to Track

- Files > 500 lines (target: < 20)
- Files > 1000 lines (target: 0)
- TODO comments (target: < 50)
- Test coverage (target: > 80%)

---

## Quick Reference

### Refactoring Decision Tree

```
Is there a deadline in < 1 week?
├── Yes → Document debt, ship, refactor later
└── No → Continue

Is there test coverage?
├── No → Write tests first
└── Yes → Continue

Is the change isolated?
├── No → Break into smaller changes
└── Yes → Proceed with refactor

Can you explain the code?
├── No → Study it first or pair with someone
└── Yes → Proceed with refactor
```

---

## Related Documentation

- [CODING_STANDARDS.md](./CODING_STANDARDS.md) - File size limits and standards
- [CLEAN_CODE_PRACTICES.md](./CLEAN_CODE_PRACTICES.md) - Writing maintainable code
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System structure
