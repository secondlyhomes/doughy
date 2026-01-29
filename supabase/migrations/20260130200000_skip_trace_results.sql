-- Migration: CRM Skip Trace Results
-- Stores skip tracing results from Tracerfy integration
-- Domain: CRM (crm_* prefix per DATABASE_NAMING_CONVENTIONS.md)

-- Create skip_trace_status enum following pattern: {context}_status
CREATE TYPE crm_skip_trace_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'no_results'
);

-- Create crm_skip_trace_results table
CREATE TABLE crm_skip_trace_results (
  -- Primary key (UUID pattern per conventions)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys ({table}_id pattern)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  property_id UUID REFERENCES rental_properties(id) ON DELETE SET NULL,
  matched_property_id UUID REFERENCES rental_properties(id) ON DELETE SET NULL,

  -- Input data (what was searched)
  input_first_name TEXT,
  input_last_name TEXT,
  input_address TEXT,
  input_city TEXT,
  input_state TEXT,
  input_zip TEXT,

  -- Status (using enum type)
  status crm_skip_trace_status NOT NULL DEFAULT 'pending',
  error_message TEXT,

  -- Results (JSONB columns per conventions: {context}_data or descriptive names)
  phones JSONB NOT NULL DEFAULT '[]',
  emails JSONB NOT NULL DEFAULT '[]',
  addresses JSONB NOT NULL DEFAULT '[]',
  properties_owned JSONB NOT NULL DEFAULT '[]',
  data_points JSONB NOT NULL DEFAULT '[]',
  raw_response JSONB,

  -- Property matching
  match_confidence INT CHECK (match_confidence >= 0 AND match_confidence <= 100),

  -- Billing/usage
  credits_used INT NOT NULL DEFAULT 0,

  -- Timestamps (TIMESTAMPTZ pattern per conventions)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes (idx_{table}_{column} pattern)
CREATE INDEX idx_crm_skip_trace_results_user_id ON crm_skip_trace_results(user_id);
CREATE INDEX idx_crm_skip_trace_results_contact_id ON crm_skip_trace_results(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_crm_skip_trace_results_lead_id ON crm_skip_trace_results(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_crm_skip_trace_results_property_id ON crm_skip_trace_results(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_crm_skip_trace_results_status ON crm_skip_trace_results(status);
CREATE INDEX idx_crm_skip_trace_results_created_at ON crm_skip_trace_results(created_at DESC);

-- Enable RLS
ALTER TABLE crm_skip_trace_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies ("{Subject} can {action} {object}" pattern)
CREATE POLICY "Users can view their own skip trace results"
  ON crm_skip_trace_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skip trace results"
  ON crm_skip_trace_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skip trace results"
  ON crm_skip_trace_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skip trace results"
  ON crm_skip_trace_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at (standard pattern)
CREATE TRIGGER update_crm_skip_trace_results_updated_at
  BEFORE UPDATE ON crm_skip_trace_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Documentation comments
COMMENT ON TABLE crm_skip_trace_results IS 'Stores skip tracing results from Tracerfy integration';
COMMENT ON COLUMN crm_skip_trace_results.phones IS 'Array of phone results: [{number, type, carrier, verified, dnc}]';
COMMENT ON COLUMN crm_skip_trace_results.emails IS 'Array of email results: [{address, type, verified}]';
COMMENT ON COLUMN crm_skip_trace_results.addresses IS 'Array of address results: [{street, city, state, zip, type, yearsAtAddress, isOwner}]';
COMMENT ON COLUMN crm_skip_trace_results.properties_owned IS 'Array of properties owned by the person';
COMMENT ON COLUMN crm_skip_trace_results.matched_property_id IS 'If this skip trace was matched to a property in the system';
COMMENT ON COLUMN crm_skip_trace_results.match_confidence IS 'Confidence score 0-100 for property matching';
