-- Migration: Clarify External IDs
-- Date: 2026-01-31
-- Description: Add documentation comments for Stripe and external integration IDs

BEGIN;

-- Clarify Stripe IDs with comments (skip if table doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'billing_stripe_customers'
               AND column_name = 'customer_id'
               AND table_schema = 'public') THEN
        COMMENT ON COLUMN billing_stripe_customers.customer_id IS 'Stripe customer ID (stripe_cus_xxx)';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'billing_stripe_subscriptions'
               AND column_name = 'subscription_id'
               AND table_schema = 'public') THEN
        COMMENT ON COLUMN billing_stripe_subscriptions.subscription_id IS 'Stripe subscription ID (stripe_sub_xxx)';
    END IF;
END$$;

-- Document external integration IDs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'landlord_integrations'
               AND column_name = 'external_property_id'
               AND table_schema = 'public') THEN
        COMMENT ON COLUMN landlord_integrations.external_property_id IS 'External platform property ID (Airbnb/VRBO)';
    END IF;
END$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'landlord_bookings'
               AND column_name = 'external_booking_id'
               AND table_schema = 'public') THEN
        COMMENT ON COLUMN landlord_bookings.external_booking_id IS 'External platform booking ID';
    END IF;
END$$;

COMMIT;
