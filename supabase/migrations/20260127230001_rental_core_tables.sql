-- Migration: Create rental core tables
-- Description: Foundation tables for Landlord platform (rental_properties, rental_rooms, rental_bookings)
-- Phase: Zone 2 - Database Foundation
-- Note: These tables power the Landlord platform, separate from RE Investor's re_properties

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Rental type: short-term, medium-term, long-term
CREATE TYPE rental_type AS ENUM ('str', 'mtr', 'ltr');

-- Property type for rentals
CREATE TYPE rental_property_type AS ENUM (
  'single_family',
  'multi_family',
  'condo',
  'apartment',
  'townhouse',
  'room'
);

-- Rate type for pricing
CREATE TYPE rental_rate_type AS ENUM ('nightly', 'weekly', 'monthly');

-- Property status
CREATE TYPE rental_property_status AS ENUM ('active', 'inactive', 'maintenance');

-- Room status
CREATE TYPE rental_room_status AS ENUM ('available', 'occupied', 'maintenance', 'unavailable');

-- Booking status
CREATE TYPE rental_booking_status AS ENUM (
  'inquiry',      -- Initial contact, not yet confirmed
  'pending',      -- Awaiting confirmation/deposit
  'confirmed',    -- Booking confirmed
  'active',       -- Guest currently staying
  'completed',    -- Stay finished
  'cancelled'     -- Booking cancelled
);

-- Booking type: reservation (STR/MTR) vs lease (LTR)
CREATE TYPE rental_booking_type AS ENUM ('reservation', 'lease');

-- ============================================================================
-- 1. RENTAL_PROPERTIES TABLE
-- ============================================================================
-- Rental listings for Landlord platform (distinct from re_properties for RE Investor)
CREATE TABLE IF NOT EXISTS rental_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Property identification
  name TEXT NOT NULL,

  -- Address
  address TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  country TEXT DEFAULT 'USA',

  -- Property details
  property_type rental_property_type NOT NULL DEFAULT 'single_family',
  rental_type rental_type NOT NULL DEFAULT 'mtr',
  bedrooms INT NOT NULL DEFAULT 1,
  bathrooms NUMERIC(3,1) NOT NULL DEFAULT 1,
  square_feet INT,

  -- Pricing
  base_rate NUMERIC(10,2) NOT NULL,
  rate_type rental_rate_type NOT NULL DEFAULT 'monthly',
  cleaning_fee NUMERIC(10,2),
  security_deposit NUMERIC(10,2),

  -- Room-by-room rental support
  room_by_room_enabled BOOLEAN DEFAULT FALSE,

  -- Features
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
  house_rules JSONB DEFAULT '{}'::JSONB,

  -- External listings
  listing_urls JSONB DEFAULT '{}'::JSONB,
  -- Expected format: { "furnishedfinder": "url", "airbnb": "url", "turbotenant": "url" }

  -- Status
  status rental_property_status NOT NULL DEFAULT 'active',

  -- Notes
  description TEXT,
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rental_properties
CREATE INDEX idx_rental_properties_user_id ON rental_properties(user_id);
CREATE INDEX idx_rental_properties_status ON rental_properties(status) WHERE status = 'active';
CREATE INDEX idx_rental_properties_rental_type ON rental_properties(rental_type);
CREATE INDEX idx_rental_properties_city_state ON rental_properties(city, state);
CREATE INDEX idx_rental_properties_zip ON rental_properties(zip);
CREATE INDEX idx_rental_properties_room_by_room ON rental_properties(user_id) WHERE room_by_room_enabled = TRUE;
CREATE INDEX idx_rental_properties_created_at ON rental_properties(created_at DESC);

-- ============================================================================
-- 2. RENTAL_ROOMS TABLE
-- ============================================================================
-- Individual rooms for room-by-room rentals
CREATE TABLE IF NOT EXISTS rental_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE CASCADE,

  -- Room identification
  name TEXT NOT NULL,
  description TEXT,

  -- Room details
  size_sqft INT,
  has_private_bath BOOLEAN DEFAULT FALSE,
  has_private_entrance BOOLEAN DEFAULT FALSE,
  amenities TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Pricing
  weekly_rate NUMERIC(10,2),
  monthly_rate NUMERIC(10,2) NOT NULL,
  utilities_included BOOLEAN DEFAULT TRUE,

  -- Status
  status rental_room_status NOT NULL DEFAULT 'available',
  available_date DATE,

  -- Current booking reference (denormalized for quick lookups)
  current_booking_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rental_rooms
CREATE INDEX idx_rental_rooms_property_id ON rental_rooms(property_id);
CREATE INDEX idx_rental_rooms_status ON rental_rooms(status);
CREATE INDEX idx_rental_rooms_available ON rental_rooms(property_id, status) WHERE status = 'available';
CREATE INDEX idx_rental_rooms_current_booking ON rental_rooms(current_booking_id) WHERE current_booking_id IS NOT NULL;

-- ============================================================================
-- 3. RENTAL_BOOKINGS TABLE
-- ============================================================================
-- Reservations and leases
CREATE TABLE IF NOT EXISTS rental_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES rental_properties(id) ON DELETE RESTRICT,
  room_id UUID REFERENCES rental_rooms(id) ON DELETE RESTRICT, -- null = whole property

  -- Booking type
  booking_type rental_booking_type NOT NULL DEFAULT 'reservation',

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE, -- null for ongoing leases
  check_in_time TIME DEFAULT '15:00',
  check_out_time TIME DEFAULT '11:00',

  -- Pricing
  rate NUMERIC(10,2) NOT NULL,
  rate_type rental_rate_type NOT NULL,
  total_amount NUMERIC(10,2),
  deposit NUMERIC(10,2),
  deposit_status TEXT DEFAULT 'pending' CHECK(deposit_status IN ('pending', 'received', 'returned', 'forfeited')),

  -- Status
  status rental_booking_status NOT NULL DEFAULT 'inquiry',

  -- Source tracking
  source TEXT, -- 'furnishedfinder', 'airbnb', 'direct', etc.
  external_booking_id TEXT, -- ID from external platform

  -- Notes
  notes TEXT,
  guest_notes TEXT, -- Notes visible to guest
  internal_notes TEXT, -- Internal only

  -- Timestamps
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rental_bookings
CREATE INDEX idx_rental_bookings_user_id ON rental_bookings(user_id);
CREATE INDEX idx_rental_bookings_contact_id ON rental_bookings(contact_id);
CREATE INDEX idx_rental_bookings_property_id ON rental_bookings(property_id);
CREATE INDEX idx_rental_bookings_room_id ON rental_bookings(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_rental_bookings_status ON rental_bookings(status);
CREATE INDEX idx_rental_bookings_dates ON rental_bookings(start_date, end_date);
CREATE INDEX idx_rental_bookings_active ON rental_bookings(property_id, status) WHERE status IN ('confirmed', 'active');
CREATE INDEX idx_rental_bookings_upcoming ON rental_bookings(start_date) WHERE status = 'confirmed';
CREATE INDEX idx_rental_bookings_source ON rental_bookings(source) WHERE source IS NOT NULL;
CREATE INDEX idx_rental_bookings_created_at ON rental_bookings(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_rental_bookings_user_status ON rental_bookings(user_id, status);
CREATE INDEX idx_rental_bookings_property_dates ON rental_bookings(property_id, start_date, end_date);

-- ============================================================================
-- ADD FOREIGN KEY FOR ROOM CURRENT BOOKING
-- ============================================================================
ALTER TABLE rental_rooms
  ADD CONSTRAINT fk_rental_rooms_current_booking
  FOREIGN KEY (current_booking_id)
  REFERENCES rental_bookings(id)
  ON DELETE SET NULL;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE rental_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rental_properties_updated_at
  BEFORE UPDATE ON rental_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rental_rooms_updated_at
  BEFORE UPDATE ON rental_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rental_bookings_updated_at
  BEFORE UPDATE ON rental_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created rental core tables for Landlord platform',
  jsonb_build_object(
    'migration', '20260127_rental_core_tables',
    'tables_created', ARRAY['rental_properties', 'rental_rooms', 'rental_bookings'],
    'enums_created', ARRAY['rental_type', 'rental_property_type', 'rental_rate_type', 'rental_property_status', 'rental_room_status', 'rental_booking_status', 'rental_booking_type'],
    'note', 'Foundation for Landlord platform - Zone 2'
  )
);
