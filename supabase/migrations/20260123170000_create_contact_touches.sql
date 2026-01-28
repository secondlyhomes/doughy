-- Migration: Create contact_touches table
-- Purpose: Track touches (calls, outreach) to leads/contacts for responsiveness analytics
-- Part of Focus Mode workflow improvements

-- Create contact_touches table
CREATE TABLE IF NOT EXISTS public.contact_touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entity references (at least one should be set)
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.re_properties(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,

  -- Touch details
  touch_type TEXT NOT NULL CHECK (touch_type IN ('first_call', 'follow_up', 'voicemail', 'email', 'text', 'in_person')),
  outcome TEXT NOT NULL CHECK (outcome IN ('connected', 'no_answer', 'voicemail_left', 'callback_scheduled', 'not_interested', 'other')),
  responded BOOLEAN NOT NULL DEFAULT false,

  -- Optional notes
  notes TEXT,

  -- Callback scheduling
  callback_scheduled_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_contact_touches_user_id ON public.contact_touches(user_id);
CREATE INDEX idx_contact_touches_lead_id ON public.contact_touches(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX idx_contact_touches_property_id ON public.contact_touches(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_contact_touches_deal_id ON public.contact_touches(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_contact_touches_created_at ON public.contact_touches(created_at DESC);
CREATE INDEX idx_contact_touches_lead_created ON public.contact_touches(lead_id, created_at DESC) WHERE lead_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.contact_touches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own touch records
CREATE POLICY "Users can view own contact touches"
  ON public.contact_touches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own touch records
CREATE POLICY "Users can insert own contact touches"
  ON public.contact_touches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own touch records
CREATE POLICY "Users can update own contact touches"
  ON public.contact_touches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own touch records
CREATE POLICY "Users can delete own contact touches"
  ON public.contact_touches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_touches_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_contact_touches_updated_at
  BEFORE UPDATE ON public.contact_touches
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_touches_updated_at();

-- Helper function to get touch count for a lead
CREATE OR REPLACE FUNCTION get_lead_touch_count(p_lead_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  touch_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO touch_count
  FROM public.contact_touches
  WHERE lead_id = p_lead_id
    AND user_id = auth.uid();

  RETURN COALESCE(touch_count, 0);
END;
$$;

-- Helper function to get last touch date for a lead
CREATE OR REPLACE FUNCTION get_lead_last_touch(p_lead_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_touch TIMESTAMPTZ;
BEGIN
  SELECT MAX(created_at)
  INTO last_touch
  FROM public.contact_touches
  WHERE lead_id = p_lead_id
    AND user_id = auth.uid();

  RETURN last_touch;
END;
$$;

-- Helper function to get responsiveness score (responses / total touches)
CREATE OR REPLACE FUNCTION get_lead_responsiveness(p_lead_id UUID)
RETURNS DECIMAL(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_touches INTEGER;
  responded_touches INTEGER;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE responded = true)
  INTO total_touches, responded_touches
  FROM public.contact_touches
  WHERE lead_id = p_lead_id
    AND user_id = auth.uid();

  IF total_touches = 0 THEN
    RETURN NULL;
  END IF;

  RETURN ROUND(responded_touches::DECIMAL / total_touches, 2);
END;
$$;

-- Add comment
COMMENT ON TABLE public.contact_touches IS 'Tracks touches (calls, outreach) to leads for responsiveness analytics in Focus Mode';
COMMENT ON FUNCTION get_lead_touch_count IS 'Returns the total number of touches for a lead';
COMMENT ON FUNCTION get_lead_last_touch IS 'Returns the timestamp of the last touch for a lead';
COMMENT ON FUNCTION get_lead_responsiveness IS 'Returns the responsiveness score (0-1) for a lead based on touches that got a response';
