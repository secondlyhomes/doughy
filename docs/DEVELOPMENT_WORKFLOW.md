# Doughy Development Workflow

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
| **STAGE** | Test with real DB | Staging Supabase | `develop` |
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
  +-- develop (STAGE) <-- Integration branch, test here
        |
        +-- feature/* (DEV) <-- Your work happens here
```

### Full Workflow (When Live)

```bash
# 1. Create feature branch
git checkout develop && git pull
git checkout -b feature/my-feature

# 2. Develop with mock data
cp .env.dev .env.local
npx expo start

# 3. Merge to develop, test on staging
git checkout develop
git merge feature/my-feature
git push
cp .env.stage .env.local
npx expo start

# 4. Ready for prod? Merge to main
git checkout main
git merge develop
git push
```

---

## Supabase Projects

| Project | Purpose | Project ID | Dashboard |
|---------|---------|------------|-----------|
| STAGE | Testing | `lqmbyobweeaigrwmvizo` | [Dashboard](https://supabase.com/dashboard/project/lqmbyobweeaigrwmvizo) |
| PROD | Live users | `vpqglbaedcpeprnlnfxd` | [Dashboard](https://supabase.com/dashboard/project/vpqglbaedcpeprnlnfxd) |

### Keeping Schemas in Sync

1. Make schema changes in STAGE first
2. Test thoroughly
3. Apply same SQL to PROD

---

## How Deployment Works (Visual Guide)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOUGHY DEPLOYMENT PIPELINE                               │
│                                                                             │
│  Your Code Journey: Local → Staging → Production                            │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: You write code on a feature branch
═════════════════════════════════════════

    Your Computer
    ┌──────────────┐
    │  feature/    │
    │  add-login   │  ← You work here
    └──────────────┘
           │
           │ git push
           ▼
    ┌──────────────┐
    │   GitHub     │  ← Creates a Pull Request
    │   PR #123    │
    └──────────────┘
           │
           │ Automatic!
           ▼
    ┌──────────────┐
    │   CI Tests   │  ← Tests run automatically
    │   ✅ or ❌   │
    └──────────────┘


STEP 2: Merge to develop = STAGING deployment
══════════════════════════════════════════════

    ┌──────────────┐
    │  PR #123     │
    │  Approved ✅  │
    └──────────────┘
           │
           │ Merge to develop
           ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                    STAGING DEPLOYMENT                        │
    │                    (Automatic on merge)                      │
    │                                                              │
    │   ┌────────────┐  ┌────────────┐  ┌────────────┐            │
    │   │  Supabase  │  │    iOS     │  │  Android   │            │
    │   │  Staging   │  │ TestFlight │  │  Internal  │            │
    │   │  Database  │  │  (Beta)    │  │   Track    │            │
    │   └────────────┘  └────────────┘  └────────────┘            │
    │                                                              │
    │   ┌────────────────────────────────────────────┐            │
    │   │        Netlify Staging Website            │            │
    │   │       stage.doughy.app                    │            │
    │   └────────────────────────────────────────────┘            │
    └──────────────────────────────────────────────────────────────┘

    🧪 TEST HERE FIRST! Install the TestFlight/internal build
       and verify everything works before going to production.


STEP 3: Merge to main = PRODUCTION deployment
══════════════════════════════════════════════

    ┌──────────────┐
    │   develop    │
    │   (tested)   │
    └──────────────┘
           │
           │ Merge to main (requires approval)
           ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                   PRODUCTION DEPLOYMENT                      │
    │                   ⚠️  REAL USERS HERE ⚠️                     │
    │                                                              │
    │   ┌────────────┐  ┌────────────┐  ┌────────────┐            │
    │   │  Supabase  │  │    iOS     │  │  Android   │            │
    │   │ Production │  │ App Store  │  │ Play Store │            │
    │   │  Database  │  │  (Public)  │  │  (Public)  │            │
    │   └────────────┘  └────────────┘  └────────────┘            │
    │                                                              │
    │   ┌────────────────────────────────────────────┐            │
    │   │       Netlify Production Website          │            │
    │   │           www.doughy.app                  │            │
    │   └────────────────────────────────────────────┘            │
    └──────────────────────────────────────────────────────────────┘


WHAT HAPPENS WHEN YOU PUSH?
═══════════════════════════

┌─────────────────┬───────────────────────────────────────────────────────────┐
│ You push to...  │ What happens automatically                               │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ feature/* → PR  │ Tests run. Nothing deploys. Just checks your code.       │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ develop         │ STAGING DEPLOY:                                          │
│                 │ • Supabase migrations run on staging DB                  │
│                 │ • Edge functions deploy to staging                       │
│                 │ • iOS build → TestFlight (internal testers only)         │
│                 │ • Android build → Play Store internal track              │
│                 │ • Web deploy → stage.doughy.app                          │
├─────────────────┼───────────────────────────────────────────────────────────┤
│ main            │ PRODUCTION DEPLOY (requires GitHub approval):            │
│                 │ • Supabase migrations run on PRODUCTION DB               │
│                 │ • Edge functions deploy to production                    │
│                 │ • iOS build → App Store (after Apple review)             │
│                 │ • Android build → Play Store production                  │
│                 │ • Web deploy → www.doughy.app                            │
└─────────────────┴───────────────────────────────────────────────────────────┘


INSTALLING TEST BUILDS
══════════════════════

iOS (TestFlight):
  1. Download TestFlight app from App Store
  2. Accept invitation (sent to your email)
  3. Install "Doughy (Stage)" when builds are ready
  4. You'll have BOTH staging and production apps installed

Android (Internal Testing):
  1. Accept invitation to internal testing (link in email)
  2. Install from Play Store (shows as "Internal testing")
  3. You'll have BOTH staging and production apps installed


THE GOLDEN RULE
═══════════════

  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │   NEVER push directly to main.                              │
  │   ALWAYS go: feature → develop → main                      │
  │   ALWAYS test on staging before production.                 │
  │                                                             │
  │   develop = safe to break (staging)                         │
  │   main = real users, don't break (production)               │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
```

---

## Going Live Checklist

> **When to use this:** You're ready to launch to real users and need to set up the full DEV → STAGE → PROD workflow.

### Step 1: Rename Branch (One-Time Setup)

```bash
# Rename master to develop (staging branch)
git checkout master
git branch -m master develop
git push origin -u develop

# Change default branch in GitHub Settings > Branches to 'develop'
# Then delete old master:
git push origin --delete master
```

### Step 2: Configure GitHub Secrets

Go to **Settings > Secrets and variables > Actions** and add:

| Secret | Description | Where to get |
|--------|-------------|--------------|
| `EXPO_TOKEN` | EAS authentication | [expo.dev tokens](https://expo.dev/accounts/[you]/settings/access-tokens) |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI auth | [supabase.com tokens](https://supabase.com/dashboard/account/tokens) |
| `NETLIFY_AUTH_TOKEN` | Netlify deployments | [app.netlify.com tokens](https://app.netlify.com/user/applications) |

### Step 3: Configure GitHub Environments

Create two environments in **Settings > Environments**:

**staging:**
| Type | Name | Value |
|------|------|-------|
| Variable | `SUPABASE_PROJECT_ID` | `lqmbyobweeaigrwmvizo` |
| Variable | `SUPABASE_URL` | `https://lqmbyobweeaigrwmvizo.supabase.co` |
| Secret | `SUPABASE_ANON_KEY` | (your staging anon key) |
| Variable | `NETLIFY_SITE_ID` | (from Netlify) |

**production:**
| Type | Name | Value |
|------|------|-------|
| Variable | `SUPABASE_PROJECT_ID` | `vpqglbaedcpeprnlnfxd` |
| Variable | `SUPABASE_URL` | `https://vpqglbaedcpeprnlnfxd.supabase.co` |
| Secret | `SUPABASE_ANON_KEY` | (your prod anon key) |
| Variable | `NETLIFY_SITE_ID` | (from Netlify) |

**Production Environment Settings:**
- ✅ Required reviewers: Add yourself
- ✅ Deployment branch restriction: `main` only

### Step 4: Initialize EAS

```bash
# Get your EAS project ID
eas init

# Update app.config.js with the projectId from the output
```

### Step 5: Update app.config.js

Replace `YOUR_EAS_PROJECT_ID` with the actual project ID from `eas init`.

### Step 6: Delete app.json

Once `app.config.js` is working, delete `app.json`:

```bash
# Verify config works first
npx expo config --type public

# If no errors, delete app.json
rm app.json
```

---

## Build Scripts

Use these npm scripts for manual builds:

```bash
# Local development builds
npm run build:ios:dev      # iOS simulator build
npm run build:android:dev  # Android APK for local testing

# Staging builds (TestFlight / Play Store internal)
npm run build:ios:stage    # iOS → TestFlight internal
npm run build:android:stage # Android → Play Store internal

# Production builds (App Store / Play Store)
npm run build:ios:prod     # iOS → App Store
npm run build:android:prod # Android → Play Store

# Submit to stores
npm run submit:ios         # Submit latest iOS build
npm run submit:android     # Submit latest Android build

# Deploy edge functions
npm run deploy:functions:stage  # Deploy to staging
npm run deploy:functions:prod   # Deploy to production

# Push database migrations
npm run db:push:stage      # Push to staging
npm run db:push:prod       # Push to production

# Generate TypeScript types
npm run db:types:stage     # From staging schema
npm run db:types:prod      # From production schema

# Build web
npm run build:web          # Export for Netlify
```

---

## Emergency Procedures

### Rollback a Bad Production Deploy

```bash
# 1. Revert the code change
git checkout main
git revert HEAD --no-edit
git push

# 2. This triggers a new production deploy with the reverted code

# 3. For immediate database rollback (DANGEROUS - data loss possible):
# Go to Supabase Dashboard > Database > Backups
# Restore from last known good backup
```

### Skip a Deployment

```bash
# Add [skip ci] to commit message
git commit -m "docs: update readme [skip ci]"
```

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

## TypeScript Types

Regenerate after schema changes:

```bash
npm run db:types:stage  # or db:types:prod
npx tsc --noEmit        # Validate
```

---

## Coming Back After a Break

1. Read this doc
2. `git status && git log --oneline -5`
3. `cat .env.local` (what mode?)
4. Run mock mode first: `cp .env.dev .env.local && npx expo start`
5. Tell Claude: "I'm back, we're in pre-prod mode"
