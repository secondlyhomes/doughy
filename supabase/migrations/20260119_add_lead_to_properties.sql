-- Migration: Add lead_id to re_properties table
-- Purpose: Link properties to leads for hierarchical seller → property view
-- Part of UI/UX restructure: Unified Leads tab with properties under each lead

-- Add lead_id column to re_properties
ALTER TABLE public.re_properties
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_re_properties_lead_id
ON public.re_properties(lead_id)
WHERE lead_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.re_properties.lead_id IS 'Links property to a lead (seller). NULL means orphan property needing skip trace.';

-- Also add profile_id if not exists (for user association via profile rather than auth.users)
ALTER TABLE public.re_properties
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for profile_id
CREATE INDEX IF NOT EXISTS idx_re_properties_profile_id
ON public.re_properties(profile_id)
WHERE profile_id IS NOT NULL;
