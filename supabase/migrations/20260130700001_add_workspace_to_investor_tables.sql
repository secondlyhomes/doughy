-- Migration: Add workspace_id to Investor Platform Tables
-- Phase 1b: Add workspace_id column to investor_* tables missing it
-- Date: 2026-01-30
--
-- DBA Best Practices Applied:
-- - Add columns as NULLABLE first (no downtime)
-- - Foreign key references to workspaces(id) for referential integrity
-- - Indexes on workspace_id for RLS query performance
-- - Comments documenting the column purpose
--
-- Tables Modified (these don't have workspace_id yet):
-- - investor_deals_pipeline
-- - investor_deal_events
-- - investor_campaigns
-- - investor_drip_campaign_steps
-- - investor_drip_enrollments
-- - investor_agents
-- - investor_follow_ups
-- - investor_outreach_templates
-- - investor_conversations
-- - investor_messages

BEGIN;

-- ============================================================================
-- STEP 1: Add workspace_id column to investor tables missing it
-- ============================================================================

-- investor_deals_pipeline - Deal tracking
ALTER TABLE public.investor_deals_pipeline
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_deal_events - Deal activity history
ALTER TABLE public.investor_deal_events
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_campaigns - Marketing campaigns
ALTER TABLE public.investor_campaigns
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_drip_campaign_steps - Campaign automation steps
ALTER TABLE public.investor_drip_campaign_steps
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_drip_enrollments - Campaign enrollments
ALTER TABLE public.investor_drip_enrollments
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_agents - Real estate agent contacts
ALTER TABLE public.investor_agents
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_follow_ups - Follow-up reminders
ALTER TABLE public.investor_follow_ups
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_outreach_templates - Message templates
ALTER TABLE public.investor_outreach_templates
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_conversations - Lead communications
ALTER TABLE public.investor_conversations
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- investor_messages - Conversation messages
ALTER TABLE public.investor_messages
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- ============================================================================
-- STEP 2: Create indexes for workspace_id (RLS performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_investor_deals_pipeline_workspace_id
  ON public.investor_deals_pipeline(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_deal_events_workspace_id
  ON public.investor_deal_events(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_campaigns_workspace_id
  ON public.investor_campaigns(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_drip_campaign_steps_workspace_id
  ON public.investor_drip_campaign_steps(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_drip_enrollments_workspace_id
  ON public.investor_drip_enrollments(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_agents_workspace_id
  ON public.investor_agents(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_follow_ups_workspace_id
  ON public.investor_follow_ups(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_outreach_templates_workspace_id
  ON public.investor_outreach_templates(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_conversations_workspace_id
  ON public.investor_conversations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_investor_messages_workspace_id
  ON public.investor_messages(workspace_id);

-- ============================================================================
-- STEP 3: Add composite indexes for common query patterns
-- ============================================================================

-- Deals by workspace and stage
CREATE INDEX IF NOT EXISTS idx_investor_deals_pipeline_workspace_stage
  ON public.investor_deals_pipeline(workspace_id, stage);

-- Campaigns by workspace and status
CREATE INDEX IF NOT EXISTS idx_investor_campaigns_workspace_status
  ON public.investor_campaigns(workspace_id, status);

-- Follow-ups by workspace and due date
CREATE INDEX IF NOT EXISTS idx_investor_follow_ups_workspace_scheduled
  ON public.investor_follow_ups(workspace_id, scheduled_at);

-- Conversations by workspace and status
CREATE INDEX IF NOT EXISTS idx_investor_conversations_workspace_status
  ON public.investor_conversations(workspace_id, status);

-- ============================================================================
-- STEP 4: Add column comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.investor_deals_pipeline.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_deal_events.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_campaigns.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_drip_campaign_steps.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_drip_enrollments.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_agents.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_follow_ups.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_outreach_templates.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_conversations.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.investor_messages.workspace_id IS 'Team workspace for multi-tenant access control';

COMMIT;
