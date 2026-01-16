# Zone E: Database Standardization & Schema Migrations

**Owner:** Backend Developer / Database Specialist
**Timeline:** Week 1-2 (Phase 1), Week 5-6 (Phase 2)
**Dependencies:** None (can start immediately)
**Risk Level:** MEDIUM (Phase 1 = 19 tables, Phase 2 = 16 tables)
**DBA Approved:** ✅ 100% aligned with DBA recommendations

---

## Mission

Standardize entire database schema by renaming tables in two phases to follow DBA-approved naming conventions. Phase 1 focuses on system/infrastructure tables with minimal code impact. Phase 2 addresses user-facing tables (profiles, CRM) with higher code impact.

**Phase 1:** 19 tables (16 with zero code impact, 3 with low-medium impact)
**Phase 2:** 16 additional tables (profiles, CRM domain, security, email, billing)

---

## DBA-Approved Naming Philosophy

### Rule 1: Prefix = Who Owns the Data (Functional Domain)
- `system_*` = internal platform config + meters + infra
- `security_*` = security/audit/incident data
- `user_*` = user-specific state/settings
- `analytics_*` = aggregated/reporting tables
- `assistant_*` = AI product domain
- `call_*` = call feature domain
- `comms_*` = outbound messaging (email/SMS)
- `crm_*` = CRM/lead management domain
- `re_*` = Real Estate domain (properties, documents, analysis)
- `billing_*` = payments, subscriptions, invoices

### Rule 2: Use Plural Nouns for Tables
- `assistant_sessions`, `security_event_logs`, `call_transcripts`

### Rule 3: Keep Names Boring and Literal
- No generic names without context

---

## Phase 1: System/Infrastructure Tables (19 Tables)

**Deploy:** Week 1-2
**Code Impact:** 13 references across 4 files
**Risk:** LOW

### GROUP 1: System & Infrastructure (5 tables)
| Current | New | Reason |
|---------|-----|--------|
| `feature_flags` | `system_feature_flags` | Platform config, not product features |
| `rate_limits` | `system_rate_limits` | Platform infrastructure |
| `usage_logs` | `system_usage_logs` | Platform metering |
| `feature_usage_stats` | `analytics_feature_usage_stats` | Analytics/reporting domain |
| `scheduled_deletions` | `system_scheduled_deletions` | Lifecycle infrastructure |

### GROUP 2: User & Auth Domain (7 tables)
| Current | New | Reason |
|---------|-----|--------|
| `mfa_pending_setup` | `user_mfa_pending_setup` | User MFA lifecycle |
| `mfa_recovery_codes` | `user_mfa_recovery_codes` | User MFA recovery |
| `reset_tokens` | `security_reset_tokens` | Security/secrets domain |
| `onboarding_status` | `user_onboarding_status` | User onboarding state |
| `onboarding_steps` | `user_onboarding_steps` | User onboarding progress |
| `onboarding_surveys` | `user_onboarding_surveys` | User survey responses |
| `reminder_states` | `user_reminder_states` | User reminder state tracking |

### GROUP 3: Workspace (1 table)
| Current | New | Reason |
|---------|-----|--------|
| `workspace` | `workspaces` | Plural consistency |

### GROUP 4: Communications Domain (2 tables)
| Current | New | Reason | Code Impact |
|---------|-----|--------|-------------|
| `messages` | `comms_messages` | Avoid future collisions | 3 refs (seed data) |
| `scheduled_messages` | `comms_scheduled_messages` | Multi-channel messaging | 0 refs |

### GROUP 5: Call/Voice Domain (3 tables)
| Current | New | Reason |
|---------|-----|--------|
| `calls` | `call_logs` | Call logging, avoid collision |
| `transcripts` | `call_transcripts` | Call-specific transcripts |
| `transcript_segments` | `call_transcript_segments` | Call transcript segments |

### GROUP 6: Deal Management - NO CHANGE ✅
| Current | Status | DBA Decision |
|---------|--------|--------------|
| `deals` | Keep as-is | Entity name is already clear. `deal_pipeline` would be semantic drift (implies workflow, not entity). Optional future rename to `crm_deals` in Phase 2. |

### GROUP 7: AI/Assistant (1 table)
| Current | New | Reason | Code Impact |
|---------|-----|--------|-------------|
| `ai_jobs` | `assistant_jobs` | Pattern consistency with assistant_sessions | 10 refs (3 hooks) |

---

## Phase 2: User-Facing Tables (16 Tables)

**Deploy:** After Phase 1 stable in production (2-4 weeks)
**Code Impact:** HIGH (profiles, leads, contacts used extensively)
**Risk:** MEDIUM

### GROUP 8: User Profile (1 table) - HIGHEST PRIORITY
| Current | New | Rationale |
|---------|-----|-----------|
| `profiles` | `user_profiles` | Most queried table. Generic name costs brainpower forever. |

### GROUP 9: CRM Domain (4 tables) - HIGH PRIORITY
| Current | New | Rationale |
|---------|-----|-----------|
| `leads` | `crm_leads` | Generic, will collide with other "lead" concepts |
| `contacts` | `crm_contacts` | Generic, will collide with contact lists |
| `lead_contacts` | `crm_lead_contacts` | Domain consistency |
| `lead_notes` | `crm_lead_notes` | Domain consistency |

**Optional:** Also rename `deals` → `crm_deals` and `deal_events` → `crm_deal_events` for complete CRM consistency

### GROUP 10: Security & Auth (3 tables) - MEDIUM PRIORITY
| Current | New | Rationale |
|---------|-----|-----------|
| `oauth_tokens` | `security_oauth_tokens` | Security boundary object |
| `api_keys` | `security_api_keys` | Security boundary object |
| `user_mfa` | `user_mfa_settings` | Consistency with user_mfa_* tables |

### GROUP 11: Email Domain (3 tables) - MEDIUM PRIORITY
| Current | New | Rationale |
|---------|-----|-----------|
| `email_logs` | `comms_email_logs` | Delivery logs = comms domain |
| `email_preferences` | `user_email_preferences` | User settings = user domain |
| `email_change_history` | `security_email_change_history` | Audit = security domain |

### GROUP 12: Billing Domain (4 tables) - LOW PRIORITY
| Current | New | Rationale |
|---------|-----|-----------|
| `stripe_customers` | `billing_stripe_customers` | Future-proof against provider changes |
| `stripe_products` | `billing_stripe_products` | Future-proof against provider changes |
| `subscription_notifications` | `billing_subscription_notifications` | Optional (already clear) |
| `subscription_events` | `billing_subscription_events` | Optional (already clear) |

### GROUP 13: Reminders (1 table) - LOW PRIORITY
| Current | New | Rationale |
|---------|-----|-----------|
| `reminder_logs` | `user_reminder_logs` | Consistency with user_reminder_states |

---

## Zero-Downtime Deployment Strategy

### Compatibility Views Approach

**Problem:** Renaming tables causes immediate breakage for existing code

**Solution:** Create updatable views with old names

```sql
-- After renaming
ALTER TABLE messages RENAME TO comms_messages;

-- Create compatibility view
CREATE VIEW messages AS SELECT * FROM comms_messages;
```

**Benefits:**
- Old code continues working during deployment
- True zero-downtime migration
- No urgent code updates required

**Cleanup:**
- Deploy view cleanup migration 24-48 hours after code updates
- Remove all compatibility views once verified

---

## Migration Execution Plan (Phase 1)

### Step 1: Deploy Migration to Database (~5 seconds)

**File:** `supabase/migrations/20260117_comprehensive_database_standardization.sql`

- Rename all 19 tables
- Create 6 compatibility views (messages, scheduled_messages, calls, transcripts, transcript_segments, ai_jobs)
- Verify all tables and views exist
- Transaction-safe (BEGIN/COMMIT)

### Step 2: Deploy Code Updates (~30 minutes)

**File:** `scripts/standardize-database-references.sh`

- Update `messages` → `comms_messages` (3 refs)
- Update `ai_jobs` → `assistant_jobs` (10 refs)
- Regenerate TypeScript types
- Create 3 git commits

### Step 3: Deploy Cleanup Migration (24-48 hours later)

**File:** `supabase/migrations/20260118_remove_compatibility_views.sql`

- Drop all 6 compatibility views
- Once all code verified using new table names

---

## Verification & Testing

### Pre-Migration Verification

```sql
-- List all tables to be renamed
SELECT tablename FROM pg_tables
WHERE table_schema = 'public'
AND tablename IN (
  'feature_flags', 'rate_limits', 'usage_logs', 'feature_usage_stats',
  'scheduled_deletions', 'mfa_pending_setup', 'mfa_recovery_codes',
  'reset_tokens', 'onboarding_status', 'onboarding_steps',
  'onboarding_surveys', 'reminder_states', 'workspace',
  'messages', 'scheduled_messages', 'calls', 'transcripts',
  'transcript_segments', 'ai_jobs'
)
ORDER BY tablename;
```

### Post-Migration Verification

```sql
-- Verify RLS policies auto-updated
SELECT tablename, policyname
FROM pg_policies
WHERE tablename IN (
  'system_feature_flags', 'comms_messages', 'assistant_jobs'
-- ... etc
)
ORDER BY tablename, policyname;

-- Verify foreign keys intact
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('comms_messages', 'assistant_jobs')
ORDER BY tc.table_name;

-- Check for stored functions referencing old names
SELECT
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%messages%'
   OR pg_get_functiondef(p.oid) ILIKE '%ai_jobs%'
ORDER BY schema, function_name;
```

---

## Rollback Strategy

### Phase 1 Rollback

**File:** `supabase/migrations/20260117_comprehensive_database_standardization_ROLLBACK.sql`

```sql
BEGIN;

-- Drop compatibility views first
DROP VIEW IF EXISTS ai_jobs;
DROP VIEW IF EXISTS transcript_segments;
DROP VIEW IF EXISTS transcripts;
DROP VIEW IF EXISTS calls;
DROP VIEW IF EXISTS scheduled_messages;
DROP VIEW IF EXISTS messages;

-- Reverse all renames (GROUP 7 → GROUP 1)
ALTER TABLE assistant_jobs RENAME TO ai_jobs;
ALTER TABLE call_transcript_segments RENAME TO transcript_segments;
ALTER TABLE call_transcripts RENAME TO transcripts;
ALTER TABLE call_logs RENAME TO calls;
ALTER TABLE comms_scheduled_messages RENAME TO scheduled_messages;
ALTER TABLE comms_messages RENAME TO messages;
ALTER TABLE workspaces RENAME TO workspace;
ALTER TABLE user_reminder_states RENAME TO reminder_states;
-- ... all other reversals

COMMIT;
```

**Rollback Time:** ~5 seconds

---

## Deliverables

### Phase 1
- [x] Migration file: `supabase/migrations/20260117_comprehensive_database_standardization.sql`
- [x] Rollback file: `supabase/migrations/20260117_comprehensive_database_standardization_ROLLBACK.sql`
- [x] Cleanup file: `supabase/migrations/20260118_remove_compatibility_views.sql`
- [x] Automation script: `scripts/standardize-database-references.sh`
- [ ] Test migration on staging
- [ ] Verify RLS policies
- [ ] Verify stored functions/triggers
- [ ] Update `docs/DATABASE_SCHEMA.md`
- [ ] Update `docs/DATABASE_NAMING_CONVENTIONS.md`

### Phase 2 (Future)
- [ ] Phase 2 migration manifest
- [ ] Phase 2 migration file
- [ ] Phase 2 rollback file
- [ ] Phase 2 automation script
- [ ] Code impact analysis for profiles/leads/contacts

---

## Testing Checklist

### Phase 1
- [ ] Run migration on local/staging Supabase
- [ ] Verify all 19 tables renamed
- [ ] Verify all 6 compatibility views created
- [ ] Verify RLS policies still work
- [ ] Verify foreign keys intact
- [ ] Test rollback script (on copy)
- [ ] Run automation script
- [ ] Verify 13 code references updated
- [ ] TypeScript types regenerated
- [ ] npm run type-check passes
- [ ] npm test passes
- [ ] Manual smoke tests:
  - [ ] View messages/communications
  - [ ] Trigger AI assistant jobs
  - [ ] View call logs/transcripts
  - [ ] Admin dashboard loads
  - [ ] Seed database works
- [ ] Deploy to staging
- [ ] Monitor staging 48 hours
- [ ] Get stakeholder approval

---

## Coordination with Other Zones

**Independent:** Can execute immediately, no dependencies

**Blocks Zone F:** Frontend code should update table references after migration (but compatibility views allow grace period)

**Communication:**
- Post in #engineering Slack when Phase 1 migration deployed
- Notify team when compatibility views will be removed (24-48h notice)
- Post Phase 2 timeline once Phase 1 is stable

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Migration fails mid-transaction | LOW | HIGH | Transaction-safe SQL, test on staging first |
| Missed code reference | MEDIUM | MEDIUM | Automated script + manual review + compatibility views buy time |
| RLS policies break | VERY LOW | HIGH | Postgres auto-updates OID-based policies, but verify manually |
| Stored functions reference old names | LOW | MEDIUM | Search all functions/triggers pre-migration, update manually if found |
| Compatibility views cause confusion | LOW | LOW | Clear comments in code, remove views after 48h |

---

## Success Criteria

### Phase 1
- ✅ All 19 tables renamed
- ✅ Zero data loss
- ✅ Zero PostgreSQL errors
- ✅ All RLS policies working
- ✅ All foreign keys intact
- ✅ All 13 code references updated
- ✅ TypeScript types regenerated
- ✅ All tests passing
- ✅ App fully functional in staging
- ✅ Zero production errors after deployment

### Phase 2 (Future)
- TBD after Phase 1 completion

---

## Notes

- **deals table:** Kept as-is in Phase 1 per DBA recommendation (no semantic drift)
- **Junction table:** NOT created in Phase 1 (deferred to future work if needed)
- **Profiles rename:** Deferred to Phase 2 due to high code impact
- **CRM domain:** Deferred to Phase 2 for batch consistency
