-- Migration: Define landlord_settings JSONB schema and defaults
-- Description: Extends user_platform_settings with AI communication preferences
-- Phase: Zone 2 - AI Enhancement
-- Note: Enables per-user AI mode selection and response preferences

-- ============================================================================
-- FUNCTION: Get default landlord settings
-- ============================================================================
CREATE OR REPLACE FUNCTION get_default_landlord_settings()
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    -- AI Communication Mode
    'ai_mode', 'assisted',  -- 'training', 'assisted', 'autonomous'

    -- Auto-respond settings
    'ai_auto_respond', true,
    'confidence_threshold', 85,  -- 0-100, responses above this auto-send

    -- Topics that always require review (regardless of confidence)
    'always_review_topics', jsonb_build_array(
      'refund',
      'discount',
      'complaint',
      'cancellation',
      'damage',
      'security_deposit'
    ),

    -- Contact types that always get notifications
    'notify_for_contact_types', jsonb_build_array('lead'),

    -- Response style
    'response_style', 'friendly',  -- 'friendly', 'professional', 'brief'

    -- Notification preferences
    'notifications', jsonb_build_object(
      'new_leads', true,
      'ai_needs_review', true,
      'booking_requests', true,
      'quiet_hours_enabled', false,
      'quiet_hours_start', '22:00',
      'quiet_hours_end', '08:00'
    ),

    -- AI personality customization
    'ai_personality', jsonb_build_object(
      'use_emojis', false,
      'greeting_style', 'Hi {first_name}!',
      'sign_off', 'Best',
      'owner_name', null  -- If null, use user's profile name
    ),

    -- Learning settings
    'learning', jsonb_build_object(
      'enabled', true,
      'min_samples_for_auto_adjust', 10,
      'recalculate_frequency_days', 7
    ),

    -- Lead handling
    'lead_settings', jsonb_build_object(
      'fast_response_enabled', true,  -- Lower threshold for new leads
      'lead_confidence_threshold', 70,  -- Lower than general threshold
      'always_notify_on_lead_response', true,
      'auto_score_leads', true
    ),

    -- Template preferences
    'templates', jsonb_build_object(
      'use_custom_templates', true,
      'ai_can_suggest_templates', true
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCTION: Merge landlord settings with defaults
-- ============================================================================
-- This ensures any missing keys get default values
CREATE OR REPLACE FUNCTION merge_landlord_settings(existing JSONB)
RETURNS JSONB AS $$
DECLARE
  defaults JSONB;
BEGIN
  defaults := get_default_landlord_settings();

  -- Deep merge: existing values override defaults
  RETURN defaults || COALESCE(existing, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- UPDATE: Set default landlord_settings for existing users
-- ============================================================================
UPDATE user_platform_settings
SET landlord_settings = merge_landlord_settings(landlord_settings)
WHERE landlord_settings IS NULL OR landlord_settings = '{}'::JSONB;

-- ============================================================================
-- TRIGGER: Auto-apply defaults on insert
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_set_default_landlord_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.landlord_settings IS NULL OR NEW.landlord_settings = '{}'::JSONB THEN
    NEW.landlord_settings := get_default_landlord_settings();
  ELSE
    NEW.landlord_settings := merge_landlord_settings(NEW.landlord_settings);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_landlord_settings_defaults ON user_platform_settings;
CREATE TRIGGER trigger_landlord_settings_defaults
  BEFORE INSERT OR UPDATE ON user_platform_settings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_default_landlord_settings();

-- ============================================================================
-- FUNCTION: Update specific landlord setting
-- ============================================================================
CREATE OR REPLACE FUNCTION update_landlord_setting(
  p_user_id UUID,
  p_path TEXT[],  -- e.g., ARRAY['notifications', 'new_leads']
  p_value JSONB
) RETURNS user_platform_settings AS $$
DECLARE
  settings user_platform_settings;
BEGIN
  UPDATE user_platform_settings
  SET
    landlord_settings = jsonb_set(
      COALESCE(landlord_settings, get_default_landlord_settings()),
      p_path,
      p_value
    ),
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO settings;

  IF NOT FOUND THEN
    -- Create settings if they don't exist
    INSERT INTO user_platform_settings (user_id, landlord_settings)
    VALUES (
      p_user_id,
      jsonb_set(get_default_landlord_settings(), p_path, p_value)
    )
    RETURNING * INTO settings;
  END IF;

  RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get landlord setting value
-- ============================================================================
CREATE OR REPLACE FUNCTION get_landlord_setting(
  p_user_id UUID,
  p_path TEXT[]
) RETURNS JSONB AS $$
DECLARE
  full_settings JSONB;
BEGIN
  SELECT merge_landlord_settings(landlord_settings)
  INTO full_settings
  FROM user_platform_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    full_settings := get_default_landlord_settings();
  END IF;

  -- Navigate to the requested path
  RETURN full_settings #> p_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Check if topic requires review
-- ============================================================================
CREATE OR REPLACE FUNCTION topic_requires_review(
  p_user_id UUID,
  p_topic TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  always_review JSONB;
BEGIN
  always_review := get_landlord_setting(p_user_id, ARRAY['always_review_topics']);

  RETURN always_review ? p_topic;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get effective confidence threshold
-- ============================================================================
CREATE OR REPLACE FUNCTION get_effective_confidence_threshold(
  p_user_id UUID,
  p_contact_type TEXT,
  p_topic TEXT DEFAULT NULL
) RETURNS NUMERIC AS $$
DECLARE
  settings JSONB;
  base_threshold NUMERIC;
  lead_threshold NUMERIC;
BEGIN
  settings := merge_landlord_settings(
    (SELECT landlord_settings FROM user_platform_settings WHERE user_id = p_user_id)
  );

  -- Get base threshold
  base_threshold := (settings->>'confidence_threshold')::NUMERIC / 100.0;

  -- Check if this is a lead with fast response enabled
  IF p_contact_type = 'lead' AND (settings->'lead_settings'->>'fast_response_enabled')::BOOLEAN THEN
    lead_threshold := (settings->'lead_settings'->>'lead_confidence_threshold')::NUMERIC / 100.0;
    RETURN LEAST(base_threshold, lead_threshold);
  END IF;

  -- Check if topic requires review (return very high threshold to force review)
  IF p_topic IS NOT NULL AND topic_requires_review(p_user_id, p_topic) THEN
    RETURN 1.0;  -- Impossible to auto-send
  END IF;

  RETURN base_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Should notify user for this response
-- ============================================================================
CREATE OR REPLACE FUNCTION should_notify_for_response(
  p_user_id UUID,
  p_contact_type TEXT,
  p_was_auto_sent BOOLEAN
) RETURNS BOOLEAN AS $$
DECLARE
  settings JSONB;
  notify_types JSONB;
BEGIN
  settings := merge_landlord_settings(
    (SELECT landlord_settings FROM user_platform_settings WHERE user_id = p_user_id)
  );

  -- Always notify if AI needs review
  IF NOT p_was_auto_sent AND (settings->'notifications'->>'ai_needs_review')::BOOLEAN THEN
    RETURN TRUE;
  END IF;

  -- Check if contact type is in notify list
  notify_types := settings->'notify_for_contact_types';
  IF notify_types ? p_contact_type THEN
    RETURN TRUE;
  END IF;

  -- For leads with always_notify_on_lead_response enabled
  IF p_contact_type = 'lead'
     AND (settings->'lead_settings'->>'always_notify_on_lead_response')::BOOLEAN
     AND p_was_auto_sent THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEW: User AI settings summary
-- ============================================================================
CREATE OR REPLACE VIEW v_user_ai_settings AS
SELECT
  ups.user_id,
  ups.active_platform,
  (ups.landlord_settings->>'ai_mode') AS ai_mode,
  (ups.landlord_settings->>'ai_auto_respond')::BOOLEAN AS ai_auto_respond,
  (ups.landlord_settings->>'confidence_threshold')::INT AS confidence_threshold,
  (ups.landlord_settings->>'response_style') AS response_style,
  (ups.landlord_settings->'lead_settings'->>'lead_confidence_threshold')::INT AS lead_confidence_threshold,
  ups.landlord_settings->'always_review_topics' AS always_review_topics,
  ups.landlord_settings->'notifications' AS notification_settings,
  ups.landlord_settings->'ai_personality' AS ai_personality,
  ups.updated_at
FROM user_platform_settings ups
WHERE 'landlord' = ANY(ups.enabled_platforms);

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Extended landlord_settings JSONB schema with AI preferences',
  jsonb_build_object(
    'migration', '20260128_landlord_settings_schema',
    'functions_created', ARRAY[
      'get_default_landlord_settings',
      'merge_landlord_settings',
      'update_landlord_setting',
      'get_landlord_setting',
      'topic_requires_review',
      'get_effective_confidence_threshold',
      'should_notify_for_response'
    ],
    'views_created', ARRAY['v_user_ai_settings'],
    'note', 'Per-user AI mode and response preferences'
  )
);
