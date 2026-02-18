# Zone A: Quick Reference Guide

Quick commands and workflows for Zone A backend operations.

---

## Initial Setup

### One-Time Setup (Complete Backend Deployment)

```bash
# Run complete Zone A setup (migrations + functions + tests)
./scripts/setup-zone-a.sh production
```

This single command:
- Applies all database migrations (Phases 1-5, Sprints 1-4)
- Deploys all 5 edge functions
- Runs pgTAP tests
- Generates TypeScript types

---

## Local Development

### Start Local Supabase

```bash
# Start local Supabase (includes PostgreSQL, Auth, Storage, Edge Runtime)
supabase start

# Check status
supabase status

# Stop local instance
supabase stop
```

### Test Functions Locally

```bash
# Test all functions against local instance
./scripts/test-functions-local.sh

# Or test individual function
curl -X POST 'http://localhost:54321/functions/v1/integration-health' \
  -H "Authorization: Bearer <local-anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"service": "openai"}'
```

### View Local Logs

```bash
# Follow logs for specific function
supabase functions logs integration-health --follow

# View logs without following
supabase functions logs sms-webhook
```

---

## Database Operations

### Run Migrations

```bash
# Apply all pending migrations
supabase db push

# Create new migration
supabase migration new <migration_name>

# Reset database (WARNING: Deletes all data)
supabase db reset
```

### Generate TypeScript Types

```bash
# Generate types from current database schema
supabase gen types typescript --linked > src/integrations/supabase/types/database.ts

# Commit to repo
git add src/integrations/supabase/types/database.ts
git commit -m "chore: regenerate database types"
```

### Run Database Tests

```bash
# Run all pgTAP tests
bash supabase/tests/run_all_tests.sh

# Run specific test
psql <database-url> -f supabase/tests/database/01_rls_policies_test.sql
```

### Query System Logs

```sql
-- Check recent errors
SELECT level, source, message, created_at
FROM system_logs
WHERE level IN ('error', 'critical')
ORDER BY created_at DESC
LIMIT 20;

-- Check function execution logs
SELECT *
FROM system_logs
WHERE source LIKE '%scheduled-reminders%'
ORDER BY created_at DESC;

-- Check integration health
SELECT service, status, last_checked, metadata
FROM api_keys
WHERE service IN ('openai', 'stripe', 'twilio');
```

---

## Edge Functions

### Deploy Functions

```bash
# Deploy all functions
./scripts/deploy-edge-functions.sh production

# Deploy single function
supabase functions deploy <function-name>

# Deploy without JWT verification (for webhooks)
supabase functions deploy sms-webhook --no-verify-jwt
```

### Test Deployed Functions

```bash
# Test all functions
./scripts/test-edge-functions.sh <project-id> <anon-key>

# Test specific function
curl -X POST 'https://<project-id>.supabase.co/functions/v1/integration-health' \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"service": "openai"}'
```

### Monitor Functions

```bash
# Follow function logs in real-time
supabase functions logs <function-name> --follow

# View recent logs
supabase functions logs <function-name> --limit 50

# Filter by level
supabase functions logs <function-name> --level error
```

### Update Environment Variables

```bash
# Set environment variable for all functions
supabase secrets set ENVIRONMENT=production

# View all secrets (values hidden)
supabase secrets list

# Delete secret
supabase secrets unset SECRET_NAME
```

---

## Testing Workflows

### Before Deploying to Production

```bash
# 1. Test locally
supabase start
./scripts/test-functions-local.sh

# 2. Run database tests
bash supabase/tests/run_all_tests.sh

# 3. Check for linting/type errors
npm run typecheck

# 4. Deploy to staging first
./scripts/deploy-edge-functions.sh staging

# 5. Test staging deployment
./scripts/test-edge-functions.sh <staging-project-id> <staging-anon-key>

# 6. Deploy to production
./scripts/deploy-edge-functions.sh production
```

### After Deployment

```bash
# 1. Verify functions are running
supabase functions list

# 2. Test each function
./scripts/test-edge-functions.sh <project-id> <anon-key>

# 3. Monitor logs for errors
supabase functions logs integration-health --follow &
supabase functions logs stripe-api --follow &
supabase functions logs openai --follow &
supabase functions logs sms-webhook --follow &
supabase functions logs scheduled-reminders --follow &

# 4. Check system logs in database
psql <database-url> -c "SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 20;"
```

---

## Common Troubleshooting

### Function Returns 401 Unauthorized

```bash
# Check anon key is correct
supabase status | grep "anon key"

# Verify Authorization header format
# Should be: Authorization: Bearer <anon-key>
```

### Function Returns CORS Error

```bash
# Check environment variable is set
supabase secrets list | grep ENVIRONMENT

# For development, ensure origin is in allowed list
# For production, ensure production domain is allowed
```

### Migration Fails

```bash
# View detailed error
supabase db push --debug

# Rollback last migration
psql <database-url> -f supabase/migrations/<timestamp>_<name>_ROLLBACK.sql

# Reset and try again
supabase db reset
supabase db push
```

### SMS Webhook Not Processing

```bash
# 1. Check function logs
supabase functions logs sms-webhook --level error

# 2. Verify OpenAI API key is in database
psql <database-url> -c "SELECT service, status FROM api_keys WHERE service LIKE '%openai%';"

# 3. Check sms_inbox table
psql <database-url> -c "SELECT * FROM sms_inbox ORDER BY created_at DESC LIMIT 5;"

# 4. Test webhook manually
curl -X POST 'https://<project-id>.supabase.co/functions/v1/sms-webhook' \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "From=+15555551234" \
  --data-urlencode "Body=Test message" \
  --data-urlencode "MessageSid=SM12345"
```

### Scheduled Reminders Not Running

```bash
# 1. Check cron job is scheduled
psql <database-url> -c "SELECT * FROM cron.job WHERE jobname LIKE '%reminder%';"

# 2. Check cron execution history
psql <database-url> -c "SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;"

# 3. Test function manually
curl -X POST 'https://<project-id>.supabase.co/functions/v1/scheduled-reminders' \
  -H "Authorization: Bearer <service-role-key>"

# 4. Check notifications were created
psql <database-url> -c "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10;"
```

### RLS Policy Blocking Query

```bash
# 1. Check which policy is blocking
# Look for "permission denied" in logs

# 2. Test policy with specific user
# In SQL editor, set auth context:
# SET request.jwt.claims.sub = '<user-id>';
# Then run your query

# 3. Verify user has correct role
psql <database-url> -c "SELECT id, email, role FROM profiles WHERE id = '<user-id>';"

# 4. Temporarily disable RLS for debugging (dev only!)
# ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
```

---

## Useful Queries

### Check Database Health

```sql
-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Slow queries (requires pg_stat_statements)
SELECT
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Check RLS Policies

```sql
-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check Constraints

```sql
-- List all CHECK constraints
SELECT
  conname as constraint_name,
  conrelid::regclass as table_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE contype = 'c'
ORDER BY conrelid::regclass::text;

-- List all UNIQUE constraints
SELECT
  conname,
  conrelid::regclass,
  pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'u'
ORDER BY conrelid::regclass::text;
```

---

## Emergency Procedures

### Rollback Migration

```bash
# Find the migration to rollback
ls -la supabase/migrations/*_ROLLBACK.sql

# Run rollback
psql <database-url> -f supabase/migrations/<timestamp>_<name>_ROLLBACK.sql

# Verify rollback
psql <database-url> -c "SELECT * FROM system_logs WHERE source = 'migration-rollback' ORDER BY created_at DESC LIMIT 1;"
```

### Disable Function Temporarily

```bash
# Delete function
supabase functions delete <function-name>

# Or update to return maintenance message
# Edit function to return:
# return new Response(
#   JSON.stringify({error: "Maintenance in progress"}),
#   {status: 503}
# )
```

### Emergency Database Access

```bash
# Get database URL
supabase status | grep "DB URL"

# Connect with psql
psql "<connection-string>"

# Or use Supabase Studio
open https://app.supabase.com/project/<project-id>/editor
```

---

## Cron Job Management

### View Scheduled Jobs

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Check recent executions
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Update Cron Schedule

```sql
-- Unschedule existing job
SELECT cron.unschedule('daily-deal-reminders');

-- Reschedule with new time
SELECT cron.schedule(
  'daily-deal-reminders',
  '0 9 * * *',  -- 9am instead of 8am
  $$
    SELECT net.http_post(
      url := 'https://<project-id>.supabase.co/functions/v1/scheduled-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      )
    );
  $$
);
```

---

## Performance Monitoring

### Query Performance

```sql
-- Enable query statistics (if not enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slowest queries
SELECT
  substring(query, 1, 50) as query_snippet,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Function Performance

```bash
# View function execution times in logs
supabase functions logs <function-name> | grep "execution time"

# Monitor function invocations
# Check system_logs table for function-specific metrics
```

### Database Connections

```sql
-- Current connections
SELECT
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query
FROM pg_stat_activity
WHERE datname = current_database();

-- Connection pool stats
SELECT
  numbackends,
  xact_commit,
  xact_rollback,
  blks_read,
  blks_hit
FROM pg_stat_database
WHERE datname = current_database();
```

---

## Documentation Links

- **Complete Deployment Guide**: `EDGE_FUNCTION_DEPLOYMENT.md`
- **Database Schema**: `docs/DATABASE_SCHEMA.md`
- **Security Model**: `docs/RLS_SECURITY_MODEL.md`
- **Naming Conventions**: `docs/DATABASE_NAMING_CONVENTIONS.md`
- **Final Summary**: `ZONE_A_FINAL_SUMMARY.md`

---

## Support

If you encounter issues:

1. Check function logs: `supabase functions logs <name>`
2. Check system_logs table in database
3. Review RLS policies if permission errors
4. Verify environment variables are set
5. Test locally with `./scripts/test-functions-local.sh`
6. Check rollback scripts if migration fails
