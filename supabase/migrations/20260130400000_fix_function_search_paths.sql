-- Migration: Fix Function Search Paths
-- Description: Add SET search_path = public to all SECURITY DEFINER functions
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
-- Risk: SQL injection via search_path manipulation if not fixed

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS - These are the critical ones to fix
-- ============================================================================

-- add_mail_credits
CREATE OR REPLACE FUNCTION public.add_mail_credits(p_user_id uuid, p_amount numeric, p_description text DEFAULT 'Credit purchase'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
    INSERT INTO user_mail_credits (user_id, balance, lifetime_purchased)
    VALUES (p_user_id, p_amount, p_amount);
    v_new_balance := p_amount;
  ELSE
    -- Calculate new balance
    v_new_balance := COALESCE(v_current_balance, 0) + p_amount;

    -- Update balance
    UPDATE user_mail_credits
    SET
      balance = v_new_balance,
      lifetime_purchased = COALESCE(lifetime_purchased, 0) + p_amount,
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Record transaction
  INSERT INTO mail_credit_transactions (
    user_id, type, amount, balance_after, description
  )
  VALUES (
    p_user_id, 'purchase', p_amount, v_new_balance, p_description
  );

  RETURN true;
END;
$function$;

-- add_mail_credits_refund
CREATE OR REPLACE FUNCTION public.add_mail_credits_refund(p_user_id uuid, p_amount numeric, p_reason text DEFAULT 'Refund'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
    -- Create credits record if doesn't exist (shouldn't happen for refunds)
    INSERT INTO user_mail_credits (user_id, balance)
    VALUES (p_user_id, p_amount);
    v_new_balance := p_amount;
  ELSE
    -- Calculate new balance
    v_new_balance := COALESCE(v_current_balance, 0) + p_amount;

    -- Update balance (also reduce lifetime_used since it was refunded)
    UPDATE user_mail_credits
    SET
      balance = v_new_balance,
      lifetime_used = GREATEST(0, COALESCE(lifetime_used, 0) - p_amount),
      updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  -- Record transaction
  INSERT INTO mail_credit_transactions (
    user_id, type, amount, balance_after, refund_reason, description
  )
  VALUES (
    p_user_id, 'refund', p_amount, v_new_balance, p_reason,
    'Refund: ' || p_reason
  );

  RETURN true;
END;
$function$;

-- deduct_mail_credits
CREATE OR REPLACE FUNCTION public.deduct_mail_credits(p_user_id uuid, p_amount numeric, p_touch_log_id uuid, p_mail_piece_type mail_piece_type, p_pieces_count integer DEFAULT 1, p_description text DEFAULT 'Direct mail'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
    RAISE EXCEPTION 'User has no mail credits record';
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient mail credits. Required: %, Available: %', p_amount, v_current_balance;
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- Update balance
  UPDATE user_mail_credits
  SET
    balance = v_new_balance,
    lifetime_used = COALESCE(lifetime_used, 0) + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Record transaction
  INSERT INTO mail_credit_transactions (
    user_id, type, amount, balance_after, touch_log_id,
    mail_piece_type, pieces_count, description
  )
  VALUES (
    p_user_id, 'deduction', p_amount, v_new_balance, p_touch_log_id,
    p_mail_piece_type, p_pieces_count, p_description
  );

  RETURN true;
END;
$function$;

-- advance_enrollment_step
CREATE OR REPLACE FUNCTION public.advance_enrollment_step(p_enrollment_id uuid, p_touch_log_id uuid DEFAULT NULL::uuid)
RETURNS drip_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- calculate_adaptive_confidence
CREATE OR REPLACE FUNCTION public.calculate_adaptive_confidence(p_user_id uuid, p_message_type text, p_topic text, p_contact_type text, p_base_confidence numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  adjustment NUMERIC := 0;
  total_weight NUMERIC := 0;
  record_adjustment ai_confidence_adjustments%ROWTYPE;
BEGIN
  SELECT * INTO record_adjustment FROM ai_confidence_adjustments
  WHERE user_id = p_user_id AND message_type = p_message_type AND topic = p_topic AND contact_type = p_contact_type AND sample_size >= 5;
  IF FOUND THEN adjustment := adjustment + (record_adjustment.confidence_adjustment * 0.4); total_weight := total_weight + 0.4; END IF;

  SELECT * INTO record_adjustment FROM ai_confidence_adjustments
  WHERE user_id = p_user_id AND message_type = p_message_type AND topic IS NULL AND contact_type = p_contact_type AND sample_size >= 10;
  IF FOUND THEN adjustment := adjustment + (record_adjustment.confidence_adjustment * 0.3); total_weight := total_weight + 0.3; END IF;

  SELECT * INTO record_adjustment FROM ai_confidence_adjustments
  WHERE user_id = p_user_id AND message_type = p_message_type AND topic IS NULL AND contact_type IS NULL AND sample_size >= 20;
  IF FOUND THEN adjustment := adjustment + (record_adjustment.confidence_adjustment * 0.2); total_weight := total_weight + 0.2; END IF;

  SELECT * INTO record_adjustment FROM ai_confidence_adjustments
  WHERE user_id = p_user_id AND message_type IS NULL AND topic IS NULL AND contact_type IS NULL AND sample_size >= 50;
  IF FOUND THEN adjustment := adjustment + (record_adjustment.confidence_adjustment * 0.1); total_weight := total_weight + 0.1; END IF;

  IF total_weight > 0 THEN adjustment := adjustment / total_weight; END IF;
  RETURN GREATEST(0, LEAST(1, p_base_confidence + adjustment));
END;
$function$;

-- check_rate_limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_channel text, p_hourly_limit integer DEFAULT 100, p_burst_limit integer DEFAULT 10)
RETURNS TABLE(allowed boolean, current_count integer, remaining integer, window_type text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_burst_count INTEGER;
  v_hourly_count INTEGER;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Count messages in burst window (1 minute)
  SELECT COUNT(*)::INTEGER INTO v_burst_count
  FROM moltbot_rate_limits
  WHERE user_id = p_user_id
    AND channel = p_channel
    AND window_start > v_now - INTERVAL '1 minute';

  -- Count messages in hourly window
  SELECT COUNT(*)::INTEGER INTO v_hourly_count
  FROM moltbot_rate_limits
  WHERE user_id = p_user_id
    AND channel = p_channel
    AND window_start > v_now - INTERVAL '1 hour';

  -- Check burst limit first
  IF v_burst_count >= p_burst_limit THEN
    RETURN QUERY SELECT false, v_burst_count, 0, 'burst'::TEXT;
    RETURN;
  END IF;

  -- Check hourly limit
  IF v_hourly_count >= p_hourly_limit THEN
    RETURN QUERY SELECT false, v_hourly_count, 0, 'hourly'::TEXT;
    RETURN;
  END IF;

  -- Record this request
  INSERT INTO moltbot_rate_limits (user_id, channel, window_start, request_count)
  VALUES (p_user_id, p_channel, v_now, 1);

  -- Return success with remaining counts
  RETURN QUERY SELECT
    true,
    v_hourly_count + 1,
    LEAST(p_burst_limit - v_burst_count - 1, p_hourly_limit - v_hourly_count - 1),
    'ok'::TEXT;
END;
$function$;

-- check_rental_availability
CREATE OR REPLACE FUNCTION public.check_rental_availability(p_property_id uuid, p_room_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_exclude_booking_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(available boolean, conflict_count integer, conflicts jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_conflicts JSONB := '[]'::JSONB;
  v_conflict_count INTEGER := 0;
BEGIN
  -- Find conflicting bookings
  SELECT COUNT(*)::INTEGER, COALESCE(jsonb_agg(jsonb_build_object(
    'booking_id', b.id,
    'guest_name', c.first_name || ' ' || c.last_name,
    'start_date', b.start_date,
    'end_date', b.end_date,
    'status', b.status
  )), '[]'::JSONB)
  INTO v_conflict_count, v_conflicts
  FROM rental_bookings b
  LEFT JOIN crm_contacts c ON b.contact_id = c.id
  WHERE b.property_id = p_property_id
    AND (p_room_id IS NULL OR b.room_id = p_room_id)
    AND b.status NOT IN ('cancelled', 'completed')
    AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
    AND (
      (p_start_date IS NOT NULL AND p_end_date IS NOT NULL AND
       b.start_date < p_end_date AND (b.end_date IS NULL OR b.end_date > p_start_date))
      OR (p_start_date IS NULL AND p_end_date IS NULL)
    );

  RETURN QUERY SELECT
    v_conflict_count = 0,
    v_conflict_count,
    v_conflicts;
END;
$function$;

-- cleanup_old_rate_limits
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM moltbot_rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;

-- create_default_workspace
CREATE OR REPLACE FUNCTION public.create_default_workspace()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create a default workspace for the new user
  INSERT INTO workspaces (name, owner_id)
  VALUES (COALESCE(NEW.name, NEW.email, 'My Workspace') || '''s Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;

  -- Add user as a member of their workspace
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  -- Update user profile with workspace_id
  UPDATE user_profiles
  SET workspace_id = new_workspace_id
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;

-- expire_ai_queue_items
CREATE OR REPLACE FUNCTION public.expire_ai_queue_items()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Expire rental AI queue items older than 24 hours
  UPDATE rental_ai_queue
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- Expire investor AI queue items older than 24 hours
  UPDATE investor_ai_queue
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours';

  expired_count := expired_count + ROW_COUNT;

  RETURN expired_count;
END;
$function$;

-- get_contact_episodic_memories
CREATE OR REPLACE FUNCTION public.get_contact_episodic_memories(p_user_id uuid, p_contact_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(memory_type moltbot_episodic_type, summary text, key_facts jsonb, sentiment text, importance integer, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    em.memory_type,
    em.summary,
    em.key_facts,
    em.sentiment,
    em.importance,
    em.created_at
  FROM moltbot_episodic_memory em
  WHERE em.user_id = p_user_id
    AND em.contact_id = p_contact_id
    AND (em.expires_at IS NULL OR em.expires_at > NOW())
  ORDER BY em.importance DESC, em.created_at DESC
  LIMIT p_limit;
END;
$function$;

-- get_conversation_summary
CREATE OR REPLACE FUNCTION public.get_conversation_summary(p_user_id uuid)
RETURNS TABLE(total_conversations bigint, active_conversations bigint, escalated_conversations bigint, pending_ai_responses bigint, unread_messages bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM rental_conversations WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM rental_conversations WHERE user_id = p_user_id AND status = 'active'),
    (SELECT COUNT(*) FROM rental_conversations WHERE user_id = p_user_id AND is_escalated = true),
    (SELECT COUNT(*) FROM rental_ai_queue WHERE user_id = p_user_id AND status = 'pending'),
    (SELECT COUNT(*) FROM rental_messages m
     JOIN rental_conversations c ON m.conversation_id = c.id
     WHERE c.user_id = p_user_id AND m.is_read = false AND m.direction = 'inbound');
END;
$function$;

-- get_due_drip_enrollments
CREATE OR REPLACE FUNCTION public.get_due_drip_enrollments(p_limit integer DEFAULT 100)
RETURNS TABLE(enrollment_id uuid, user_id uuid, campaign_id uuid, contact_id uuid, current_step integer, campaign_name text, contact_first_name text, contact_last_name text, contact_phone text, contact_email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
  JOIN investor_campaigns c ON e.campaign_id = c.id
  JOIN crm_contacts ct ON e.contact_id = ct.id
  WHERE e.status = 'active'
    AND e.next_touch_at <= NOW()
    AND c.status = 'active'
  ORDER BY e.next_touch_at ASC
  LIMIT p_limit;
END;
$function$;

-- get_effective_confidence_threshold
CREATE OR REPLACE FUNCTION public.get_effective_confidence_threshold(p_user_id uuid, p_contact_type text, p_topic text DEFAULT NULL::text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_base_threshold NUMERIC;
  v_adjustment NUMERIC := 0;
BEGIN
  -- Get base threshold from user settings
  SELECT COALESCE(
    (landlord_settings->'ai'->'autoSendThreshold')::NUMERIC,
    0.85
  ) INTO v_base_threshold
  FROM user_platform_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    v_base_threshold := 0.85;
  END IF;

  -- Apply topic-specific adjustments if available
  IF p_topic IS NOT NULL THEN
    SELECT confidence_adjustment INTO v_adjustment
    FROM ai_confidence_adjustments
    WHERE user_id = p_user_id
      AND topic = p_topic
      AND contact_type = p_contact_type
      AND sample_size >= 10;
  END IF;

  RETURN GREATEST(0.5, LEAST(0.99, v_base_threshold - v_adjustment));
END;
$function$;

-- get_knowledge_context
CREATE OR REPLACE FUNCTION public.get_knowledge_context(p_user_id uuid, p_query_embedding vector DEFAULT NULL::vector, p_query_text text DEFAULT NULL::text, p_chunk_types moltbot_chunk_type[] DEFAULT NULL::moltbot_chunk_type[], p_max_tokens integer DEFAULT 2000, p_limit integer DEFAULT 5)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_context TEXT := '';
  v_chunk RECORD;
  v_token_count INTEGER := 0;
BEGIN
  -- Search by embedding if provided
  IF p_query_embedding IS NOT NULL THEN
    FOR v_chunk IN
      SELECT title, content, chunk_type
      FROM moltbot_knowledge_chunks
      WHERE user_id = p_user_id
        AND is_active = true
        AND (p_chunk_types IS NULL OR chunk_type = ANY(p_chunk_types))
      ORDER BY embedding <=> p_query_embedding
      LIMIT p_limit
    LOOP
      -- Rough token estimation (4 chars per token)
      v_token_count := v_token_count + (LENGTH(v_chunk.content) / 4);
      IF v_token_count > p_max_tokens THEN
        EXIT;
      END IF;

      v_context := v_context || E'\n\n### ' || v_chunk.title || E'\n' || v_chunk.content;
    END LOOP;
  -- Fall back to keyword search
  ELSIF p_query_text IS NOT NULL THEN
    FOR v_chunk IN
      SELECT title, content, chunk_type
      FROM moltbot_knowledge_chunks
      WHERE user_id = p_user_id
        AND is_active = true
        AND (p_chunk_types IS NULL OR chunk_type = ANY(p_chunk_types))
        AND search_vector @@ plainto_tsquery('english', p_query_text)
      ORDER BY ts_rank(search_vector, plainto_tsquery('english', p_query_text)) DESC
      LIMIT p_limit
    LOOP
      v_token_count := v_token_count + (LENGTH(v_chunk.content) / 4);
      IF v_token_count > p_max_tokens THEN
        EXIT;
      END IF;

      v_context := v_context || E'\n\n### ' || v_chunk.title || E'\n' || v_chunk.content;
    END LOOP;
  END IF;

  RETURN TRIM(v_context);
END;
$function$;

-- get_landlord_setting
CREATE OR REPLACE FUNCTION public.get_landlord_setting(p_user_id uuid, p_path text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_settings JSONB;
  v_result JSONB;
BEGIN
  SELECT landlord_settings INTO v_settings
  FROM user_platform_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND OR v_settings IS NULL THEN
    v_settings := get_default_landlord_settings();
  END IF;

  v_result := v_settings #> p_path;
  RETURN v_result;
END;
$function$;

-- get_next_available_date
CREATE OR REPLACE FUNCTION public.get_next_available_date(p_property_id uuid, p_room_id uuid DEFAULT NULL::uuid, p_min_days integer DEFAULT 1)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_date DATE := CURRENT_DATE;
  v_available BOOLEAN;
  v_max_search_days INTEGER := 365;
  v_days_checked INTEGER := 0;
BEGIN
  WHILE v_days_checked < v_max_search_days LOOP
    SELECT available INTO v_available
    FROM check_rental_availability(
      p_property_id,
      p_room_id,
      v_date,
      v_date + p_min_days
    );

    IF v_available THEN
      RETURN v_date;
    END IF;

    v_date := v_date + 1;
    v_days_checked := v_days_checked + 1;
  END LOOP;

  RETURN NULL; -- No availability found within search range
END;
$function$;

-- get_or_create_investor_conversation
CREATE OR REPLACE FUNCTION public.get_or_create_investor_conversation(p_user_id uuid, p_lead_id uuid, p_channel investor_channel, p_property_id uuid DEFAULT NULL::uuid, p_deal_id uuid DEFAULT NULL::uuid, p_external_thread_id text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM investor_conversations
  WHERE user_id = p_user_id
    AND lead_id = p_lead_id
    AND channel = p_channel
    AND status != 'archived'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO investor_conversations (
    user_id, lead_id, channel, property_id, deal_id, external_thread_id, status
  )
  VALUES (
    p_user_id, p_lead_id, p_channel, p_property_id, p_deal_id, p_external_thread_id, 'active'
  )
  RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$function$;

-- get_or_create_platform_settings
CREATE OR REPLACE FUNCTION public.get_or_create_platform_settings(p_user_id uuid)
RETURNS user_platform_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_settings user_platform_settings;
BEGIN
  SELECT * INTO v_settings
  FROM user_platform_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_platform_settings (user_id, current_platform, landlord_settings)
    VALUES (p_user_id, 'investor', get_default_landlord_settings())
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$function$;

-- get_property_occupancy
CREATE OR REPLACE FUNCTION public.get_property_occupancy(p_property_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date)
RETURNS TABLE(total_days integer, occupied_days integer, occupancy_rate numeric, revenue numeric, booking_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_start DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  v_end DATE := COALESCE(p_end_date, CURRENT_DATE);
  v_total_days INTEGER;
  v_occupied INTEGER := 0;
  v_revenue NUMERIC := 0;
  v_count BIGINT := 0;
BEGIN
  v_total_days := v_end - v_start;

  SELECT
    COUNT(*),
    COALESCE(SUM(LEAST(b.end_date, v_end) - GREATEST(b.start_date, v_start)), 0),
    COALESCE(SUM(b.total_amount), 0)
  INTO v_count, v_occupied, v_revenue
  FROM rental_bookings b
  WHERE b.property_id = p_property_id
    AND b.status NOT IN ('cancelled')
    AND b.start_date < v_end
    AND (b.end_date IS NULL OR b.end_date > v_start);

  RETURN QUERY SELECT
    v_total_days,
    v_occupied,
    CASE WHEN v_total_days > 0 THEN ROUND((v_occupied::NUMERIC / v_total_days) * 100, 2) ELSE 0 END,
    v_revenue,
    v_count;
END;
$function$;

-- get_sources_due_for_sync
CREATE OR REPLACE FUNCTION public.get_sources_due_for_sync(p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, user_id uuid, source_type moltbot_knowledge_source_type, name text, config jsonb, last_sync_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.source_type,
    s.name,
    s.config,
    s.last_sync_at
  FROM moltbot_knowledge_sources s
  WHERE s.is_active = true
    AND s.sync_status != 'syncing'
    AND (
      s.last_sync_at IS NULL
      OR s.last_sync_at < NOW() - (COALESCE((s.config->>'sync_interval_hours')::INTEGER, 24) || ' hours')::INTERVAL
    )
  ORDER BY s.last_sync_at NULLS FIRST
  LIMIT p_limit;
END;
$function$;

-- get_user_memory_context
CREATE OR REPLACE FUNCTION public.get_user_memory_context(p_user_id uuid, p_property_id uuid DEFAULT NULL::uuid, p_channel text DEFAULT NULL::text, p_contact_type text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_memories JSONB := '[]'::JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', memory_type,
    'key', key,
    'value', value,
    'confidence', confidence,
    'source', source
  )), '[]'::JSONB) INTO v_memories
  FROM moltbot_user_memory
  WHERE user_id = p_user_id
    AND (p_property_id IS NULL OR property_id IS NULL OR property_id = p_property_id)
    AND (p_channel IS NULL OR channel IS NULL OR channel = p_channel)
    AND (p_contact_type IS NULL OR contact_type IS NULL OR contact_type = p_contact_type)
    AND confidence >= 0.5
  ORDER BY confidence DESC, updated_at DESC
  LIMIT 50;

  RETURN v_memories;
END;
$function$;

-- get_user_security_summary
CREATE OR REPLACE FUNCTION public.get_user_security_summary(p_user_id uuid)
RETURNS TABLE(total_events bigint, critical_events bigint, high_events bigint, blocked_events bigint, last_event_at timestamp with time zone, most_common_event moltbot_security_event_type)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_events,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
    COUNT(*) FILTER (WHERE severity = 'high') as high_events,
    COUNT(*) FILTER (WHERE action_taken = 'blocked') as blocked_events,
    MAX(created_at) as last_event_at,
    (SELECT event_type FROM moltbot_security_events
     WHERE user_id = p_user_id
     GROUP BY event_type
     ORDER BY COUNT(*) DESC
     LIMIT 1) as most_common_event
  FROM moltbot_security_events
  WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '30 days';
END;
$function$;

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'firstName', split_part(COALESCE(NEW.raw_user_meta_data->>'name', ''), ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'lastName',
      CASE
        WHEN position(' ' in COALESCE(NEW.raw_user_meta_data->>'name', '')) > 0
        THEN substring(COALESCE(NEW.raw_user_meta_data->>'name', '') from position(' ' in COALESCE(NEW.raw_user_meta_data->>'name', '')) + 1)
        ELSE ''
      END
    ),
    'user'
  );
  RETURN NEW;
END;
$function$;

-- increment_campaign_enrolled_count
CREATE OR REPLACE FUNCTION public.increment_campaign_enrolled_count(p_campaign_id uuid, p_count integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE investor_campaigns
  SET
    enrolled_count = COALESCE(enrolled_count, 0) + p_count,
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$function$;

-- increment_contact_touches
CREATE OR REPLACE FUNCTION public.increment_contact_touches(p_contact_id uuid, p_touch_time timestamp with time zone DEFAULT now())
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE crm_contacts
  SET
    touch_count = COALESCE(touch_count, 0) + 1,
    last_touch_at = p_touch_time,
    updated_at = NOW()
  WHERE id = p_contact_id;
END;
$function$;

-- is_contact_opted_out
CREATE OR REPLACE FUNCTION public.is_contact_opted_out(p_contact_id uuid, p_channel drip_channel)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_opted_out BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM contact_opt_outs
    WHERE contact_id = p_contact_id
      AND channel = p_channel
      AND revoked_at IS NULL
  ) INTO v_opted_out;

  RETURN v_opted_out;
END;
$function$;

-- is_ip_blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_blocked BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM moltbot_ip_blocks
    WHERE ip_address = p_ip_address
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
  ) INTO v_blocked;

  RETURN v_blocked;
END;
$function$;

-- is_within_quiet_hours
CREATE OR REPLACE FUNCTION public.is_within_quiet_hours(p_quiet_start time without time zone, p_quiet_end time without time zone, p_timezone text DEFAULT 'America/New_York'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_current_time TIME;
BEGIN
  v_current_time := (NOW() AT TIME ZONE p_timezone)::TIME;

  IF p_quiet_start < p_quiet_end THEN
    -- Same day window (e.g., 09:00 to 21:00)
    RETURN v_current_time >= p_quiet_start AND v_current_time < p_quiet_end;
  ELSE
    -- Overnight window (e.g., 21:00 to 09:00)
    RETURN v_current_time >= p_quiet_start OR v_current_time < p_quiet_end;
  END IF;
END;
$function$;

-- log_lock_event
CREATE OR REPLACE FUNCTION public.log_lock_event(p_user_id uuid, p_device_id uuid, p_event_type text, p_triggered_by text DEFAULT 'system'::text, p_access_code_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO seam_lock_events (
    user_id, device_id, event_type, triggered_by, access_code_id, details
  )
  VALUES (
    p_user_id, p_device_id, p_event_type, p_triggered_by, p_access_code_id, p_details
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$function$;

-- log_security_event
CREATE OR REPLACE FUNCTION public.log_security_event(p_user_id uuid, p_event_type moltbot_security_event_type, p_severity moltbot_security_severity, p_action_taken moltbot_security_action, p_channel text DEFAULT NULL::text, p_raw_input text DEFAULT NULL::text, p_detected_patterns text[] DEFAULT NULL::text[], p_risk_score integer DEFAULT NULL::integer, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO moltbot_security_events (
    user_id, event_type, severity, action_taken, channel,
    raw_input, detected_patterns, risk_score, metadata
  )
  VALUES (
    p_user_id, p_event_type, p_severity, p_action_taken, p_channel,
    p_raw_input, p_detected_patterns, p_risk_score, p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$function$;

-- queue_learning_opportunity
CREATE OR REPLACE FUNCTION public.queue_learning_opportunity(p_user_id uuid, p_outcome_id uuid, p_conversation_id uuid, p_contact_id uuid, p_original_response text, p_final_response text, p_outcome text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO moltbot_learning_queue (
    user_id, outcome_id, conversation_id, contact_id,
    original_response, final_response, outcome, status
  )
  VALUES (
    p_user_id, p_outcome_id, p_conversation_id, p_contact_id,
    p_original_response, p_final_response, p_outcome, 'pending'
  )
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$function$;

-- recalculate_confidence_adjustments
CREATE OR REPLACE FUNCTION public.recalculate_confidence_adjustments(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Recalculate adjustments based on recent outcomes
  INSERT INTO ai_confidence_adjustments (
    user_id, message_type, topic, contact_type,
    confidence_adjustment, sample_size, approval_rate
  )
  SELECT
    user_id,
    message_type,
    topic,
    contact_type,
    -- Adjustment: positive if approval rate > 80%, negative if < 60%
    CASE
      WHEN approval_rate > 0.8 THEN LEAST(0.1, (approval_rate - 0.8) * 0.5)
      WHEN approval_rate < 0.6 THEN GREATEST(-0.1, (approval_rate - 0.6) * 0.5)
      ELSE 0
    END,
    sample_size,
    approval_rate
  FROM (
    SELECT
      o.user_id,
      o.message_type,
      o.topic,
      o.contact_type,
      COUNT(*) as sample_size,
      AVG(CASE WHEN o.outcome IN ('approved', 'auto_sent') THEN 1.0 ELSE 0.0 END) as approval_rate
    FROM ai_response_outcomes o
    WHERE o.user_id = p_user_id
      AND o.created_at > NOW() - INTERVAL '30 days'
    GROUP BY o.user_id, o.message_type, o.topic, o.contact_type
    HAVING COUNT(*) >= 5
  ) stats
  ON CONFLICT (user_id, COALESCE(message_type, ''), COALESCE(topic, ''), COALESCE(contact_type, ''))
  DO UPDATE SET
    confidence_adjustment = EXCLUDED.confidence_adjustment,
    sample_size = EXCLUDED.sample_size,
    approval_rate = EXCLUDED.approval_rate,
    updated_at = NOW();
END;
$function$;

-- record_chunk_usage
CREATE OR REPLACE FUNCTION public.record_chunk_usage(p_chunk_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE moltbot_knowledge_chunks
  SET
    usage_count = COALESCE(usage_count, 0) + 1,
    last_used_at = NOW()
  WHERE id = p_chunk_id;
END;
$function$;

-- record_memory_usage
CREATE OR REPLACE FUNCTION public.record_memory_usage(p_memory_id uuid, p_was_successful boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE moltbot_user_memory
  SET
    usage_count = COALESCE(usage_count, 0) + 1,
    last_used_at = NOW(),
    -- Slightly boost confidence on successful use, reduce on failure
    confidence = CASE
      WHEN p_was_successful THEN LEAST(1.0, confidence + 0.01)
      ELSE GREATEST(0.1, confidence - 0.05)
    END
  WHERE id = p_memory_id;
END;
$function$;

-- record_opt_out
CREATE OR REPLACE FUNCTION public.record_opt_out(p_user_id uuid, p_contact_id uuid, p_channel drip_channel, p_reason text DEFAULT 'STOP keyword'::text, p_message text DEFAULT NULL::text, p_campaign_id uuid DEFAULT NULL::uuid, p_touch_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_opt_out_id UUID;
BEGIN
  INSERT INTO contact_opt_outs (
    user_id, contact_id, channel, reason, opt_out_message,
    source_campaign_id, source_touch_id
  )
  VALUES (
    p_user_id, p_contact_id, p_channel, p_reason, p_message,
    p_campaign_id, p_touch_id
  )
  RETURNING id INTO v_opt_out_id;

  -- Also pause any active enrollments for this contact
  UPDATE drip_enrollments
  SET
    status = 'opted_out',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE contact_id = p_contact_id
    AND user_id = p_user_id
    AND status = 'active';

  RETURN v_opt_out_id;
END;
$function$;

-- score_contact
CREATE OR REPLACE FUNCTION public.score_contact(p_contact_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_score INTEGER := 0;
  v_contact crm_contacts;
BEGIN
  SELECT * INTO v_contact FROM crm_contacts WHERE id = p_contact_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Base score for having contact info
  IF v_contact.email IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_contact.phone IS NOT NULL THEN v_score := v_score + 10; END IF;

  -- Touch count scoring
  v_score := v_score + LEAST(v_contact.touch_count * 2, 20);

  -- Recency scoring
  IF v_contact.last_touch_at > NOW() - INTERVAL '7 days' THEN
    v_score := v_score + 20;
  ELSIF v_contact.last_touch_at > NOW() - INTERVAL '30 days' THEN
    v_score := v_score + 10;
  END IF;

  -- Update the contact with new score
  UPDATE crm_contacts SET lead_score = v_score WHERE id = p_contact_id;

  RETURN v_score;
END;
$function$;

-- search_knowledge_chunks
CREATE OR REPLACE FUNCTION public.search_knowledge_chunks(p_user_id uuid, p_query_embedding vector, p_chunk_types moltbot_chunk_type[] DEFAULT NULL::moltbot_chunk_type[], p_limit integer DEFAULT 5, p_similarity_threshold numeric DEFAULT 0.7)
RETURNS TABLE(id uuid, chunk_type moltbot_chunk_type, title text, content text, metadata jsonb, similarity numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.chunk_type,
    c.title,
    c.content,
    c.metadata,
    (1 - (c.embedding <=> p_query_embedding))::NUMERIC as similarity
  FROM moltbot_knowledge_chunks c
  WHERE c.user_id = p_user_id
    AND c.is_active = true
    AND (p_chunk_types IS NULL OR c.chunk_type = ANY(p_chunk_types))
    AND (1 - (c.embedding <=> p_query_embedding)) >= p_similarity_threshold
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$function$;

-- search_knowledge_keyword
CREATE OR REPLACE FUNCTION public.search_knowledge_keyword(p_user_id uuid, p_query text, p_chunk_types moltbot_chunk_type[] DEFAULT NULL::moltbot_chunk_type[], p_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, chunk_type moltbot_chunk_type, title text, content text, metadata jsonb, relevance real)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.chunk_type,
    c.title,
    c.content,
    c.metadata,
    ts_rank(c.search_vector, plainto_tsquery('english', p_query)) as relevance
  FROM moltbot_knowledge_chunks c
  WHERE c.user_id = p_user_id
    AND c.is_active = true
    AND (p_chunk_types IS NULL OR c.chunk_type = ANY(p_chunk_types))
    AND c.search_vector @@ plainto_tsquery('english', p_query)
  ORDER BY relevance DESC
  LIMIT p_limit;
END;
$function$;

-- should_notify_for_response
CREATE OR REPLACE FUNCTION public.should_notify_for_response(p_user_id uuid, p_contact_type text, p_was_auto_sent boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_settings JSONB;
  v_notify_auto BOOLEAN;
  v_notify_pending BOOLEAN;
BEGIN
  SELECT landlord_settings INTO v_settings
  FROM user_platform_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND OR v_settings IS NULL THEN
    RETURN true; -- Default to notify
  END IF;

  v_notify_auto := COALESCE((v_settings->'notifications'->>'autoSentResponses')::BOOLEAN, true);
  v_notify_pending := COALESCE((v_settings->'notifications'->>'pendingReview')::BOOLEAN, true);

  IF p_was_auto_sent THEN
    RETURN v_notify_auto;
  ELSE
    RETURN v_notify_pending;
  END IF;
END;
$function$;

-- store_episodic_memory
CREATE OR REPLACE FUNCTION public.store_episodic_memory(p_user_id uuid, p_contact_id uuid, p_memory_type moltbot_episodic_type, p_summary text, p_key_facts jsonb DEFAULT NULL::jsonb, p_sentiment text DEFAULT 'neutral'::text, p_importance integer DEFAULT 5, p_conversation_id uuid DEFAULT NULL::uuid, p_expires_in_days integer DEFAULT NULL::integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_memory_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF p_expires_in_days IS NOT NULL THEN
    v_expires_at := NOW() + (p_expires_in_days || ' days')::INTERVAL;
  END IF;

  INSERT INTO moltbot_episodic_memory (
    user_id, contact_id, memory_type, summary, key_facts,
    sentiment, importance, conversation_id, expires_at
  )
  VALUES (
    p_user_id, p_contact_id, p_memory_type, p_summary, p_key_facts,
    p_sentiment, p_importance, p_conversation_id, v_expires_at
  )
  RETURNING id INTO v_memory_id;

  RETURN v_memory_id;
END;
$function$;

-- store_user_memory
CREATE OR REPLACE FUNCTION public.store_user_memory(p_user_id uuid, p_memory_type moltbot_user_memory_type, p_key text, p_value jsonb, p_source moltbot_memory_source DEFAULT 'learned'::moltbot_memory_source, p_confidence numeric DEFAULT 1.0, p_property_id uuid DEFAULT NULL::uuid, p_channel text DEFAULT NULL::text, p_contact_type text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_memory_id UUID;
BEGIN
  INSERT INTO moltbot_user_memory (
    user_id, memory_type, key, value, source, confidence,
    property_id, channel, contact_type
  )
  VALUES (
    p_user_id, p_memory_type, p_key, p_value, p_source, p_confidence,
    p_property_id, p_channel, p_contact_type
  )
  ON CONFLICT (user_id, memory_type, key, COALESCE(property_id, '00000000-0000-0000-0000-000000000000'), COALESCE(channel, ''), COALESCE(contact_type, ''))
  DO UPDATE SET
    value = EXCLUDED.value,
    source = EXCLUDED.source,
    confidence = GREATEST(moltbot_user_memory.confidence, EXCLUDED.confidence),
    updated_at = NOW()
  RETURNING id INTO v_memory_id;

  RETURN v_memory_id;
END;
$function$;

-- switch_platform
CREATE OR REPLACE FUNCTION public.switch_platform(p_user_id uuid, p_platform user_platform)
RETURNS user_platform_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_settings user_platform_settings;
BEGIN
  UPDATE user_platform_settings
  SET
    current_platform = p_platform,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_settings;

  IF NOT FOUND THEN
    INSERT INTO user_platform_settings (user_id, current_platform, landlord_settings)
    VALUES (p_user_id, p_platform, get_default_landlord_settings())
    RETURNING * INTO v_settings;
  END IF;

  RETURN v_settings;
END;
$function$;

-- topic_requires_review
CREATE OR REPLACE FUNCTION public.topic_requires_review(p_user_id uuid, p_topic text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_always_review TEXT[];
BEGIN
  SELECT COALESCE(
    (landlord_settings->'ai'->'topicsRequireReview')::TEXT[],
    ARRAY['pricing', 'legal', 'eviction', 'discrimination']
  ) INTO v_always_review
  FROM user_platform_settings
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    v_always_review := ARRAY['pricing', 'legal', 'eviction', 'discrimination'];
  END IF;

  RETURN p_topic = ANY(v_always_review);
END;
$function$;

-- update_landlord_setting
CREATE OR REPLACE FUNCTION public.update_landlord_setting(p_user_id uuid, p_path text[], p_value jsonb)
RETURNS user_platform_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_settings user_platform_settings;
  v_current_settings JSONB;
BEGIN
  -- Get or create settings
  SELECT * INTO v_settings FROM get_or_create_platform_settings(p_user_id);

  v_current_settings := COALESCE(v_settings.landlord_settings, get_default_landlord_settings());

  -- Update the nested path
  v_current_settings := jsonb_set(v_current_settings, p_path, p_value, true);

  UPDATE user_platform_settings
  SET
    landlord_settings = v_current_settings,
    updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING * INTO v_settings;

  RETURN v_settings;
END;
$function$;

-- update_source_sync_status
CREATE OR REPLACE FUNCTION public.update_source_sync_status(p_source_id uuid, p_status moltbot_sync_status, p_error text DEFAULT NULL::text, p_chunks_count integer DEFAULT NULL::integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE moltbot_knowledge_sources
  SET
    sync_status = p_status,
    last_sync_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE last_sync_at END,
    last_sync_error = p_error,
    chunks_count = COALESCE(p_chunks_count, chunks_count),
    updated_at = NOW()
  WHERE id = p_source_id;

  -- Log sync history
  INSERT INTO moltbot_sync_history (
    source_id, user_id, status, error_message, chunks_processed
  )
  SELECT
    p_source_id,
    s.user_id,
    p_status,
    p_error,
    p_chunks_count
  FROM moltbot_knowledge_sources s
  WHERE s.id = p_source_id;
END;
$function$;

-- ============================================================================
-- TRIGGER FUNCTIONS - These also need search_path for safety
-- ============================================================================

-- calculate_booking_total
CREATE OR REPLACE FUNCTION public.calculate_booking_total()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;

-- set_booking_confirmed_at
CREATE OR REPLACE FUNCTION public.set_booking_confirmed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmed_at := NOW();
  END IF;
  RETURN NEW;
END;
$function$;

-- update_conversation_on_message
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE rental_conversations
  SET
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- update_investor_conversation_on_message
CREATE OR REPLACE FUNCTION public.update_investor_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  UPDATE investor_conversations
  SET
    last_message_at = NEW.created_at,
    message_count = COALESCE(message_count, 0) + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$function$;

-- update_room_on_booking
CREATE OR REPLACE FUNCTION public.update_room_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.room_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    UPDATE rental_rooms
    SET
      current_booking_id = NEW.id,
      updated_at = NOW()
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_drip_updated_at
CREATE OR REPLACE FUNCTION public.update_drip_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_campaign_counts
CREATE OR REPLACE FUNCTION public.update_campaign_counts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE investor_campaigns
    SET enrolled_count = COALESCE(enrolled_count, 0) + 1
    WHERE id = NEW.campaign_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      UPDATE investor_campaigns
      SET
        completed_count = COALESCE(completed_count, 0) + 1,
        enrolled_count = GREATEST(0, COALESCE(enrolled_count, 0) - 1)
      WHERE id = NEW.campaign_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- update_investor_updated_at
CREATE OR REPLACE FUNCTION public.update_investor_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_investor_ai_confidence_from_outcome
CREATE OR REPLACE FUNCTION public.update_investor_ai_confidence_from_outcome()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Trigger recalculation when outcomes are recorded
  IF NEW.outcome IS NOT NULL THEN
    PERFORM recalculate_confidence_adjustments(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- update_knowledge_source_updated_at
CREATE OR REPLACE FUNCTION public.update_knowledge_source_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_user_gmail_tokens_updated_at
CREATE OR REPLACE FUNCTION public.update_user_gmail_tokens_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- update_user_memory_updated_at
CREATE OR REPLACE FUNCTION public.update_user_memory_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- trigger_set_default_landlord_settings
CREATE OR REPLACE FUNCTION public.trigger_set_default_landlord_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF NEW.landlord_settings IS NULL THEN
    NEW.landlord_settings := get_default_landlord_settings();
  ELSE
    NEW.landlord_settings := merge_landlord_settings(NEW.landlord_settings);
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- HELPER FUNCTIONS - These should also have search_path for consistency
-- ============================================================================

-- get_default_landlord_settings
CREATE OR REPLACE FUNCTION public.get_default_landlord_settings()
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'ai', jsonb_build_object(
      'enabled', true,
      'autoSendThreshold', 0.85,
      'topicsRequireReview', ARRAY['pricing', 'legal', 'eviction', 'discrimination'],
      'maxDailyAutoSend', 50
    ),
    'notifications', jsonb_build_object(
      'autoSentResponses', true,
      'pendingReview', true,
      'newInquiries', true,
      'quietHoursStart', '22:00',
      'quietHoursEnd', '08:00'
    ),
    'messaging', jsonb_build_object(
      'defaultSignature', '',
      'autoGreeting', true,
      'responseTimeGoal', 60
    )
  );
END;
$function$;

-- merge_landlord_settings
CREATE OR REPLACE FUNCTION public.merge_landlord_settings(existing jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  defaults JSONB;
BEGIN
  defaults := get_default_landlord_settings();
  RETURN defaults || existing;
END;
$function$;

-- calculate_booking_revenue (immutable helper)
CREATE OR REPLACE FUNCTION public.calculate_booking_revenue(p_rate numeric, p_rate_type rental_rate_type, p_start_date date, p_end_date date)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $function$
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
$function$;

-- calculate_settlement_deductions
CREATE OR REPLACE FUNCTION public.calculate_settlement_deductions(p_booking_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total FROM booking_charges WHERE booking_id = p_booking_id AND status IN ('approved', 'deducted');
  RETURN total;
END;
$function$;

-- render_guest_template
CREATE OR REPLACE FUNCTION public.render_guest_template(p_template_body text, p_variables jsonb)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  v_result TEXT := p_template_body;
  v_key TEXT;
  v_value TEXT;
BEGIN
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_result := REPLACE(v_result, '{{' || v_key || '}}', COALESCE(v_value, ''));
  END LOOP;
  RETURN v_result;
END;
$function$;

-- ============================================================================
-- VERIFICATION QUERY (run after migration)
-- ============================================================================
-- SELECT proname, proconfig
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
--   AND prokind = 'f'
--   AND proconfig @> ARRAY['search_path=public'];
