-- Migration: Add primary_image_url to re_properties
-- Description: Adds image support for property listings

-- Add primary_image_url column to re_properties
ALTER TABLE re_properties
ADD COLUMN IF NOT EXISTS primary_image_url TEXT;

-- Add comment
COMMENT ON COLUMN re_properties.primary_image_url IS 'URL to the primary/hero image for the property listing';
