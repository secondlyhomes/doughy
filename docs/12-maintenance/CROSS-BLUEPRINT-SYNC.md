# Cross-Blueprint Sync Guide

**Purpose:** Keep `mobile-app-blueprint` and `web-app-blueprint` aligned on shared standards while respecting platform differences.

**Companion project:** `web-app-blueprint` (same parent directory)

---

## What MUST Be Identical

These are copied verbatim between blueprints. Any change to one must be mirrored exactly in the other.

| Category | Mobile File | Web File |
|----------|-------------|----------|
| Security Protocol (5 rules) | `CLAUDE.md` | `CLAUDE.md` |
| Architecture Principles (8) | `docs/02-coding-standards/ARCHITECTURE-PRINCIPLES.md` | `docs/02-coding-standards/ARCHITECTURE-PRINCIPLES.md` |
| Component line limits | 200 hard / 150 target (all files) | 200 hard / 150 target (all files) |
| Slash commands | `.claude/commands/start-session.md` | `.claude/commands/start-session.md` |
| Slash commands | `.claude/commands/wrap-up.md` | `.claude/commands/wrap-up.md` |
| Anti-patterns (UX/AI) | `docs/anti-patterns/WHAT-NOT-TO-DO.md` | `docs/anti-patterns/WHAT-NOT-TO-DO.md` |

### Security Protocol (Immutable, Cross-Platform)

These 5 rules are identical in both CLAUDE.md files:

1. NEVER disable RLS on any table
2. NEVER put service_role key in client code
3. NEVER commit secrets (.env, API keys)
4. ALWAYS validate AI inputs
5. ALWAYS use parameterized queries

---

## What Should Be Adapted

Same concept, different platform examples. When updating one, update the other with equivalent platform-specific code.

| Category | Mobile Implementation | Web Implementation |
|----------|----------------------|-------------------|
| Error handling (AppError) | `new AppError({ message, code, userMessage, recoverable?, cause? })` | `new AppError(message, code, { statusCode?, userMessage?, recoverable?, details? })` |
| Edge Function imports | `import "jsr:@supabase/functions-js/edge-runtime.d.ts"` + `Deno.serve()` | Same (shared backend) |
| Enterprise patterns | React Native UI examples | HTML/CSS UI examples |
| Architecture principles | Expo/React Native examples | Vite/React examples |

---

## Intentional Differences (Do NOT "Fix")

These differ by design. Flagging them as bugs wastes time.

| Difference | Mobile | Web | Why |
|-----------|--------|-----|-----|
| Border radius | Rounder (8-24px) | Tighter (4-12px) | Touch targets vs desktop precision |
| Animations | Spring physics | CSS easing curves | Platform conventions |
| Brand color | Green | Blue/Teal | Each project defines its own palette |
| Git workflow | Git Flow | Feature branching | Team preference |
| Testing | Jest + Maestro | Vitest + Playwright | Platform-specific tools |
| Coverage threshold | 70% | 80% | Native mocking overhead justifies lower |
| Toast duration | 10 seconds (undo window) | 4-5 seconds | Interaction patterns differ |

---

## Copy vs Adapt Decision Rule

Use this when deciding how to sync a change:

| Content Type | Rule | Example |
|-------------|------|---------|
| Security rules | **Identical copy** | RLS rules, secret handling |
| UX/AI anti-patterns | **Identical copy** | "Never trust AI output without validation" |
| Architecture principles | **Adapt examples** | Same principle, platform-specific code |
| Enterprise patterns | **90% copy** | Same logic, adapt only UI layer |
| Design tokens | **Platform-specific** | Web uses CSS vars, mobile uses theme objects |
| Testing patterns | **Platform-specific** | Same strategy, different frameworks |

---

## Sync Audit Checklist

Run this when you've made significant changes to either blueprint.

### Quick Check (After Any Doc Change)

- [ ] Does this doc exist in the other blueprint?
- [ ] If yes, does the change affect shared standards (security, architecture, anti-patterns)?
- [ ] If shared standard changed, mirror it exactly in the other blueprint
- [ ] If platform-specific examples changed, check if the other blueprint's examples need equivalent updates

### Full Audit (Quarterly or After Major Updates)

- [ ] Verify Security Protocol is identical in both CLAUDE.md files
- [ ] Verify all 8 Architecture Principles match
- [ ] Verify component line limits (200/150) in CLAUDE.md, CONTRIBUTING.md, WHAT-NOT-TO-DO.md
- [ ] Verify slash commands (start-session, wrap-up) are byte-for-byte identical
- [ ] Verify Edge Function examples use `Deno.serve()` + JSR imports (not deprecated `serve` import)
- [ ] Verify AppError follows options-object pattern in both
- [ ] Verify no `deno.land/std` imports, no `esm.sh/@supabase`, no bare `serve(async` calls
- [ ] Verify enterprise pattern file names match (see table below)
- [ ] Check design token names against each project's DESIGN-SYSTEM.md

### Enterprise Pattern File Names (Must Match)

| Pattern | File Name |
|---------|-----------|
| RBAC | `RBAC.md` |
| SSO | `ENTERPRISE-AUTHENTICATION.md` |
| Multi-tenancy | `MULTI-TENANCY.md` |
| Audit logging | `AUDIT-LOGGING.md` |
| Compliance | `COMPLIANCE.md` |
| Data export | `DATA-EXPORT.md` |
| Encryption | `ENCRYPTION.md` |
| Feature flags | `FEATURE-FLAGS.md` |
| Infrastructure | `INFRASTRUCTURE.md` |
| Security hardening | `SECURITY-HARDENING.md` |
| Teams | `TEAMS.md` |
| White-labeling | `WHITE-LABELING.md` |
| API versioning | `API-VERSIONING.md` |
| Rate limiting | `RATE-LIMITING.md` |

---

## Audit History

| Date | Scope | Result |
|------|-------|--------|
| 2026-02-09 | Exhaustive (127+ docs, 8 categories) | All fixes applied to both projects. Zero deprecated imports remaining. |
