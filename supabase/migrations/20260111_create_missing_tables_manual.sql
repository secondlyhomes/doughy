-- Create only the missing tables: deals and re_documents
-- This is a manual fix because partial migration was applied

-- ============================================================================
-- DEALS TABLE
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_next_action_due ON deals(next_action_due) WHERE next_action_due IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_property_id ON deals(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_user_status ON deals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_user_stage ON deals(user_id, stage);

-- Enable RLS
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- RE_DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS re_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships
  property_id UUID REFERENCES re_properties(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,

  -- Document metadata
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN (
    'inspection', 'appraisal', 'title_search', 'survey', 'photo', 'comp',
    'offer', 'counter_offer', 'purchase_agreement', 'addendum',
    'closing_statement', 'hud1', 'deed', 'contract',
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
CREATE INDEX IF NOT EXISTS idx_re_documents_user_id ON re_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_re_documents_property_id ON re_documents(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_re_documents_deal_id ON re_documents(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_re_documents_type ON re_documents(type);
CREATE INDEX IF NOT EXISTS idx_re_documents_created_at ON re_documents(created_at DESC);

-- Enable RLS
ALTER TABLE re_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for re_documents
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
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );
