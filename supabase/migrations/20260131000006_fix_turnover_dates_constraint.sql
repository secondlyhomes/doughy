-- Migration: Fix Turnover Dates Constraint
-- Date: 2026-01-31
-- Description: Fix the check_turnover_dates constraint - checkin should be >= checkout, not the reverse
-- In a turnover: Guest A checks OUT, then Guest B checks IN (checkin >= checkout)

BEGIN;

-- Drop the incorrect constraint
ALTER TABLE landlord_turnovers
  DROP CONSTRAINT IF EXISTS check_turnover_dates;

-- Add the corrected constraint
-- checkin_at should be >= checkout_at (next guest arrives after previous leaves)
ALTER TABLE landlord_turnovers
  ADD CONSTRAINT check_turnover_dates
  CHECK (checkin_at IS NULL OR checkin_at >= checkout_at);

COMMIT;
