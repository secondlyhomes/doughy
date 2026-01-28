-- Migration: Rental functions and triggers
-- Description: Helper functions for availability checking, booking management, etc.
-- Phase: Zone 2 - Database Foundation
-- Note: Business logic functions for Landlord platform

-- ============================================================================
-- FUNCTION: Check availability
-- ============================================================================
-- Check if a property/room is available for given dates
CREATE OR REPLACE FUNCTION check_rental_availability(
  p_property_id UUID,
  p_room_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS TABLE (
  available BOOLEAN,
  conflict_count INT,
  conflicts JSONB
) AS $$
DECLARE
  v_conflicts JSONB;
  v_count INT;
BEGIN
  -- Find conflicting bookings
  WITH conflicting_bookings AS (
    SELECT
      rb.id,
      rb.contact_id,
      rb.start_date,
      rb.end_date,
      rb.status,
      cc.first_name || ' ' || cc.last_name AS guest_name
    FROM rental_bookings rb
    LEFT JOIN crm_contacts cc ON cc.id = rb.contact_id
    WHERE rb.property_id = p_property_id
      AND rb.status IN ('confirmed', 'active', 'pending')
      AND (p_exclude_booking_id IS NULL OR rb.id != p_exclude_booking_id)
      -- Room match (if specified)
      AND (
        p_room_id IS NULL
        OR rb.room_id IS NULL  -- Whole property bookings block all rooms
        OR rb.room_id = p_room_id
      )
      -- Date overlap check
      AND (
        p_start_date IS NULL
        OR p_end_date IS NULL
        OR (
          rb.start_date < p_end_date
          AND (rb.end_date IS NULL OR rb.end_date > p_start_date)
        )
      )
  )
  SELECT
    COUNT(*)::INT,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'contact_id', contact_id,
          'guest_name', guest_name,
          'start_date', start_date,
          'end_date', end_date,
          'status', status
        )
      ),
      '[]'::JSONB
    )
  INTO v_count, v_conflicts
  FROM conflicting_bookings;

  RETURN QUERY SELECT
    (v_count = 0) AS available,
    v_count AS conflict_count,
    v_conflicts AS conflicts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get next available date
-- ============================================================================
-- Find the next available date for a property/room
CREATE OR REPLACE FUNCTION get_next_available_date(
  p_property_id UUID,
  p_room_id UUID DEFAULT NULL,
  p_min_days INT DEFAULT 1
)
RETURNS DATE AS $$
DECLARE
  v_next_date DATE;
  v_current_date DATE := CURRENT_DATE;
  v_max_check_date DATE := CURRENT_DATE + INTERVAL '1 year';
BEGIN
  -- Find gaps in bookings
  WITH booking_dates AS (
    SELECT
      start_date,
      COALESCE(end_date, start_date + INTERVAL '1 year') AS end_date
    FROM rental_bookings
    WHERE property_id = p_property_id
      AND status IN ('confirmed', 'active', 'pending')
      AND (p_room_id IS NULL OR room_id IS NULL OR room_id = p_room_id)
      AND (end_date IS NULL OR end_date > v_current_date)
    ORDER BY start_date
  ),
  -- Generate date series to check
  date_gaps AS (
    SELECT
      GREATEST(v_current_date, LAG(end_date, 1, v_current_date) OVER (ORDER BY start_date)) AS gap_start,
      start_date AS gap_end
    FROM booking_dates
    UNION ALL
    SELECT
      COALESCE(MAX(end_date), v_current_date),
      v_max_check_date
    FROM booking_dates
  )
  SELECT gap_start INTO v_next_date
  FROM date_gaps
  WHERE gap_end - gap_start >= p_min_days
  ORDER BY gap_start
  LIMIT 1;

  RETURN COALESCE(v_next_date, v_current_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Calculate booking revenue
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_booking_revenue(
  p_rate NUMERIC,
  p_rate_type rental_rate_type,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  v_days INT;
  v_weeks NUMERIC;
  v_months NUMERIC;
BEGIN
  IF p_end_date IS NULL THEN
    RETURN NULL;  -- Ongoing booking
  END IF;

  v_days := p_end_date - p_start_date;

  CASE p_rate_type
    WHEN 'nightly' THEN
      RETURN p_rate * v_days;
    WHEN 'weekly' THEN
      v_weeks := CEIL(v_days::NUMERIC / 7);
      RETURN p_rate * v_weeks;
    WHEN 'monthly' THEN
      v_months := CEIL(v_days::NUMERIC / 30);
      RETURN p_rate * v_months;
    ELSE
      RETURN p_rate * v_days;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGER: Auto-calculate booking total
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_booking_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL THEN
    NEW.total_amount := calculate_booking_revenue(
      NEW.rate,
      NEW.rate_type,
      NEW.start_date,
      NEW.end_date
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_booking_total
  BEFORE INSERT OR UPDATE OF rate, rate_type, start_date, end_date
  ON rental_bookings
  FOR EACH ROW EXECUTE FUNCTION calculate_booking_total();

-- ============================================================================
-- TRIGGER: Update room status on booking changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_room_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- On booking confirmed/active, update room
  IF NEW.room_id IS NOT NULL THEN
    IF NEW.status IN ('confirmed', 'active') THEN
      UPDATE rental_rooms
      SET
        status = 'occupied',
        current_booking_id = NEW.id,
        updated_at = NOW()
      WHERE id = NEW.room_id;
    -- On booking completed/cancelled, free the room
    ELSIF NEW.status IN ('completed', 'cancelled') THEN
      UPDATE rental_rooms
      SET
        status = 'available',
        current_booking_id = NULL,
        updated_at = NOW()
      WHERE id = NEW.room_id
        AND current_booking_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_on_booking
  AFTER INSERT OR UPDATE OF status
  ON rental_bookings
  FOR EACH ROW EXECUTE FUNCTION update_room_on_booking();

-- ============================================================================
-- TRIGGER: Set confirmed_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION set_booking_confirmed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmed_at := NOW();
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_timestamps
  BEFORE UPDATE OF status
  ON rental_bookings
  FOR EACH ROW EXECUTE FUNCTION set_booking_confirmed_at();

-- ============================================================================
-- FUNCTION: Get conversation summary
-- ============================================================================
CREATE OR REPLACE FUNCTION get_conversation_summary(p_user_id UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  active_conversations BIGINT,
  escalated_conversations BIGINT,
  pending_ai_responses BIGINT,
  unread_messages BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM rental_conversations WHERE user_id = p_user_id) AS total_conversations,
    (SELECT COUNT(*) FROM rental_conversations WHERE user_id = p_user_id AND status = 'active') AS active_conversations,
    (SELECT COUNT(*) FROM rental_conversations WHERE user_id = p_user_id AND status = 'escalated') AS escalated_conversations,
    (SELECT COUNT(*) FROM rental_ai_queue WHERE user_id = p_user_id AND status = 'pending') AS pending_ai_responses,
    (SELECT COALESCE(SUM(unread_count), 0) FROM rental_conversations WHERE user_id = p_user_id) AS unread_messages;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get property occupancy stats
-- ============================================================================
CREATE OR REPLACE FUNCTION get_property_occupancy(
  p_property_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_days INT,
  occupied_days INT,
  occupancy_rate NUMERIC,
  revenue NUMERIC,
  booking_count BIGINT
) AS $$
DECLARE
  v_start DATE := COALESCE(p_start_date, DATE_TRUNC('month', CURRENT_DATE)::DATE);
  v_end DATE := COALESCE(p_end_date, (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE);
BEGIN
  RETURN QUERY
  WITH period_bookings AS (
    SELECT
      GREATEST(start_date, v_start) AS actual_start,
      LEAST(COALESCE(end_date, v_end), v_end) AS actual_end,
      rate,
      rate_type
    FROM rental_bookings
    WHERE property_id = p_property_id
      AND status IN ('confirmed', 'active', 'completed')
      AND start_date <= v_end
      AND (end_date IS NULL OR end_date >= v_start)
  )
  SELECT
    (v_end - v_start)::INT AS total_days,
    COALESCE(SUM(actual_end - actual_start)::INT, 0) AS occupied_days,
    CASE
      WHEN (v_end - v_start) > 0
      THEN ROUND(COALESCE(SUM(actual_end - actual_start)::NUMERIC / (v_end - v_start) * 100, 0), 1)
      ELSE 0
    END AS occupancy_rate,
    COALESCE(SUM(calculate_booking_revenue(rate, rate_type, actual_start, actual_end)), 0) AS revenue,
    COUNT(*) AS booking_count
  FROM period_bookings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Score a contact/lead
-- ============================================================================
CREATE OR REPLACE FUNCTION score_contact(p_contact_id UUID)
RETURNS INT AS $$
DECLARE
  v_score INT := 0;
  v_contact crm_contacts;
  v_conversation_count INT;
  v_booking_count INT;
  v_last_message_days INT;
BEGIN
  SELECT * INTO v_contact FROM crm_contacts WHERE id = p_contact_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Base points for having contact info
  IF v_contact.email IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_contact.phone IS NOT NULL THEN v_score := v_score + 10; END IF;

  -- Points for conversation engagement
  SELECT COUNT(*) INTO v_conversation_count
  FROM rental_conversations
  WHERE contact_id = p_contact_id AND status = 'active';
  v_score := v_score + LEAST(v_conversation_count * 5, 20);

  -- Points for booking history
  SELECT COUNT(*) INTO v_booking_count
  FROM rental_bookings
  WHERE contact_id = p_contact_id AND status IN ('confirmed', 'active', 'completed');
  v_score := v_score + LEAST(v_booking_count * 15, 30);

  -- Recency bonus
  SELECT EXTRACT(DAY FROM NOW() - MAX(created_at))::INT INTO v_last_message_days
  FROM rental_messages m
  JOIN rental_conversations c ON c.id = m.conversation_id
  WHERE c.contact_id = p_contact_id AND m.direction = 'inbound';

  IF v_last_message_days IS NOT NULL AND v_last_message_days < 7 THEN
    v_score := v_score + 20;
  ELSIF v_last_message_days IS NOT NULL AND v_last_message_days < 30 THEN
    v_score := v_score + 10;
  END IF;

  -- Cap at 100
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-expire AI queue items
-- ============================================================================
-- Note: This should be run by a scheduled job, not a trigger
-- But we can create a function for it
CREATE OR REPLACE FUNCTION expire_ai_queue_items()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE rental_ai_queue
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migration complete: rental functions and triggers
