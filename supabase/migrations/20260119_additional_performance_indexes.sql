-- Migration: Additional Performance Indexes
-- Description: Add remaining indexes for Sprint 2-3 tables and optimize queries
-- Phase: Sprint 4 - Final Optimization

-- ============================================================================
-- SPRINT 2 TABLE INDEXES
-- ============================================================================

-- Portfolio Valuations: Index for latest valuation per property
CREATE INDEX IF NOT EXISTS idx_portfolio_val_latest
  ON re_portfolio_valuations(property_id, valuation_date DESC, source)
  WHERE valuation_date > NOW() - INTERVAL '1 year'; -- Only recent valuations

-- Deals: Index for portfolio tracking queries
CREATE INDEX IF NOT EXISTS idx_deals_portfolio_status
  ON deals(user_id, status, added_to_portfolio)
  WHERE status = 'won'; -- Only won deals

-- Leads: Creative finance qualification queries
CREATE INDEX IF NOT EXISTS idx_leads_seller_finance_ready
  ON leads(user_id, motivation, timeline, current_mortgage_status)
  WHERE motivation IS NOT NULL
    AND timeline IN ('asap', '1_3_months')
    AND current_mortgage_status IN ('current', '1_2_behind');

-- Leads: Financial situation queries
CREATE INDEX IF NOT EXISTS idx_leads_financial_metrics
  ON leads(user_id, monthly_obligations, existing_mortgage_balance)
  WHERE monthly_obligations IS NOT NULL
    OR existing_mortgage_balance IS NOT NULL;

-- Calculation Overrides: Global vs property/deal specific
CREATE INDEX IF NOT EXISTS idx_calc_overrides_scope
  ON re_calculation_overrides(user_id, metric_name, property_id, deal_id);

-- ============================================================================
-- SPRINT 3 TABLE INDEXES
-- ============================================================================

-- SMS Inbox: Composite index for admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_sms_inbox_dashboard
  ON sms_inbox(status, created_at DESC, phone_number);

-- SMS Inbox: Index for conversion tracking
CREATE INDEX IF NOT EXISTS idx_sms_inbox_converted
  ON sms_inbox(lead_id, created_at DESC)
  WHERE lead_id IS NOT NULL;

-- Document Templates: Index for user searches
CREATE INDEX IF NOT EXISTS idx_doc_templates_search
  ON re_document_templates(template_type, is_active, is_system, created_at DESC);

-- ============================================================================
-- CROSS-TABLE QUERY OPTIMIZATION
-- ============================================================================

-- Deals with properties: Optimize JOIN queries
CREATE INDEX IF NOT EXISTS idx_deals_property_user
  ON deals(property_id, user_id)
  WHERE property_id IS NOT NULL;

-- Deals with leads: Optimize JOIN queries
CREATE INDEX IF NOT EXISTS idx_deals_lead_user
  ON deals(lead_id, user_id)
  WHERE lead_id IS NOT NULL;

-- Documents with properties: Already has idx_re_documents_property_id

-- Documents with deals: Already has idx_re_documents_deal_id

-- ============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ============================================================================

-- Active deals with next actions in next 7 days (dashboard widget)
CREATE INDEX IF NOT EXISTS idx_deals_upcoming_week
  ON deals(user_id, next_action_due, next_action)
  WHERE status = 'active'
    AND next_action_due IS NOT NULL
    AND next_action_due <= NOW() + INTERVAL '7 days';

-- Hot leads (high score, active status, recent)
CREATE INDEX IF NOT EXISTS idx_leads_hot
  ON leads(user_id, score DESC, created_at DESC)
  WHERE status IN ('active', 'qualified')
    AND score >= 80
    AND is_deleted = FALSE;

-- Recent portfolio valuations (last 6 months)
CREATE INDEX IF NOT EXISTS idx_portfolio_val_recent
  ON re_portfolio_valuations(user_id, valuation_date DESC)
  WHERE valuation_date > NOW() - INTERVAL '6 months';

-- Pending SMS messages (needs immediate attention)
CREATE INDEX IF NOT EXISTS idx_sms_inbox_urgent
  ON sms_inbox(created_at ASC, phone_number)
  WHERE status = 'pending_review'
    AND created_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- COVERING INDEXES (Include commonly selected columns)
-- ============================================================================

-- Portfolio valuations covering index
CREATE INDEX IF NOT EXISTS idx_portfolio_val_covering
  ON re_portfolio_valuations(property_id, valuation_date DESC)
  INCLUDE (estimated_value, source);

-- Leads covering index for list views
CREATE INDEX IF NOT EXISTS idx_leads_list_covering
  ON leads(user_id, created_at DESC)
  INCLUDE (name, phone, email, status, score)
  WHERE is_deleted = FALSE;

-- SMS inbox covering index for dashboard
CREATE INDEX IF NOT EXISTS idx_sms_inbox_covering
  ON sms_inbox(status, created_at DESC)
  INCLUDE (phone_number, message_body, lead_id);

-- ============================================================================
-- EXPRESSION INDEXES
-- ============================================================================

-- Leads: Search by normalized phone number
CREATE INDEX IF NOT EXISTS idx_leads_phone_normalized
  ON leads(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'))
  WHERE phone IS NOT NULL;

-- SMS Inbox: Search by normalized phone number
CREATE INDEX IF NOT EXISTS idx_sms_inbox_phone_normalized
  ON sms_inbox(REGEXP_REPLACE(phone_number, '[^0-9]', '', 'g'));

-- ============================================================================
-- STATISTICS UPDATE
-- ============================================================================

-- Analyze all new tables to update query planner statistics
ANALYZE re_portfolio_valuations;
ANALYZE re_calculation_overrides;
ANALYZE sms_inbox;
ANALYZE re_document_templates;
ANALYZE re_user_calculation_preferences;

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================

INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Added additional performance indexes for Sprint 2-3 tables',
  jsonb_build_object(
    'migration', '20260119_additional_performance_indexes',
    'new_indexes', 19,
    'partial_indexes', 4,
    'covering_indexes', 3,
    'expression_indexes', 2,
    'tables_analyzed', 5,
    'purpose', 'Optimize common query patterns for portfolio, creative finance, SMS, and templates'
  )
);
