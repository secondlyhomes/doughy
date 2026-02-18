-- Rollback Migration: PostgreSQL ENUM Types
-- Description: Convert ENUM columns back to TEXT with CHECK constraints
-- Phase: 4 - Performance & Quality
-- WARNING: This migration is complex and may fail if new enum values were added

-- ============================================================================
-- CONVERT ENUM COLUMNS BACK TO TEXT
-- ============================================================================

-- Deals table - convert status back to TEXT
ALTER TABLE deals
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- Leads table - convert status and opt_status back to TEXT
ALTER TABLE leads
  ALTER COLUMN status TYPE TEXT USING status::TEXT,
  ALTER COLUMN opt_status TYPE TEXT USING opt_status::TEXT;

-- Re_documents table - convert type back to TEXT
ALTER TABLE re_documents
  ALTER COLUMN type TYPE TEXT USING type::TEXT;

-- Re_lead_documents table - convert type back to TEXT
ALTER TABLE re_lead_documents
  ALTER COLUMN type TYPE TEXT USING type::TEXT;

-- Profiles table - convert role back to TEXT
ALTER TABLE profiles
  ALTER COLUMN role TYPE TEXT USING role::TEXT;

-- Messages table (if exists) - convert channel, direction, status back to TEXT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE messages
      ALTER COLUMN channel TYPE TEXT USING channel::TEXT,
      ALTER COLUMN direction TYPE TEXT USING direction::TEXT,
      ALTER COLUMN status TYPE TEXT USING status::TEXT;
  END IF;
END $$;

-- AI_jobs table - convert status back to TEXT
ALTER TABLE ai_jobs
  ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- ============================================================================
-- RE-ADD CHECK CONSTRAINTS
-- ============================================================================

-- Deals
ALTER TABLE deals ADD CONSTRAINT deals_status_check
  CHECK(status IN ('active', 'won', 'lost', 'archived'));

-- Leads
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK(status IN ('new', 'active', 'qualified', 'unqualified', 'closed'));

ALTER TABLE leads ADD CONSTRAINT leads_opt_status_check
  CHECK(opt_status IN ('opted_in', 'opted_out', 'pending'));

-- Re_documents
ALTER TABLE re_documents ADD CONSTRAINT re_documents_type_check
  CHECK(type IN (
    'inspection', 'appraisal', 'title_search', 'survey', 'photo', 'comp',
    'offer', 'counter_offer', 'purchase_agreement', 'addendum',
    'closing_statement', 'hud1', 'deed', 'contract', 'receipt', 'other'
  ));

-- Re_lead_documents
ALTER TABLE re_lead_documents ADD CONSTRAINT re_lead_documents_type_check
  CHECK(type IN ('id', 'tax_return', 'bank_statement', 'w9', 'death_cert', 'poa', 'other'));

-- AI_jobs
ALTER TABLE ai_jobs ADD CONSTRAINT ai_jobs_status_check
  CHECK(status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled'));

-- ============================================================================
-- DROP ENUM TYPES
-- ============================================================================

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS lead_document_type CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS message_status CASCADE;
DROP TYPE IF EXISTS message_direction CASCADE;
DROP TYPE IF EXISTS message_channel CASCADE;
DROP TYPE IF EXISTS opt_status CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TYPE IF EXISTS deal_status CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration-rollback',
  'Rolled back PostgreSQL ENUM types to TEXT with CHECK constraints',
  jsonb_build_object(
    'migration', '20260118_add_enum_types',
    'action', 'rollback',
    'types_dropped', ARRAY[
      'deal_status', 'lead_status', 'opt_status',
      'message_channel', 'message_direction', 'message_status',
      'job_status', 'document_type', 'lead_document_type', 'user_role'
    ],
    'impact', 'Columns reverted to TEXT with CHECK constraints',
    'note', 'Type safety reduced, but functionality preserved'
  )
);
