-- Add missing address fields to re_properties table
-- These were missing from the initial migration

ALTER TABLE re_properties
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS street_address_2 TEXT,
ADD COLUMN IF NOT EXISTS county TEXT;

-- Rename zip to zip_code for consistency
ALTER TABLE re_properties
RENAME COLUMN zip TO zip_code;

-- Create index for address search
CREATE INDEX IF NOT EXISTS idx_re_properties_street_address ON re_properties(street_address);
CREATE INDEX IF NOT EXISTS idx_re_properties_county ON re_properties(county);
