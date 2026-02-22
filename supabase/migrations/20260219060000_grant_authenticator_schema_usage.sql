-- PostgREST connects as authenticator, then SET LOCAL ROLE to the JWT role.
-- Schema resolution (Content-Profile/Accept-Profile headers) happens at the
-- authenticator level. Without USAGE, PostgREST silently ignores profile
-- headers and falls back to schema-list ordering — causing wrong-table inserts
-- when multiple schemas have identically-named tables (e.g. "messages").

GRANT USAGE ON SCHEMA investor TO authenticator;
GRANT USAGE ON SCHEMA landlord TO authenticator;
GRANT USAGE ON SCHEMA crm TO authenticator;
GRANT USAGE ON SCHEMA ai TO authenticator;
GRANT USAGE ON SCHEMA integrations TO authenticator;
GRANT USAGE ON SCHEMA claw TO authenticator;
GRANT USAGE ON SCHEMA callpilot TO authenticator;

-- Drop stale workaround RPC that is no longer needed
DROP FUNCTION IF EXISTS public.insert_crm_message;

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
