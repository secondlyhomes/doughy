-- Migration: Missing RPC Functions for Drip Campaign System
-- Description: Additional RPC functions for atomic operations

-- ============================================================================
-- INCREMENT CONTACT TOUCHES
-- ============================================================================
-- Atomically increment touch count and update last touch time

CREATE OR REPLACE FUNCTION increment_contact_touches(
  p_contact_id UUID,
  p_touch_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE crm_contacts
  SET
    campaign_touches_received = COALESCE(campaign_touches_received, 0) + 1,
    last_campaign_touch_at = p_touch_time,
    updated_at = NOW()
  WHERE id = p_contact_id;
END;
$$;

-- ============================================================================
-- INCREMENT CAMPAIGN ENROLLED COUNT
-- ============================================================================
-- Atomically increment enrolled count for a campaign

CREATE OR REPLACE FUNCTION increment_campaign_enrolled_count(
  p_campaign_id UUID,
  p_count INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE investor_campaigns
  SET
    enrolled_count = COALESCE(enrolled_count, 0) + p_count,
    updated_at = NOW()
  WHERE id = p_campaign_id;
END;
$$;

-- ============================================================================
-- ADD MAIL CREDITS
-- ============================================================================
-- Add credits to user's balance (for purchases)

CREATE OR REPLACE FUNCTION add_mail_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Credit purchase'
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
$$;

-- ============================================================================
-- ADD MAIL CREDITS REFUND
-- ============================================================================
-- Refund credits to user's balance (for failed mail)

CREATE OR REPLACE FUNCTION add_mail_credits_refund(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT DEFAULT 'Refund'
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
$$;

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON FUNCTION increment_contact_touches IS 'Atomically increment contact touch count and update last touch time';
COMMENT ON FUNCTION increment_campaign_enrolled_count IS 'Atomically increment campaign enrolled count';
COMMENT ON FUNCTION add_mail_credits IS 'Add credits to user balance for purchases';
COMMENT ON FUNCTION add_mail_credits_refund IS 'Refund credits to user balance for failed mail';
