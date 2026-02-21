# Doughy Ecosystem — Post-Demo Refactoring Plan

> **Target:** Claude Code Agent Teams
> **When:** Execute AFTER demo is complete and all tasks in `doughy-tasks.md` are resolved.
> **Monorepo Structure:** `Doughy` (root) · `apps/Callpilot` · `apps/TheClaw` · `openclaw-server`

---

## ⚠️ Rules That Still Apply

All Global Behavioral Rules from `doughy-tasks.md` remain in effect during refactoring. In addition:

1. **Do not refactor and add features at the same time.** Each phase below is structural only. No new functionality, no new UI, no new endpoints.
2. **Test after every change.** After every file move, rename, or extraction — run the app and verify it still works. Do not batch moves without testing between them.
3. **Preserve git history.** Use `git mv` when moving files. Do not delete-and-recreate.
4. **Do not change any logic during extraction.** When pulling a function, component, or hook out of a large file into its own file, copy it exactly. Refactoring logic is a separate step from refactoring structure.

---

## Phase 1: Generate `ARCHITECTURE.md`

**Do this first. Do not touch any code until this is complete.**

Create an `ARCHITECTURE.md` file at the monorepo root. This document will be read at the start of every future Claude Code session to orient agents. It must be accurate, complete, and maintained as the source of truth for how the codebase is organized.

### Contents to include:

**1. Monorepo Directory Map**
- Walk the repo. Document every top-level directory and its purpose.
- Document the `apps/` folder contents and each app's entry point.
- Document where shared code currently lives (if anywhere).
- Document where config files live (env files, Supabase config, Twilio config, etc.).

**2. Product Descriptions & Relationships**
- Doughy: What it is, what modules it contains (Investor, Landlord), what entities it manages (leads, properties, deals, people, bookings).
- Callpilot: What it is, that it's CRM-agnostic by design, what it handles (calls, texts, emails, transcripts, call coaching).
- The Claw: What it is, that it's the AI bridge, that it has its own UI for audit/control, that `openclaw-server` is its backend.
- How data flows between them: Doughy ↔ The Claw ↔ Callpilot.

**3. Database Schema Overview**
- Connect via MCP to Supabase.
- List all tables with a one-line description of each.
- Document key relationships (foreign keys, junction tables).
- Note any Supabase-specific patterns (RLS policies, realtime subscriptions, edge functions).

**4. Naming Conventions**
- Document the current file naming convention (camelCase, kebab-case, PascalCase — whatever is actually in use).
- Document component naming patterns.
- Document route/screen naming patterns.
- Document DB column naming patterns.
- If conventions are inconsistent, document what they ARE, not what they should be. Standardizing conventions is a separate task.

**5. State Management**
- What state management approach is used (Context, Zustand, Redux, etc.)?
- Where does global state live?
- How do apps share state (if at all)?

**6. API & Service Patterns**
- How do the apps communicate with Supabase?
- How do Doughy and Callpilot communicate with The Claw / openclaw-server?
- Are there shared API clients or does each app have its own?

**7. Environment & Setup**
- How to install dependencies.
- How to start each app.
- How to run the seed.
- Required environment variables and where they're configured.

**8. Seed Data**
- What the seed creates (personas, properties, deals, bookings, etc.).
- How to run it.
- How to reset it.

---

## Phase 2: Monorepo Structure Cleanup

**Goal:** Establish clean shared packages so that Doughy, Callpilot, and The Claw can import shared code from a single source of truth instead of duplicating it.

### Recommended target structure:

```
root/
├── ARCHITECTURE.md
├── docs/
├── packages/
│   ├── ui/              ← Shared UI components (buttons, sheets, search bars, empty states, layout wrappers)
│   ├── types/           ← Shared TypeScript types and interfaces
│   ├── utils/           ← Shared utilities (phone formatting, date helpers, validators, etc.)
│   └── api/             ← Shared API clients, Supabase queries, data access layer
├── apps/
│   ├── doughy/          ← CRM app
│   ├── callpilot/       ← Communication hub
│   └── the-claw/        ← AI bridge UI
├── servers/
│   └── openclaw-server/ ← The Claw backend
├── supabase/
│   ├── migrations/
│   └── seed/
└── package.json         ← Workspace root
```

### Steps:

1. **Assess current workspace tooling.** Is this using npm workspaces, pnpm, yarn, turborepo? Document it. Work within the existing tooling — do not switch package managers during refactoring.

2. **Create `packages/` directory** with subdirectories: `ui`, `types`, `utils`, `api`. Each gets its own `package.json` with an appropriate package name (e.g., `@doughy/ui`, `@doughy/types`).

3. **Move shared types first.** These have zero runtime impact and are the safest starting point. Find all TypeScript types/interfaces that are duplicated or used across apps. Move them to `packages/types`. Update imports. Test.

4. **Move shared utilities second.** Phone formatting, date helpers, validation functions, formatting utils. Move to `packages/utils`. Update imports. Test.

5. **Move shared UI components third.** The components extracted during pre-demo work (back button, bottom sheet, search bar, empty state, safe area wrapper) should already be somewhat shared. Move them to `packages/ui`. Update imports. Test.

6. **Move shared API/data access last.** Supabase client config, shared queries, data access functions. Move to `packages/api`. Update imports. Test.

7. **Update `ARCHITECTURE.md`** to reflect the new structure.

### Rules during this phase:

- One package at a time. Do not move types and utils simultaneously.
- After every batch of import updates, run ALL apps to verify nothing is broken.
- If a piece of code is only used by one app, leave it in that app. Only shared code goes into `packages/`.
- Do not rename files during this phase. Just move them.

---

## Phase 3: File-Level Refactoring

**Goal:** Reduce file sizes so that each file has a single responsibility and can be fully understood in context. Target ~200 lines per file as a guideline.

### Principles:

- **200 lines is a smell threshold, not a hard rule.** A cohesive 250-line file is better than 3 tangled 80-line files with circular imports. The goal is single responsibility — 200 lines is where that naturally tends to land.
- **Extract, do not rewrite.** Pull pieces out into their own files and import them back. Do not change logic during extraction.
- **One file at a time.** Split a file, update imports, test, commit. Then move to the next file.
- **Prioritize high-churn files.** Check `git log --stat` to find the most frequently modified files. These benefit the most from being smaller and clearer.

### Common splitting patterns:

| What you find | How to split it |
|---|---|
| 500+ line screen component | Extract sub-components into sibling files. Extract custom hooks into a `hooks/` directory. Extract helpers/utils into a `utils/` file. The screen file should be mostly composition and layout — reading it should feel like reading an outline. |
| 400+ line utility file | Group functions by domain. `utils/phone.ts`, `utils/date.ts`, `utils/format.ts` instead of one `utils.ts`. |
| 600+ line API/service file | Split by entity. `api/leads.ts`, `api/properties.ts`, `api/bookings.ts` instead of one `api.ts`. |
| 300+ line custom hook | Extract sub-hooks. A hook that manages form state, validation, and submission is 3 hooks. |
| Component with 100+ lines of inline styles | Extract styles into a co-located styles file or use a shared styling pattern. |

### Splitting order:

1. **Shared packages first** (`packages/ui`, `packages/utils`, etc.) — these are imported everywhere, so cleaning them up has the widest impact.
2. **Screen components** — these are where most of the bloat lives.
3. **API/service layers** — split by entity for clarity.
4. **Hooks and state management** — split by concern.

### After splitting is complete:

- Run the full app suite one more time.
- Update `ARCHITECTURE.md` with any new conventions or patterns that emerged.
- Commit with a clean message: `refactor: complete file-level restructuring`

---

## Phase 4: Convention Standardization (Optional)

If Phase 1 revealed inconsistent naming conventions, file structures, or patterns across the codebase, this is the phase to standardize them. This is optional and should only be done if the inconsistencies are actively causing confusion.

**Examples:**
- Standardize file naming: pick one of `camelCase.ts`, `kebab-case.ts`, or `PascalCase.ts` and apply it everywhere.
- Standardize component file structure: should a component folder contain `index.ts`, `Component.tsx`, `styles.ts`, `hooks.ts`? Pick one pattern.
- Standardize route naming patterns across Doughy, Callpilot, and The Claw.

**Document all decisions in `ARCHITECTURE.md`.**

---

## Post-Refactor Checklist

Before resuming feature development, verify:

- [ ] `ARCHITECTURE.md` exists at root and is accurate
- [ ] All apps build and run independently
- [ ] Shared packages (`packages/`) are properly configured and importable
- [ ] Seed runs successfully with one command
- [ ] No file in the codebase exceeds 300 lines without good reason
- [ ] Git history is preserved (no delete-and-recreate, used `git mv`)
- [ ] No duplicate code exists across apps that should be in `packages/`

---

## Summary

| Phase | What | Test After? |
|---|---|---|
| 1 | Generate `ARCHITECTURE.md` — full monorepo documentation | No code changes |
| 2 | Monorepo structure — create `packages/`, move shared code | Yes, after every batch |
| 3 | File-level refactoring — shrink files to ~200 lines, single responsibility | Yes, after every file |
| 4 | Convention standardization *(optional)* — unify naming and patterns | Yes, full suite |
