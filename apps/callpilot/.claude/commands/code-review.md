---
allowed-tools: Task
description: Multi-pass code review with agents. Run after completing features to harden code.
---

## When to Use This Skill

Use `/code-review` when:
- Just finished implementing a feature
- Completed a bug fix
- Before creating a PR
- Anytime you want to harden code quality

Can run **multiple times per session** - it's not tied to session end.

## Code Review Protocol

Run code review agents in passes, fixing by severity:

| Pass | Fix Severity | Goal |
|------|--------------|------|
| 1st | High → Critical | Major bugs, security issues, breaking changes |
| 2nd | Medium → Critical | Verify fixes + medium-priority issues |
| 3rd | Low → Critical | Hardening, polish, minor improvements |
| 4th+ | Best judgment | Stop when fixes create more churn than value |

## Available Agents

| Agent | What It Checks | When to Use |
|-------|----------------|-------------|
| `code-reviewer` | Style, patterns, bugs, project conventions | **Always** |
| `silent-failure-hunter` | Error handling, catch blocks, fallback behavior | After async/API code |
| `type-design-analyzer` | TypeScript type quality and invariants | After adding/changing types |

## Your Task

### CRITICAL: Continuation Rules

- You MUST complete ALL passes (1st through 3rd minimum) before stopping
- DO NOT stop after a single agent returns results
- After each pass, IMMEDIATELY proceed to the next step without waiting
- Only stop when: ALL severity levels reviewed AND Future Improvements written

### Step 1: Identify What to Review

Ask user what code was just written, or check recent changes:
- `git diff HEAD~1` for last commit
- `git diff` for uncommitted changes

### Step 2: Run Review Pass

Launch appropriate agents based on the code:
- **Always** run `code-reviewer`
- If async/API code: also run `silent-failure-hunter`
- If types changed: also run `type-design-analyzer`

### Step 3: Present Findings by Severity

Group findings:
```
## Critical/High
- [List items that MUST be fixed]

## Medium
- [List items that SHOULD be fixed]

## Low
- [List items that are nice-to-have]
```

### Step 4: Fix and Re-run (MANDATORY)

This step is NOT optional. After fixing high/critical issues:
1. Apply fixes immediately
2. Re-run agents to verify - DO NOT SKIP this verification
3. Move to next severity level - DO NOT STOP HERE
4. Repeat until Pass 3 complete (diminishing returns only applies to Pass 4+)

### Step 5: Output Future Improvements

**ALWAYS** end with a `## Future Improvements` section containing:
- Recommendations noticed but not urgent
- Patterns that could be improved project-wide
- Technical debt items for backlog

Example:
```
## Future Improvements

- [ ] Consider extracting common validation logic into shared hook
- [ ] Add retry logic to API calls in this module
- [ ] Update similar patterns in other screens
```

These can be added to GitHub issues or session notes via `/wrap-up`.

---

## Completion Checklist (MANDATORY before stopping)

- [ ] Pass 1 complete: High/Critical issues identified and fixed
- [ ] Pass 2 complete: Medium issues addressed, fixes verified
- [ ] Pass 3 complete: Low issues reviewed, hardening applied
- [ ] Future Improvements section written
- [ ] Summary provided to user

**DO NOT STOP until all boxes can be checked.**
