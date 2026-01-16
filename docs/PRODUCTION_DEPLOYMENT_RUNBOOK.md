# Production Deployment Runbook (DB Standardization)

**Date:** 2026-01-16
**Scope:** Phase 1 + Phase 2 table renames (35 tables) already validated in staging
**Goal:** Deploy safely to production with minimal risk

---

## Option 1 — True Zero-Downtime (Compatibility Views) ✅ Recommended

### Step 0 — Preconditions

1. **Confirm staging is healthy** + latest commit deployed
2. **Confirm production code version** is still using OLD names (pre-migration)
3. **Ensure you have DB backup** / point-in-time recovery enabled

### Step 1 — Apply DB Migration (rename + compat views in same transaction)

4. **Run the production migration script:**
   ```bash
   supabase db push
   ```
   (or apply via Supabase Dashboard SQL editor)

   **Migration must include:**
   - `ALTER TABLE ... RENAME TO ...`
   - `CREATE VIEW old_name AS SELECT * FROM new_name;`

   ✅ Both rename and view creation happen in **same transaction**

### Step 2 — Verify Migration Success

5. **Verify expected new tables exist** (quick check):
   ```sql
   SELECT tablename
   FROM pg_tables
   WHERE schemaname='public'
   ORDER BY tablename;
   ```

6. **Verify compatibility views exist** (quick check):
   ```sql
   SELECT table_name
   FROM information_schema.views
   WHERE table_schema='public'
   ORDER BY table_name;
   ```

### Step 3 — Deploy Production Code (new names)

7. **Deploy app to production** (the version that uses only NEW names)

### Step 4 — Post-Deploy Smoke Test

8. **Validate critical flows in production:**
   - ✅ Deals list/create/update/delete
   - ✅ CRM leads load + update
   - ✅ Calls/transcripts display
   - ✅ Messages send/schedule
   - ✅ Assistant jobs trigger
   - ✅ Admin dashboard loads

### Step 5 — Monitor

9. **Monitor error logs for 30–60 minutes** (DB + app)

### Step 6 — Remove Compatibility Views (after 24–48h)

10. **Run cleanup migration:** drop all old-name compatibility views
11. **Regenerate types if needed** (optional) and ensure no old references

✅ **Done. Zero downtime and no deploy-order risk.**

---

## Option 2 — Maintenance Window (Fast + Simple)

### Step 0 — Preconditions

1. **Schedule a 2–5 minute maintenance window**
2. **Put site in "maintenance mode"** (or temporarily block writes)

### Step 1 — Apply DB Migration

3. **Run production DB migration** (rename tables only)

### Step 2 — Deploy Code Immediately

4. **Deploy the production app build** that uses NEW names only

### Step 3 — Smoke Test

5. **Validate critical flows:**
   - ✅ Deals CRUD
   - ✅ CRM leads loading
   - ✅ Calls/transcripts display
   - ✅ Messages scheduled
   - ✅ Assistant jobs trigger
   - ✅ Admin dashboard

### Step 4 — End Maintenance

6. **Remove maintenance mode**
7. **Monitor logs for 30–60 minutes**

✅ **Done. Small downtime but simplest rollout.**

---

## Rollback Plan (Both Options)

If anything breaks hard:

1. **Deploy previous application version** (immediate)
2. **Apply rollback migration** (reverse all renames)
3. **Re-run smoke tests**
4. **Open incident ticket + capture logs**

---

## Migration Files Reference

**Phase 1 + Phase 2 Migrations:**
- `/supabase/migrations/20260117_database_standardization_phase1.sql`
- `/supabase/migrations/20260117_database_standardization_phase2.sql`

**Rollback Scripts:**
- `/supabase/migrations/20260117_database_standardization_phase1_ROLLBACK.sql`
- `/supabase/migrations/20260117_database_standardization_phase2_ROLLBACK.sql`

**Cleanup Migration (for Option 1):**
- `/supabase/migrations/20260119_remove_compatibility_views.sql`

---

## Pre-Deployment Checklist

**Before starting deployment:**

- [ ] Staging environment fully tested (48+ hours monitoring)
- [ ] All tests passing in production code
- [ ] Database backup confirmed
- [ ] Team notified of deployment window
- [ ] Rollback scripts tested and ready
- [ ] Production monitoring dashboards open
- [ ] On-call engineer available

---

## Tables Being Renamed (35 total)

### Phase 1 (19 tables):
- System: `feature_flags`, `rate_limits`, `usage_logs`, `scheduled_deletions` → `system_*`
- Analytics: `feature_usage_stats` → `analytics_feature_usage_stats`
- User/Auth: 7 tables → `user_*` / `security_*`
- Workspace: `workspace` → `workspaces`
- Communications: `messages`, `scheduled_messages` → `comms_*`
- Call: `calls`, `transcripts`, `transcript_segments` → `call_*`
- Assistant: `ai_jobs` → `assistant_jobs`

### Phase 2 (16 tables):
- User: `profiles` → `user_profiles`
- CRM: `leads`, `contacts`, `lead_contacts`, `lead_notes` → `crm_*`
- Security: `oauth_tokens`, `api_keys`, `user_mfa` → `security_*` / `user_mfa_settings`
- Email: 3 tables → `comms_*` / `user_*` / `security_*`
- Billing: 4 tables → `billing_*`
- Reminders: `reminder_logs` → `user_reminder_logs`

---

## Success Criteria

**Deployment is successful when:**

- ✅ All 35 tables renamed
- ✅ Zero errors in application logs
- ✅ All smoke tests passing
- ✅ RLS policies intact (161 policies)
- ✅ Foreign keys intact (auto-updated by PostgreSQL)
- ✅ No user-reported issues
- ✅ Monitoring shows normal performance

---

## Post-Deployment

**After successful deployment:**

1. **Monitor for 24-48 hours** before dropping compatibility views
2. **Document any issues** encountered during deployment
3. **Update team wiki** with final deployment notes
4. **Schedule `system_logs` retention implementation** (2-4 weeks)

---

**Prepared By:** Engineering Team
**DBA Approved:** ✅ YES
**Last Updated:** 2026-01-16
