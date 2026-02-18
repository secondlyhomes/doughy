-- Migration: Add CHECK Constraints
-- Date: 2026-01-31
-- Description: Add validation constraints for dates, currency, and scores

BEGIN;

-- Date logic constraints (skip if constraint already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_booking_dates') THEN
        ALTER TABLE landlord_bookings
          ADD CONSTRAINT check_booking_dates
          CHECK (end_date > start_date);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_turnover_dates') THEN
        -- In a turnover: Guest A checks OUT, then Guest B checks IN (checkin >= checkout)
        ALTER TABLE landlord_turnovers
          ADD CONSTRAINT check_turnover_dates
          CHECK (checkin_at IS NULL OR checkin_at >= checkout_at);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_maintenance_dates') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'landlord_maintenance_records'
                   AND column_name = 'started_at'
                   AND table_schema = 'public') THEN
            ALTER TABLE landlord_maintenance_records
              ADD CONSTRAINT check_maintenance_dates
              CHECK (completed_at IS NULL OR completed_at >= started_at);
        END IF;
    END IF;
END$$;

-- Currency constraints (non-negative)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_maintenance_costs') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'landlord_maintenance_records'
                   AND column_name = 'estimated_cost'
                   AND table_schema = 'public') THEN
            ALTER TABLE landlord_maintenance_records
              ADD CONSTRAINT check_maintenance_costs
              CHECK (estimated_cost >= 0 AND (actual_cost IS NULL OR actual_cost >= 0));
        END IF;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_charge_amount') THEN
        ALTER TABLE landlord_booking_charges
          ADD CONSTRAINT check_charge_amount
          CHECK (amount >= 0);
    END IF;
END$$;

-- Confidence/score constraints (0-100 range)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_motivation_score') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'investor_deals_pipeline'
                   AND column_name = 'motivation_score'
                   AND table_schema = 'public') THEN
            ALTER TABLE investor_deals_pipeline
              ADD CONSTRAINT check_motivation_score
              CHECK (motivation_score IS NULL OR (motivation_score >= 0 AND motivation_score <= 100));
        END IF;
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_confidence_score') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'landlord_ai_queue_items'
                   AND column_name = 'confidence_score'
                   AND table_schema = 'public') THEN
            ALTER TABLE landlord_ai_queue_items
              ADD CONSTRAINT check_confidence_score
              CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));
        END IF;
    END IF;
END$$;

COMMIT;
