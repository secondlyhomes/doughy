# How to Work with Claude on Doughy AI

This document explains how to communicate effectively with Claude when working on this project.

---

## Quick Reference Commands

Copy-paste these to set context at the start of a session:

### Pre-Production (Current)

```
We're in pre-prod mode. [describe what you want to work on]
```

### When We Go Live

```
We're in full workflow mode now. [describe what you want to work on]
```

### Specific Modes

```
Use mock data - I want to iterate fast on the UI.
```

```
Connect to staging - I need to test with real data.
```

```
Connect to prod - I need to check something in production.
```

---

## What Each Command Means

| Command | Claude Will... |
|---------|----------------|
| **"pre-prod mode"** | Help you push directly to prod, skip staging gate |
| **"full workflow mode"** | Remind you to test in staging before main |
| **"use mock data"** | Help with EXPO_PUBLIC_USE_MOCK_DATA=true |
| **"connect to staging"** | Help you work with .env.stage |
| **"connect to prod"** | Help you work with .env.prod (careful!) |

---

## Coming Back After a Break

Use this prompt to get Claude up to speed:

```
Hey Claude, I'm back after a break. We're still in pre-prod mode.
The project is a React Native/Expo app with Supabase.
Can you read docs/DEVELOPMENT_WORKFLOW.md and help me [your task]?
```

---

## Asking Claude for Help

### Debug Database Issues

```
Claude, I'm getting empty results from the leads query.
We're connected to [staging/prod]. Can you help me debug RLS?
```

### Schema Changes

```
Claude, I need to add a new column to the leads table.
Walk me through the schema sync process (STAGE first, then PROD).
```

### Environment Issues

```
Claude, I'm getting "Invalid JWT" errors.
Help me verify my environment is set up correctly.
```

### Git Workflow

```
Claude, I've finished the feature on master.
Help me merge to main and push to prod. (We're pre-prod, so it's safe)
```

---

## Things Claude Should Know About This Project

- **Two Supabase projects**: STAGE and PROD (separate, not same project)
- **34+ database tables**: Real estate, leads, messaging, admin, auth
- **Mock data layer**: Can develop without hitting real database
- **Branch strategy**: feature/* -> master -> main
- **Pre-production**: No real users yet, safe to push freely

---

## Files Claude Should Reference

| For This | Point Claude To |
|----------|-----------------|
| Workflow questions | `docs/DEVELOPMENT_WORKFLOW.md` |
| Database schema | `src/integrations/supabase/types.ts` |
| Mock data | `src/lib/mockData/` |
| Auth logic | `src/features/auth/context/AuthProvider.tsx` |
| Supabase client | `src/lib/supabase.ts` |

---

## When to Update This Document

Update this file when:
- We go live (remove pre-prod references)
- We add new environments
- We change the workflow significantly
- Claude consistently misunderstands something
