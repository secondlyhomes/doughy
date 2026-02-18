-- Migration: RPC Functions for Landlord Bookings
-- Description: Replace PostgREST cross-schema joins for landlord bookings

-- ============================================================================
-- landlord.get_bookings_with_contact
-- Bookings with contact, property, and room data
-- ============================================================================
CREATE OR REPLACE FUNCTION landlord.get_bookings_with_contact(
  p_user_id UUID,
  p_property_id UUID DEFAULT NULL,
  p_status TEXT[] DEFAULT NULL,
  p_date_filter TEXT DEFAULT NULL, -- 'upcoming', 'past', 'active', 'all'
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  -- Booking columns
  id UUID,
  user_id UUID,
  contact_id UUID,
  property_id UUID,
  room_id UUID,
  booking_type TEXT,
  start_date DATE,
  end_date DATE,
  rate NUMERIC,
  rate_type TEXT,
  deposit NUMERIC,
  total_amount NUMERIC,
  status TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  -- Flattened property columns
  property_name TEXT,
  property_address TEXT,
  -- Flattened room columns
  room_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = landlord, crm, public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.user_id,
    b.contact_id,
    b.property_id,
    b.room_id,
    b.booking_type,
    b.start_date,
    b.end_date,
    b.rate,
    b.rate_type,
    b.deposit,
    b.total_amount,
    b.status,
    b.source,
    b.notes,
    b.created_at,
    b.updated_at,
    b.confirmed_at,
    b.cancelled_at,
    -- Contact fields
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    c.email AS contact_email,
    c.phone AS contact_phone,
    -- Property fields
    p.name AS property_name,
    p.address AS property_address,
    -- Room fields
    r.name AS room_name
  FROM landlord.bookings b
  LEFT JOIN crm.contacts c ON c.id = b.contact_id
  LEFT JOIN landlord.properties p ON p.id = b.property_id
  LEFT JOIN landlord.rooms r ON r.id = b.room_id
  WHERE b.user_id = p_user_id
    AND (p_property_id IS NULL OR b.property_id = p_property_id)
    AND (p_status IS NULL OR b.status = ANY(p_status))
    AND (
      p_date_filter IS NULL
      OR p_date_filter = 'all'
      OR (p_date_filter = 'upcoming' AND b.start_date >= v_today)
      OR (p_date_filter = 'past' AND b.end_date < v_today)
      OR (p_date_filter = 'active' AND b.status = 'active')
    )
  ORDER BY b.start_date ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

COMMENT ON FUNCTION landlord.get_bookings_with_contact IS
  'Fetches bookings with joined contact, property, and room data.';

GRANT EXECUTE ON FUNCTION landlord.get_bookings_with_contact TO authenticated;


-- ============================================================================
-- landlord.get_booking_by_id
-- Single booking with full relations
-- ============================================================================
CREATE OR REPLACE FUNCTION landlord.get_booking_by_id(
  p_booking_id UUID
)
RETURNS TABLE (
  -- Booking columns
  id UUID,
  user_id UUID,
  contact_id UUID,
  property_id UUID,
  room_id UUID,
  booking_type TEXT,
  start_date DATE,
  end_date DATE,
  rate NUMERIC,
  rate_type TEXT,
  deposit NUMERIC,
  total_amount NUMERIC,
  status TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  -- Flattened property columns
  property_name TEXT,
  property_address TEXT,
  -- Flattened room columns
  room_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = landlord, crm, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.user_id,
    b.contact_id,
    b.property_id,
    b.room_id,
    b.booking_type,
    b.start_date,
    b.end_date,
    b.rate,
    b.rate_type,
    b.deposit,
    b.total_amount,
    b.status,
    b.source,
    b.notes,
    b.created_at,
    b.updated_at,
    b.confirmed_at,
    b.cancelled_at,
    -- Contact fields
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    c.email AS contact_email,
    c.phone AS contact_phone,
    -- Property fields
    p.name AS property_name,
    p.address AS property_address,
    -- Room fields
    r.name AS room_name
  FROM landlord.bookings b
  LEFT JOIN crm.contacts c ON c.id = b.contact_id
  LEFT JOIN landlord.properties p ON p.id = b.property_id
  LEFT JOIN landlord.rooms r ON r.id = b.room_id
  WHERE b.id = p_booking_id;
END;
$$;

COMMENT ON FUNCTION landlord.get_booking_by_id IS
  'Fetches a single booking with full relations.';

GRANT EXECUTE ON FUNCTION landlord.get_booking_by_id TO authenticated;


-- ============================================================================
-- landlord.get_upcoming_bookings
-- Upcoming bookings for a property (used in property detail)
-- ============================================================================
CREATE OR REPLACE FUNCTION landlord.get_upcoming_bookings(
  p_property_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  -- Booking columns
  id UUID,
  user_id UUID,
  contact_id UUID,
  property_id UUID,
  room_id UUID,
  booking_type TEXT,
  start_date DATE,
  end_date DATE,
  rate NUMERIC,
  rate_type TEXT,
  deposit NUMERIC,
  total_amount NUMERIC,
  status TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  -- Flattened contact columns
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  -- Flattened room columns
  room_name TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = landlord, crm, public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_upcoming_statuses TEXT[] := ARRAY['inquiry', 'pending', 'confirmed', 'active'];
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.user_id,
    b.contact_id,
    b.property_id,
    b.room_id,
    b.booking_type,
    b.start_date,
    b.end_date,
    b.rate,
    b.rate_type,
    b.deposit,
    b.total_amount,
    b.status,
    b.source,
    b.notes,
    b.created_at,
    b.updated_at,
    b.confirmed_at,
    b.cancelled_at,
    -- Contact fields
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    c.email AS contact_email,
    c.phone AS contact_phone,
    -- Room fields
    r.name AS room_name
  FROM landlord.bookings b
  LEFT JOIN crm.contacts c ON c.id = b.contact_id
  LEFT JOIN landlord.rooms r ON r.id = b.room_id
  WHERE b.property_id = p_property_id
    AND b.start_date >= v_today
    AND b.status = ANY(v_upcoming_statuses)
  ORDER BY b.start_date ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION landlord.get_upcoming_bookings IS
  'Fetches upcoming bookings for a property with contact and room data.';

GRANT EXECUTE ON FUNCTION landlord.get_upcoming_bookings TO authenticated;
