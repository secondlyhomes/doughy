# Doughy AI Development Workflow

> **Quick Start:** If you're coming back after a break, start here!

---

## Current Mode: PRE-PRODUCTION

> We are NOT live yet. Using simplified fast workflow.
>
> **When we go live:** Remove this section and follow the full DEV -> STAGE -> PROD workflow below.

### Fast Workflow (Pre-Prod)

```bash
# Work on master, push directly to main
git checkout master
# ... make changes ...
git add . && git commit -m "Add feature X"
git checkout main && git merge master && git push
```

---

## How to Tell Claude What Mode We're In

When starting a session, tell Claude one of these:

| Say This | What It Means |
|----------|---------------|
| "We're in **pre-prod mode**" | Push freely to prod, no staging gate, move fast |
| "We're in **full workflow mode**" | Follow DEV -> STAGE -> PROD carefully |
| "Use **mock data**" | Work with local mock layer (fastest) |
| "Connect to **staging**" | Testing against staging Supabase |
| "Connect to **prod**" | Working with production data |

### Example Prompts

```
"Hey Claude, we're still in pre-prod mode. Let's add the notes feature."

"Claude, we're now live. Full workflow mode from now on."

"Let's work with mock data today, I want to iterate fast on the UI."
```

---

## Three Environments

| Environment | Purpose | Database | Branch |
|-------------|---------|----------|--------|
| **DEV** | Fast local development | Mock data (no DB) | Any feature branch |
| **STAGE** | Test with real DB | Staging Supabase | `master` |
| **PROD** | Live users | Production Supabase | `main` |

---

## Environment Files

```
.env                 # Current active (git-ignored)
.env.example         # Template (committed)
.env.dev             # Mock data mode
.env.stage           # Staging Supabase
.env.prod            # Production Supabase
```

### Switching Environments

```bash
# Fast local dev with mock data
cp .env.dev .env.local && npx expo start

# Test with staging database
cp .env.stage .env.local && npx expo start

# Test with production database
cp .env.prod .env.local && npx expo start
```

---

## Git Branch Strategy

```
main (PROD)          <-- Only merge when ready to go live
  |
  +-- master (STAGE) <-- Integration branch, test here
        |
        +-- feature/* (DEV) <-- Your work happens here
```

### Full Workflow (When Live)

```bash
# 1. Create feature branch
git checkout master && git pull
git checkout -b feature/my-feature

# 2. Develop with mock data
cp .env.dev .env.local
npx expo start

# 3. Merge to master, test on staging
git checkout master
git merge feature/my-feature
git push
cp .env.stage .env.local
npx expo start

# 4. Ready for prod? Merge to main
git checkout main
git merge master
git push
```

---

## Supabase Projects

| Project | Purpose | Dashboard |
|---------|---------|-----------|
| STAGE | Testing | https://supabase.com/dashboard/project/[STAGE-ID] |
| PROD | Live users | https://supabase.com/dashboard/project/lqmbyobweeaigrwmvizo |

### Keeping Schemas in Sync

1. Make schema changes in STAGE first
2. Test thoroughly
3. Apply same SQL to PROD

---

## RLS Debugging

When queries return empty but you expect data:

```sql
-- Check if RLS is blocking (run as service_role)
SELECT * FROM your_table LIMIT 5;

-- See all policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Test as specific user
SET request.jwt.claims = '{"sub": "user-uuid", "role": "authenticated"}';
SELECT * FROM your_table;
```

---

## Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Empty data | RLS blocking | Check policies |
| "Invalid JWT" | Wrong .env loaded | `cat .env.local` |
| Auth not persisting | SecureStore issue | Clear app data |
| Can't connect | VPN/firewall | Try without VPN |

---

## Emergency Rollback

```bash
# Revert last merge
git checkout main
git revert HEAD --no-edit
git push

# Or hard reset (pre-prod only)
git reset --hard <commit>
git push --force
```

---

## TypeScript Types

Regenerate after schema changes:

```bash
supabase gen types typescript --project-id lqmbyobweeaigrwmvizo > src/integrations/supabase/types.ts
npx tsc --noEmit  # Validate
```

---

## Coming Back After a Break

1. Read this doc
2. `git status && git log --oneline -5`
3. `cat .env.local` (what mode?)
4. Run mock mode first: `cp .env.dev .env.local && npx expo start`
5. Tell Claude: "I'm back, we're in pre-prod mode"
