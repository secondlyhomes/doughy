-- Migration: Add workspace_id to Landlord Platform Tables
-- Phase 1a: Add workspace_id column to all landlord_* tables for team multi-tenancy
-- Date: 2026-01-30
--
-- DBA Best Practices Applied:
-- - Add columns as NULLABLE first (no downtime)
-- - Foreign key references to workspaces(id) for referential integrity
-- - Indexes on workspace_id for RLS query performance
-- - Comments documenting the column purpose
--
-- Tables Modified:
-- - landlord_properties
-- - landlord_rooms
-- - landlord_bookings
-- - landlord_conversations
-- - landlord_messages
-- - landlord_ai_queue_items
-- - landlord_inventory_items
-- - landlord_maintenance_records
-- - landlord_vendors
-- - landlord_vendor_messages
-- - landlord_turnovers
-- - landlord_booking_charges
-- - landlord_deposit_settlements
-- - landlord_guest_templates
-- - landlord_turnover_templates

BEGIN;

-- ============================================================================
-- STEP 1: Add workspace_id column to all landlord tables
-- ============================================================================

-- landlord_properties - Primary entity, will be used for ownership chain
ALTER TABLE public.landlord_properties
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_rooms - Child of landlord_properties
ALTER TABLE public.landlord_rooms
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_bookings - References property
ALTER TABLE public.landlord_bookings
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_conversations - Guest communications
ALTER TABLE public.landlord_conversations
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_messages - Child of landlord_conversations
ALTER TABLE public.landlord_messages
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_ai_queue_items - AI processing queue
ALTER TABLE public.landlord_ai_queue_items
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_inventory_items - Property inventory tracking
ALTER TABLE public.landlord_inventory_items
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_maintenance_records - Maintenance history
ALTER TABLE public.landlord_maintenance_records
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_vendors - Vendor contacts
ALTER TABLE public.landlord_vendors
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_vendor_messages - Vendor communications
ALTER TABLE public.landlord_vendor_messages
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_turnovers - Turnover workflow
ALTER TABLE public.landlord_turnovers
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_booking_charges - Guest charges
ALTER TABLE public.landlord_booking_charges
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_deposit_settlements - Security deposit handling
ALTER TABLE public.landlord_deposit_settlements
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_guest_templates - Message templates
ALTER TABLE public.landlord_guest_templates
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- landlord_turnover_templates - Checklist templates
ALTER TABLE public.landlord_turnover_templates
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id);

-- ============================================================================
-- STEP 2: Create indexes for workspace_id (RLS performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_landlord_properties_workspace_id
  ON public.landlord_properties(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_rooms_workspace_id
  ON public.landlord_rooms(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_bookings_workspace_id
  ON public.landlord_bookings(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_conversations_workspace_id
  ON public.landlord_conversations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_messages_workspace_id
  ON public.landlord_messages(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_ai_queue_items_workspace_id
  ON public.landlord_ai_queue_items(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_inventory_items_workspace_id
  ON public.landlord_inventory_items(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_maintenance_records_workspace_id
  ON public.landlord_maintenance_records(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_vendors_workspace_id
  ON public.landlord_vendors(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_vendor_messages_workspace_id
  ON public.landlord_vendor_messages(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_turnovers_workspace_id
  ON public.landlord_turnovers(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_booking_charges_workspace_id
  ON public.landlord_booking_charges(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_deposit_settlements_workspace_id
  ON public.landlord_deposit_settlements(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_guest_templates_workspace_id
  ON public.landlord_guest_templates(workspace_id);

CREATE INDEX IF NOT EXISTS idx_landlord_turnover_templates_workspace_id
  ON public.landlord_turnover_templates(workspace_id);

-- ============================================================================
-- STEP 3: Add composite indexes for common query patterns
-- ============================================================================

-- Properties by workspace and status
CREATE INDEX IF NOT EXISTS idx_landlord_properties_workspace_status
  ON public.landlord_properties(workspace_id, status);

-- Bookings by workspace and date range
CREATE INDEX IF NOT EXISTS idx_landlord_bookings_workspace_dates
  ON public.landlord_bookings(workspace_id, start_date, end_date);

-- Conversations by workspace and status
CREATE INDEX IF NOT EXISTS idx_landlord_conversations_workspace_status
  ON public.landlord_conversations(workspace_id, status);

-- Maintenance by workspace and status
CREATE INDEX IF NOT EXISTS idx_landlord_maintenance_records_workspace_status
  ON public.landlord_maintenance_records(workspace_id, status);

-- Turnovers by workspace and status
CREATE INDEX IF NOT EXISTS idx_landlord_turnovers_workspace_status
  ON public.landlord_turnovers(workspace_id, status);

-- ============================================================================
-- STEP 4: Add column comments for documentation
-- ============================================================================

COMMENT ON COLUMN public.landlord_properties.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_rooms.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_bookings.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_conversations.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_messages.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_ai_queue_items.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_inventory_items.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_maintenance_records.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_vendors.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_vendor_messages.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_turnovers.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_booking_charges.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_deposit_settlements.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_guest_templates.workspace_id IS 'Team workspace for multi-tenant access control';
COMMENT ON COLUMN public.landlord_turnover_templates.workspace_id IS 'Team workspace for multi-tenant access control';

COMMIT;
