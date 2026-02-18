-- ============================================================================
-- Seam Smart Lock Integration
-- Enables landlords to connect smart locks and manage access codes for guests
-- ============================================================================

-- Connected smart lock devices via Seam
CREATE TABLE IF NOT EXISTS seam_connected_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seam_device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'lock', 'thermostat', etc.
  manufacturer TEXT,
  model TEXT,
  property_id UUID REFERENCES rental_properties(id) ON DELETE SET NULL,
  is_online BOOLEAN DEFAULT true,
  battery_level NUMERIC,
  capabilities JSONB DEFAULT '[]'::jsonb, -- ['lock', 'access_codes', 'battery_status']
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, seam_device_id)
);

-- Seam workspace connections (one per user)
CREATE TABLE IF NOT EXISTS seam_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  seam_workspace_id TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_webhook_at TIMESTAMPTZ,
  webhook_secret TEXT, -- For verifying Seam webhooks
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Access codes generated for bookings/guests
CREATE TABLE IF NOT EXISTS seam_access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES seam_connected_devices(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,

  seam_access_code_id TEXT, -- ID from Seam API
  code TEXT NOT NULL, -- The actual door code
  name TEXT NOT NULL, -- "Sarah Johnson - Jan 15-22"

  code_type TEXT NOT NULL DEFAULT 'time_bound', -- 'ongoing', 'time_bound', 'one_time'
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  status TEXT NOT NULL DEFAULT 'setting', -- 'setting', 'set', 'removing', 'removed', 'failed'
  error_message TEXT,

  -- Tracking
  times_used INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  sent_to_guest BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Lock operation audit log
CREATE TABLE IF NOT EXISTS seam_lock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES seam_connected_devices(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL, -- 'locked', 'unlocked', 'code_used', 'code_created', 'code_deleted', 'tamper', 'battery_low'
  triggered_by TEXT, -- 'user', 'guest', 'code', 'auto', 'manual', 'schedule'
  access_code_id UUID REFERENCES seam_access_codes(id) ON DELETE SET NULL,

  details JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE seam_connected_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE seam_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE seam_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seam_lock_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own connected devices"
  ON seam_connected_devices FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own workspace"
  ON seam_workspaces FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own access codes"
  ON seam_access_codes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own lock events"
  ON seam_lock_events FOR ALL
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_seam_devices_user ON seam_connected_devices(user_id);
CREATE INDEX idx_seam_devices_property ON seam_connected_devices(property_id);
CREATE INDEX idx_seam_codes_device ON seam_access_codes(device_id);
CREATE INDEX idx_seam_codes_booking ON seam_access_codes(booking_id);
CREATE INDEX idx_seam_codes_status ON seam_access_codes(status);
CREATE INDEX idx_seam_events_device ON seam_lock_events(device_id);
CREATE INDEX idx_seam_events_occurred ON seam_lock_events(occurred_at DESC);

-- Function to auto-generate access codes for confirmed bookings
CREATE OR REPLACE FUNCTION generate_booking_access_code()
RETURNS TRIGGER AS $$
DECLARE
  v_device_id UUID;
  v_code TEXT;
  v_guest_name TEXT;
BEGIN
  -- Only trigger on status change to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Find a connected lock for this property
    SELECT id INTO v_device_id
    FROM seam_connected_devices
    WHERE property_id = NEW.property_id
      AND user_id = NEW.user_id
      AND device_type = 'lock'
      AND is_online = true
    LIMIT 1;

    IF v_device_id IS NOT NULL THEN
      -- Generate a random 4-6 digit code
      v_code := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');

      -- Get guest name
      SELECT COALESCE(first_name || ' ' || last_name, first_name, 'Guest') INTO v_guest_name
      FROM crm_contacts
      WHERE id = NEW.contact_id;

      -- Create the access code record (actual Seam API call done by edge function)
      INSERT INTO seam_access_codes (
        user_id,
        device_id,
        booking_id,
        contact_id,
        code,
        name,
        code_type,
        starts_at,
        ends_at,
        status
      ) VALUES (
        NEW.user_id,
        v_device_id,
        NEW.id,
        NEW.contact_id,
        v_code,
        v_guest_name || ' - ' || TO_CHAR(NEW.check_in_date, 'Mon DD') || '-' || TO_CHAR(NEW.check_out_date, 'DD'),
        'time_bound',
        NEW.check_in_date + INTERVAL '15 hours', -- 3 PM check-in
        NEW.check_out_date + INTERVAL '11 hours', -- 11 AM check-out
        'pending'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-generating access codes
DROP TRIGGER IF EXISTS trg_booking_access_code ON rental_bookings;
CREATE TRIGGER trg_booking_access_code
  AFTER INSERT OR UPDATE ON rental_bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_access_code();

-- Function to log lock events
CREATE OR REPLACE FUNCTION log_lock_event(
  p_user_id UUID,
  p_device_id UUID,
  p_event_type TEXT,
  p_triggered_by TEXT DEFAULT 'system',
  p_access_code_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO seam_lock_events (
    user_id,
    device_id,
    event_type,
    triggered_by,
    access_code_id,
    details
  ) VALUES (
    p_user_id,
    p_device_id,
    p_event_type,
    p_triggered_by,
    p_access_code_id,
    p_details
  ) RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION log_lock_event TO authenticated;

COMMENT ON TABLE seam_connected_devices IS 'Smart lock devices connected via Seam API';
COMMENT ON TABLE seam_workspaces IS 'Seam workspace connection per user';
COMMENT ON TABLE seam_access_codes IS 'Access codes generated for bookings/guests';
COMMENT ON TABLE seam_lock_events IS 'Audit log of all lock operations';
