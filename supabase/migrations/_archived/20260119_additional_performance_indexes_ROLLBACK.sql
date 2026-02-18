-- Rollback Migration: Additional Performance Indexes
-- Description: Drop all performance indexes added in Sprint 4
-- Phase: Sprint 4 - Final Optimization
-- WARNING: This may impact query performance

-- ============================================================================
-- DROP EXPRESSION INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_sms_inbox_phone_normalized;
DROP INDEX IF EXISTS idx_leads_phone_normalized;

-- ============================================================================
-- DROP COVERING INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_sms_inbox_covering;
DROP INDEX IF EXISTS idx_leads_list_covering;
DROP INDEX IF EXISTS idx_portfolio_val_covering;

-- ============================================================================
-- DROP PARTIAL INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_sms_inbox_urgent;
DROP INDEX IF EXISTS idx_portfolio_val_recent;
DROP INDEX IF EXISTS idx_leads_hot;
DROP INDEX IF EXISTS idx_deals_upcoming_week;

-- ============================================================================
-- DROP CROSS-TABLE QUERY INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_deals_lead_user;
DROP INDEX IF EXISTS idx_deals_property_user;

-- ============================================================================
-- DROP SPRINT 3 TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_doc_templates_search;
DROP INDEX IF EXISTS idx_sms_inbox_converted;
DROP INDEX IF EXISTS idx_sms_inbox_dashboard;

-- ============================================================================
-- DROP SPRINT 2 TABLE INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_calc_overrides_scope;
DROP INDEX IF EXISTS idx_leads_financial_metrics;
DROP INDEX IF EXISTS idx_leads_seller_finance_ready;
DROP INDEX IF EXISTS idx_deals_portfolio_status;
DROP INDEX IF EXISTS idx_portfolio_val_latest;

-- ============================================================================
-- LOG ROLLBACK
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'warning',
  'migration-rollback',
  'Rolled back additional performance indexes',
  jsonb_build_object(
    'migration', '20260119_additional_performance_indexes',
    'action', 'rollback',
    'indexes_dropped', 19,
    'performance_impact', 'Queries may be slower without these optimizations',
    'note', 'Core indexes from original table creation migrations remain intact'
  )
);
