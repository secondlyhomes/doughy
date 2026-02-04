-- Migration: RPC Functions for Smart Home / Integrations
-- Description: Replace PostgREST cross-schema joins for smart home access codes

-- ============================================================================
-- integrations.get_access_codes_with_booking
-- Access codes with device and booking data
-- ============================================================================
CREATE OR REPLACE FUNCTION integrations.get_access_codes_with_booking(
  p_user_id UUID,
  p_device_id UUID DEFAULT NULL,
  p_property_id UUID DEFAULT NULL
)
RETURNS TABLE (
  -- Access code columns
  id UUID,
  user_id UUID,
  device_id UUID,
  booking_id UUID,
  seam_access_code_id TEXT,
  code TEXT,
  name TEXT,
  status TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened device columns
  device_seam_device_id TEXT,
  device_name TEXT,
  device_type TEXT,
  device_model TEXT,
  device_property_id UUID,
  device_lock_state TEXT,
  device_connection_status TEXT,
  device_battery_level INTEGER,
  -- Flattened booking columns
  booking_start_date DATE,
  booking_end_date DATE,
  -- Flattened contact columns (nested via booking)
  contact_first_name TEXT,
  contact_last_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = integrations, landlord, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.user_id,
    ac.device_id,
    ac.booking_id,
    ac.seam_access_code_id,
    ac.code,
    ac.name,
    ac.status,
    ac.starts_at,
    ac.ends_at,
    ac.created_at,
    ac.updated_at,
    -- Device fields
    d.seam_device_id AS device_seam_device_id,
    d.name AS device_name,
    d.device_type AS device_type,
    d.model AS device_model,
    d.property_id AS device_property_id,
    d.lock_state AS device_lock_state,
    d.connection_status AS device_connection_status,
    d.battery_level AS device_battery_level,
    -- Booking fields
    b.start_date AS booking_start_date,
    b.end_date AS booking_end_date,
    -- Contact fields
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name
  FROM integrations.seam_access_codes ac
  LEFT JOIN integrations.seam_connected_devices d ON d.id = ac.device_id
  LEFT JOIN landlord.bookings b ON b.id = ac.booking_id
  LEFT JOIN crm.contacts c ON c.id = b.contact_id
  WHERE ac.user_id = p_user_id
    AND (p_device_id IS NULL OR ac.device_id = p_device_id)
    AND (p_property_id IS NULL OR d.property_id = p_property_id)
  ORDER BY ac.created_at DESC;
END;
$$;

COMMENT ON FUNCTION integrations.get_access_codes_with_booking IS
  'Fetches access codes with device, booking, and contact data.';

GRANT EXECUTE ON FUNCTION integrations.get_access_codes_with_booking TO authenticated;


-- ============================================================================
-- integrations.get_access_codes_by_property
-- Access codes for all devices in a property
-- ============================================================================
CREATE OR REPLACE FUNCTION integrations.get_access_codes_by_property(
  p_property_id UUID
)
RETURNS TABLE (
  -- Access code columns
  id UUID,
  user_id UUID,
  device_id UUID,
  booking_id UUID,
  seam_access_code_id TEXT,
  code TEXT,
  name TEXT,
  status TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- Flattened device columns
  device_seam_device_id TEXT,
  device_name TEXT,
  device_type TEXT,
  device_model TEXT,
  device_lock_state TEXT,
  device_connection_status TEXT,
  device_battery_level INTEGER,
  -- Flattened booking columns
  booking_start_date DATE,
  booking_end_date DATE,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = integrations, landlord, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.user_id,
    ac.device_id,
    ac.booking_id,
    ac.seam_access_code_id,
    ac.code,
    ac.name,
    ac.status,
    ac.starts_at,
    ac.ends_at,
    ac.created_at,
    ac.updated_at,
    -- Device fields
    d.seam_device_id AS device_seam_device_id,
    d.name AS device_name,
    d.device_type AS device_type,
    d.model AS device_model,
    d.lock_state AS device_lock_state,
    d.connection_status AS device_connection_status,
    d.battery_level AS device_battery_level,
    -- Booking fields
    b.start_date AS booking_start_date,
    b.end_date AS booking_end_date,
    -- Contact fields
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name
  FROM integrations.seam_access_codes ac
  INNER JOIN integrations.seam_connected_devices d ON d.id = ac.device_id
  LEFT JOIN landlord.bookings b ON b.id = ac.booking_id
  LEFT JOIN crm.contacts c ON c.id = b.contact_id
  WHERE d.property_id = p_property_id
  ORDER BY ac.created_at DESC;
END;
$$;

COMMENT ON FUNCTION integrations.get_access_codes_by_property IS
  'Fetches access codes for all devices in a property.';

GRANT EXECUTE ON FUNCTION integrations.get_access_codes_by_property TO authenticated;
