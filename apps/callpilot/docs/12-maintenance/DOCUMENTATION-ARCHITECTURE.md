# Documentation Architecture

> How this documentation system is designed, who it serves, and how to extend it.

## Primary Audience: Claude Code

This documentation is **designed for AI-first consumption**. The primary reader is Claude Code (Anthropic's CLI agent), which reads these docs as context to generate correct, convention-following code.

### What This Means in Practice

- **Thoroughness over brevity.** A human might skim a 500-line doc and find it overwhelming. Claude Code reads every line and uses the detail to produce more accurate output. Never trim a doc just to make it "more readable" if the detail helps Claude generate better code.
- **Complete code examples.** Claude Code uses code blocks as templates for generation. Every example should be syntactically valid, include imports, and follow project conventions (TypeScript strict, named exports, etc.).
- **Explicit conventions.** Don't leave things implicit. If components must be under 200 lines, state it. If named exports are required, state it. Claude Code follows stated rules precisely.
- **Checklists.** Most docs end with a checklist. Claude Code uses these as verification steps after generating code.

### Secondary Audience: Human Developers

Humans also read these docs — especially when onboarding or looking up specific patterns. The docs accommodate this by:

- Starting each doc with a one-line blockquote summary
- Using consistent heading structure for scanning
- Providing "I Want To..." navigation in INDEX.md
- Keeping root-level files (README.md, QUICKSTART.md, CONTRIBUTING.md) human-friendly

## How Claude Code Consumes These Docs

### Entry Point: CLAUDE.md

`CLAUDE.md` is always loaded into Claude Code's context. It acts as a routing table:

| Section | Purpose |
|---------|---------|
| Project & Commands | Immediate context — what the stack is, how to run things |
| Structure | Where code lives |
| Naming & Rules | Conventions Claude must follow in generated code |
| Security Protocol | Immutable rules that cannot be overridden |
| Read Before Implementing | Routes Claude to the right doc per task type |
| Key Docs | Quick reference for design philosophy and anti-patterns |

When a user says "add authentication," Claude reads CLAUDE.md, sees the "Read Before Implementing" table pointing to the relevant doc, loads that doc, and follows its patterns.

### Pattern Docs: Implementation Recipes

The `docs/patterns/` directory contains step-by-step implementation recipes:

| Pattern | Claude Uses It When... |
|---------|----------------------|
| `NEW-FEATURE.md` | Building any new feature end-to-end |
| `NEW-SCREEN.md` | Adding a new screen to the app |
| `SUPABASE-TABLE.md` | Creating a new database table with RLS, types, service, hook |
| `AI-API-CALL.md` | Integrating any AI/LLM API through Edge Functions |
| `FORM-PATTERNS.md` | Building forms with validation, keyboard handling |

These are the most literally followed docs — Claude treats them as recipes and generates code matching each step.

### Anti-Pattern Docs: What NOT to Generate

`docs/anti-patterns/WHAT-NOT-TO-DO.md` tells Claude what code patterns to avoid. Claude checks generated code against these rules. The BAD/GOOD pairs give concrete examples of what to reject vs. produce.

### Reference Docs: Deep Context

The numbered directories (01-architecture through 13-lifecycle) provide deep context that Claude loads when it needs specific domain knowledge:

- Working on auth → load `docs/04-authentication/`
- Setting up payments → load `docs/08-payments/`
- Handling security → load `docs/09-security/`
- Using native features → load `docs/06-native-features/`

These are comprehensive by design — Claude needs the full picture to generate correct, secure code.

### INDEX.md: Human Navigation Hub

`docs/INDEX.md` is primarily for humans browsing the docs. Claude Code doesn't need it — it follows CLAUDE.md's routing table. INDEX.md exists so a human can find any doc through task-oriented navigation ("I Want To...").

## Directory Structure Conventions

### Numbered Directories (00–13)

```
00-getting-started/   → First things a user or Claude needs
01-architecture/      → How the system is designed
02-coding-standards/  → How to write code in this project
03-database/          → Supabase setup and patterns
04-authentication/    → Auth setup and OAuth
05-ui-ux/             → Design system, theming, accessibility
06-native-features/   → Permissions, biometric, push, platform-specific
07-ai-integration/    → AI cost optimization
08-payments/          → RevenueCat, Stripe, and entitlements
09-security/          → Security checklist and hardening
10-testing/           → All testing strategies and patterns
11-deployment/        → CI/CD, EAS, and app store submission
12-maintenance/       → Keeping things working over time
13-developer-tools/   → Code generators and utilities
13-lifecycle/         → Releases, hotfixes, incidents
```

Numbers indicate topic grouping, not reading order. Claude loads specific directories by task context, not sequentially.

### Special Directories

| Directory | Purpose |
|-----------|---------|
| `patterns/` | Implementation recipes Claude follows step-by-step |
| `anti-patterns/` | Rules for what Claude must NOT generate |
| `decisions/` | ADR template for recording architectural decisions |
| `troubleshooting/` | Categorized error resolution guides |
| `tutorials/` | Step-by-step learning guides for humans |
| `video-guides/` | Video walkthrough scripts |

### Root-Level Files

| File | Primary Audience | Purpose |
|------|-----------------|---------|
| `README.md` | Human (GitHub landing page) | Project overview, quick start, doc index |
| `QUICKSTART.md` | Human | Detailed setup with troubleshooting |
| `CONTRIBUTING.md` | Human | Contribution workflow, PR process, code review |
| `REFERENCE.md` | Both | Quick pattern lookup guide |
| `CLAUDE.md` | Claude Code | Routing table, conventions, immutable rules |

Root files may overlap with `docs/` files intentionally. The root version is for a human landing on the GitHub repo. The `docs/` version is for Claude Code loading context within a specific task domain.

## Intentional Duplication vs. Bugs

### Intentional (Context Layering)

Some content appears in multiple places because Claude Code and humans access it from different entry points:

- **QUICKSTART.md** at root (detailed human entry with troubleshooting) vs. `docs/00-getting-started/QUICKSTART.md` (concise version Claude references for setup tasks)
- **Security rules** in CLAUDE.md (immutable rules Claude always sees) vs. `docs/09-security/SECURITY-CHECKLIST.md` (comprehensive reference)

This is by design. Don't consolidate these — they serve different access paths.

### Accidental (Fix These)

If the same *rule* appears in multiple places with *different values*, that's a bug. Examples of what must always agree everywhere:

- Component line limits: 200 hard limit, 150 target
- Clone URLs: must match the actual GitHub repository
- Security rules: must be identical in CLAUDE.md, SECURITY-CHECKLIST.md, and WHAT-NOT-TO-DO.md

When you find a discrepancy, fix it everywhere. Grep for the conflicting value to find all instances.

## How to Write a New Doc

### Structure

```markdown
# Document Title

> One-line summary of what this doc covers.

## Overview (or intro paragraph)

2-3 sentences explaining purpose and scope.

## [Content Sections]

Main content with code examples.

## Checklist

- [ ] Actionable verification items
```

### Rules for Claude-Friendly Docs

1. **Complete code examples.** Include imports, types, and file paths. Claude copies these patterns directly into generated code.
2. **State conventions explicitly.** Don't assume Claude remembers something from another doc. Repeat critical rules (like "named exports only") where relevant.
3. **Use tables for structured data.** Claude parses tables reliably.
4. **End with a checklist.** Claude uses these to verify its own generated code.
5. **Cross-reference related docs.** Use relative paths: `See [AUTH-SETUP.md](../04-authentication/AUTH-SETUP.md)`. Claude follows these links when it needs more context.
6. **Show BAD/GOOD pairs** for conventions. Claude uses these to pattern-match what to generate and what to avoid.
7. **Don't abbreviate for readability.** What feels repetitive to a human is precision for Claude. If a rule matters, state it fully each time.

### Where to Put New Docs

| Doc Type | Location |
|----------|----------|
| Implementation recipe (step-by-step) | `docs/patterns/` |
| Anti-pattern or common mistake | `docs/anti-patterns/` |
| Architecture decision record | `docs/decisions/` (use TEMPLATE.md) |
| Domain-specific reference | Appropriate numbered directory |
| Project-level guide (human-facing) | Root directory |
| Error resolution guide | `docs/troubleshooting/` |
| Learning guide (step-by-step) | `docs/tutorials/` |

### After Adding a New Doc

1. Add an entry in `docs/INDEX.md` under the relevant "I Want To..." section
2. If Claude should load it for a specific task type, add it to the "Read Before Implementing" table in `CLAUDE.md`
3. Update the doc count in the `docs/INDEX.md` header if needed

## Using This Blueprint

### Starting a New Project

This blueprint combines **documentation** and **example code**. The docs instruct Claude Code on how to build the app. The `.examples/` directory provides copy-paste-ready reference implementations. To start a new project:

1. Clone or use as a GitHub template
2. Run setup: install dependencies, configure environment variables
3. Tell Claude Code what to build — it reads the docs and generates code following these patterns
4. Reference `.examples/` for concrete implementations of common patterns

### Adopting in an Existing Project

To apply these patterns to an existing codebase:

1. **Copy selectively.** You don't need every doc. Start with:
   - `CLAUDE.md` → customize the Structure and Commands sections to match your existing setup
   - `docs/patterns/` → for establishing consistent implementation patterns
   - `docs/09-security/` → for security hardening
   - `docs/anti-patterns/` → for code review standards

2. **Adapt to your conventions.** Update the pattern docs to match your existing naming, folder structure, and state management rather than adopting the blueprint's conventions wholesale. Claude Code follows whatever conventions your customized docs describe.

3. **Add domain-specific docs gradually.** As you work with Claude Code on your project, add docs for your specific patterns, integrations, and decisions. Claude gets better the more context it has about *your* codebase.

4. **Keep CLAUDE.md as the routing table.** Even in an existing project, CLAUDE.md should list your commands, structure, and a "Read Before Implementing" table pointing to whichever docs are relevant.

## The .examples/ Directory

Unlike a pure documentation template, this mobile blueprint includes a comprehensive `.examples/` directory with:

- **Components** — Advanced UI component implementations
- **Features** — Complete feature implementations (auth, tasks, payments, AI)
- **Enterprise patterns** — RBAC, SSO, multi-tenancy, audit, compliance
- **Integrations** — Third-party service integrations (AI, analytics, email, maps, payments)
- **Platform-specific** — iOS and Android specific implementations

Claude Code can reference these as working examples when generating new code. The examples should follow all the conventions documented in the pattern docs.

**Important:** Example files must follow the same standards as production code. If the component limit is 200 lines, example components should demonstrate proper decomposition at or below that limit.

## Maintaining This Documentation System

See [DOCUMENTATION-MAINTENANCE.md](DOCUMENTATION-MAINTENANCE.md) for:

- Review schedules and ownership
- Link checking and spell checking automation
- Quality standards for code examples
- Process for fixing outdated content
