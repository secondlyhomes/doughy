-- Migration: Add PostgreSQL ENUM types for better type safety
-- Description: Replace TEXT + CHECK constraints with proper ENUM types
-- Phase: 4 - Performance & Quality

-- ============================================================================
-- CREATE ENUM TYPES
-- ============================================================================

-- Deal statuses
CREATE TYPE deal_status AS ENUM ('active', 'won', 'lost', 'archived');

-- Lead statuses
CREATE TYPE lead_status AS ENUM ('new', 'active', 'qualified', 'unqualified', 'closed');

-- Lead opt statuses (SMS/communication preferences)
CREATE TYPE opt_status AS ENUM ('opted_in', 'opted_out', 'pending');

-- Message channels
CREATE TYPE message_channel AS ENUM ('sms', 'email', 'voice');

-- Message directions
CREATE TYPE message_direction AS ENUM ('incoming', 'outgoing');

-- Message statuses
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'failed', 'pending', 'read');

-- AI job statuses
CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');

-- Document types (property documents)
CREATE TYPE document_type AS ENUM (
  -- Research phase
  'inspection', 'appraisal', 'title_search', 'survey', 'photo', 'comp',
  -- Transaction phase
  'offer', 'counter_offer', 'purchase_agreement', 'addendum',
  'closing_statement', 'hud1', 'deed', 'contract',
  -- Other
  'receipt', 'other'
);

-- Lead document types (seller documents)
CREATE TYPE lead_document_type AS ENUM (
  'id',             -- Government ID
  'tax_return',     -- Tax returns
  'bank_statement', -- Bank statements
  'w9',             -- W-9 form
  'death_cert',     -- Death certificate
  'poa',            -- Power of Attorney
  'other'           -- Other
);

-- User roles (for profiles)
CREATE TYPE user_role AS ENUM ('user', 'admin', 'support', 'standard');

-- ============================================================================
-- MIGRATE EXISTING TABLES TO USE ENUMS
-- ============================================================================

-- Deals table
ALTER TABLE deals
  ALTER COLUMN status TYPE deal_status USING status::deal_status;

-- Leads table
ALTER TABLE leads
  ALTER COLUMN status TYPE lead_status USING status::lead_status,
  ALTER COLUMN opt_status TYPE opt_status USING opt_status::opt_status;

-- Re_documents table
ALTER TABLE re_documents
  ALTER COLUMN type TYPE document_type USING type::document_type;

-- Re_lead_documents table
ALTER TABLE re_lead_documents
  ALTER COLUMN type TYPE lead_document_type USING type::lead_document_type;

-- Profiles table
ALTER TABLE profiles
  ALTER COLUMN role TYPE user_role USING role::user_role;

-- Messages table (if exists - handle gracefully)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE messages
      ALTER COLUMN channel TYPE message_channel USING channel::message_channel,
      ALTER COLUMN direction TYPE message_direction USING direction::message_direction,
      ALTER COLUMN status TYPE message_status USING status::message_status;
  END IF;
END $$;

-- AI_jobs table - migrate from CHECK constraint to ENUM
DO $$
BEGIN
  -- Drop the existing CHECK constraint
  ALTER TABLE ai_jobs DROP CONSTRAINT IF EXISTS ai_jobs_status_check;

  -- Alter column to use enum
  ALTER TABLE ai_jobs
    ALTER COLUMN status TYPE job_status USING status::job_status;
END $$;

-- ============================================================================
-- DROP OLD CHECK CONSTRAINTS (now enforced by ENUMs)
-- ============================================================================

-- Deals
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_status_check;

-- Leads
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_opt_status_check;

-- Re_documents
ALTER TABLE re_documents DROP CONSTRAINT IF EXISTS re_documents_type_check;

-- Re_lead_documents
ALTER TABLE re_lead_documents DROP CONSTRAINT IF EXISTS re_lead_documents_type_check;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added PostgreSQL ENUM types for type safety',
  jsonb_build_object(
    'migration', '20260118_add_enum_types',
    'enums_created', ARRAY[
      'deal_status', 'lead_status', 'opt_status',
      'message_channel', 'message_direction', 'message_status',
      'job_status', 'document_type', 'lead_document_type', 'user_role'
    ],
    'tables_migrated', ARRAY[
      'deals', 'leads', 're_documents', 're_lead_documents', 'profiles', 'ai_jobs'
    ],
    'benefit', 'Improved type safety and query performance'
  )
);
