-- Rollback Migration: Create Core Tables
-- Description: Drop all core tables (deals, leads, re_properties, re_documents)
-- Phase: 1 - Critical Security
-- WARNING: This will delete ALL data in these tables

-- ============================================================================
-- DROP TABLES (in reverse dependency order)
-- ============================================================================

-- Drop RLS policies first
DROP POLICY IF EXISTS "Users can delete their own documents" ON re_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON re_documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON re_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON re_documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON re_documents;

DROP POLICY IF EXISTS "Users can delete their own deals" ON deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON deals;
DROP POLICY IF EXISTS "Admins can view all deals" ON deals;
DROP POLICY IF EXISTS "Users can view their own deals" ON deals;

DROP POLICY IF EXISTS "Users can delete their own properties" ON re_properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON re_properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON re_properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON re_properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON re_properties;

DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS re_documents CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS re_properties CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'critical',
  'migration-rollback',
  'Rolled back core tables creation - DATA LOSS OCCURRED',
  jsonb_build_object(
    'migration', '20260116_create_core_tables',
    'action', 'rollback',
    'tables_dropped', ARRAY['leads', 're_properties', 'deals', 're_documents'],
    'warning', 'All data in these tables has been permanently deleted',
    'recovery', 'Restore from backup if this rollback was unintended'
  )
);
