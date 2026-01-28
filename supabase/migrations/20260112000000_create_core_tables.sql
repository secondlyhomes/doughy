-- Migration: Create core tables (deals, leads, re_properties, re_documents)
-- Description: Foundation tables for deal pipeline, CRM, and real estate management
-- Phase: 1 - Critical Foundation
-- Note: These tables are referenced by existing ai_jobs and deal_events tables

-- ============================================================================
-- 1. LEADS TABLE
-- ============================================================================
-- CRM leads/prospects table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID, -- Optional workspace reference

  -- Contact information
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,

  -- Lead qualification
  status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'active', 'qualified', 'unqualified', 'closed')),
  score INT CHECK(score >= 0 AND score <= 100),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Communication preferences
  opt_status TEXT DEFAULT 'opted_in' CHECK(opt_status IN ('opted_in', 'opted_out', 'pending')),

  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_workspace_id ON leads(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_leads_status ON leads(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ============================================================================
-- 2. RE_PROPERTIES TABLE
-- ============================================================================
-- Real estate property listings
CREATE TABLE IF NOT EXISTS re_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Address
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,

  -- Property details
  bedrooms INT,
  bathrooms NUMERIC(3,1),
  square_feet INT,
  lot_size INT,
  year_built INT CHECK(year_built >= 1800 AND year_built <= EXTRACT(YEAR FROM NOW()) + 5),

  -- Financial
  purchase_price NUMERIC(12,2),
  arv NUMERIC(12,2), -- After Repair Value

  -- Status and categorization
  status TEXT DEFAULT 'active',
  property_type TEXT,
  mls_id TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for re_properties
CREATE INDEX idx_re_properties_user_id ON re_properties(user_id);
CREATE INDEX idx_re_properties_status ON re_properties(status);
CREATE INDEX idx_re_properties_city_state ON re_properties(city, state);
CREATE INDEX idx_re_properties_zip ON re_properties(zip);
CREATE INDEX idx_re_properties_created_at ON re_properties(created_at DESC);

-- ============================================================================
-- 3. DEALS TABLE
-- ============================================================================
-- Deal pipeline management (links leads to properties)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  property_id UUID REFERENCES re_properties(id) ON DELETE SET NULL,

  -- Deal status
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'won', 'lost', 'archived')),
  stage TEXT NOT NULL DEFAULT 'initial_contact',

  -- Deal details
  title TEXT NOT NULL,
  estimated_value NUMERIC(12,2),
  probability INT CHECK(probability >= 0 AND probability <= 100),
  expected_close_date DATE,

  -- Action tracking
  next_action TEXT,
  next_action_due TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for deals
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_next_action_due ON deals(next_action_due) WHERE next_action_due IS NOT NULL;
CREATE INDEX idx_deals_lead_id ON deals(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_deals_property_id ON deals(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_deals_created_at ON deals(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_deals_user_status ON deals(user_id, status);
CREATE INDEX idx_deals_user_stage ON deals(user_id, stage);

-- ============================================================================
-- 4. RE_DOCUMENTS TABLE
-- ============================================================================
-- Document management for properties and deals
CREATE TABLE IF NOT EXISTS re_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships (property-scoped with optional deal context)
  property_id UUID REFERENCES re_properties(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Document metadata
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    -- Research phase
    'inspection', 'appraisal', 'title_search', 'survey', 'photo', 'comp',
    -- Transaction phase
    'offer', 'counter_offer', 'purchase_agreement', 'addendum',
    'closing_statement', 'hud1', 'deed', 'contract',
    -- Other
    'receipt', 'other'
  )),

  -- File information
  file_url TEXT NOT NULL,
  file_size INT,
  content_type VARCHAR(100),

  -- Tracking
  uploaded_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for re_documents
CREATE INDEX idx_re_documents_user_id ON re_documents(user_id);
CREATE INDEX idx_re_documents_property_id ON re_documents(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_re_documents_deal_id ON re_documents(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_re_documents_type ON re_documents(type);
CREATE INDEX idx_re_documents_created_at ON re_documents(created_at DESC);

-- Composite indexes
CREATE INDEX idx_re_documents_user_type ON re_documents(user_id, type);
CREATE INDEX idx_re_documents_property_created ON re_documents(property_id, created_at DESC) WHERE property_id IS NOT NULL;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE re_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE re_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- LEADS policies
CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON leads FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- RE_PROPERTIES policies
CREATE POLICY "Users can view their own properties"
  ON re_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties"
  ON re_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON re_properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties"
  ON re_properties FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all properties"
  ON re_properties FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- DEALS policies
CREATE POLICY "Users can view their own deals"
  ON deals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deals"
  ON deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals"
  ON deals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deals"
  ON deals FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deals"
  ON deals FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- RE_DOCUMENTS policies
CREATE POLICY "Users can view their own documents"
  ON re_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON re_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON re_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON re_documents FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
  ON re_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- Migration complete: core tables with RLS policies
