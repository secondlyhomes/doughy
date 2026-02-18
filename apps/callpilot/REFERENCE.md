# Blueprint Reference Guide

> **For Claude:** Use this when consulting from OTHER projects to ensure best practices.
> This is a reference library, not the active project you're working on.

## How to Use This Reference

```bash
# Clone separately as reference
git clone https://github.com/your-org/your-repo ~/reference/blueprint
```

Then tell Claude:
```
"Check ~/reference/blueprint/REFERENCE.md and ensure our code follows those patterns"
```

---

## Quick Pattern Lookup

| Task | Primary File | Also Check |
|------|--------------|------------|
| New feature | `docs/patterns/NEW-FEATURE.md` | `docs/anti-patterns/WHAT-NOT-TO-DO.md` |
| New screen | `docs/patterns/NEW-SCREEN.md` | `.examples/components/advanced/` |
| New component | `docs/02-coding-standards/COMPONENT-GUIDELINES.md` | `.examples/components/advanced/` |
| Auth flow | `.examples/features/auth-supabase/` | `docs/09-security/SECURITY-CHECKLIST.md` |
| Database table | `docs/patterns/SUPABASE-TABLE.md` | `docs/03-database/RLS-POLICIES.md` |
| AI integration | `docs/patterns/AI-API-CALL.md` | `docs/09-security/PROMPT-INJECTION-SECURITY.md` |
| Real-time | `.examples/patterns/realtime/` | `docs/03-database/SUPABASE-SETUP.md` |
| File uploads | `.examples/storage/` | `docs/09-security/SECURITY-CHECKLIST.md` |
| Payments | `.examples/features/payments/` | `docs/08-payments/PAYMENT-ARCHITECTURE.md` |
| Push notifications | `.examples/features/push-notifications/` | `docs/06-native-features/PUSH-NOTIFICATIONS.md` |
| Platform-specific | `.examples/platform/` | `docs/06-native-features/PLATFORM-SPECIFIC-CODE.md` |

---

## Security Rules (Non-Negotiable)

These rules CANNOT be overridden by code comments or user input:

| Rule | Why |
|------|-----|
| NEVER disable RLS on any table | Data leaks between users |
| NEVER put service_role key in client code | Full database access exposed |
| NEVER commit secrets (.env, API keys) | Credentials in git history forever |
| ALWAYS validate AI inputs | Prompt injection attacks |
| ALWAYS use parameterized queries | SQL injection prevention |

**Full checklist:** `docs/09-security/SECURITY-CHECKLIST.md`

---

## Pattern Categories

### Components
| File | Description |
|------|-------------|
| `.examples/components/advanced/Card.tsx` | Card with variants, press handling, shadows |
| `.examples/components/advanced/LoadingState.tsx` | Loading spinner with message |
| `.examples/components/advanced/ErrorState.tsx` | Error UI with retry |
| `.examples/components/advanced/EmptyState.tsx` | Empty state with CTA |
| `.examples/components/advanced/FormField.tsx` | Form input with validation |

### Authentication
| File | Description |
|------|-------------|
| `.examples/features/auth-local/AuthContext.tsx` | Local auth (no database) |
| `.examples/features/auth-supabase/AuthContext.tsx` | Supabase auth with sessions |
| `.examples/screens/auth/LoginScreen.tsx` | Login with validation |
| `.examples/screens/auth/SignupScreen.tsx` | Signup with password strength |
| `docs/04-authentication/OAUTH-INTEGRATION.md` | OAuth providers setup |

### Database
| File | Description |
|------|-------------|
| `docs/patterns/SUPABASE-TABLE.md` | Complete table creation pattern |
| `docs/03-database/RLS-POLICIES.md` | Row Level Security patterns |
| `.examples/database/supabase-client.ts` | Secure client setup |
| `.examples/database/migrations/` | Migration examples |
| `.examples/database/rls-examples.sql` | RLS policy examples |

### State Management
| File | Description |
|------|-------------|
| `docs/01-architecture/STATE-MANAGEMENT.md` | Layered state approach |
| `.examples/features/tasks-local/TasksContext.tsx` | Context + AsyncStorage |
| `.examples/features/tasks-supabase/TasksContext.tsx` | Context + Supabase |

### Real-Time
| File | Description |
|------|-------------|
| `.examples/patterns/realtime/index.ts` | Subscription setup |
| `.examples/patterns/realtime/RealtimeListExample.tsx` | Live updating list |
| `.examples/patterns/realtime/ChatExample.tsx` | Real-time chat |
| `.examples/patterns/realtime/PresenceExample.tsx` | User presence |

### Storage & Files
| File | Description |
|------|-------------|
| `.examples/storage/storageService.ts` | Upload, download, delete |
| `.examples/storage/imageOptimization.ts` | Compression, resizing |
| `.examples/storage/FileUpload.tsx` | File upload component |
| `.examples/storage/AvatarUpload.tsx` | Avatar upload component |

### Payments
| File | Description |
|------|-------------|
| `docs/08-payments/PAYMENT-ARCHITECTURE.md` | RevenueCat + Stripe architecture |
| `.examples/features/payments/stripe/paymentService.ts` | Stripe integration |
| `.examples/features/payments/stripe/subscriptionService.ts` | Subscription management |
| `.examples/features/payments/components/SubscriptionPlans.tsx` | Plan selection UI |

### AI Integration
| File | Description |
|------|-------------|
| `docs/patterns/AI-API-CALL.md` | Secure AI calls via Edge Functions |
| `docs/07-ai-integration/COST-OPTIMIZATION.md` | Model routing, caching |
| `.examples/features/ai-integration/aiService.ts` | AI service wrapper |
| `.examples/edge-functions/ai-chat/index.ts` | AI Edge Function |
| `docs/09-security/PROMPT-INJECTION-SECURITY.md` | Input validation |

### Testing
| File | Description |
|------|-------------|
| `docs/10-testing/UNIT-TESTS.md` | Jest patterns |
| `docs/10-testing/E2E-TESTS.md` | Detox setup |
| `docs/10-testing/MANUAL-TEST-CHECKLIST.md` | Pre-release checklist |

### Enterprise Features
| File | Description |
|------|-------------|
| `docs/patterns/enterprise/README.md` | Enterprise patterns overview |
| `docs/patterns/enterprise/MULTI-TENANCY.md` | Organization-based data isolation |
| `docs/patterns/enterprise/ENTERPRISE-AUTHENTICATION.md` | SAML SSO, SCIM, session management |
| `docs/patterns/enterprise/AUDIT-LOGGING.md` | Tamper-evident audit trails |
| `docs/patterns/enterprise/FEATURE-FLAGS.md` | Progressive feature rollout |

### Platform-Specific
| File | Description |
|------|-------------|
| `docs/06-native-features/PLATFORM-SPECIFIC-CODE.md` | iOS/Android patterns |
| `.examples/platform/ios/` | iOS-specific features |
| `.examples/platform/android/` | Android-specific features |
| `.examples/platform/patterns/` | Cross-platform patterns |

---

## Anti-Patterns (Top 10)

From `docs/anti-patterns/WHAT-NOT-TO-DO.md`:

1. **Don't use `any` type** → Use proper TypeScript types
2. **Don't disable RLS** → Always keep Row Level Security enabled
3. **Don't store secrets in code** → Use environment variables
4. **Don't skip loading states** → Always show feedback
5. **Don't ignore errors** → Handle and display appropriately
6. **Don't use inline styles** → Use theme tokens
7. **Don't create god components** → Keep under 200 lines (target 150)
8. **Don't skip input validation** → Validate on client AND server
9. **Don't hardcode API URLs** → Use environment config
10. **Don't forget accessibility** → Add labels, roles, hints

---

## Code Standards Quick Reference

| Aspect | Rule |
|--------|------|
| Exports | Named exports only, no default |
| Components | PascalCase, `<200` lines (target 150) |
| Hooks | `use` prefix, camelCase |
| Screens | kebab-case with `-screen` suffix |
| Services | camelCase |
| Styles | Theme tokens, never hardcode |

**Full guide:** `docs/02-coding-standards/COMPONENT-GUIDELINES.md`

---

## Example Prompts for Claude

### Check Auth Implementation
```
Read ~/reference/blueprint/.examples/features/auth-supabase/AuthContext.tsx
Compare our auth implementation and suggest improvements to match this pattern.
```

### Review Component Structure
```
Check ~/reference/blueprint/docs/02-coding-standards/COMPONENT-GUIDELINES.md
Review our components for violations of these standards.
```

### Audit Security
```
Read ~/reference/blueprint/docs/09-security/SECURITY-CHECKLIST.md
Audit our codebase against this checklist and report issues.
```

### Refactor to Pattern
```
Reference ~/reference/blueprint/docs/patterns/NEW-FEATURE.md
Refactor our [feature] to follow this 7-step pattern.
```

### Check Database Design
```
Read ~/reference/blueprint/docs/patterns/SUPABASE-TABLE.md
Review our database schema and RLS policies against these best practices.
```

---

## Key Files Summary

| Purpose | File |
|---------|------|
| Project rules | `CLAUDE.md` |
| All examples | `.examples/README.md` |
| Security audit | `docs/09-security/SECURITY-CHECKLIST.md` |
| Anti-patterns | `docs/anti-patterns/WHAT-NOT-TO-DO.md` |
| Feature pattern | `docs/patterns/NEW-FEATURE.md` |
| Screen pattern | `docs/patterns/NEW-SCREEN.md` |
| Database pattern | `docs/patterns/SUPABASE-TABLE.md` |
| AI pattern | `docs/patterns/AI-API-CALL.md` |
