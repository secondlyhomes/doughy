-- Stripe Payment Integration Schema
--
-- This migration creates tables for managing Stripe subscriptions, payment methods,
-- and invoices with proper RLS policies for security.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- ENUMS
-- ==============================================================================

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
  'pending',
  'succeeded',
  'failed',
  'refunded'
);

-- ==============================================================================
-- TABLES
-- ==============================================================================

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  stripe_product_id TEXT NOT NULL,

  -- Subscription details
  status subscription_status NOT NULL DEFAULT 'incomplete',

  -- Billing period
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,

  -- Cancellation info
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Trial info
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_period CHECK (current_period_end > current_period_start)
);

-- Payment methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,

  -- Payment method details
  type TEXT NOT NULL, -- 'card', 'bank_account', etc.

  -- Card-specific fields (null for non-card payment methods)
  card_brand TEXT, -- 'visa', 'mastercard', etc.
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,

  -- Status
  is_default BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT REFERENCES subscriptions(stripe_subscription_id),
  stripe_customer_id TEXT NOT NULL,

  -- Invoice details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'

  -- URLs
  invoice_url TEXT,
  invoice_pdf TEXT,

  -- Payment info
  paid_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Payments table (for tracking individual payment attempts)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT REFERENCES invoices(stripe_invoice_id),
  stripe_subscription_id TEXT REFERENCES subscriptions(stripe_subscription_id),
  stripe_customer_id TEXT NOT NULL,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status payment_status NOT NULL DEFAULT 'pending',

  -- Error info
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Stripe events table (for webhook idempotency)
CREATE TABLE stripe_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT NOT NULL UNIQUE, -- Stripe event ID
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_current_period_end ON subscriptions(current_period_end);

-- Payment methods indexes
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_customer_id ON payment_methods(stripe_customer_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);

-- Invoices indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_stripe_customer_id ON invoices(stripe_customer_id);
CREATE INDEX idx_invoices_stripe_subscription_id ON invoices(stripe_subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Payments indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_stripe_customer_id ON payments(stripe_customer_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Stripe events indexes
CREATE INDEX idx_stripe_events_type ON stripe_events(type);
CREATE INDEX idx_stripe_events_processed ON stripe_events(processed);

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Payment methods policies
CREATE POLICY "Users can view own payment methods"
  ON payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment methods"
  ON payment_methods FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Invoices policies
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage invoices"
  ON invoices FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Stripe events policies (service role only)
CREATE POLICY "Service role can manage stripe events"
  ON stripe_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Ensure only one default payment method per user
CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset other default payment methods for this user
    UPDATE payment_methods
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_default_check
  BEFORE INSERT OR UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- ==============================================================================
-- FUNCTIONS
-- ==============================================================================

-- Get active subscription for user
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID)
RETURNS subscriptions AS $$
  SELECT *
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing', 'past_due')
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1
    FROM subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND current_period_end > NOW()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Get subscription entitlements
CREATE OR REPLACE FUNCTION get_user_entitlements(p_user_id UUID)
RETURNS TABLE(entitlement TEXT) AS $$
  SELECT DISTINCT
    CASE
      WHEN s.status = 'active' THEN 'premium'
      WHEN s.status = 'trialing' THEN 'trial'
      ELSE NULL
    END as entitlement
  FROM subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
    AND s.current_period_end > NOW()
    AND entitlement IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription data synced via webhooks';
COMMENT ON TABLE payment_methods IS 'Stores customer payment methods from Stripe';
COMMENT ON TABLE invoices IS 'Stores Stripe invoices for record keeping';
COMMENT ON TABLE payments IS 'Tracks individual payment attempts';
COMMENT ON TABLE stripe_events IS 'Stores Stripe webhook events for idempotency';
