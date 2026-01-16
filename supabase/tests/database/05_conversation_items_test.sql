-- Test Suite: Conversation Items
-- Description: Verify conversation_items constraints, RLS, and unique indexes
-- Zone G: UX Improvements - Code Review Response

BEGIN;
SELECT plan(15);

-- ============================================================================
-- TEST 1: TABLE EXISTS AND RLS IS ENABLED
-- ============================================================================

SELECT has_table('public', 'conversation_items', 'conversation_items table exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE relname = 'conversation_items'),
  'RLS is enabled on conversation_items'
);

-- ============================================================================
-- TEST 2: PARENT CHECK CONSTRAINT
-- Verify conversation_items_parent_check rejects records with NULL for both lead_id and pipeline_id
-- ============================================================================

SELECT has_check(
  'public', 'conversation_items',
  'conversation_items has CHECK constraint'
);

-- Test: Should reject conversation with no parent (both lead_id and pipeline_id NULL)
PREPARE orphaned_conversation AS
  INSERT INTO conversation_items (
    workspace_id,
    user_id,
    type,
    direction,
    content
    -- lead_id and pipeline_id both NULL
  )
  VALUES (
    (SELECT id FROM workspaces LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    'note',
    'internal',
    'Orphaned conversation test'
  );

SELECT throws_ok(
  'orphaned_conversation',
  '23514', -- CHECK constraint violation
  NULL,
  'Rejects conversation with no parent (lead_id and pipeline_id both NULL)'
);

-- Test: Should allow conversation with only lead_id
PREPARE lead_only_conversation AS
  INSERT INTO conversation_items (
    workspace_id,
    user_id,
    lead_id,
    type,
    direction,
    content
  )
  VALUES (
    (SELECT id FROM workspaces LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM crm_leads LIMIT 1),
    'note',
    'internal',
    'Lead-only conversation test'
  );

SELECT lives_ok(
  'lead_only_conversation',
  'Allows conversation with lead_id only'
);

-- Test: Should allow conversation with only pipeline_id
PREPARE pipeline_only_conversation AS
  INSERT INTO conversation_items (
    workspace_id,
    user_id,
    pipeline_id,
    type,
    direction,
    content
  )
  VALUES (
    (SELECT id FROM workspaces LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM re_pipeline LIMIT 1),
    'note',
    'internal',
    'Pipeline-only conversation test'
  );

SELECT lives_ok(
  'pipeline_only_conversation',
  'Allows conversation with pipeline_id only'
);

-- Test: Should allow conversation with both lead_id AND pipeline_id
PREPARE both_parents_conversation AS
  INSERT INTO conversation_items (
    workspace_id,
    user_id,
    lead_id,
    pipeline_id,
    type,
    direction,
    content
  )
  VALUES (
    (SELECT id FROM workspaces LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM crm_leads LIMIT 1),
    (SELECT id FROM re_pipeline LIMIT 1),
    'note',
    'internal',
    'Both parents conversation test'
  );

SELECT lives_ok(
  'both_parents_conversation',
  'Allows conversation with both lead_id and pipeline_id (for deals linked to leads)'
);

-- ============================================================================
-- TEST 3: TWILIO MESSAGE SID UNIQUE CONSTRAINT (Deduplication)
-- ============================================================================

SELECT has_index(
  'public', 'conversation_items', 'idx_conversation_items_twilio_sid',
  'conversation_items has unique index on twilio_message_sid'
);

-- Insert conversation with twilio_message_sid
PREPARE first_twilio_message AS
  INSERT INTO conversation_items (
    workspace_id,
    user_id,
    lead_id,
    type,
    direction,
    content,
    twilio_message_sid
  )
  VALUES (
    (SELECT id FROM workspaces LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    (SELECT id FROM crm_leads LIMIT 1),
    'sms',
    'inbound',
    'First SMS',
    'SM_TEST_UNIQUE_' || gen_random_uuid()::TEXT
  )
  RETURNING twilio_message_sid;

SELECT lives_ok(
  'first_twilio_message',
  'Can insert conversation with unique twilio_message_sid'
);

-- Try to insert duplicate twilio_message_sid
DO $$
DECLARE
  existing_sid TEXT;
BEGIN
  SELECT twilio_message_sid INTO existing_sid
  FROM conversation_items
  WHERE twilio_message_sid IS NOT NULL
  LIMIT 1;

  IF existing_sid IS NOT NULL THEN
    EXECUTE format(
      'PREPARE duplicate_twilio_message AS
        INSERT INTO conversation_items (
          workspace_id, user_id, lead_id, type, direction, content, twilio_message_sid
        )
        VALUES (
          (SELECT id FROM workspaces LIMIT 1),
          (SELECT id FROM auth.users LIMIT 1),
          (SELECT id FROM crm_leads LIMIT 1),
          ''sms'',
          ''inbound'',
          ''Duplicate SMS'',
          %L
        )', existing_sid);
  END IF;
END $$;

SELECT throws_ok(
  'duplicate_twilio_message',
  '23505', -- unique_violation
  NULL,
  'Rejects duplicate twilio_message_sid (deduplication works)'
);

-- ============================================================================
-- TEST 4: RLS POLICIES EXIST
-- ============================================================================

SELECT ok(
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'conversation_items') >= 4,
  'conversation_items has at least 4 RLS policies (SELECT, INSERT, UPDATE, DELETE)'
);

-- Verify each policy type exists
SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_items' AND cmd = 'SELECT'),
  'conversation_items has SELECT policy'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_items' AND cmd = 'INSERT'),
  'conversation_items has INSERT policy'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_items' AND cmd = 'UPDATE'),
  'conversation_items has UPDATE policy'
);

SELECT ok(
  EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_items' AND cmd = 'DELETE'),
  'conversation_items has DELETE policy'
);

-- ============================================================================
-- CLEANUP
-- ============================================================================

-- Cleanup test data
DELETE FROM conversation_items WHERE content LIKE '%conversation test';
DELETE FROM conversation_items WHERE content IN ('First SMS', 'Duplicate SMS');

SELECT finish();
ROLLBACK;
