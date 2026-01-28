-- Migration: RE Investor Tables
-- Description: Tables for RE investor platform - deals, sellers, agents, campaigns
-- Phase: MoltBot Investor Skill

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Deal pipeline stages
CREATE TYPE investor_deal_stage AS ENUM (
  'lead',                -- Initial lead, not yet contacted
  'prospect',            -- Contacted, motivation assessed
  'appointment_set',     -- Meeting/call scheduled
  'offer_made',          -- Offer submitted
  'under_contract',      -- Contract signed
  'due_diligence',       -- Inspection/title period
  'closed',              -- Deal completed
  'dead'                 -- Deal fell through
);

-- Seller motivation levels
CREATE TYPE seller_motivation AS ENUM (
  'hot',                 -- 80+ score, ready to sell
  'warm',                -- 60-79 score, interested
  'cold',                -- 40-59 score, nurturing
  'not_motivated'        -- <40 score, long-term follow-up
);

-- Deal types
CREATE TYPE investor_deal_type AS ENUM (
  'wholesale',           -- Assign contract
  'fix_and_flip',        -- Renovate and sell
  'buy_and_hold',        -- Rental property
  'subject_to',          -- Take over financing
  'creative_finance',    -- Seller financing, lease option
  'land',                -- Vacant land
  'commercial'           -- Commercial property
);

-- Lead source types for investors
CREATE TYPE investor_lead_source AS ENUM (
  'direct_mail',         -- Yellow letters, postcards
  'cold_call',           -- Phone outreach
  'driving_for_dollars', -- Property scouting
  'propstream',          -- PropStream leads
  'batchleads',          -- BatchLeads platform
  'listsource',          -- ListSource data
  'referral',            -- Word of mouth
  'agent_referral',      -- From agent network
  'website',             -- Inbound from website
  'sms_campaign',        -- Text marketing
  'facebook_ads',        -- Social media ads
  'bandit_signs',        -- Road signs
  'other'                -- Other sources
);

-- ============================================================================
-- 1. INVESTOR_DEALS
-- ============================================================================
-- Master deal tracking table for RE investors

CREATE TABLE IF NOT EXISTS investor_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Property information
  property_address TEXT NOT NULL,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,
  property_county TEXT,
  property_type TEXT,             -- single_family, duplex, triplex, etc.

  -- Seller contact (links to CRM)
  seller_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  seller_name TEXT,
  seller_phone TEXT,
  seller_email TEXT,

  -- Deal details
  deal_type investor_deal_type DEFAULT 'wholesale',
  stage investor_deal_stage DEFAULT 'lead',
  motivation seller_motivation DEFAULT 'cold',
  motivation_score INTEGER CHECK (motivation_score >= 0 AND motivation_score <= 100),

  -- Financial
  asking_price NUMERIC(12, 2),
  offer_price NUMERIC(12, 2),
  arv NUMERIC(12, 2),              -- After Repair Value
  repair_estimate NUMERIC(12, 2),
  wholesale_fee NUMERIC(12, 2),
  profit_estimate NUMERIC(12, 2),

  -- Contract details
  contract_date DATE,
  close_date DATE,
  earnest_money NUMERIC(12, 2),
  contingencies TEXT[],

  -- Lead source
  source investor_lead_source DEFAULT 'other',
  source_campaign_id UUID,         -- Link to marketing campaign
  acquisition_cost NUMERIC(12, 2), -- Cost to acquire this lead

  -- Pain points and notes
  pain_points TEXT[],              -- foreclosure, inheritance, divorce, etc.
  objections TEXT[],               -- price_expectations, not_ready, etc.
  notes TEXT,

  -- AI tracking
  ai_last_message_at TIMESTAMPTZ,
  ai_follow_up_scheduled_at TIMESTAMPTZ,
  ai_response_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for deal queries
CREATE INDEX idx_investor_deals_user ON investor_deals(user_id);
CREATE INDEX idx_investor_deals_stage ON investor_deals(user_id, stage);
CREATE INDEX idx_investor_deals_motivation ON investor_deals(user_id, motivation);
CREATE INDEX idx_investor_deals_seller ON investor_deals(seller_contact_id);
CREATE INDEX idx_investor_deals_follow_up ON investor_deals(user_id, ai_follow_up_scheduled_at)
  WHERE ai_follow_up_scheduled_at IS NOT NULL;

-- ============================================================================
-- 2. INVESTOR_AGENTS
-- ============================================================================
-- Agent relationships for deal sourcing

CREATE TABLE IF NOT EXISTS investor_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  -- Agent info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  brokerage TEXT,
  license_number TEXT,

  -- Relationship
  relationship_status TEXT DEFAULT 'new', -- new, active, dormant, preferred
  deals_sourced INTEGER DEFAULT 0,
  last_deal_date DATE,
  commission_preference TEXT,       -- flat_fee, percentage, referral_only

  -- Specializations
  specializations TEXT[],           -- foreclosure, estate, investor-friendly
  target_markets TEXT[],            -- Areas they cover
  deal_types_interested TEXT[],     -- wholesale, creative, etc.

  -- Communication
  preferred_contact_method TEXT,    -- email, phone, text
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_investor_agents_user ON investor_agents(user_id);
CREATE INDEX idx_investor_agents_contact ON investor_agents(contact_id);
CREATE INDEX idx_investor_agents_status ON investor_agents(user_id, relationship_status);

-- ============================================================================
-- 3. INVESTOR_CAMPAIGNS
-- ============================================================================
-- Marketing campaigns for lead generation

CREATE TABLE IF NOT EXISTS investor_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,      -- direct_mail, sms, cold_call, etc.
  status TEXT DEFAULT 'draft',      -- draft, active, paused, completed

  -- Target criteria
  target_criteria JSONB,            -- List criteria (absentee, equity, etc.)
  target_markets TEXT[],
  list_source TEXT,
  list_count INTEGER,

  -- Budget
  budget NUMERIC(12, 2),
  spent NUMERIC(12, 2) DEFAULT 0,
  cost_per_lead NUMERIC(12, 2),

  -- Performance
  leads_generated INTEGER DEFAULT 0,
  deals_closed INTEGER DEFAULT 0,
  revenue NUMERIC(12, 2) DEFAULT 0,
  roi_percent NUMERIC(5, 2),

  -- Schedule
  start_date DATE,
  end_date DATE,

  -- Sequence settings (for follow-up)
  follow_up_sequence INTEGER[],     -- Days between touches: [3, 7, 14]
  max_touches INTEGER DEFAULT 5,

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_investor_campaigns_user ON investor_campaigns(user_id);
CREATE INDEX idx_investor_campaigns_status ON investor_campaigns(user_id, status);

-- ============================================================================
-- 4. INVESTOR_FOLLOW_UPS
-- ============================================================================
-- Scheduled follow-ups for deals and contacts

CREATE TABLE IF NOT EXISTS investor_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Related entities
  deal_id UUID REFERENCES investor_deals(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES investor_agents(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES investor_campaigns(id) ON DELETE SET NULL,

  -- Follow-up details
  follow_up_type TEXT NOT NULL,     -- seller_check_in, agent_touch, campaign_sequence
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,

  -- Message
  channel TEXT,                     -- email, sms, phone
  message_template TEXT,
  ai_generated_message TEXT,
  actual_message TEXT,              -- After edits

  -- Sequence position
  sequence_position INTEGER,
  is_final_touch BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled, sent, completed, skipped, failed

  -- Context
  context JSONB DEFAULT '{}'::jsonb, -- Previous conversation topics, etc.

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_investor_follow_ups_user ON investor_follow_ups(user_id);
CREATE INDEX idx_investor_follow_ups_scheduled ON investor_follow_ups(user_id, scheduled_at)
  WHERE status = 'scheduled';
CREATE INDEX idx_investor_follow_ups_deal ON investor_follow_ups(deal_id);
CREATE INDEX idx_investor_follow_ups_contact ON investor_follow_ups(contact_id);

-- ============================================================================
-- 5. INVESTOR_OUTREACH_TEMPLATES
-- ============================================================================
-- Templates for seller and agent outreach

CREATE TABLE IF NOT EXISTS investor_outreach_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = system template

  name TEXT NOT NULL,
  category TEXT NOT NULL,           -- seller_initial, seller_followup, agent_intro, etc.
  contact_type TEXT NOT NULL,       -- seller, agent
  channel TEXT NOT NULL,            -- email, sms

  subject TEXT,                     -- For emails
  body TEXT NOT NULL,

  -- Personalization variables
  variables TEXT[],                 -- {first_name}, {property_address}, etc.

  -- Performance
  use_count INTEGER DEFAULT 0,
  response_rate NUMERIC(5, 2),

  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,  -- System-provided template

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_outreach_templates_user ON investor_outreach_templates(user_id);
CREATE INDEX idx_outreach_templates_category ON investor_outreach_templates(category, contact_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE investor_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE investor_outreach_templates ENABLE ROW LEVEL SECURITY;

-- Deals
CREATE POLICY "Users can manage own deals"
  ON investor_deals FOR ALL
  USING (auth.uid() = user_id);

-- Agents
CREATE POLICY "Users can manage own agent relationships"
  ON investor_agents FOR ALL
  USING (auth.uid() = user_id);

-- Campaigns
CREATE POLICY "Users can manage own campaigns"
  ON investor_campaigns FOR ALL
  USING (auth.uid() = user_id);

-- Follow-ups
CREATE POLICY "Users can manage own follow-ups"
  ON investor_follow_ups FOR ALL
  USING (auth.uid() = user_id);

-- Templates (users see own + system templates)
CREATE POLICY "Users can view own and system templates"
  ON investor_outreach_templates FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage own templates"
  ON investor_outreach_templates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update deal stage with timestamp tracking
CREATE OR REPLACE FUNCTION update_deal_stage(
  p_deal_id UUID,
  p_new_stage investor_deal_stage,
  p_notes TEXT DEFAULT NULL
)
RETURNS investor_deals
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deal investor_deals;
BEGIN
  UPDATE investor_deals
  SET
    stage = p_new_stage,
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_deal_id
  RETURNING * INTO v_deal;

  RETURN v_deal;
END;
$$;

-- Calculate deal motivation from factors
CREATE OR REPLACE FUNCTION calculate_seller_motivation(
  p_deal_id UUID,
  p_factors JSONB
)
RETURNS TABLE(score INTEGER, motivation seller_motivation)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score INTEGER := 50; -- Base score
  v_motivation seller_motivation;
BEGIN
  -- Add positive factors
  IF p_factors ? 'foreclosure' THEN v_score := v_score + 25; END IF;
  IF p_factors ? 'inherited' THEN v_score := v_score + 20; END IF;
  IF p_factors ? 'divorce' THEN v_score := v_score + 20; END IF;
  IF p_factors ? 'medical' THEN v_score := v_score + 20; END IF;
  IF p_factors ? 'out_of_state' THEN v_score := v_score + 15; END IF;
  IF p_factors ? 'vacant' THEN v_score := v_score + 15; END IF;
  IF p_factors ? 'tired_landlord' THEN v_score := v_score + 15; END IF;
  IF p_factors ? 'job_relocation' THEN v_score := v_score + 15; END IF;
  IF p_factors ? 'quick_timeline' THEN v_score := v_score + 20; END IF;
  IF p_factors ? 'code_violations' THEN v_score := v_score + 15; END IF;
  IF p_factors ? 'stale_listing' THEN v_score := v_score + 15; END IF;

  -- Subtract negative factors
  IF p_factors ? 'unrealistic_price' THEN v_score := v_score - 20; END IF;
  IF p_factors ? 'just_testing' THEN v_score := v_score - 15; END IF;
  IF p_factors ? 'has_agent' THEN v_score := v_score - 10; END IF;
  IF p_factors ? 'wants_to_stay' THEN v_score := v_score - 25; END IF;
  IF p_factors ? 'recently_refinanced' THEN v_score := v_score - 20; END IF;

  -- Clamp score
  v_score := GREATEST(0, LEAST(100, v_score));

  -- Determine motivation level
  IF v_score >= 80 THEN
    v_motivation := 'hot';
  ELSIF v_score >= 60 THEN
    v_motivation := 'warm';
  ELSIF v_score >= 40 THEN
    v_motivation := 'cold';
  ELSE
    v_motivation := 'not_motivated';
  END IF;

  -- Update the deal if ID provided
  IF p_deal_id IS NOT NULL THEN
    UPDATE investor_deals
    SET motivation_score = v_score,
        motivation = v_motivation,
        updated_at = NOW()
    WHERE id = p_deal_id;
  END IF;

  RETURN QUERY SELECT v_score, v_motivation;
END;
$$;

-- Get due follow-ups for a user
CREATE OR REPLACE FUNCTION get_due_follow_ups(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS SETOF investor_follow_ups
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM investor_follow_ups
  WHERE user_id = p_user_id
    AND status = 'scheduled'
    AND scheduled_at <= NOW()
  ORDER BY scheduled_at ASC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_investor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_investor_deals_updated
  BEFORE UPDATE ON investor_deals
  FOR EACH ROW EXECUTE FUNCTION update_investor_updated_at();

CREATE TRIGGER trigger_investor_agents_updated
  BEFORE UPDATE ON investor_agents
  FOR EACH ROW EXECUTE FUNCTION update_investor_updated_at();

CREATE TRIGGER trigger_investor_campaigns_updated
  BEFORE UPDATE ON investor_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_investor_updated_at();

CREATE TRIGGER trigger_outreach_templates_updated
  BEFORE UPDATE ON investor_outreach_templates
  FOR EACH ROW EXECUTE FUNCTION update_investor_updated_at();

-- ============================================================================
-- SEED SYSTEM TEMPLATES
-- ============================================================================

INSERT INTO investor_outreach_templates (user_id, name, category, contact_type, channel, subject, body, variables, is_system)
VALUES
  -- Seller templates
  (NULL, 'Initial Seller Response', 'seller_initial', 'seller', 'email',
   'Re: Your Property at {property_address}',
   E'Hi {first_name},\n\nThank you for reaching out about your property at {property_address}. I appreciate you taking the time to contact me.\n\nI work with homeowners in situations like yours every day, and I''m here to provide a straightforward, hassle-free option if it makes sense for you.\n\nTo better understand how I can help, could you tell me a bit more about:\n- Your timeline for potentially selling?\n- The current condition of the property?\n- What''s most important to you in this process?\n\nI''m happy to discuss this over the phone if you prefer - just let me know what works for you.\n\nLooking forward to hearing from you,\n\n{owner_name}\n{company_name}',
   ARRAY['first_name', 'property_address', 'owner_name', 'company_name'],
   true),

  (NULL, 'Motivated Seller Follow-up', 'seller_followup', 'seller', 'email',
   'Following up on {property_address}',
   E'Hi {first_name},\n\nI wanted to follow up on our conversation about {property_address}. I understand selling a property can be a big decision, and I want to make sure you have all the information you need.\n\nAs a reminder, when you work with me:\n- No repairs or cleaning needed\n- No agent commissions or fees\n- Flexible closing timeline that works for you\n- Fair cash offer with no obligations\n\nIs there anything specific I can answer for you? I''m here to help whenever you''re ready.\n\n{owner_name}',
   ARRAY['first_name', 'property_address', 'owner_name'],
   true),

  (NULL, 'SMS First Touch', 'seller_initial', 'seller', 'sms',
   NULL,
   'Hi {first_name}, this is {owner_name}. I received your info about {property_address}. Are you still interested in getting a cash offer? I can give you a no-obligation number today. - {owner_name}',
   ARRAY['first_name', 'owner_name', 'property_address'],
   true),

  -- Agent templates
  (NULL, 'Agent Introduction', 'agent_intro', 'agent', 'email',
   'Active Cash Buyer in {market_area}',
   E'Hi {agent_name},\n\nI hope this message finds you well. My name is {owner_name} and I''m an active real estate investor in the {market_area} area.\n\nI''m always looking to connect with agents who have:\n- Off-market or pocket listings\n- Expired listings with motivated sellers\n- REO or estate sale properties\n\nI can close quickly with cash and handle properties in any condition. If you come across any deals that might fit, I''d love to be a resource for you.\n\nHappy to discuss how we can work together - what''s the best way to connect?\n\n{owner_name}\n{company_name}',
   ARRAY['agent_name', 'owner_name', 'market_area', 'company_name'],
   true),

  (NULL, 'Agent Follow-up', 'agent_followup', 'agent', 'email',
   'Checking in - Still Looking for Deals',
   E'Hi {agent_name},\n\nJust wanted to touch base and see if you''ve come across any off-market opportunities lately.\n\nI''m actively buying in {market_area} and can close quickly with cash. Let me know if anything comes across your desk that might be a fit.\n\nHope you''re having a great week!\n\n{owner_name}',
   ARRAY['agent_name', 'market_area', 'owner_name'],
   true);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE investor_deals IS 'Master deal tracking for RE investors - properties, sellers, offers, and pipeline stages';
COMMENT ON TABLE investor_agents IS 'Agent relationships for deal sourcing and referrals';
COMMENT ON TABLE investor_campaigns IS 'Marketing campaigns for lead generation (direct mail, SMS, etc.)';
COMMENT ON TABLE investor_follow_ups IS 'Scheduled follow-up tasks for deals, contacts, and agents';
COMMENT ON TABLE investor_outreach_templates IS 'Message templates for seller and agent outreach';
