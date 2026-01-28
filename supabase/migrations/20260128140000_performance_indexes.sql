-- Performance indexes for common queries
-- Zone 5: Integration & Final Polish

-- Index for fetching conversations by user, sorted by last message
-- Used by: Inbox list, conversation fetching
CREATE INDEX IF NOT EXISTS idx_rental_conversations_user_last_message
ON rental_conversations(user_id, last_message_at DESC);

-- Index for fetching messages by conversation, sorted by time
-- Used by: Conversation detail screen, message threading
CREATE INDEX IF NOT EXISTS idx_rental_messages_conversation_created
ON rental_messages(conversation_id, created_at DESC);

-- Index for AI queue queries by user and status
-- Used by: Pending response counts, review queue
CREATE INDEX IF NOT EXISTS idx_rental_ai_queue_user_status
ON rental_ai_queue(user_id, status);

-- Index for AI queue expiration checks
-- Used by: Expiration cleanup jobs, approval validation
CREATE INDEX IF NOT EXISTS idx_rental_ai_queue_expires
ON rental_ai_queue(expires_at)
WHERE status = 'pending';

-- Index for bookings by property and dates
-- Used by: Availability checks, property booking list
CREATE INDEX IF NOT EXISTS idx_rental_bookings_property_dates
ON rental_bookings(property_id, start_date, end_date);

-- Index for contacts by user and type
-- Used by: Contact list filtering, lead/guest/tenant views
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user_types
ON crm_contacts USING GIN (contact_types);

-- Partial index for active conversations only
-- Used by: Inbox default view (active conversations)
CREATE INDEX IF NOT EXISTS idx_rental_conversations_active
ON rental_conversations(user_id, last_message_at DESC)
WHERE status = 'active';

-- Index for rooms by property and status
-- Used by: Property detail room list, availability checks
CREATE INDEX IF NOT EXISTS idx_rental_rooms_property_status
ON rental_rooms(property_id, status);
