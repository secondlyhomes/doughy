-- Migration: Guest Message Templates Tables
-- Description: Store and manage templates for guest communication (check-in instructions, etc.)
-- Phase: Landlord Mode Enhancement - Guest Communication

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Template type (create only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guest_template_type') THEN
    CREATE TYPE guest_template_type AS ENUM (
      'check_in_instructions',   -- Arrival info, access codes, WiFi, etc.
      'checkout_reminder',       -- Reminder before checkout
      'house_rules',             -- Property rules and guidelines
      'review_request',          -- Ask for review after stay
      'welcome',                 -- Welcome message on booking confirmation
      'pre_arrival',             -- Day before arrival
      'during_stay',             -- Check-in during stay
      'emergency_contact',       -- Emergency information
      'custom'                   -- User-defined template
    );
  END IF;
END
$$;

-- Message channel (create only if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_channel') THEN
    CREATE TYPE message_channel AS ENUM (
      'sms',
      'email',
      'whatsapp',
      'in_app'
    );
  END IF;
END
$$;

-- ============================================================================
-- 1. GUEST_MESSAGE_TEMPLATES TABLE
-- ============================================================================
-- Store reusable message templates for guest communication

CREATE TABLE IF NOT EXISTS guest_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional property-specific (NULL = global template)
  property_id UUID REFERENCES rental_properties(id) ON DELETE CASCADE,

  -- Template identification
  template_type guest_template_type NOT NULL,
  name TEXT NOT NULL,

  -- Message content
  subject TEXT,  -- For email templates
  body TEXT NOT NULL,  -- Supports {{variables}} for substitution

  -- Channel
  channel message_channel NOT NULL DEFAULT 'email',

  -- Automation settings
  is_active BOOLEAN DEFAULT TRUE,
  auto_send BOOLEAN DEFAULT FALSE,  -- Automatically send at trigger time

  -- Trigger settings (for auto_send)
  trigger_hours_offset INT,  -- Hours before/after trigger event (negative = before)
  -- e.g., check_in_instructions with offset -24 = send 24 hours before check-in

  -- Template metadata
  available_variables JSONB DEFAULT '[]'::JSONB,
  -- e.g., ["guest_name", "property_name", "check_in_time", "access_code", "wifi_password"]

  -- Usage tracking
  times_used INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. GUEST_MESSAGES TABLE
-- ============================================================================
-- Track sent messages to guests

CREATE TABLE IF NOT EXISTS guest_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Related records
  booking_id UUID NOT NULL REFERENCES rental_bookings(id) ON DELETE CASCADE,
  template_id UUID REFERENCES guest_message_templates(id) ON DELETE SET NULL,

  -- Recipient
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,

  -- Message content
  channel message_channel NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,  -- Final rendered message (variables substituted)

  -- Variables used (for reference)
  variables_used JSONB DEFAULT '{}'::JSONB,
  -- e.g., { "guest_name": "John", "access_code": "1234" }

  -- AI composition tracking
  ai_composed BOOLEAN DEFAULT FALSE,
  ai_prompt TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'sent', 'delivered', 'read', 'failed', 'bounced')),
  scheduled_for TIMESTAMPTZ,  -- For scheduled sends
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,
  retry_count INT DEFAULT 0,

  -- External IDs (from SMS/Email provider)
  external_message_id TEXT,

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. AUTO_SEND_RULES TABLE
-- ============================================================================
-- Configure automatic message sending rules

CREATE TABLE IF NOT EXISTS auto_send_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional property-specific (NULL = applies to all properties)
  property_id UUID REFERENCES rental_properties(id) ON DELETE CASCADE,

  -- Rule configuration
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID NOT NULL REFERENCES guest_message_templates(id) ON DELETE CASCADE,

  -- Trigger configuration
  trigger_event TEXT NOT NULL CHECK (trigger_event IN (
    'booking_confirmed',
    'pre_arrival',
    'check_in_day',
    'during_stay',
    'checkout_day',
    'post_checkout',
    'review_request'
  )),
  trigger_offset_hours INT DEFAULT 0,  -- Hours before/after event (negative = before)

  -- Conditions (JSON for flexibility)
  conditions JSONB DEFAULT '{}'::JSONB,
  -- e.g., { "min_stay_nights": 3, "rental_type": ["str"] }

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Usage tracking
  times_triggered INT DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- guest_message_templates indexes
CREATE INDEX idx_guest_message_templates_user_id ON guest_message_templates(user_id);
CREATE INDEX idx_guest_message_templates_property_id ON guest_message_templates(property_id);
CREATE INDEX idx_guest_message_templates_type ON guest_message_templates(template_type);
CREATE INDEX idx_guest_message_templates_channel ON guest_message_templates(channel);
CREATE INDEX idx_guest_message_templates_active ON guest_message_templates(is_active) WHERE is_active = TRUE;

-- guest_messages indexes
CREATE INDEX idx_guest_messages_user_id ON guest_messages(user_id);
CREATE INDEX idx_guest_messages_booking_id ON guest_messages(booking_id);
CREATE INDEX idx_guest_messages_template_id ON guest_messages(template_id);
CREATE INDEX idx_guest_messages_contact_id ON guest_messages(contact_id);
CREATE INDEX idx_guest_messages_status ON guest_messages(status);
CREATE INDEX idx_guest_messages_scheduled_for ON guest_messages(scheduled_for) WHERE status = 'queued';
CREATE INDEX idx_guest_messages_created_at ON guest_messages(created_at DESC);

-- auto_send_rules indexes
CREATE INDEX idx_auto_send_rules_user_id ON auto_send_rules(user_id);
CREATE INDEX idx_auto_send_rules_property_id ON auto_send_rules(property_id);
CREATE INDEX idx_auto_send_rules_template_id ON auto_send_rules(template_id);
CREATE INDEX idx_auto_send_rules_trigger ON auto_send_rules(trigger_event);
CREATE INDEX idx_auto_send_rules_active ON auto_send_rules(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE guest_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_send_rules ENABLE ROW LEVEL SECURITY;

-- guest_message_templates policies
CREATE POLICY "Users can view own guest templates"
  ON guest_message_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own guest templates"
  ON guest_message_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guest templates"
  ON guest_message_templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own guest templates"
  ON guest_message_templates FOR DELETE
  USING (auth.uid() = user_id);

-- guest_messages policies
CREATE POLICY "Users can view own guest messages"
  ON guest_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own guest messages"
  ON guest_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own guest messages"
  ON guest_messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own guest messages"
  ON guest_messages FOR DELETE
  USING (auth.uid() = user_id);

-- auto_send_rules policies
CREATE POLICY "Users can view own auto send rules"
  ON auto_send_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own auto send rules"
  ON auto_send_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto send rules"
  ON auto_send_rules FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own auto send rules"
  ON auto_send_rules FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_guest_message_templates_timestamp
  BEFORE UPDATE ON guest_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guest_messages_timestamp
  BEFORE UPDATE ON guest_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_auto_send_rules_timestamp
  BEFORE UPDATE ON auto_send_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DEFAULT TEMPLATES
-- ============================================================================
-- Note: These are inserted per-user when they first access the feature

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to render a template with variables
CREATE OR REPLACE FUNCTION render_guest_template(
  p_template_body TEXT,
  p_variables JSONB
)
RETURNS TEXT AS $$
DECLARE
  result TEXT := p_template_body;
  key TEXT;
  value TEXT;
BEGIN
  FOR key, value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    result := REPLACE(result, '{{' || key || '}}', COALESCE(value, ''));
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE guest_message_templates IS 'Reusable message templates for guest communication';
COMMENT ON COLUMN guest_message_templates.body IS 'Template body with {{variable}} placeholders';
COMMENT ON COLUMN guest_message_templates.auto_send IS 'Automatically send when trigger event occurs';
COMMENT ON TABLE guest_messages IS 'Sent messages to guests with delivery tracking';
COMMENT ON COLUMN guest_messages.variables_used IS 'Variables substituted into the template';
COMMENT ON TABLE auto_send_rules IS 'Rules for automatic message sending based on events';
