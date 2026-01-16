# Zone E: Database Standardization & Schema Migrations

**Owner:** Backend Developer / Database Specialist
**Timeline:** Weeks 1-2
**Dependencies:** None (can start immediately)
**Risk Level:** HIGH (touches all database tables)

---

## Mission

Standardize entire database schema by renaming 22 tables to follow DBA-approved naming conventions, create junction table for package deals, and ensure zero data loss.

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
- `re_*` = Real Estate domain (properties, pipeline, documents, analysis)

### Rule 2: Use Plural Nouns for Tables
- `assistant_sessions`, `security_event_logs`, `call_transcripts`

### Rule 3: Keep Names Boring and Literal
- No generic names without context

---

## Complete Rename Manifest (22 Tables)

### PRIMARY: Deal Domain → Real Estate Domain (2 tables)
| Current | New | Reason |
|---------|-----|--------|
| `deals` | `re_pipeline` | Deals ARE real estate pipeline entries |
| `deal_events` | `re_pipeline_events` | Timeline for pipeline |

**Junction Table:** Create `re_pipeline_properties` (one pipeline → many properties)

---

### SECONDARY: System Domain (3 tables)
| Current | New |
|---------|-----|
| `feature_flags` | `system_feature_flags` |
| `rate_limits` | `system_rate_limits` |
| `usage_logs` | `system_usage_logs` |

---

### SECONDARY: Security Domain (3 tables)
| Current | New |
|---------|-----|
| `oauth_tokens` | `security_oauth_tokens` |
| `api_keys` | `security_api_keys` |
| `reset_tokens` | `security_reset_tokens` |

---

### SECONDARY: User/MFA Domain (4 tables)
| Current | New | Notes |
|---------|-----|-------|
| `profiles` | `user_profiles` | Prefix + plural |
| `user_mfa` | `user_mfa_settings` | Optional clarity rename |
| `mfa_pending_setup` | `user_mfa_pending_setup` | |
| `mfa_recovery_codes` | `user_mfa_recovery_codes` | |

---

### SECONDARY: Analytics Domain (1 table)
| Current | New |
|---------|-----|
| `feature_usage_stats` | `analytics_feature_usage_stats` |

---

### SECONDARY: Assistant/AI Domain (1 table)
| Current | New |
|---------|-----|
| `ai_jobs` | `assistant_jobs` |

---

### SECONDARY: Call Domain (2 tables)
| Current | New |
|---------|-----|
| `transcripts` | `call_transcripts` |
| `transcript_segments` | `call_transcript_segments` |

---

### SECONDARY: Communications Domain (2 tables)
| Current | New |
|---------|-----|
| `messages` | `comms_messages` |
| `scheduled_messages` | `comms_scheduled_messages` |

---

### SECONDARY: CRM Domain (5 tables)
| Current | New | Notes |
|---------|-----|-------|
| `leads` | `crm_leads` | Avoid generic collision |
| `contacts` | `crm_contacts` | |
| `lead_contacts` | `crm_lead_contacts` | Junction table |
| `lead_notes` | `crm_lead_notes` | |
| `calls` | `call_logs` | Avoid collision with call_transcripts |

---

### SECONDARY: Workspace (1 table - pure pluralization)
| Current | New |
|---------|-----|
| `workspace` | `workspaces` |

---

## Migration Execution Order

**Why order matters:** Dependencies! Tables with fewer FK relationships first.

### Phase 1A: Rename System/Analytics/Workspace (5 tables)
```sql
ALTER TABLE feature_flags RENAME TO system_feature_flags;
ALTER TABLE rate_limits RENAME TO system_rate_limits;
ALTER TABLE usage_logs RENAME TO system_usage_logs;
ALTER TABLE feature_usage_stats RENAME TO analytics_feature_usage_stats;
ALTER TABLE workspace RENAME TO workspaces;
```

### Phase 1B: Rename Security/User/Assistant/Call/Comms (10 tables)
```sql
ALTER TABLE oauth_tokens RENAME TO security_oauth_tokens;
ALTER TABLE api_keys RENAME TO security_api_keys;
ALTER TABLE reset_tokens RENAME TO security_reset_tokens;

ALTER TABLE profiles RENAME TO user_profiles;
ALTER TABLE user_mfa RENAME TO user_mfa_settings;
ALTER TABLE mfa_pending_setup RENAME TO user_mfa_pending_setup;
ALTER TABLE mfa_recovery_codes RENAME TO user_mfa_recovery_codes;

ALTER TABLE ai_jobs RENAME TO assistant_jobs;

ALTER TABLE transcripts RENAME TO call_transcripts;
ALTER TABLE transcript_segments RENAME TO call_transcript_segments;

ALTER TABLE messages RENAME TO comms_messages;
ALTER TABLE scheduled_messages RENAME TO comms_scheduled_messages;
```

### Phase 1C: Rename CRM Domain (5 tables)
```sql
ALTER TABLE leads RENAME TO crm_leads;
ALTER TABLE contacts RENAME TO crm_contacts;
ALTER TABLE lead_contacts RENAME TO crm_lead_contacts;
ALTER TABLE lead_notes RENAME TO crm_lead_notes;
ALTER TABLE calls RENAME TO call_logs;
```

### Phase 1D: PRIMARY - Rename Deals + Create Junction Table
```sql
ALTER TABLE deals RENAME TO re_pipeline;
ALTER TABLE deal_events RENAME TO re_pipeline_events;

-- Create junction table
CREATE TABLE re_pipeline_properties (
  pipeline_id UUID NOT NULL REFERENCES re_pipeline(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES re_properties(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0 CHECK (display_order >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (pipeline_id, property_id)
);

-- Indexes
CREATE INDEX idx_re_pipeline_properties_pipeline_id ON re_pipeline_properties(pipeline_id);
CREATE INDEX idx_re_pipeline_properties_property_id ON re_pipeline_properties(property_id);
CREATE INDEX idx_re_pipeline_properties_pipeline_order ON re_pipeline_properties(pipeline_id, display_order, created_at);
CREATE INDEX idx_re_pipeline_properties_primary ON re_pipeline_properties(pipeline_id) WHERE is_primary = TRUE;
CREATE UNIQUE INDEX idx_re_pipeline_properties_one_primary ON re_pipeline_properties(pipeline_id) WHERE is_primary = TRUE;

-- RLS Policies
ALTER TABLE re_pipeline_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipeline-property links for their pipelines"
  ON re_pipeline_properties FOR SELECT
  USING (
    pipeline_id IN (SELECT id FROM re_pipeline WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create links for their pipelines"
  ON re_pipeline_properties FOR INSERT
  WITH CHECK (
    pipeline_id IN (SELECT id FROM re_pipeline WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update links for their pipelines"
  ON re_pipeline_properties FOR UPDATE
  USING (
    pipeline_id IN (SELECT id FROM re_pipeline WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete links for their pipelines"
  ON re_pipeline_properties FOR DELETE
  USING (
    pipeline_id IN (SELECT id FROM re_pipeline WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all pipeline-property links"
  ON re_pipeline_properties FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- Backfill junction table from legacy property_id column
INSERT INTO re_pipeline_properties (pipeline_id, property_id, is_primary, created_at)
SELECT id, property_id, TRUE, created_at
FROM re_pipeline
WHERE property_id IS NOT NULL
ON CONFLICT (pipeline_id, property_id) DO NOTHING;

-- Mark legacy column as deprecated (keep for compatibility)
COMMENT ON COLUMN re_pipeline.property_id IS
  'DEPRECATED: Use re_pipeline_properties junction table instead.
   Maintained for backward compatibility only. Will be removed in v2.0.0';
```

---

## Verification Queries

Run after EACH phase to ensure data integrity:

```sql
-- 1. Verify table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'system_feature_flags'
);

-- 2. Verify row count unchanged
SELECT
  'system_feature_flags' as table_name,
  COUNT(*) as row_count
FROM system_feature_flags;

-- 3. Verify RLS policies attached
SELECT tablename, policyname
FROM pg_policies
WHERE tablename = 're_pipeline_properties';

-- 4. Verify foreign keys work
SELECT COUNT(*)
FROM re_pipeline_properties rpp
JOIN re_pipeline rp ON rpp.pipeline_id = rp.id
JOIN re_properties prop ON rpp.property_id = prop.id;

-- 5. Verify junction table backfill
SELECT
  (SELECT COUNT(*) FROM re_pipeline WHERE property_id IS NOT NULL) as legacy_links,
  (SELECT COUNT(*) FROM re_pipeline_properties) as junction_links;
-- Should match!

-- 6. Performance check
EXPLAIN ANALYZE
SELECT p.*, array_agg(rpp.property_id) as property_ids
FROM re_pipeline p
LEFT JOIN re_pipeline_properties rpp ON rpp.pipeline_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id;
-- Should use indexes
```

---

## Rollback Strategy

If anything goes wrong, rollback in REVERSE order:

```sql
-- Phase 1D Rollback
DROP TABLE IF EXISTS re_pipeline_properties;
ALTER TABLE re_pipeline RENAME TO deals;
ALTER TABLE re_pipeline_events RENAME TO deal_events;

-- Phase 1C Rollback
ALTER TABLE crm_leads RENAME TO leads;
ALTER TABLE crm_contacts RENAME TO contacts;
ALTER TABLE crm_lead_contacts RENAME TO lead_contacts;
ALTER TABLE crm_lead_notes RENAME TO lead_notes;
ALTER TABLE call_logs RENAME TO calls;

-- Phase 1B Rollback
ALTER TABLE security_oauth_tokens RENAME TO oauth_tokens;
ALTER TABLE security_api_keys RENAME TO api_keys;
ALTER TABLE security_reset_tokens RENAME TO reset_tokens;
ALTER TABLE user_profiles RENAME TO profiles;
ALTER TABLE user_mfa_settings RENAME TO user_mfa;
ALTER TABLE user_mfa_pending_setup RENAME TO mfa_pending_setup;
ALTER TABLE user_mfa_recovery_codes RENAME TO mfa_recovery_codes;
ALTER TABLE assistant_jobs RENAME TO ai_jobs;
ALTER TABLE call_transcripts RENAME TO transcripts;
ALTER TABLE call_transcript_segments RENAME TO transcript_segments;
ALTER TABLE comms_messages RENAME TO messages;
ALTER TABLE comms_scheduled_messages RENAME TO scheduled_messages;

-- Phase 1A Rollback
ALTER TABLE system_feature_flags RENAME TO feature_flags;
ALTER TABLE system_rate_limits RENAME TO rate_limits;
ALTER TABLE system_usage_logs RENAME TO usage_logs;
ALTER TABLE analytics_feature_usage_stats RENAME TO feature_usage_stats;
ALTER TABLE workspaces RENAME TO workspace;
```

---

## Deliverables

- [ ] Migration file: `supabase/migrations/20260123_comprehensive_table_standardization.sql`
- [ ] Rollback file: `supabase/migrations/20260123_comprehensive_table_standardization_ROLLBACK.sql`
- [ ] Verification report: Document showing all verification queries passed
- [ ] Performance benchmarks: Query times before/after (<100ms target)
- [ ] Updated `docs/DATABASE_SCHEMA.md`
- [ ] Updated `docs/DATABASE_NAMING_CONVENTIONS.md`

---

## Testing Checklist

- [ ] Run migration on local database
- [ ] Verify all 22 tables renamed
- [ ] Verify all row counts unchanged
- [ ] Verify all FK relationships intact
- [ ] Verify RLS policies work for re_pipeline_properties
- [ ] Verify junction table backfill 100% complete
- [ ] Test rollback script (on copy of database)
- [ ] Performance testing: query time <100ms
- [ ] Deploy to staging Supabase project
- [ ] Monitor staging for 48 hours
- [ ] Get stakeholder approval

---

## Coordination with Other Zones

**Blocks Zone F:** Frontend code can't update until migration completes
**Unblocks Zone F:** Once migration deployed to staging, frontend dev can start

**Communication:** Post in #engineering Slack when each phase completes
