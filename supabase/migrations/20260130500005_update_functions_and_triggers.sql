-- Migration: Update Functions and Triggers
-- Phase 6: Update all functions and triggers to use new table names
-- Date: 2026-01-30
--
-- This migration updates all functions and triggers that reference renamed tables.

BEGIN;

-- ============================================================================
-- STEP 0: Drop triggers first (they depend on the functions we're replacing)
-- ============================================================================

DROP TRIGGER IF EXISTS set_comp_workspace_id_trigger ON public.investor_comps;
DROP TRIGGER IF EXISTS set_lead_property_workspace_trigger ON public.investor_lead_properties;
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON public.landlord_messages;

-- ============================================================================
-- STEP 1: Drop old functions (will recreate with new table references)
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_conversation_summary(UUID);
DROP FUNCTION IF EXISTS public.set_comp_workspace_id();
DROP FUNCTION IF EXISTS public.set_lead_property_workspace();
DROP FUNCTION IF EXISTS public.update_conversation_on_message();
DROP FUNCTION IF EXISTS public.update_property_geo_point(UUID, NUMERIC, NUMERIC);

-- ============================================================================
-- STEP 2: Recreate functions with new table names
-- ============================================================================

-- get_conversation_summary - Updated to use landlord_* tables
CREATE OR REPLACE FUNCTION public.get_conversation_summary(p_user_id UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  active_conversations BIGINT,
  escalated_conversations BIGINT,
  pending_ai_queue BIGINT,
  unread_messages BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM landlord_conversations WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM landlord_conversations WHERE user_id = p_user_id AND status = 'active'),
    (SELECT COUNT(*) FROM landlord_conversations WHERE user_id = p_user_id AND is_escalated = true),
    (SELECT COUNT(*) FROM landlord_ai_queue_items WHERE user_id = p_user_id AND status = 'pending'),
    (SELECT COUNT(*) FROM landlord_messages m
     JOIN landlord_conversations c ON m.conversation_id = c.id
     WHERE c.user_id = p_user_id AND m.is_read = false AND m.direction = 'inbound');
END;
$$;

-- set_comp_workspace_id - Updated to use investor_properties
CREATE OR REPLACE FUNCTION public.set_comp_workspace_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only set workspace_id if it's not already set
    IF NEW.workspace_id IS NULL THEN
        -- Get the workspace_id from the property
        SELECT workspace_id INTO NEW.workspace_id
        FROM investor_properties
        WHERE id = NEW.property_id;
    END IF;

    RETURN NEW;
END;
$$;

-- set_lead_property_workspace - Updated to use investor_properties
CREATE OR REPLACE FUNCTION public.set_lead_property_workspace()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lead_workspace_id UUID;
  property_workspace_id UUID;
BEGIN
  -- Try to get the workspace_id from the lead
  SELECT workspace_id INTO lead_workspace_id
  FROM crm_leads
  WHERE id = NEW.lead_id
  LIMIT 1;

  -- If lead has workspace_id, use it
  IF lead_workspace_id IS NOT NULL THEN
    NEW.workspace_id := lead_workspace_id;
  ELSE
    -- Try to get the workspace_id from the property
    SELECT workspace_id INTO property_workspace_id
    FROM investor_properties
    WHERE id = NEW.property_id
    LIMIT 1;

    -- If property has workspace_id, use it
    IF property_workspace_id IS NOT NULL THEN
      NEW.workspace_id := property_workspace_id;
    ELSE
      -- Otherwise, try to get the user's workspace
      SELECT workspace_id INTO NEW.workspace_id
      FROM workspace_members
      WHERE user_id = auth.uid()
      LIMIT 1;
    END IF;
  END IF;

  -- Ensure user_id is set
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

-- update_conversation_on_message - Updated to use landlord_conversations
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE landlord_conversations
  SET
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- update_property_geo_point - Updated to use investor_properties
CREATE OR REPLACE FUNCTION public.update_property_geo_point(
  p_property_id UUID,
  p_latitude NUMERIC,
  p_longitude NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_property RECORD;
  v_result JSONB;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();

  -- Verify the user has access to this property
  SELECT * INTO v_property
  FROM investor_properties p
  WHERE p.id = p_property_id
  AND (
    p.user_id = v_user_id OR
    p.workspace_id IN (
      SELECT workspace_id
      FROM workspace_members
      WHERE user_id = v_user_id
    )
  );

  IF v_property IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Property not found or access denied'
    );
  END IF;

  -- Validate the coordinates
  IF p_latitude < -90 OR p_latitude > 90 OR p_longitude < -180 OR p_longitude > 180 THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid coordinates'
    );
  END IF;

  -- Try to update with properly formatted PostGIS point
  BEGIN
    -- Check if PostGIS extension is available
    IF EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'postgis'
    ) THEN
      -- Use PostGIS to create a proper geometry point
      UPDATE investor_properties
      SET
        geo_point = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
        updated_at = NOW()
      WHERE id = p_property_id;

      v_result := jsonb_build_object(
        'success', true,
        'message', 'Geo point updated with PostGIS',
        'coordinates', jsonb_build_object('lat', p_latitude, 'lng', p_longitude)
      );
    ELSE
      -- If PostGIS is not available, store as JSONB
      UPDATE investor_properties
      SET
        geo_point = jsonb_build_object('lat', p_latitude, 'lng', p_longitude),
        updated_at = NOW()
      WHERE id = p_property_id;

      v_result := jsonb_build_object(
        'success', true,
        'message', 'Geo point updated as JSONB',
        'coordinates', jsonb_build_object('lat', p_latitude, 'lng', p_longitude)
      );
    END IF;

    RETURN v_result;
  EXCEPTION WHEN OTHERS THEN
    -- Fall back to storing as JSONB if there's any error
    BEGIN
      UPDATE investor_properties
      SET
        geo_point = jsonb_build_object('lat', p_latitude, 'lng', p_longitude),
        updated_at = NOW()
      WHERE id = p_property_id;

      RETURN jsonb_build_object(
        'success', true,
        'message', 'Geo point updated as JSONB (fallback)',
        'coordinates', jsonb_build_object('lat', p_latitude, 'lng', p_longitude)
      );
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Error updating geo_point: ' || SQLERRM
      );
    END;
  END;
END;
$$;

-- ============================================================================
-- STEP 3: Recreate triggers with new table names
-- ============================================================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS set_comp_workspace_trigger ON public.investor_comps;
DROP TRIGGER IF EXISTS set_lead_property_workspace_trigger ON public.investor_lead_properties;
DROP TRIGGER IF EXISTS update_conversation_on_message_trigger ON public.landlord_messages;

-- Recreate triggers
CREATE TRIGGER set_comp_workspace_trigger
  BEFORE INSERT ON public.investor_comps
  FOR EACH ROW
  EXECUTE FUNCTION public.set_comp_workspace_id();

CREATE TRIGGER set_lead_property_workspace_trigger
  BEFORE INSERT ON public.investor_lead_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lead_property_workspace();

CREATE TRIGGER update_conversation_on_message_trigger
  AFTER INSERT ON public.landlord_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_on_message();

-- ============================================================================
-- STEP 4: Grant permissions on new functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_conversation_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_comp_workspace_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_lead_property_workspace() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_on_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_property_geo_point(UUID, NUMERIC, NUMERIC) TO authenticated;

COMMIT;
