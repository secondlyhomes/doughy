-- Migration: RLS policies for rental tables
-- Description: Row-level security policies for all Landlord platform tables
-- Phase: Zone 2 - Database Foundation
-- Note: Follows existing RLS patterns from core tables

-- ============================================================================
-- RENTAL_PROPERTIES POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own rental properties"
  ON rental_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rental properties"
  ON rental_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rental properties"
  ON rental_properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rental properties"
  ON rental_properties FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all rental properties"
  ON rental_properties FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- RENTAL_ROOMS POLICIES
-- ============================================================================

-- Rooms are accessed through their parent property
CREATE POLICY "Users can view rooms of their properties"
  ON rental_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rental_properties
      WHERE rental_properties.id = rental_rooms.property_id
      AND rental_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert rooms to their properties"
  ON rental_rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rental_properties
      WHERE rental_properties.id = property_id
      AND rental_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update rooms of their properties"
  ON rental_rooms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rental_properties
      WHERE rental_properties.id = rental_rooms.property_id
      AND rental_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete rooms of their properties"
  ON rental_rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rental_properties
      WHERE rental_properties.id = rental_rooms.property_id
      AND rental_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all rooms"
  ON rental_rooms FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- RENTAL_BOOKINGS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own bookings"
  ON rental_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings"
  ON rental_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON rental_bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings"
  ON rental_bookings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
  ON rental_bookings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- RENTAL_CONVERSATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own conversations"
  ON rental_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON rental_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON rental_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON rental_conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations"
  ON rental_conversations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- RENTAL_MESSAGES POLICIES
-- ============================================================================

-- Messages are accessed through their parent conversation
CREATE POLICY "Users can view messages in their conversations"
  ON rental_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rental_conversations
      WHERE rental_conversations.id = rental_messages.conversation_id
      AND rental_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations"
  ON rental_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rental_conversations
      WHERE rental_conversations.id = conversation_id
      AND rental_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON rental_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rental_conversations
      WHERE rental_conversations.id = rental_messages.conversation_id
      AND rental_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages"
  ON rental_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- RENTAL_AI_QUEUE POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own AI queue items"
  ON rental_ai_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI queue items"
  ON rental_ai_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI queue items"
  ON rental_ai_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI queue items"
  ON rental_ai_queue FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI queue items"
  ON rental_ai_queue FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- RENTAL_TEMPLATES POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own templates"
  ON rental_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON rental_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON rental_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON rental_templates FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all templates"
  ON rental_templates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- USER_PLATFORM_SETTINGS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own platform settings"
  ON user_platform_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own platform settings"
  ON user_platform_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own platform settings"
  ON user_platform_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all platform settings"
  ON user_platform_settings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- RENTAL_INTEGRATIONS POLICIES
-- ============================================================================

CREATE POLICY "Users can view their own integrations"
  ON rental_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
  ON rental_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON rental_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON rental_integrations FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all integrations"
  ON rental_integrations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
  );

-- ============================================================================
-- CRM_CONTACTS POLICIES (for user_id column)
-- ============================================================================

-- Drop and recreate policies (idempotent)
DROP POLICY IF EXISTS "Users can view their own contacts" ON crm_contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON crm_contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON crm_contacts;

-- Add policies for user-scoped contacts (if user_id is set)
CREATE POLICY "Users can view their own contacts"
  ON crm_contacts FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON crm_contacts FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON crm_contacts FOR UPDATE
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Migration complete: RLS policies for rental tables
