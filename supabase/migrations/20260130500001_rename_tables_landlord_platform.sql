-- Migration: Rename Landlord Platform Tables
-- Phase 2: Rename rental_*, property_*, guest_* tables to landlord_*
-- Date: 2026-01-30
--
-- This migration renames all landlord/rental platform tables to use
-- the landlord_* prefix for clear platform ownership.

BEGIN;

-- ============================================================================
-- STEP 1: Rename rental_* tables to landlord_*
-- ============================================================================

-- rental_templates → landlord_templates (leaf table)
ALTER TABLE IF EXISTS public.rental_templates
  RENAME TO landlord_templates;

-- rental_integrations → landlord_integrations (leaf table)
ALTER TABLE IF EXISTS public.rental_integrations
  RENAME TO landlord_integrations;

-- rental_ai_queue → landlord_ai_queue_items (leaf table, references rental_messages and rental_conversations)
ALTER TABLE IF EXISTS public.rental_ai_queue
  RENAME TO landlord_ai_queue_items;

-- rental_messages → landlord_messages (references rental_conversations)
ALTER TABLE IF EXISTS public.rental_messages
  RENAME TO landlord_messages;

-- rental_conversations → landlord_conversations (references rental_properties, rental_bookings)
ALTER TABLE IF EXISTS public.rental_conversations
  RENAME TO landlord_conversations;

-- rental_bookings → landlord_bookings (references rental_properties, rental_rooms)
ALTER TABLE IF EXISTS public.rental_bookings
  RENAME TO landlord_bookings;

-- rental_rooms → landlord_rooms (references rental_properties, rental_bookings)
ALTER TABLE IF EXISTS public.rental_rooms
  RENAME TO landlord_rooms;

-- rental_properties → landlord_properties (parent table)
ALTER TABLE IF EXISTS public.rental_properties
  RENAME TO landlord_properties;

-- ============================================================================
-- STEP 2: Rename property_* tables to landlord_*
-- ============================================================================

-- property_inventory → landlord_inventory_items
ALTER TABLE IF EXISTS public.property_inventory
  RENAME TO landlord_inventory_items;

-- property_maintenance → landlord_maintenance_records
ALTER TABLE IF EXISTS public.property_maintenance
  RENAME TO landlord_maintenance_records;

-- property_vendors → landlord_vendors
ALTER TABLE IF EXISTS public.property_vendors
  RENAME TO landlord_vendors;

-- property_turnovers → landlord_turnovers
ALTER TABLE IF EXISTS public.property_turnovers
  RENAME TO landlord_turnovers;

-- ============================================================================
-- STEP 3: Rename guest_* tables to landlord_guest_*
-- ============================================================================

-- guest_message_templates → landlord_guest_templates
ALTER TABLE IF EXISTS public.guest_message_templates
  RENAME TO landlord_guest_templates;

-- guest_messages → landlord_guest_messages
ALTER TABLE IF EXISTS public.guest_messages
  RENAME TO landlord_guest_messages;

-- ============================================================================
-- STEP 4: Rename orphan tables to landlord_*
-- ============================================================================

-- booking_charges → landlord_booking_charges
ALTER TABLE IF EXISTS public.booking_charges
  RENAME TO landlord_booking_charges;

-- deposit_settlements → landlord_deposit_settlements
ALTER TABLE IF EXISTS public.deposit_settlements
  RENAME TO landlord_deposit_settlements;

-- turnover_templates → landlord_turnover_templates
ALTER TABLE IF EXISTS public.turnover_templates
  RENAME TO landlord_turnover_templates;

-- vendor_messages → landlord_vendor_messages
ALTER TABLE IF EXISTS public.vendor_messages
  RENAME TO landlord_vendor_messages;

-- ============================================================================
-- STEP 5: Update FK constraints for landlord core tables
-- ============================================================================

-- landlord_rooms FKs
ALTER TABLE public.landlord_rooms
  DROP CONSTRAINT IF EXISTS rental_rooms_property_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_rental_rooms_current_booking,
  ADD CONSTRAINT landlord_rooms_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_rooms_current_booking_id_fkey
    FOREIGN KEY (current_booking_id) REFERENCES public.landlord_bookings(id) ON DELETE SET NULL;

-- landlord_bookings FKs
ALTER TABLE public.landlord_bookings
  DROP CONSTRAINT IF EXISTS rental_bookings_property_id_fkey,
  DROP CONSTRAINT IF EXISTS rental_bookings_room_id_fkey,
  DROP CONSTRAINT IF EXISTS rental_bookings_contact_id_fkey,
  ADD CONSTRAINT landlord_bookings_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_bookings_room_id_fkey
    FOREIGN KEY (room_id) REFERENCES public.landlord_rooms(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_bookings_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- landlord_conversations FKs
ALTER TABLE public.landlord_conversations
  DROP CONSTRAINT IF EXISTS rental_conversations_property_id_fkey,
  DROP CONSTRAINT IF EXISTS rental_conversations_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS rental_conversations_contact_id_fkey,
  ADD CONSTRAINT landlord_conversations_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_conversations_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.landlord_bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_conversations_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- landlord_messages FKs
ALTER TABLE public.landlord_messages
  DROP CONSTRAINT IF EXISTS rental_messages_conversation_id_fkey,
  ADD CONSTRAINT landlord_messages_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.landlord_conversations(id) ON DELETE CASCADE;

-- landlord_ai_queue_items FKs
ALTER TABLE public.landlord_ai_queue_items
  DROP CONSTRAINT IF EXISTS rental_ai_queue_conversation_id_fkey,
  DROP CONSTRAINT IF EXISTS rental_ai_queue_trigger_message_id_fkey,
  DROP CONSTRAINT IF EXISTS rental_ai_queue_sent_message_id_fkey,
  ADD CONSTRAINT landlord_ai_queue_items_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.landlord_conversations(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_ai_queue_items_trigger_message_id_fkey
    FOREIGN KEY (trigger_message_id) REFERENCES public.landlord_messages(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_ai_queue_items_sent_message_id_fkey
    FOREIGN KEY (sent_message_id) REFERENCES public.landlord_messages(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 6: Update FK constraints for property management tables
-- ============================================================================

-- landlord_inventory_items FKs
ALTER TABLE public.landlord_inventory_items
  DROP CONSTRAINT IF EXISTS property_inventory_property_id_fkey,
  ADD CONSTRAINT landlord_inventory_items_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE;

-- landlord_vendors FKs
ALTER TABLE public.landlord_vendors
  DROP CONSTRAINT IF EXISTS property_vendors_property_id_fkey,
  ADD CONSTRAINT landlord_vendors_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE;

-- landlord_maintenance_records FKs
ALTER TABLE public.landlord_maintenance_records
  DROP CONSTRAINT IF EXISTS property_maintenance_property_id_fkey,
  DROP CONSTRAINT IF EXISTS property_maintenance_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS property_maintenance_inventory_item_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_property_maintenance_vendor,
  ADD CONSTRAINT landlord_maintenance_records_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_maintenance_records_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.landlord_bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_maintenance_records_inventory_item_id_fkey
    FOREIGN KEY (inventory_item_id) REFERENCES public.landlord_inventory_items(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_maintenance_records_vendor_id_fkey
    FOREIGN KEY (vendor_id) REFERENCES public.landlord_vendors(id) ON DELETE SET NULL;

-- landlord_turnovers FKs
ALTER TABLE public.landlord_turnovers
  DROP CONSTRAINT IF EXISTS property_turnovers_property_id_fkey,
  DROP CONSTRAINT IF EXISTS property_turnovers_checkout_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS property_turnovers_checkin_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS property_turnovers_cleaner_vendor_id_fkey,
  DROP CONSTRAINT IF EXISTS property_turnovers_maintenance_created_id_fkey,
  ADD CONSTRAINT landlord_turnovers_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_turnovers_checkout_booking_id_fkey
    FOREIGN KEY (checkout_booking_id) REFERENCES public.landlord_bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_turnovers_checkin_booking_id_fkey
    FOREIGN KEY (checkin_booking_id) REFERENCES public.landlord_bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_turnovers_cleaner_vendor_id_fkey
    FOREIGN KEY (cleaner_vendor_id) REFERENCES public.landlord_vendors(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_turnovers_maintenance_created_id_fkey
    FOREIGN KEY (maintenance_created_id) REFERENCES public.landlord_maintenance_records(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 7: Update FK constraints for guest tables
-- ============================================================================

-- landlord_guest_templates FKs
ALTER TABLE public.landlord_guest_templates
  DROP CONSTRAINT IF EXISTS guest_message_templates_property_id_fkey,
  ADD CONSTRAINT landlord_guest_templates_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE;

-- landlord_guest_messages FKs
ALTER TABLE public.landlord_guest_messages
  DROP CONSTRAINT IF EXISTS guest_messages_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS guest_messages_contact_id_fkey,
  DROP CONSTRAINT IF EXISTS guest_messages_template_id_fkey,
  ADD CONSTRAINT landlord_guest_messages_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.landlord_bookings(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_guest_messages_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_guest_messages_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES public.landlord_guest_templates(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 8: Update FK constraints for orphan tables
-- ============================================================================

-- landlord_booking_charges FKs
ALTER TABLE public.landlord_booking_charges
  DROP CONSTRAINT IF EXISTS booking_charges_booking_id_fkey,
  DROP CONSTRAINT IF EXISTS booking_charges_maintenance_id_fkey,
  ADD CONSTRAINT landlord_booking_charges_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.landlord_bookings(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_booking_charges_maintenance_id_fkey
    FOREIGN KEY (maintenance_id) REFERENCES public.landlord_maintenance_records(id) ON DELETE SET NULL;

-- landlord_deposit_settlements FKs
ALTER TABLE public.landlord_deposit_settlements
  DROP CONSTRAINT IF EXISTS deposit_settlements_booking_id_fkey,
  ADD CONSTRAINT landlord_deposit_settlements_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.landlord_bookings(id) ON DELETE CASCADE;

-- landlord_turnover_templates FKs
ALTER TABLE public.landlord_turnover_templates
  DROP CONSTRAINT IF EXISTS turnover_templates_property_id_fkey,
  ADD CONSTRAINT landlord_turnover_templates_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE;

-- landlord_vendor_messages FKs
ALTER TABLE public.landlord_vendor_messages
  DROP CONSTRAINT IF EXISTS vendor_messages_property_id_fkey,
  DROP CONSTRAINT IF EXISTS vendor_messages_vendor_id_fkey,
  DROP CONSTRAINT IF EXISTS vendor_messages_maintenance_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_vendor_messages_turnover,
  ADD CONSTRAINT landlord_vendor_messages_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_vendor_messages_vendor_id_fkey
    FOREIGN KEY (vendor_id) REFERENCES public.landlord_vendors(id) ON DELETE CASCADE,
  ADD CONSTRAINT landlord_vendor_messages_maintenance_id_fkey
    FOREIGN KEY (maintenance_id) REFERENCES public.landlord_maintenance_records(id) ON DELETE SET NULL,
  ADD CONSTRAINT landlord_vendor_messages_turnover_id_fkey
    FOREIGN KEY (turnover_id) REFERENCES public.landlord_turnovers(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 9: Update FKs from OTHER tables that reference renamed landlord tables
-- ============================================================================

-- ai_response_outcomes → references rental_* tables (now landlord_*)
ALTER TABLE public.ai_response_outcomes
  DROP CONSTRAINT IF EXISTS ai_response_outcomes_conversation_id_fkey,
  DROP CONSTRAINT IF EXISTS ai_response_outcomes_message_id_fkey,
  DROP CONSTRAINT IF EXISTS ai_response_outcomes_property_id_fkey,
  ADD CONSTRAINT ai_response_outcomes_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES public.landlord_conversations(id) ON DELETE CASCADE,
  ADD CONSTRAINT ai_response_outcomes_message_id_fkey
    FOREIGN KEY (message_id) REFERENCES public.landlord_messages(id) ON DELETE CASCADE,
  ADD CONSTRAINT ai_response_outcomes_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE;

-- auto_send_rules → references rental_properties (now landlord_properties) and guest_message_templates (now landlord_guest_templates)
ALTER TABLE public.auto_send_rules
  DROP CONSTRAINT IF EXISTS auto_send_rules_property_id_fkey,
  DROP CONSTRAINT IF EXISTS auto_send_rules_template_id_fkey,
  ADD CONSTRAINT auto_send_rules_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE,
  ADD CONSTRAINT auto_send_rules_template_id_fkey
    FOREIGN KEY (template_id) REFERENCES public.landlord_guest_templates(id) ON DELETE CASCADE;

-- crm_skip_trace_results → references rental_properties (now landlord_properties)
ALTER TABLE public.crm_skip_trace_results
  DROP CONSTRAINT IF EXISTS crm_skip_trace_results_property_id_fkey,
  DROP CONSTRAINT IF EXISTS crm_skip_trace_results_matched_property_id_fkey,
  ADD CONSTRAINT crm_skip_trace_results_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE SET NULL,
  ADD CONSTRAINT crm_skip_trace_results_matched_property_id_fkey
    FOREIGN KEY (matched_property_id) REFERENCES public.landlord_properties(id) ON DELETE SET NULL;

-- seam_connected_devices → references rental_properties (now landlord_properties)
ALTER TABLE public.seam_connected_devices
  DROP CONSTRAINT IF EXISTS seam_connected_devices_property_id_fkey,
  ADD CONSTRAINT seam_connected_devices_property_id_fkey
    FOREIGN KEY (property_id) REFERENCES public.landlord_properties(id) ON DELETE CASCADE;

-- seam_access_codes → references rental_bookings (now landlord_bookings)
ALTER TABLE public.seam_access_codes
  DROP CONSTRAINT IF EXISTS seam_access_codes_booking_id_fkey,
  ADD CONSTRAINT seam_access_codes_booking_id_fkey
    FOREIGN KEY (booking_id) REFERENCES public.landlord_bookings(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 10: Update RLS policies for landlord tables
-- ============================================================================

-- RLS for landlord_properties
DROP POLICY IF EXISTS "rental_properties_select_policy" ON public.landlord_properties;
DROP POLICY IF EXISTS "rental_properties_insert_policy" ON public.landlord_properties;
DROP POLICY IF EXISTS "rental_properties_update_policy" ON public.landlord_properties;
DROP POLICY IF EXISTS "rental_properties_delete_policy" ON public.landlord_properties;
DROP POLICY IF EXISTS "Users can view own rental properties" ON public.landlord_properties;
DROP POLICY IF EXISTS "Users can insert own rental properties" ON public.landlord_properties;
DROP POLICY IF EXISTS "Users can update own rental properties" ON public.landlord_properties;
DROP POLICY IF EXISTS "Users can delete own rental properties" ON public.landlord_properties;

CREATE POLICY "landlord_properties_select_policy" ON public.landlord_properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_properties_insert_policy" ON public.landlord_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_properties_update_policy" ON public.landlord_properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_properties_delete_policy" ON public.landlord_properties
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_rooms
DROP POLICY IF EXISTS "rental_rooms_select_policy" ON public.landlord_rooms;
DROP POLICY IF EXISTS "rental_rooms_insert_policy" ON public.landlord_rooms;
DROP POLICY IF EXISTS "rental_rooms_update_policy" ON public.landlord_rooms;
DROP POLICY IF EXISTS "rental_rooms_delete_policy" ON public.landlord_rooms;

CREATE POLICY "landlord_rooms_select_policy" ON public.landlord_rooms
  FOR SELECT USING (
    property_id IN (SELECT id FROM public.landlord_properties WHERE user_id = auth.uid())
  );

CREATE POLICY "landlord_rooms_insert_policy" ON public.landlord_rooms
  FOR INSERT WITH CHECK (
    property_id IN (SELECT id FROM public.landlord_properties WHERE user_id = auth.uid())
  );

CREATE POLICY "landlord_rooms_update_policy" ON public.landlord_rooms
  FOR UPDATE USING (
    property_id IN (SELECT id FROM public.landlord_properties WHERE user_id = auth.uid())
  );

CREATE POLICY "landlord_rooms_delete_policy" ON public.landlord_rooms
  FOR DELETE USING (
    property_id IN (SELECT id FROM public.landlord_properties WHERE user_id = auth.uid())
  );

-- RLS for landlord_bookings
DROP POLICY IF EXISTS "rental_bookings_select_policy" ON public.landlord_bookings;
DROP POLICY IF EXISTS "rental_bookings_insert_policy" ON public.landlord_bookings;
DROP POLICY IF EXISTS "rental_bookings_update_policy" ON public.landlord_bookings;
DROP POLICY IF EXISTS "rental_bookings_delete_policy" ON public.landlord_bookings;

CREATE POLICY "landlord_bookings_select_policy" ON public.landlord_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_bookings_insert_policy" ON public.landlord_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_bookings_update_policy" ON public.landlord_bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_bookings_delete_policy" ON public.landlord_bookings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_conversations
DROP POLICY IF EXISTS "rental_conversations_select_policy" ON public.landlord_conversations;
DROP POLICY IF EXISTS "rental_conversations_insert_policy" ON public.landlord_conversations;
DROP POLICY IF EXISTS "rental_conversations_update_policy" ON public.landlord_conversations;
DROP POLICY IF EXISTS "rental_conversations_delete_policy" ON public.landlord_conversations;

CREATE POLICY "landlord_conversations_select_policy" ON public.landlord_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_conversations_insert_policy" ON public.landlord_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_conversations_update_policy" ON public.landlord_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_conversations_delete_policy" ON public.landlord_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_messages
DROP POLICY IF EXISTS "rental_messages_select_policy" ON public.landlord_messages;
DROP POLICY IF EXISTS "rental_messages_insert_policy" ON public.landlord_messages;
DROP POLICY IF EXISTS "rental_messages_update_policy" ON public.landlord_messages;
DROP POLICY IF EXISTS "rental_messages_delete_policy" ON public.landlord_messages;

CREATE POLICY "landlord_messages_select_policy" ON public.landlord_messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM public.landlord_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "landlord_messages_insert_policy" ON public.landlord_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM public.landlord_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "landlord_messages_update_policy" ON public.landlord_messages
  FOR UPDATE USING (
    conversation_id IN (SELECT id FROM public.landlord_conversations WHERE user_id = auth.uid())
  );

CREATE POLICY "landlord_messages_delete_policy" ON public.landlord_messages
  FOR DELETE USING (
    conversation_id IN (SELECT id FROM public.landlord_conversations WHERE user_id = auth.uid())
  );

-- RLS for landlord_ai_queue_items
DROP POLICY IF EXISTS "rental_ai_queue_select_policy" ON public.landlord_ai_queue_items;
DROP POLICY IF EXISTS "rental_ai_queue_insert_policy" ON public.landlord_ai_queue_items;
DROP POLICY IF EXISTS "rental_ai_queue_update_policy" ON public.landlord_ai_queue_items;
DROP POLICY IF EXISTS "rental_ai_queue_delete_policy" ON public.landlord_ai_queue_items;

CREATE POLICY "landlord_ai_queue_items_select_policy" ON public.landlord_ai_queue_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_ai_queue_items_insert_policy" ON public.landlord_ai_queue_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_ai_queue_items_update_policy" ON public.landlord_ai_queue_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_ai_queue_items_delete_policy" ON public.landlord_ai_queue_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_inventory_items
DROP POLICY IF EXISTS "property_inventory_select_policy" ON public.landlord_inventory_items;
DROP POLICY IF EXISTS "property_inventory_insert_policy" ON public.landlord_inventory_items;
DROP POLICY IF EXISTS "property_inventory_update_policy" ON public.landlord_inventory_items;
DROP POLICY IF EXISTS "property_inventory_delete_policy" ON public.landlord_inventory_items;

CREATE POLICY "landlord_inventory_items_select_policy" ON public.landlord_inventory_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_inventory_items_insert_policy" ON public.landlord_inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_inventory_items_update_policy" ON public.landlord_inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_inventory_items_delete_policy" ON public.landlord_inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_maintenance_records
DROP POLICY IF EXISTS "property_maintenance_select_policy" ON public.landlord_maintenance_records;
DROP POLICY IF EXISTS "property_maintenance_insert_policy" ON public.landlord_maintenance_records;
DROP POLICY IF EXISTS "property_maintenance_update_policy" ON public.landlord_maintenance_records;
DROP POLICY IF EXISTS "property_maintenance_delete_policy" ON public.landlord_maintenance_records;

CREATE POLICY "landlord_maintenance_records_select_policy" ON public.landlord_maintenance_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_maintenance_records_insert_policy" ON public.landlord_maintenance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_maintenance_records_update_policy" ON public.landlord_maintenance_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_maintenance_records_delete_policy" ON public.landlord_maintenance_records
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_vendors
DROP POLICY IF EXISTS "property_vendors_select_policy" ON public.landlord_vendors;
DROP POLICY IF EXISTS "property_vendors_insert_policy" ON public.landlord_vendors;
DROP POLICY IF EXISTS "property_vendors_update_policy" ON public.landlord_vendors;
DROP POLICY IF EXISTS "property_vendors_delete_policy" ON public.landlord_vendors;

CREATE POLICY "landlord_vendors_select_policy" ON public.landlord_vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_vendors_insert_policy" ON public.landlord_vendors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_vendors_update_policy" ON public.landlord_vendors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_vendors_delete_policy" ON public.landlord_vendors
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_turnovers
DROP POLICY IF EXISTS "property_turnovers_select_policy" ON public.landlord_turnovers;
DROP POLICY IF EXISTS "property_turnovers_insert_policy" ON public.landlord_turnovers;
DROP POLICY IF EXISTS "property_turnovers_update_policy" ON public.landlord_turnovers;
DROP POLICY IF EXISTS "property_turnovers_delete_policy" ON public.landlord_turnovers;

CREATE POLICY "landlord_turnovers_select_policy" ON public.landlord_turnovers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_turnovers_insert_policy" ON public.landlord_turnovers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_turnovers_update_policy" ON public.landlord_turnovers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_turnovers_delete_policy" ON public.landlord_turnovers
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_guest_templates
DROP POLICY IF EXISTS "guest_message_templates_select_policy" ON public.landlord_guest_templates;
DROP POLICY IF EXISTS "guest_message_templates_insert_policy" ON public.landlord_guest_templates;
DROP POLICY IF EXISTS "guest_message_templates_update_policy" ON public.landlord_guest_templates;
DROP POLICY IF EXISTS "guest_message_templates_delete_policy" ON public.landlord_guest_templates;

CREATE POLICY "landlord_guest_templates_select_policy" ON public.landlord_guest_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_guest_templates_insert_policy" ON public.landlord_guest_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_guest_templates_update_policy" ON public.landlord_guest_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_guest_templates_delete_policy" ON public.landlord_guest_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_guest_messages
DROP POLICY IF EXISTS "guest_messages_select_policy" ON public.landlord_guest_messages;
DROP POLICY IF EXISTS "guest_messages_insert_policy" ON public.landlord_guest_messages;
DROP POLICY IF EXISTS "guest_messages_update_policy" ON public.landlord_guest_messages;
DROP POLICY IF EXISTS "guest_messages_delete_policy" ON public.landlord_guest_messages;

CREATE POLICY "landlord_guest_messages_select_policy" ON public.landlord_guest_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_guest_messages_insert_policy" ON public.landlord_guest_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_guest_messages_update_policy" ON public.landlord_guest_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_guest_messages_delete_policy" ON public.landlord_guest_messages
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_booking_charges
DROP POLICY IF EXISTS "booking_charges_select_policy" ON public.landlord_booking_charges;
DROP POLICY IF EXISTS "booking_charges_insert_policy" ON public.landlord_booking_charges;
DROP POLICY IF EXISTS "booking_charges_update_policy" ON public.landlord_booking_charges;
DROP POLICY IF EXISTS "booking_charges_delete_policy" ON public.landlord_booking_charges;

CREATE POLICY "landlord_booking_charges_select_policy" ON public.landlord_booking_charges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_booking_charges_insert_policy" ON public.landlord_booking_charges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_booking_charges_update_policy" ON public.landlord_booking_charges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_booking_charges_delete_policy" ON public.landlord_booking_charges
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_deposit_settlements
DROP POLICY IF EXISTS "deposit_settlements_select_policy" ON public.landlord_deposit_settlements;
DROP POLICY IF EXISTS "deposit_settlements_insert_policy" ON public.landlord_deposit_settlements;
DROP POLICY IF EXISTS "deposit_settlements_update_policy" ON public.landlord_deposit_settlements;
DROP POLICY IF EXISTS "deposit_settlements_delete_policy" ON public.landlord_deposit_settlements;

CREATE POLICY "landlord_deposit_settlements_select_policy" ON public.landlord_deposit_settlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_deposit_settlements_insert_policy" ON public.landlord_deposit_settlements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_deposit_settlements_update_policy" ON public.landlord_deposit_settlements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_deposit_settlements_delete_policy" ON public.landlord_deposit_settlements
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_turnover_templates
DROP POLICY IF EXISTS "turnover_templates_select_policy" ON public.landlord_turnover_templates;
DROP POLICY IF EXISTS "turnover_templates_insert_policy" ON public.landlord_turnover_templates;
DROP POLICY IF EXISTS "turnover_templates_update_policy" ON public.landlord_turnover_templates;
DROP POLICY IF EXISTS "turnover_templates_delete_policy" ON public.landlord_turnover_templates;

CREATE POLICY "landlord_turnover_templates_select_policy" ON public.landlord_turnover_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_turnover_templates_insert_policy" ON public.landlord_turnover_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_turnover_templates_update_policy" ON public.landlord_turnover_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_turnover_templates_delete_policy" ON public.landlord_turnover_templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS for landlord_vendor_messages
DROP POLICY IF EXISTS "vendor_messages_select_policy" ON public.landlord_vendor_messages;
DROP POLICY IF EXISTS "vendor_messages_insert_policy" ON public.landlord_vendor_messages;
DROP POLICY IF EXISTS "vendor_messages_update_policy" ON public.landlord_vendor_messages;
DROP POLICY IF EXISTS "vendor_messages_delete_policy" ON public.landlord_vendor_messages;

CREATE POLICY "landlord_vendor_messages_select_policy" ON public.landlord_vendor_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "landlord_vendor_messages_insert_policy" ON public.landlord_vendor_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "landlord_vendor_messages_update_policy" ON public.landlord_vendor_messages
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "landlord_vendor_messages_delete_policy" ON public.landlord_vendor_messages
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 11: Rename indexes
-- ============================================================================

-- Rename indexes for landlord_properties
ALTER INDEX IF EXISTS rental_properties_pkey RENAME TO landlord_properties_pkey;
ALTER INDEX IF EXISTS rental_properties_user_id_idx RENAME TO landlord_properties_user_id_idx;

-- Rename indexes for landlord_rooms
ALTER INDEX IF EXISTS rental_rooms_pkey RENAME TO landlord_rooms_pkey;
ALTER INDEX IF EXISTS rental_rooms_property_id_idx RENAME TO landlord_rooms_property_id_idx;

-- Rename indexes for landlord_bookings
ALTER INDEX IF EXISTS rental_bookings_pkey RENAME TO landlord_bookings_pkey;
ALTER INDEX IF EXISTS rental_bookings_property_id_idx RENAME TO landlord_bookings_property_id_idx;

-- Rename indexes for landlord_conversations
ALTER INDEX IF EXISTS rental_conversations_pkey RENAME TO landlord_conversations_pkey;
ALTER INDEX IF EXISTS rental_conversations_property_id_idx RENAME TO landlord_conversations_property_id_idx;

-- Rename indexes for landlord_messages
ALTER INDEX IF EXISTS rental_messages_pkey RENAME TO landlord_messages_pkey;
ALTER INDEX IF EXISTS rental_messages_conversation_id_idx RENAME TO landlord_messages_conversation_id_idx;

-- ============================================================================
-- STEP 12: Add comments
-- ============================================================================

COMMENT ON TABLE public.landlord_properties IS 'Rental properties managed by landlords (formerly rental_properties)';
COMMENT ON TABLE public.landlord_rooms IS 'Rooms within rental properties (formerly rental_rooms)';
COMMENT ON TABLE public.landlord_bookings IS 'Guest bookings for rental properties (formerly rental_bookings)';
COMMENT ON TABLE public.landlord_conversations IS 'Conversations with guests/tenants (formerly rental_conversations)';
COMMENT ON TABLE public.landlord_messages IS 'Messages within conversations (formerly rental_messages)';
COMMENT ON TABLE public.landlord_ai_queue_items IS 'AI response queue for landlord conversations (formerly rental_ai_queue)';
COMMENT ON TABLE public.landlord_inventory_items IS 'Inventory items in properties (formerly property_inventory)';
COMMENT ON TABLE public.landlord_maintenance_records IS 'Maintenance records and work orders (formerly property_maintenance)';
COMMENT ON TABLE public.landlord_vendors IS 'Vendors for maintenance and services (formerly property_vendors)';
COMMENT ON TABLE public.landlord_turnovers IS 'Property turnovers between guests (formerly property_turnovers)';
COMMENT ON TABLE public.landlord_guest_templates IS 'Message templates for guests (formerly guest_message_templates)';
COMMENT ON TABLE public.landlord_guest_messages IS 'Scheduled guest messages (formerly guest_messages)';
COMMENT ON TABLE public.landlord_booking_charges IS 'Charges for bookings (formerly booking_charges)';
COMMENT ON TABLE public.landlord_deposit_settlements IS 'Deposit settlements (formerly deposit_settlements)';
COMMENT ON TABLE public.landlord_turnover_templates IS 'Turnover task templates (formerly turnover_templates)';
COMMENT ON TABLE public.landlord_vendor_messages IS 'Messages to/from vendors (formerly vendor_messages)';

COMMIT;
