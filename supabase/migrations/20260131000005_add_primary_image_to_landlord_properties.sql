-- Migration: Add primary_image_url to landlord_properties
-- Date: 2026-01-31
-- Description: Add image column to landlord_properties to match investor_properties pattern

BEGIN;

ALTER TABLE public.landlord_properties
  ADD COLUMN IF NOT EXISTS primary_image_url TEXT;

COMMENT ON COLUMN public.landlord_properties.primary_image_url IS 'Primary listing photo URL';

COMMIT;
