-- Migration: Create rental communication tables
-- Description: Tables for conversations, messages, AI queue, and templates
-- Phase: Zone 2 - Database Foundation
-- Note: Powers the Inbox feature and AI-assisted communication

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Communication channel
CREATE TYPE rental_channel AS ENUM (
  'whatsapp',
  'telegram',
  'email',
  'sms',
  'imessage',
  'discord',
  'webchat',
  'phone'
);

-- Platform source (where the lead came from)
CREATE TYPE rental_platform AS ENUM (
  'furnishedfinder',
  'airbnb',
  'turbotenant',
  'zillow',
  'facebook',
  'craigslist',
  'direct',
  'referral',
  'other'
);

-- Conversation status
CREATE TYPE rental_conversation_status AS ENUM (
  'active',
  'resolved',
  'escalated',
  'archived'
);

-- Message direction
CREATE TYPE rental_message_direction AS ENUM ('inbound', 'outbound');

-- Message content type
CREATE TYPE rental_message_content_type AS ENUM ('text', 'image', 'file', 'voice', 'video');

-- Message sender type
CREATE TYPE rental_message_sender AS ENUM ('contact', 'ai', 'user');

-- AI queue status
CREATE TYPE rental_ai_queue_status AS ENUM (
  'pending',
  'approved',
  'edited',
  'rejected',
  'expired',
  'sent'
);

-- ============================================================================
-- 1. RENTAL_CONVERSATIONS TABLE
-- ============================================================================
-- Message threads with contacts
CREATE TABLE IF NOT EXISTS rental_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  property_id UUID REFERENCES rental_properties(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,

  -- Channel and platform
  channel rental_channel NOT NULL,
  platform rental_platform,

  -- Status and settings
  status rental_conversation_status NOT NULL DEFAULT 'active',
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_auto_respond BOOLEAN DEFAULT FALSE, -- Auto-send high-confidence responses

  -- AI settings for this conversation
  ai_confidence_threshold INT DEFAULT 85, -- Min confidence to auto-respond
  ai_personality TEXT, -- Override default AI personality

  -- Subject/topic
  subject TEXT,

  -- Tracking
  message_count INT DEFAULT 0,
  unread_count INT DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- External reference
  external_thread_id TEXT, -- Thread ID from external platform

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rental_conversations
CREATE INDEX idx_rental_conversations_user_id ON rental_conversations(user_id);
CREATE INDEX idx_rental_conversations_contact_id ON rental_conversations(contact_id);
CREATE INDEX idx_rental_conversations_property_id ON rental_conversations(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX idx_rental_conversations_booking_id ON rental_conversations(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_rental_conversations_status ON rental_conversations(status);
CREATE INDEX idx_rental_conversations_channel ON rental_conversations(channel);
CREATE INDEX idx_rental_conversations_platform ON rental_conversations(platform) WHERE platform IS NOT NULL;
CREATE INDEX idx_rental_conversations_active ON rental_conversations(user_id, status) WHERE status = 'active';
CREATE INDEX idx_rental_conversations_unread ON rental_conversations(user_id, unread_count) WHERE unread_count > 0;
CREATE INDEX idx_rental_conversations_last_message ON rental_conversations(last_message_at DESC);

-- ============================================================================
-- 2. RENTAL_MESSAGES TABLE
-- ============================================================================
-- Individual messages in conversations
CREATE TABLE IF NOT EXISTS rental_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES rental_conversations(id) ON DELETE CASCADE,

  -- Message details
  direction rental_message_direction NOT NULL,
  content TEXT NOT NULL,
  content_type rental_message_content_type NOT NULL DEFAULT 'text',

  -- Sender info
  sent_by rental_message_sender NOT NULL,

  -- AI metadata (for AI-generated messages)
  ai_confidence INT, -- 0-100
  ai_model TEXT, -- Which model generated this
  ai_prompt_tokens INT,
  ai_completion_tokens INT,

  -- Approval workflow (for AI messages needing approval)
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  edited_content TEXT, -- If user edited before sending

  -- Delivery status
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Attachments
  attachments JSONB DEFAULT '[]'::JSONB,
  -- Format: [{ "type": "image", "url": "...", "name": "..." }]

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  -- Can include: external_message_id, raw_email_headers, etc.

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rental_messages
CREATE INDEX idx_rental_messages_conversation_id ON rental_messages(conversation_id);
CREATE INDEX idx_rental_messages_direction ON rental_messages(direction);
CREATE INDEX idx_rental_messages_sent_by ON rental_messages(sent_by);
CREATE INDEX idx_rental_messages_pending_approval ON rental_messages(conversation_id) WHERE requires_approval = TRUE AND approved_at IS NULL;
CREATE INDEX idx_rental_messages_created_at ON rental_messages(created_at DESC);
CREATE INDEX idx_rental_messages_conversation_created ON rental_messages(conversation_id, created_at DESC);

-- ============================================================================
-- 3. RENTAL_AI_QUEUE TABLE
-- ============================================================================
-- Pending AI responses for human review
CREATE TABLE IF NOT EXISTS rental_ai_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Relationships
  conversation_id UUID NOT NULL REFERENCES rental_conversations(id) ON DELETE CASCADE,
  trigger_message_id UUID REFERENCES rental_messages(id) ON DELETE SET NULL,
  sent_message_id UUID REFERENCES rental_messages(id) ON DELETE SET NULL,

  -- AI response
  suggested_response TEXT NOT NULL,
  confidence INT NOT NULL, -- 0-100
  reasoning TEXT, -- Why AI generated this response

  -- Classification
  intent TEXT, -- Detected intent: 'inquiry', 'booking_request', 'question', 'complaint', etc.
  detected_topics TEXT[], -- ['availability', 'pricing', 'amenities', etc.]

  -- Alternative responses
  alternatives JSONB DEFAULT '[]'::JSONB,
  -- Format: [{ "response": "...", "confidence": 80 }]

  -- Status
  status rental_ai_queue_status NOT NULL DEFAULT 'pending',
  final_response TEXT, -- What was actually sent (may be edited)

  -- Review
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rental_ai_queue
CREATE INDEX idx_rental_ai_queue_user_id ON rental_ai_queue(user_id);
CREATE INDEX idx_rental_ai_queue_conversation_id ON rental_ai_queue(conversation_id);
CREATE INDEX idx_rental_ai_queue_status ON rental_ai_queue(status);
CREATE INDEX idx_rental_ai_queue_pending ON rental_ai_queue(user_id, status, created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_rental_ai_queue_confidence ON rental_ai_queue(confidence);
CREATE INDEX idx_rental_ai_queue_expires ON rental_ai_queue(expires_at) WHERE status = 'pending';

-- ============================================================================
-- 4. RENTAL_TEMPLATES TABLE
-- ============================================================================
-- Response templates by category
CREATE TABLE IF NOT EXISTS rental_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template details
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'inquiry_response', 'booking_confirmation', 'check_in', 'check_out', etc.
  subject TEXT, -- For email templates

  -- Content
  content TEXT NOT NULL,
  -- Supports variables: {{guest_name}}, {{property_name}}, {{check_in_date}}, etc.

  -- Settings
  channel rental_channel, -- null = all channels
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Usage tracking
  use_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- AI context
  ai_use_as_example BOOLEAN DEFAULT TRUE, -- AI can learn from this template

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rental_templates
CREATE INDEX idx_rental_templates_user_id ON rental_templates(user_id);
CREATE INDEX idx_rental_templates_category ON rental_templates(category);
CREATE INDEX idx_rental_templates_channel ON rental_templates(channel) WHERE channel IS NOT NULL;
CREATE INDEX idx_rental_templates_active ON rental_templates(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_rental_templates_default ON rental_templates(user_id, category) WHERE is_default = TRUE;

-- Unique constraint: only one default per user per category
CREATE UNIQUE INDEX idx_rental_templates_unique_default
  ON rental_templates(user_id, category)
  WHERE is_default = TRUE;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE rental_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_ai_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================
CREATE TRIGGER trigger_rental_conversations_updated_at
  BEFORE UPDATE ON rental_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rental_templates_updated_at
  BEFORE UPDATE ON rental_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER: Update conversation stats on new message
-- ============================================================================
-- Uses atomic increment to prevent race conditions with concurrent messages
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Use FOR UPDATE to lock the row and prevent race conditions
  -- This ensures message_count is atomically incremented even with concurrent inserts
  UPDATE rental_conversations
  SET
    -- Atomic increment using current value (not read-then-write)
    message_count = rental_conversations.message_count + 1,
    unread_count = CASE
      WHEN NEW.direction = 'inbound' THEN rental_conversations.unread_count + 1
      ELSE rental_conversations.unread_count
    END,
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON rental_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ============================================================================
-- LOG MIGRATION
-- ============================================================================
INSERT INTO system_logs (level, source, message, details)
VALUES (
  'info',
  'migration',
  'Created rental communication tables for Landlord platform',
  jsonb_build_object(
    'migration', '20260127_rental_communication_tables',
    'tables_created', ARRAY['rental_conversations', 'rental_messages', 'rental_ai_queue', 'rental_templates'],
    'enums_created', ARRAY['rental_channel', 'rental_platform', 'rental_conversation_status', 'rental_message_direction', 'rental_message_content_type', 'rental_message_sender', 'rental_ai_queue_status'],
    'note', 'Powers Inbox and AI communication - Zone 2'
  )
);
