-- Migration: Create capture_items table
-- Purpose: Store captured recordings, transcripts, documents for triage queue
-- Part of UI/UX restructure: Capture tab for intake and routing

-- Create capture_items table
CREATE TABLE IF NOT EXISTS public.capture_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Item type and content
  type TEXT NOT NULL CHECK (type IN ('recording', 'call', 'text', 'transcript', 'document', 'email', 'note', 'photo')),
  title TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  duration_seconds INTEGER, -- For recordings
  transcript TEXT,
  content TEXT, -- For notes/emails

  -- AI processing
  ai_summary TEXT,
  ai_extracted_data JSONB DEFAULT '{}'::JSONB,
  suggested_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  suggested_property_id UUID REFERENCES public.re_properties(id) ON DELETE SET NULL,
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00

  -- Assignment (after triage)
  assigned_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  assigned_property_id UUID REFERENCES public.re_properties(id) ON DELETE SET NULL,
  assigned_deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,

  -- Status and workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'assigned', 'dismissed')),
  triaged_at TIMESTAMPTZ,
  triaged_by UUID REFERENCES auth.users(id),

  -- Metadata
  source TEXT, -- 'app_recording', 'upload', 'email_import', 'manual'
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_capture_items_user_id ON public.capture_items(user_id);
CREATE INDEX idx_capture_items_status ON public.capture_items(status);
CREATE INDEX idx_capture_items_user_status ON public.capture_items(user_id, status);
CREATE INDEX idx_capture_items_created_at ON public.capture_items(created_at DESC);
CREATE INDEX idx_capture_items_assigned_lead ON public.capture_items(assigned_lead_id) WHERE assigned_lead_id IS NOT NULL;
CREATE INDEX idx_capture_items_assigned_property ON public.capture_items(assigned_property_id) WHERE assigned_property_id IS NOT NULL;
CREATE INDEX idx_capture_items_assigned_deal ON public.capture_items(assigned_deal_id) WHERE assigned_deal_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.capture_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own capture items
CREATE POLICY "Users can view own capture items"
  ON public.capture_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own capture items
CREATE POLICY "Users can insert own capture items"
  ON public.capture_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own capture items
CREATE POLICY "Users can update own capture items"
  ON public.capture_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own capture items
CREATE POLICY "Users can delete own capture items"
  ON public.capture_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_capture_items_updated_at()
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

CREATE TRIGGER trigger_capture_items_updated_at
  BEFORE UPDATE ON public.capture_items
  FOR EACH ROW
  EXECUTE FUNCTION update_capture_items_updated_at();

-- Add comment
COMMENT ON TABLE public.capture_items IS 'Stores captured recordings, transcripts, documents for triage queue in Capture tab';
