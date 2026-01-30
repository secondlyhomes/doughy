# Database Standardization & Complete Code Refactor

**Last Updated:** 2026-01-16
**Status:** Architecture Complete - Ready for Implementation
**Scope:** 22 table renames + comprehensive code refactor across entire codebase

---

## Executive Summary

Standardize entire database schema following DBA-approved naming conventions. Includes comprehensive code refactoring to update ALL references across the codebase.

**Total Tables to Rename:** 22
**Estimated Code Files to Update:** ~150-200
**Breaking Changes:** YES - All client code must be updated
**Backward Compatibility:** NO - Clean break, no legacy support

---

## DBA-Approved Naming Philosophy

### Core Rules

1. **Prefix = Domain Ownership**
   - `system_*` = platform infrastructure
   - `security_*` = auth, secrets, audit
   - `user_*` = user-specific data
   - `analytics_*` = reporting/metrics
   - `assistant_*` = AI features
   - `call_*` = call/voice features
   - `comms_*` = messaging (email/SMS)
   - `crm_*` = lead/contact management
   - `re_*` = real estate (properties, deals, documents)

2. **Always Plural:** `user_profiles`, `call_transcripts`, `crm_leads`

3. **Boring & Literal:** No generic names without context

---

## Complete Rename Manifest (22 Tables)

### Group 1: System & Infrastructure (5 tables)

| Current | New | Reason |
|---------|-----|--------|
| `feature_flags` | `system_feature_flags` | Platform infrastructure |
| `rate_limits` | `system_rate_limits` | Platform infrastructure |
| `usage_logs` | `system_usage_logs` | Platform infrastructure |
| `feature_usage_stats` | `analytics_feature_usage_stats` | Analytics/reporting |
| `workspace` | `workspaces` | Plural consistency |

---

### Group 2: Security & Auth (3 tables)

| Current | New | Reason |
|---------|-----|--------|
| `oauth_tokens` | `security_oauth_tokens` | Security/secrets |
| `api_keys` | `security_api_keys` | Security/secrets |
| `reset_tokens` | `security_reset_tokens` | Security/secrets |

---

### Group 3: User Domain (4 tables)

| Current | New | Reason |
|---------|-----|--------|
| `profiles` | `user_profiles` | Prefix + plural |
| `user_mfa` | `user_mfa_settings` | Clarity |
| `mfa_pending_setup` | `user_mfa_pending_setup` | Domain consistency |
| `mfa_recovery_codes` | `user_mfa_recovery_codes` | Domain consistency |

---

### Group 4: Assistant/AI (1 table)

| Current | New | Reason |
|---------|-----|--------|
| `ai_jobs` | `assistant_jobs` | Domain consistency |

---

### Group 5: Communications (2 tables)

| Current | New | Reason |
|---------|-----|--------|
| `messages` | `comms_messages` | Multi-channel messaging |
| `scheduled_messages` | `comms_scheduled_messages` | Multi-channel messaging |

---

### Group 6: Call/Voice Domain (3 tables)

| Current | New | Reason |
|---------|-----|--------|
| `calls` | `call_logs` | Call logging (avoid collision) |
| `transcripts` | `call_transcripts` | Voice transcripts |
| `transcript_segments` | `call_transcript_segments` | Voice transcript segments |

---

### Group 7: CRM Domain (4 tables)

| Current | New | Reason |
|---------|-----|--------|
| `leads` | `crm_leads` | Avoid generic collision |
| `contacts` | `crm_contacts` | Avoid generic collision |
| `lead_contacts` | `crm_lead_contacts` | Junction table |
| `lead_notes` | `crm_lead_notes` | Domain consistency |

---

## Migration SQL - Complete

**File:** `supabase/migrations/20260123_comprehensive_database_standardization.sql`

```sql
-- ============================================================================
-- COMPREHENSIVE DATABASE STANDARDIZATION MIGRATION
-- ============================================================================
-- Date: 2026-01-23
-- Purpose: Standardize all table names following DBA-approved conventions
-- Tables affected: 22
-- Breaking changes: YES - all client code must update references
-- Rollback: See 20260123_comprehensive_database_standardization_ROLLBACK.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- GROUP 1: SYSTEM & INFRASTRUCTURE (5 tables)
-- ============================================================================

ALTER TABLE feature_flags RENAME TO system_feature_flags;
ALTER TABLE rate_limits RENAME TO system_rate_limits;
ALTER TABLE usage_logs RENAME TO system_usage_logs;
ALTER TABLE feature_usage_stats RENAME TO analytics_feature_usage_stats;
ALTER TABLE workspace RENAME TO workspaces;

-- ============================================================================
-- GROUP 2: SECURITY & AUTH (3 tables)
-- ============================================================================

ALTER TABLE oauth_tokens RENAME TO security_oauth_tokens;
ALTER TABLE api_keys RENAME TO security_api_keys;
ALTER TABLE reset_tokens RENAME TO security_reset_tokens;

-- ============================================================================
-- GROUP 3: USER DOMAIN (4 tables)
-- ============================================================================

ALTER TABLE profiles RENAME TO user_profiles;
ALTER TABLE user_mfa RENAME TO user_mfa_settings;
ALTER TABLE mfa_pending_setup RENAME TO user_mfa_pending_setup;
ALTER TABLE mfa_recovery_codes RENAME TO user_mfa_recovery_codes;

-- ============================================================================
-- GROUP 4: ASSISTANT/AI (1 table)
-- ============================================================================

ALTER TABLE ai_jobs RENAME TO assistant_jobs;

-- ============================================================================
-- GROUP 5: COMMUNICATIONS (2 tables)
-- ============================================================================

ALTER TABLE messages RENAME TO comms_messages;
ALTER TABLE scheduled_messages RENAME TO comms_scheduled_messages;

-- ============================================================================
-- GROUP 6: CALL/VOICE DOMAIN (3 tables)
-- ============================================================================

ALTER TABLE calls RENAME TO call_logs;
ALTER TABLE transcripts RENAME TO call_transcripts;
ALTER TABLE transcript_segments RENAME TO call_transcript_segments;

-- ============================================================================
-- GROUP 7: CRM DOMAIN (4 tables)
-- ============================================================================

ALTER TABLE leads RENAME TO crm_leads;
ALTER TABLE contacts RENAME TO crm_contacts;
ALTER TABLE lead_contacts RENAME TO crm_lead_contacts;
ALTER TABLE lead_notes RENAME TO crm_lead_notes;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify all tables exist with new names
DO $$
DECLARE
    expected_tables TEXT[] := ARRAY[
        'system_feature_flags',
        'system_rate_limits',
        'system_usage_logs',
        'analytics_feature_usage_stats',
        'workspaces',
        'security_oauth_tokens',
        'security_api_keys',
        'security_reset_tokens',
        'user_profiles',
        'user_mfa_settings',
        'user_mfa_pending_setup',
        'user_mfa_recovery_codes',
        'assistant_jobs',
        'comms_messages',
        'comms_scheduled_messages',
        'call_logs',
        'call_transcripts',
        'call_transcript_segments',
        'crm_leads',
        'crm_contacts',
        'crm_lead_contacts',
        'crm_lead_notes'
    ];
    tbl TEXT;
    missing_tables TEXT[] := '{}';
BEGIN
    FOREACH tbl IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = tbl
        ) THEN
            missing_tables := array_append(missing_tables, tbl);
        END IF;
    END LOOP;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables after migration: %', missing_tables;
    END IF;

    RAISE NOTICE 'All 22 tables renamed successfully';
END $$;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
    'info',
    'migration',
    'Comprehensive database standardization completed',
    jsonb_build_object(
        'migration', '20260123_comprehensive_database_standardization',
        'tables_renamed', 22,
        'groups', ARRAY['system', 'security', 'user', 'assistant', 'comms', 'call', 'crm'],
        'breaking_change', true,
        'client_code_updates_required', true
    )
);

COMMIT;
```

---

## Rollback SQL

**File:** `supabase/migrations/20260123_comprehensive_database_standardization_ROLLBACK.sql`

```sql
BEGIN;

-- GROUP 7: CRM (reverse order)
ALTER TABLE crm_lead_notes RENAME TO lead_notes;
ALTER TABLE crm_lead_contacts RENAME TO lead_contacts;
ALTER TABLE crm_contacts RENAME TO contacts;
ALTER TABLE crm_leads RENAME TO leads;

-- GROUP 6: CALL/VOICE
ALTER TABLE call_transcript_segments RENAME TO transcript_segments;
ALTER TABLE call_transcripts RENAME TO transcripts;
ALTER TABLE call_logs RENAME TO calls;

-- GROUP 5: COMMUNICATIONS
ALTER TABLE comms_scheduled_messages RENAME TO scheduled_messages;
ALTER TABLE comms_messages RENAME TO messages;

-- GROUP 4: ASSISTANT
ALTER TABLE assistant_jobs RENAME TO ai_jobs;

-- GROUP 3: USER
ALTER TABLE user_mfa_recovery_codes RENAME TO mfa_recovery_codes;
ALTER TABLE user_mfa_pending_setup RENAME TO mfa_pending_setup;
ALTER TABLE user_mfa_settings RENAME TO user_mfa;
ALTER TABLE user_profiles RENAME TO profiles;

-- GROUP 2: SECURITY
ALTER TABLE security_reset_tokens RENAME TO reset_tokens;
ALTER TABLE security_api_keys RENAME TO api_keys;
ALTER TABLE security_oauth_tokens RENAME TO oauth_tokens;

-- GROUP 1: SYSTEM
ALTER TABLE workspaces RENAME TO workspace;
ALTER TABLE analytics_feature_usage_stats RENAME TO feature_usage_stats;
ALTER TABLE system_usage_logs RENAME TO usage_logs;
ALTER TABLE system_rate_limits RENAME TO rate_limits;
ALTER TABLE system_feature_flags RENAME TO feature_flags;

COMMIT;
```

---

## Code Refactor Strategy - Complete Search & Replace

### Step 1: Generate TypeScript Types

```bash
# Connect to Supabase and regenerate types
npx supabase gen types typescript --project-id lqmbyobweeaigrwmvizo > src/integrations/supabase/types.ts
```

---

### Step 2: Systematic Code Updates (All 22 Tables)

For EACH table, we need to find and replace in these patterns:

#### Pattern 1: `.from('table_name')` queries

```bash
# Example for leads → crm_leads
grep -r "\.from('leads')" src --include="*.ts" --include="*.tsx"
grep -r '\.from("leads")' src --include="*.ts" --include="*.tsx"
grep -r '\.from(`leads`)' src --include="*.ts" --include="*.tsx"

# Replace all occurrences
# .from('leads') → .from('crm_leads')
```

#### Pattern 2: Import statements

```bash
# Example for profiles → user_profiles
grep -r "from.*profiles" src --include="*.ts" --include="*.tsx"

# Check for type imports
grep -r "Profile" src/integrations/supabase/types.ts
```

#### Pattern 3: Type references

```bash
# Example for ai_jobs → assistant_jobs
grep -r "AiJob\|AIJob\|ai_job" src --include="*.ts" --include="*.tsx"
```

---

### Step 3: Comprehensive File Search Matrix

**Table-by-Table Search Commands:**

```bash
# ============================================================================
# GROUP 1: SYSTEM & INFRASTRUCTURE
# ============================================================================

# feature_flags → system_feature_flags
grep -r "feature_flags\|featureFlags\|FeatureFlag" src --include="*.ts" --include="*.tsx"

# rate_limits → system_rate_limits
grep -r "rate_limits\|rateLimit\|RateLimit" src --include="*.ts" --include="*.tsx"

# usage_logs → system_usage_logs
grep -r "usage_logs\|usageLog\|UsageLog" src --include="*.ts" --include="*.tsx"

# feature_usage_stats → analytics_feature_usage_stats
grep -r "feature_usage_stats\|featureUsageStat" src --include="*.ts" --include="*.tsx"

# workspace → workspaces
grep -r "\.from.*workspace[^_]" src --include="*.ts" --include="*.tsx"

# ============================================================================
# GROUP 2: SECURITY & AUTH
# ============================================================================

# oauth_tokens → security_oauth_tokens
grep -r "oauth_tokens\|oauthToken\|OAuthToken" src --include="*.ts" --include="*.tsx"

# api_keys → security_api_keys
grep -r "\.from.*api_keys" src --include="*.ts" --include="*.tsx"

# reset_tokens → security_reset_tokens
grep -r "reset_tokens\|resetToken" src --include="*.ts" --include="*.tsx"

# ============================================================================
# GROUP 3: USER DOMAIN
# ============================================================================

# profiles → user_profiles
grep -r "\.from.*profiles[^/]" src --include="*.ts" --include="*.tsx"

# user_mfa → user_mfa_settings
grep -r "\.from.*user_mfa[^_]" src --include="*.ts" --include="*.tsx"

# mfa_pending_setup → user_mfa_pending_setup
grep -r "mfa_pending_setup" src --include="*.ts" --include="*.tsx"

# mfa_recovery_codes → user_mfa_recovery_codes
grep -r "mfa_recovery_codes" src --include="*.ts" --include="*.tsx"

# ============================================================================
# GROUP 4: ASSISTANT/AI
# ============================================================================

# ai_jobs → assistant_jobs
grep -r "\.from.*ai_jobs" src --include="*.ts" --include="*.tsx"

# ============================================================================
# GROUP 5: COMMUNICATIONS
# ============================================================================

# messages → comms_messages
grep -r "\.from.*messages[^/]" src --include="*.ts" --include="*.tsx"

# scheduled_messages → comms_scheduled_messages
grep -r "scheduled_messages" src --include="*.ts" --include="*.tsx"

# ============================================================================
# GROUP 6: CALL/VOICE DOMAIN
# ============================================================================

# calls → call_logs
grep -r "\.from.*calls[^/]" src --include="*.ts" --include="*.tsx"

# transcripts → call_transcripts
grep -r "\.from.*transcripts" src --include="*.ts" --include="*.tsx"

# transcript_segments → call_transcript_segments
grep -r "transcript_segments" src --include="*.ts" --include="*.tsx"

# ============================================================================
# GROUP 7: CRM DOMAIN
# ============================================================================

# leads → crm_leads
grep -r "\.from.*leads[^/]" src --include="*.ts" --include="*.tsx"

# contacts → crm_contacts
grep -r "\.from.*contacts[^/]" src --include="*.ts" --include="*.tsx"

# lead_contacts → crm_lead_contacts
grep -r "lead_contacts" src --include="*.ts" --include="*.tsx"

# lead_notes → crm_lead_notes
grep -r "lead_notes" src --include="*.ts" --include="*.tsx"
```

---

### Step 4: Expected Files Requiring Updates

Based on codebase analysis, here are the estimated files per table:

| Table Rename | Est. Files | High-Risk Areas |
|--------------|-----------|-----------------|
| `leads` → `crm_leads` | ~30 files | `src/features/leads/`, deal hooks |
| `profiles` → `user_profiles` | ~15 files | Auth hooks, settings screens |
| `calls` → `call_logs` | ~10 files | Call tracking features |
| `transcripts` → `call_transcripts` | ~10 files | Transcript features |
| `messages` → `comms_messages` | ~8 files | Messaging features |
| `workspace` → `workspaces` | ~6 files | Workspace hooks, member management |
| `api_keys` → `security_api_keys` | ~5 files | Admin screens, settings |
| `ai_jobs` → `assistant_jobs` | ~5 files | AI job hooks |
| `contacts` → `crm_contacts` | ~4 files | Contact management |
| `lead_contacts` → `crm_lead_contacts` | ~3 files | Junction queries |
| `lead_notes` → `crm_lead_notes` | ~3 files | Notes features |
| All others | ~2 files each | Low usage |

**Total:** ~150-200 files

---

## Critical Files Checklist

### Auth & User Domain

- [ ] `src/features/auth/hooks/useAuth.ts`
- [ ] `src/features/auth/hooks/useSession.ts`
- [ ] `src/features/settings/screens/SettingsScreen.tsx`
- [ ] `src/features/settings/hooks/useProfile.ts`
- [ ] Any MFA-related components

### CRM Domain (HIGHEST IMPACT)

- [ ] `src/features/leads/hooks/useLeads.ts`
- [ ] `src/features/leads/hooks/useLeadMutations.ts`
- [ ] `src/features/leads/hooks/useLeadDocuments.ts`
- [ ] `src/features/leads/screens/LeadsListScreen.tsx`
- [ ] `src/features/leads/screens/LeadDetailScreen.tsx`
- [ ] `src/features/leads/screens/AddLeadScreen.tsx`
- [ ] Any contact management hooks/screens

### Call/Voice Domain

- [ ] `src/features/calls/hooks/useCalls.ts` (if exists)
- [ ] `src/features/transcripts/hooks/useTranscripts.ts` (if exists)
- [ ] Any call logging components

### Communications Domain

- [ ] `src/features/messaging/hooks/useMessages.ts` (if exists)
- [ ] Any SMS/email components

### System/Admin Domain

- [ ] `src/features/admin/hooks/useFeatureFlags.ts` (if exists)
- [ ] `src/features/admin/hooks/useRateLimits.ts` (if exists)
- [ ] `src/features/admin/screens/AdminDashboardScreen.tsx`

### Workspace Domain

- [ ] Workspace-related hooks
- [ ] Workspace member management

### AI/Assistant Domain

- [ ] `src/features/assistant/hooks/useAIJobs.ts`
- [ ] Any AI job tracking components

---

## Automated Refactor Script

**File:** `scripts/refactor-database-references.sh` (NEW)

```bash
#!/bin/bash

# ============================================================================
# AUTOMATED DATABASE REFERENCE REFACTOR
# ============================================================================
# This script updates all code references to renamed database tables
# WARNING: Creates git commits for each group - review before pushing
# ============================================================================

set -e

echo "Starting database reference refactor..."
echo "This will update ~150-200 files"
echo ""

# ============================================================================
# GROUP 1: SYSTEM & INFRASTRUCTURE
# ============================================================================

echo "GROUP 1: Refactoring system & infrastructure tables..."

# feature_flags → system_feature_flags
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('feature_flags')/.from('system_feature_flags')/g" \
  -e "s/\.from(\"feature_flags\")/.from(\"system_feature_flags\")/g" \
  {} \;

# rate_limits → system_rate_limits
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('rate_limits')/.from('system_rate_limits')/g" \
  -e "s/\.from(\"rate_limits\")/.from(\"system_rate_limits\")/g" \
  {} \;

# usage_logs → system_usage_logs
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('usage_logs')/.from('system_usage_logs')/g" \
  -e "s/\.from(\"usage_logs\")/.from(\"system_usage_logs\")/g" \
  {} \;

# feature_usage_stats → analytics_feature_usage_stats
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('feature_usage_stats')/.from('analytics_feature_usage_stats')/g" \
  -e "s/\.from(\"feature_usage_stats\")/.from(\"analytics_feature_usage_stats\")/g" \
  {} \;

# workspace → workspaces (careful: don't match workspace_members)
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('workspace')/.from('workspaces')/g" \
  -e "s/\.from(\"workspace\")/.from(\"workspaces\")/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename system & infrastructure tables (group 1)"

# ============================================================================
# GROUP 2: SECURITY & AUTH
# ============================================================================

echo "GROUP 2: Refactoring security & auth tables..."

# oauth_tokens → security_oauth_tokens
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('oauth_tokens')/.from('security_oauth_tokens')/g" \
  -e "s/\.from(\"oauth_tokens\")/.from(\"security_oauth_tokens\")/g" \
  {} \;

# api_keys → security_api_keys
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('api_keys')/.from('security_api_keys')/g" \
  -e "s/\.from(\"api_keys\")/.from(\"security_api_keys\")/g" \
  {} \;

# reset_tokens → security_reset_tokens
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('reset_tokens')/.from('security_reset_tokens')/g" \
  -e "s/\.from(\"reset_tokens\")/.from(\"security_reset_tokens\")/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename security & auth tables (group 2)"

# ============================================================================
# GROUP 3: USER DOMAIN
# ============================================================================

echo "GROUP 3: Refactoring user domain tables..."

# profiles → user_profiles
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('profiles')/.from('user_profiles')/g" \
  -e "s/\.from(\"profiles\")/.from(\"user_profiles\")/g" \
  {} \;

# user_mfa → user_mfa_settings
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('user_mfa')/.from('user_mfa_settings')/g" \
  -e "s/\.from(\"user_mfa\")/.from(\"user_mfa_settings\")/g" \
  {} \;

# mfa_pending_setup → user_mfa_pending_setup
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('mfa_pending_setup')/.from('user_mfa_pending_setup')/g" \
  -e "s/\.from(\"mfa_pending_setup\")/.from(\"user_mfa_pending_setup\")/g" \
  {} \;

# mfa_recovery_codes → user_mfa_recovery_codes
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('mfa_recovery_codes')/.from('user_mfa_recovery_codes')/g" \
  -e "s/\.from(\"mfa_recovery_codes\")/.from(\"user_mfa_recovery_codes\")/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename user domain tables (group 3)"

# ============================================================================
# GROUP 4: ASSISTANT/AI
# ============================================================================

echo "GROUP 4: Refactoring assistant/AI tables..."

# ai_jobs → assistant_jobs
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('ai_jobs')/.from('assistant_jobs')/g" \
  -e "s/\.from(\"ai_jobs\")/.from(\"assistant_jobs\")/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename assistant/AI tables (group 4)"

# ============================================================================
# GROUP 5: COMMUNICATIONS
# ============================================================================

echo "GROUP 5: Refactoring communications tables..."

# messages → comms_messages
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('messages')/.from('comms_messages')/g" \
  -e "s/\.from(\"messages\")/.from(\"comms_messages\")/g" \
  {} \;

# scheduled_messages → comms_scheduled_messages
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('scheduled_messages')/.from('comms_scheduled_messages')/g" \
  -e "s/\.from(\"scheduled_messages\")/.from(\"comms_scheduled_messages\")/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename communications tables (group 5)"

# ============================================================================
# GROUP 6: CALL/VOICE DOMAIN
# ============================================================================

echo "GROUP 6: Refactoring call/voice tables..."

# calls → call_logs
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('calls')/.from('call_logs')/g" \
  -e "s/\.from(\"calls\")/.from(\"call_logs\")/g" \
  {} \;

# transcripts → call_transcripts
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('transcripts')/.from('call_transcripts')/g" \
  -e "s/\.from(\"transcripts\")/.from(\"call_transcripts\")/g" \
  {} \;

# transcript_segments → call_transcript_segments
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('transcript_segments')/.from('call_transcript_segments')/g" \
  -e "s/\.from(\"transcript_segments\")/.from(\"call_transcript_segments\")/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename call/voice tables (group 6)"

# ============================================================================
# GROUP 7: CRM DOMAIN (HIGHEST IMPACT)
# ============================================================================

echo "GROUP 7: Refactoring CRM tables (highest impact)..."

# leads → crm_leads
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('leads')/.from('crm_leads')/g" \
  -e "s/\.from(\"leads\")/.from(\"crm_leads\")/g" \
  {} \;

# contacts → crm_contacts
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('contacts')/.from('crm_contacts')/g" \
  -e "s/\.from(\"contacts\")/.from(\"crm_contacts\")/g" \
  {} \;

# lead_contacts → crm_lead_contacts
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('lead_contacts')/.from('crm_lead_contacts')/g" \
  -e "s/\.from(\"lead_contacts\")/.from(\"crm_lead_contacts\")/g" \
  {} \;

# lead_notes → crm_lead_notes
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  -e "s/\.from('lead_notes')/.from('crm_lead_notes')/g" \
  -e "s/\.from(\"lead_notes\")/.from(\"crm_lead_notes\")/g" \
  {} \;

git add -A
git commit -m "refactor(db): rename CRM tables (group 7)"

# ============================================================================
# REGENERATE TYPES
# ============================================================================

echo "Regenerating TypeScript types from Supabase..."
npx supabase gen types typescript --project-id lqmbyobweeaigrwmvizo > src/integrations/supabase/types.ts

git add src/integrations/supabase/types.ts
git commit -m "chore(types): regenerate Supabase types after table renames"

# ============================================================================
# DONE
# ============================================================================

echo ""
echo "✅ Database reference refactor complete!"
echo ""
echo "Summary:"
echo "- 22 tables renamed"
echo "- ~150-200 files updated"
echo "- 7 git commits created (1 per group)"
echo ""
echo "Next steps:"
echo "1. Run: npm run type-check"
echo "2. Run: npm test"
echo "3. Test app manually"
echo "4. Review commits: git log --oneline -7"
echo "5. If good: git push"
echo "6. If issues: git reset --hard HEAD~7"
```

---

## Execution Checklist

### Pre-Migration

- [ ] Backup production database
- [ ] Backup staging database
- [ ] Test migration on local database copy
- [ ] Verify rollback script works

### Migration Execution

- [ ] Run migration on local: `supabase db push`
- [ ] Verify all 22 tables renamed: Check Supabase dashboard
- [ ] Run verification queries (see Migration SQL)
- [ ] Deploy to staging Supabase project
- [ ] Monitor for errors (48 hours)

### Code Refactor Execution

- [ ] Create feature branch: `git checkout -b refactor/database-standardization`
- [ ] Run automated refactor script: `bash scripts/refactor-database-references.sh`
- [ ] Review all 7 commits created
- [ ] Run type check: `npm run type-check`
- [ ] Run tests: `npm test`
- [ ] Fix any remaining type errors manually
- [ ] Test app manually (all major features)
- [ ] Merge to main when verified

### Post-Migration

- [ ] Monitor error logs (Sentry)
- [ ] Check query performance
- [ ] Update documentation: `docs/DATABASE_SCHEMA.md`
- [ ] Deploy to production (after 48hr staging soak)
- [ ] Monitor production for 7 days

---

## Manual Review Areas

Some patterns require manual review:

### 1. Dynamic Table Names

```typescript
// Search for dynamic table references
grep -r "supabase\.from(.*\${" src

// Example that needs manual update:
const tableName = 'leads'; // ❌ Needs manual update
supabase.from(tableName)

// Should be:
const tableName = 'crm_leads'; // ✅
```

### 2. String Interpolation

```typescript
// Search for template literals in .from()
grep -r '\.from(`' src
```

### 3. Edge Functions

```bash
# Check edge functions for table references
grep -r "\.from\(" supabase/functions
```

### 4. Type Assertions

```typescript
// Search for type casts that reference old table names
grep -r "as.*Profile\|as.*Lead\|as.*Contact" src
```

---

## Success Criteria

- [ ] All 22 tables renamed in database
- [ ] Zero missing tables (verification query passes)
- [ ] ~150-200 files updated in code
- [ ] Zero TypeScript errors: `npm run type-check` passes
- [ ] Zero test failures: `npm test` passes
- [ ] App builds successfully: `npm run build` passes
- [ ] All major features work in staging
- [ ] Query performance <100ms (no degradation)
- [ ] Zero runtime errors in Sentry (48hr soak)

---

## Troubleshooting

### Issue: "Table does not exist" errors

```sql
-- Check if table was renamed
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

### Issue: TypeScript type errors after regeneration

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate types again
npx supabase gen types typescript > src/integrations/supabase/types.ts
```

### Issue: RLS policy errors

```sql
-- Check RLS policies still reference correct tables
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

---

## Contact

Questions? Ask in #engineering Slack or ping @tech-lead
