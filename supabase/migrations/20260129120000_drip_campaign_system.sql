-- Migration: Multi-Channel Drip Campaign System
-- Description: Tables for automated drip campaigns across SMS, Email, Direct Mail, Meta DM, and Phone Reminders
-- Phase: Lead Nurturing System

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Lead type for situation-specific campaigns
CREATE TYPE drip_lead_type AS ENUM (
  'preforeclosure',        -- Urgent, credit-focused
  'probate',               -- Gentle, patient approach
  'divorce',               -- Sensitive, quick resolution
  'tired_landlord',        -- Solution-focused, freedom
  'vacant_property',       -- Practical, asset protection
  'tax_lien',              -- Deadline-aware, urgent
  'absentee_owner',        -- Investment-focused
  'code_violation',        -- Problem-solving
  'high_equity',           -- Value proposition
  'expired_listing',       -- Agent relationship
  'general'                -- Default nurture
);

-- Campaign channels
CREATE TYPE drip_channel AS ENUM (
  'sms',                   -- Twilio SMS
  'email',                 -- Resend/Gmail
  'direct_mail',           -- PostGrid
  'meta_dm',               -- Facebook/Instagram
  'phone_reminder'         -- Call reminder notification
);

-- Mail piece types for PostGrid
CREATE TYPE mail_piece_type AS ENUM (
  'postcard_4x6',          -- Standard postcard
  'postcard_6x9',          -- Large postcard
  'postcard_6x11',         -- Jumbo postcard
  'yellow_letter',         -- Handwritten-style letter
  'letter_1_page',         -- Typed letter
  'letter_2_page'          -- Multi-page letter
);

-- Enrollment status
CREATE TYPE drip_enrollment_status AS ENUM (
  'active',                -- Currently receiving touches
  'paused',                -- Temporarily stopped
  'completed',             -- Finished all steps
  'responded',             -- Contact responded
  'converted',             -- Became a deal
  'opted_out',             -- Unsubscribed
  'bounced',               -- Delivery failed
  'expired'                -- Campaign ended
);

-- Touch execution status
CREATE TYPE drip_touch_status AS ENUM (
  'pending',               -- Waiting to send
  'sending',               -- In progress
  'sent',                  -- Successfully sent
  'delivered',             -- Confirmed delivery
  'failed',                -- Send failed
  'skipped',               -- Skipped (opt-out, quiet hours, etc.)
  'bounced'                -- Delivery bounced
);

-- ============================================================================
-- 1. DRIP_CAMPAIGN_STEPS
-- ============================================================================
-- Individual steps/touches within a campaign

CREATE TABLE IF NOT EXISTS drip_campaign_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES investor_campaigns(id) ON DELETE CASCADE,

  -- Step configuration
  step_number INTEGER NOT NULL,              -- Order in sequence (1, 2, 3...)
  delay_days INTEGER NOT NULL DEFAULT 0,     -- Days after enrollment (or previous step)
  delay_from_enrollment BOOLEAN DEFAULT true, -- true = from enrollment, false = from previous step

  -- Channel settings
  channel drip_channel NOT NULL,

  -- Message content (for SMS/Email/Meta)
  subject TEXT,                              -- Email subject
  message_body TEXT,                         -- Message template with {variables}
  template_id UUID REFERENCES investor_outreach_templates(id) ON DELETE SET NULL,
  use_ai_generation BOOLEAN DEFAULT false,   -- Generate message with AI
  ai_tone TEXT,                              -- AI generation guidance

  -- Direct mail specific
  mail_piece_type mail_piece_type,
  mail_template_id TEXT,                     -- PostGrid template ID
  return_address JSONB,                      -- Override return address

  -- Phone reminder specific
  talking_points TEXT[],                     -- Reminder call notes
  call_script TEXT,                          -- Optional script

  -- Conditions
  skip_if_responded BOOLEAN DEFAULT true,    -- Skip if contact already responded
  skip_if_converted BOOLEAN DEFAULT true,    -- Skip if already converted to deal

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_campaign_step UNIQUE (campaign_id, step_number)
);

CREATE INDEX idx_drip_steps_campaign ON drip_campaign_steps(campaign_id);
CREATE INDEX idx_drip_steps_channel ON drip_campaign_steps(channel);

-- ============================================================================
-- 2. DRIP_ENROLLMENTS
-- ============================================================================
-- Track each contact's journey through a campaign

CREATE TABLE IF NOT EXISTS drip_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES investor_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES investor_deals(id) ON DELETE SET NULL,

  -- Journey tracking
  current_step INTEGER DEFAULT 1,            -- Current step number
  next_touch_at TIMESTAMPTZ,                 -- When to send next touch
  status drip_enrollment_status DEFAULT 'active',

  -- Progress tracking
  touches_sent INTEGER DEFAULT 0,
  touches_delivered INTEGER DEFAULT 0,
  touches_failed INTEGER DEFAULT 0,
  last_touch_at TIMESTAMPTZ,
  last_touch_channel drip_channel,

  -- Response tracking
  responded_at TIMESTAMPTZ,
  response_channel drip_channel,
  response_message TEXT,

  -- Conversion tracking
  converted_at TIMESTAMPTZ,
  converted_deal_id UUID REFERENCES investor_deals(id) ON DELETE SET NULL,

  -- Pause/resume
  paused_at TIMESTAMPTZ,
  paused_reason TEXT,
  resumed_at TIMESTAMPTZ,

  -- Context for personalization
  enrollment_context JSONB DEFAULT '{}'::jsonb, -- Pain points, property info, etc.

  -- Metadata
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_contact_campaign UNIQUE (contact_id, campaign_id)
);

CREATE INDEX idx_drip_enrollments_user ON drip_enrollments(user_id);
CREATE INDEX idx_drip_enrollments_campaign ON drip_enrollments(campaign_id);
CREATE INDEX idx_drip_enrollments_contact ON drip_enrollments(contact_id);
CREATE INDEX idx_drip_enrollments_next_touch ON drip_enrollments(next_touch_at)
  WHERE status = 'active';
CREATE INDEX idx_drip_enrollments_status ON drip_enrollments(user_id, status);

-- ============================================================================
-- 3. DRIP_TOUCH_LOG
-- ============================================================================
-- Execution log for every sent message

CREATE TABLE IF NOT EXISTS drip_touch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES drip_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES drip_campaign_steps(id) ON DELETE CASCADE,

  -- Execution details
  channel drip_channel NOT NULL,
  status drip_touch_status DEFAULT 'pending',

  -- Message content
  subject TEXT,                              -- Final subject (after personalization)
  message_body TEXT,                         -- Final message body
  recipient_phone TEXT,                      -- For SMS
  recipient_email TEXT,                      -- For email
  recipient_address JSONB,                   -- For direct mail

  -- Channel-specific IDs
  external_message_id TEXT,                  -- Twilio SID, Resend ID, PostGrid ID, Meta message ID
  external_tracking_url TEXT,                -- Tracking URL if available

  -- Direct mail specific
  mail_piece_type mail_piece_type,
  mail_cost NUMERIC(8, 2),                   -- Cost in credits/dollars
  mail_tracking_number TEXT,                 -- USPS tracking

  -- Timing
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Response (if any)
  response_received BOOLEAN DEFAULT false,
  response_at TIMESTAMPTZ,
  response_body TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drip_touch_log_enrollment ON drip_touch_log(enrollment_id);
CREATE INDEX idx_drip_touch_log_user ON drip_touch_log(user_id);
CREATE INDEX idx_drip_touch_log_status ON drip_touch_log(status);
CREATE INDEX idx_drip_touch_log_scheduled ON drip_touch_log(scheduled_at)
  WHERE status = 'pending';
CREATE INDEX idx_drip_touch_log_channel ON drip_touch_log(channel);

-- ============================================================================
-- 4. CONTACT_OPT_OUTS
-- ============================================================================
-- Per-channel unsubscribe tracking

CREATE TABLE IF NOT EXISTS contact_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,

  -- Opt-out details
  channel drip_channel NOT NULL,             -- Which channel they opted out of
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  opt_out_reason TEXT,                       -- STOP, unsubscribe link, manual, etc.
  opt_out_message TEXT,                      -- Original STOP message if applicable

  -- Source tracking
  source_campaign_id UUID REFERENCES investor_campaigns(id) ON DELETE SET NULL,
  source_touch_id UUID REFERENCES drip_touch_log(id) ON DELETE SET NULL,

  -- Reversal (if they opt back in)
  is_active BOOLEAN DEFAULT true,
  opted_in_at TIMESTAMPTZ,
  opt_in_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_contact_channel_optout UNIQUE (contact_id, channel)
);

CREATE INDEX idx_opt_outs_user ON contact_opt_outs(user_id);
CREATE INDEX idx_opt_outs_contact ON contact_opt_outs(contact_id);
CREATE INDEX idx_opt_outs_active ON contact_opt_outs(contact_id, channel)
  WHERE is_active = true;

-- ============================================================================
-- 5. USER_MAIL_CREDITS
-- ============================================================================
-- User wallet for direct mail credits

CREATE TABLE IF NOT EXISTS user_mail_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Balance
  balance NUMERIC(12, 2) DEFAULT 0,          -- Current credit balance
  lifetime_purchased NUMERIC(12, 2) DEFAULT 0,
  lifetime_used NUMERIC(12, 2) DEFAULT 0,

  -- Reserved (for pending mail jobs)
  reserved NUMERIC(12, 2) DEFAULT 0,

  -- Low balance alert
  low_balance_threshold NUMERIC(12, 2) DEFAULT 50,
  low_balance_alert_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mail_credits_user ON user_mail_credits(user_id);

-- ============================================================================
-- 6. MAIL_CREDIT_TRANSACTIONS
-- ============================================================================
-- Purchase/usage history for mail credits

CREATE TABLE IF NOT EXISTS mail_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Transaction type
  type TEXT NOT NULL,                        -- 'purchase', 'usage', 'refund', 'adjustment'

  -- Amount
  amount NUMERIC(12, 2) NOT NULL,            -- Positive for credit, negative for debit
  balance_after NUMERIC(12, 2) NOT NULL,     -- Balance after this transaction

  -- Purchase details
  stripe_payment_id TEXT,                    -- Stripe payment intent ID
  package_name TEXT,                         -- e.g., "100 Postcards Pack"
  package_price NUMERIC(12, 2),              -- Price paid

  -- Usage details
  touch_log_id UUID REFERENCES drip_touch_log(id) ON DELETE SET NULL,
  mail_piece_type mail_piece_type,
  pieces_count INTEGER,

  -- Refund details
  refund_reason TEXT,
  original_transaction_id UUID REFERENCES mail_credit_transactions(id),

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mail_transactions_user ON mail_credit_transactions(user_id);
CREATE INDEX idx_mail_transactions_type ON mail_credit_transactions(user_id, type);
CREATE INDEX idx_mail_transactions_created ON mail_credit_transactions(created_at DESC);

-- ============================================================================
-- 7. META_DM_CREDENTIALS
-- ============================================================================
-- Facebook/Instagram tokens (encrypted at application layer)

CREATE TABLE IF NOT EXISTS meta_dm_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Facebook Page
  page_id TEXT NOT NULL,
  page_name TEXT,
  page_access_token TEXT NOT NULL,           -- Long-lived page token (encrypted)

  -- Instagram Business Account (linked to page)
  instagram_account_id TEXT,
  instagram_username TEXT,

  -- Token management
  token_expires_at TIMESTAMPTZ,              -- When token expires (if known)
  token_refreshed_at TIMESTAMPTZ,

  -- Permissions granted
  permissions TEXT[],                        -- ['pages_messaging', 'instagram_manage_messages']

  -- Rate limiting tracking
  daily_dm_count INTEGER DEFAULT 0,
  daily_dm_reset_at TIMESTAMPTZ,
  hourly_dm_count INTEGER DEFAULT 0,
  hourly_dm_reset_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meta_creds_user ON meta_dm_credentials(user_id);

-- ============================================================================
-- 8. POSTGRID_CREDENTIALS
-- ============================================================================
-- PostGrid API credentials and settings

CREATE TABLE IF NOT EXISTS postgrid_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- API credentials (stored by system, not user-provided for white-label)
  -- For white-label, we use system credentials, so this is mainly for tracking

  -- Return address settings
  return_name TEXT,
  return_company TEXT,
  return_address_line1 TEXT,
  return_address_line2 TEXT,
  return_city TEXT,
  return_state TEXT,
  return_zip TEXT,

  -- Preferences
  default_mail_class TEXT DEFAULT 'first_class', -- 'first_class' or 'standard'

  -- Webhook tracking
  webhook_secret TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_mail_sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_postgrid_creds_user ON postgrid_credentials(user_id);

-- ============================================================================
-- 9. EXTEND INVESTOR_CAMPAIGNS TABLE
-- ============================================================================

-- Add new columns to investor_campaigns
ALTER TABLE investor_campaigns
  ADD COLUMN IF NOT EXISTS lead_type drip_lead_type,
  ADD COLUMN IF NOT EXISTS target_motivation seller_motivation,
  ADD COLUMN IF NOT EXISTS is_drip_campaign BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quiet_hours_start TIME,              -- e.g., 21:00 (9 PM)
  ADD COLUMN IF NOT EXISTS quiet_hours_end TIME,                -- e.g., 09:00 (9 AM)
  ADD COLUMN IF NOT EXISTS quiet_hours_timezone TEXT DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS respect_weekends BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_pause_on_response BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_convert_on_response BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrolled_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responded_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS converted_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opted_out_count INTEGER DEFAULT 0;

-- ============================================================================
-- 10. EXTEND CRM_CONTACTS TABLE
-- ============================================================================

-- Add campaign-related columns to crm_contacts
ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS campaign_status TEXT,                 -- 'enrolled', 'responded', 'converted'
  ADD COLUMN IF NOT EXISTS active_campaign_id UUID REFERENCES investor_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_campaign_touch_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS campaign_touches_received INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS preferred_channel drip_channel,
  ADD COLUMN IF NOT EXISTS best_contact_time TEXT,               -- 'morning', 'afternoon', 'evening'
  ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN DEFAULT false;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE drip_campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_touch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mail_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_dm_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE postgrid_credentials ENABLE ROW LEVEL SECURITY;

-- Campaign steps - users can manage steps of their own campaigns
CREATE POLICY "Users can manage own campaign steps"
  ON drip_campaign_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM investor_campaigns c
      WHERE c.id = drip_campaign_steps.campaign_id
      AND c.user_id = auth.uid()
    )
  );

-- Enrollments
CREATE POLICY "Users can manage own enrollments"
  ON drip_enrollments FOR ALL
  USING (auth.uid() = user_id);

-- Touch log
CREATE POLICY "Users can view own touch logs"
  ON drip_touch_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own touch logs"
  ON drip_touch_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Opt-outs
CREATE POLICY "Users can manage own opt-outs"
  ON contact_opt_outs FOR ALL
  USING (auth.uid() = user_id);

-- Mail credits
CREATE POLICY "Users can view own mail credits"
  ON user_mail_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Mail credit transactions
CREATE POLICY "Users can view own transactions"
  ON mail_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Meta credentials
CREATE POLICY "Users can manage own meta credentials"
  ON meta_dm_credentials FOR ALL
  USING (auth.uid() = user_id);

-- PostGrid credentials
CREATE POLICY "Users can manage own postgrid credentials"
  ON postgrid_credentials FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get due enrollments for processing
CREATE OR REPLACE FUNCTION get_due_drip_enrollments(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  enrollment_id UUID,
  user_id UUID,
  campaign_id UUID,
  contact_id UUID,
  current_step INTEGER,
  campaign_name TEXT,
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_phone TEXT,
  contact_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as enrollment_id,
    e.user_id,
    e.campaign_id,
    e.contact_id,
    e.current_step,
    c.name as campaign_name,
    ct.first_name as contact_first_name,
    ct.last_name as contact_last_name,
    ct.phone as contact_phone,
    ct.email as contact_email
  FROM drip_enrollments e
  JOIN investor_campaigns c ON c.id = e.campaign_id
  JOIN crm_contacts ct ON ct.id = e.contact_id
  WHERE e.status = 'active'
    AND e.next_touch_at <= NOW()
    AND c.status = 'active'
    AND ct.do_not_contact = false
  ORDER BY e.next_touch_at ASC
  LIMIT p_limit;
END;
$$;

-- Check if contact has opted out of channel
CREATE OR REPLACE FUNCTION is_contact_opted_out(
  p_contact_id UUID,
  p_channel drip_channel
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM contact_opt_outs
    WHERE contact_id = p_contact_id
    AND channel = p_channel
    AND is_active = true
  );
END;
$$;

-- Record opt-out from STOP keyword
CREATE OR REPLACE FUNCTION record_opt_out(
  p_user_id UUID,
  p_contact_id UUID,
  p_channel drip_channel,
  p_reason TEXT DEFAULT 'STOP keyword',
  p_message TEXT DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL,
  p_touch_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opt_out_id UUID;
BEGIN
  -- Insert or update opt-out
  INSERT INTO contact_opt_outs (
    user_id, contact_id, channel, opt_out_reason,
    opt_out_message, source_campaign_id, source_touch_id
  )
  VALUES (
    p_user_id, p_contact_id, p_channel, p_reason,
    p_message, p_campaign_id, p_touch_id
  )
  ON CONFLICT (contact_id, channel)
  DO UPDATE SET
    is_active = true,
    opted_out_at = NOW(),
    opt_out_reason = p_reason,
    opt_out_message = COALESCE(p_message, contact_opt_outs.opt_out_message),
    source_campaign_id = COALESCE(p_campaign_id, contact_opt_outs.source_campaign_id),
    source_touch_id = COALESCE(p_touch_id, contact_opt_outs.source_touch_id)
  RETURNING id INTO v_opt_out_id;

  -- Pause all active enrollments for this contact
  UPDATE drip_enrollments
  SET
    status = 'opted_out',
    paused_at = NOW(),
    paused_reason = 'Opted out via ' || p_channel::text
  WHERE contact_id = p_contact_id
    AND status = 'active';

  RETURN v_opt_out_id;
END;
$$;

-- Advance enrollment to next step
CREATE OR REPLACE FUNCTION advance_enrollment_step(
  p_enrollment_id UUID,
  p_touch_log_id UUID DEFAULT NULL
)
RETURNS drip_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment drip_enrollments;
  v_next_step drip_campaign_steps;
  v_max_step INTEGER;
BEGIN
  -- Get current enrollment
  SELECT * INTO v_enrollment
  FROM drip_enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Enrollment not found: %', p_enrollment_id;
  END IF;

  -- Get max step for this campaign
  SELECT MAX(step_number) INTO v_max_step
  FROM drip_campaign_steps
  WHERE campaign_id = v_enrollment.campaign_id
    AND is_active = true;

  -- Update touches count
  UPDATE drip_enrollments
  SET
    touches_sent = touches_sent + 1,
    last_touch_at = NOW(),
    updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- Check if we've completed all steps
  IF v_enrollment.current_step >= v_max_step THEN
    UPDATE drip_enrollments
    SET
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_enrollment_id
    RETURNING * INTO v_enrollment;

    RETURN v_enrollment;
  END IF;

  -- Get next step
  SELECT * INTO v_next_step
  FROM drip_campaign_steps
  WHERE campaign_id = v_enrollment.campaign_id
    AND step_number = v_enrollment.current_step + 1
    AND is_active = true;

  IF NOT FOUND THEN
    -- No more steps, mark as completed
    UPDATE drip_enrollments
    SET
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_enrollment_id
    RETURNING * INTO v_enrollment;

    RETURN v_enrollment;
  END IF;

  -- Calculate next touch time
  UPDATE drip_enrollments
  SET
    current_step = current_step + 1,
    next_touch_at = CASE
      WHEN v_next_step.delay_from_enrollment THEN
        enrolled_at + (v_next_step.delay_days || ' days')::INTERVAL
      ELSE
        NOW() + (v_next_step.delay_days || ' days')::INTERVAL
      END,
    last_touch_channel = (
      SELECT channel FROM drip_campaign_steps
      WHERE id = v_next_step.id
    ),
    updated_at = NOW()
  WHERE id = p_enrollment_id
  RETURNING * INTO v_enrollment;

  RETURN v_enrollment;
END;
$$;

-- Deduct mail credits
CREATE OR REPLACE FUNCTION deduct_mail_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_touch_log_id UUID,
  p_mail_piece_type mail_piece_type,
  p_pieces_count INTEGER DEFAULT 1,
  p_description TEXT DEFAULT 'Direct mail'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Get current balance with lock
  SELECT balance INTO v_current_balance
  FROM user_mail_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Create credits record if doesn't exist
    INSERT INTO user_mail_credits (user_id, balance)
    VALUES (p_user_id, 0);
    v_current_balance := 0;
  END IF;

  -- Check if sufficient balance
  IF v_current_balance < p_amount THEN
    RETURN false;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update balance
  UPDATE user_mail_credits
  SET
    balance = v_new_balance,
    lifetime_used = lifetime_used + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO mail_credit_transactions (
    user_id, type, amount, balance_after,
    touch_log_id, mail_piece_type, pieces_count, description
  )
  VALUES (
    p_user_id, 'usage', -p_amount, v_new_balance,
    p_touch_log_id, p_mail_piece_type, p_pieces_count, p_description
  );

  RETURN true;
END;
$$;

-- Check if within quiet hours
CREATE OR REPLACE FUNCTION is_within_quiet_hours(
  p_quiet_start TIME,
  p_quiet_end TIME,
  p_timezone TEXT DEFAULT 'America/New_York'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_time TIME;
BEGIN
  -- Get current time in the specified timezone
  v_current_time := (NOW() AT TIME ZONE p_timezone)::TIME;

  -- Handle overnight quiet hours (e.g., 21:00 to 09:00)
  IF p_quiet_start > p_quiet_end THEN
    RETURN v_current_time >= p_quiet_start OR v_current_time <= p_quiet_end;
  ELSE
    RETURN v_current_time >= p_quiet_start AND v_current_time <= p_quiet_end;
  END IF;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_drip_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_drip_steps_updated
  BEFORE UPDATE ON drip_campaign_steps
  FOR EACH ROW EXECUTE FUNCTION update_drip_updated_at();

CREATE TRIGGER trigger_drip_enrollments_updated
  BEFORE UPDATE ON drip_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_drip_updated_at();

CREATE TRIGGER trigger_mail_credits_updated
  BEFORE UPDATE ON user_mail_credits
  FOR EACH ROW EXECUTE FUNCTION update_drip_updated_at();

CREATE TRIGGER trigger_meta_creds_updated
  BEFORE UPDATE ON meta_dm_credentials
  FOR EACH ROW EXECUTE FUNCTION update_drip_updated_at();

CREATE TRIGGER trigger_postgrid_creds_updated
  BEFORE UPDATE ON postgrid_credentials
  FOR EACH ROW EXECUTE FUNCTION update_drip_updated_at();

-- Update campaign counts when enrollment status changes
CREATE OR REPLACE FUNCTION update_campaign_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrolled count on insert
  IF TG_OP = 'INSERT' THEN
    UPDATE investor_campaigns
    SET enrolled_count = enrolled_count + 1
    WHERE id = NEW.campaign_id;
  END IF;

  -- Update counts on status change
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Responded
    IF NEW.status = 'responded' AND OLD.status != 'responded' THEN
      UPDATE investor_campaigns
      SET responded_count = responded_count + 1
      WHERE id = NEW.campaign_id;
    END IF;

    -- Converted
    IF NEW.status = 'converted' AND OLD.status != 'converted' THEN
      UPDATE investor_campaigns
      SET converted_count = converted_count + 1
      WHERE id = NEW.campaign_id;
    END IF;

    -- Opted out
    IF NEW.status = 'opted_out' AND OLD.status != 'opted_out' THEN
      UPDATE investor_campaigns
      SET opted_out_count = opted_out_count + 1
      WHERE id = NEW.campaign_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollment_count_update
  AFTER INSERT OR UPDATE ON drip_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_campaign_counts();

-- ============================================================================
-- SEED DATA: Lead-Type-Specific Campaign Templates
-- ============================================================================

-- Note: These are template campaigns that users can clone
-- They'll be created via the application layer with proper user_id = NULL for system templates

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE drip_campaign_steps IS 'Individual steps/touches within a drip campaign with channel, timing, and content configuration';
COMMENT ON TABLE drip_enrollments IS 'Tracks each contact''s journey through a campaign including progress, status, and responses';
COMMENT ON TABLE drip_touch_log IS 'Execution log for every message sent across all channels';
COMMENT ON TABLE contact_opt_outs IS 'Per-channel unsubscribe tracking for compliance';
COMMENT ON TABLE user_mail_credits IS 'User wallet for direct mail credits (white-label PostGrid)';
COMMENT ON TABLE mail_credit_transactions IS 'Purchase and usage history for mail credits';
COMMENT ON TABLE meta_dm_credentials IS 'Facebook/Instagram DM OAuth tokens and rate limiting';
COMMENT ON TABLE postgrid_credentials IS 'PostGrid settings and return address configuration';
