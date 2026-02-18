# Production Runbook

## Overview

This runbook contains step-by-step procedures for common operational tasks. Each procedure includes prerequisites, steps, verification, and rollback instructions.

## Table of Contents

1. [Database Operations](#database-operations)
2. [Deployment Operations](#deployment-operations)
3. [User Management](#user-management)
4. [Cache Management](#cache-management)
5. [Monitoring and Diagnostics](#monitoring-and-diagnostics)
6. [Emergency Procedures](#emergency-procedures)
7. [Scheduled Maintenance](#scheduled-maintenance)

---

## Database Operations

### Database Backup

**When**: Daily (automated) or before major changes (manual)
**Duration**: 5-10 minutes
**Risk**: Low

**Prerequisites:**
- Database access credentials
- AWS CLI configured
- Sufficient disk space

**Steps:**

```bash
# 1. Set variables
export BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
export BACKUP_DIR="/tmp/backups"
export DB_HOST="db.your-project.supabase.co"
export DB_USER="postgres"
export DB_NAME="postgres"

# 2. Create backup directory
mkdir -p $BACKUP_DIR

# 3. Perform backup
pg_dump \
  --host=$DB_HOST \
  --port=5432 \
  --username=$DB_USER \
  --format=custom \
  --file="$BACKUP_DIR/backup_$BACKUP_DATE.dump" \
  $DB_NAME

# 4. Compress backup
gzip "$BACKUP_DIR/backup_$BACKUP_DATE.dump"

# 5. Upload to S3
aws s3 cp \
  "$BACKUP_DIR/backup_$BACKUP_DATE.dump.gz" \
  "s3://your-backup-bucket/database/$BACKUP_DATE.dump.gz"

# 6. Verify upload
aws s3 ls "s3://your-backup-bucket/database/$BACKUP_DATE.dump.gz"

# 7. Clean up local file
rm "$BACKUP_DIR/backup_$BACKUP_DATE.dump.gz"
```

**Verification:**

```bash
# Check backup exists in S3
aws s3 ls s3://your-backup-bucket/database/ | grep $BACKUP_DATE

# Verify backup size (should be > 0)
aws s3 ls s3://your-backup-bucket/database/$BACKUP_DATE.dump.gz --summarize

# Test backup integrity
aws s3 cp "s3://your-backup-bucket/database/$BACKUP_DATE.dump.gz" /tmp/test.dump.gz
gunzip /tmp/test.dump.gz
pg_restore --list /tmp/test.dump > /dev/null && echo "Backup is valid"
rm /tmp/test.dump
```

**Alerts:**
- Slack: #ops-backups
- Email: ops-team@yourdomain.com

---

### Restore Database

**When**: Data corruption, accidental deletion, disaster recovery
**Duration**: 30-60 minutes
**Risk**: Critical - causes downtime

**Prerequisites:**
- Valid backup file
- Database access
- Stakeholder approval
- Maintenance mode enabled

**Steps:**

```bash
# 1. ENABLE MAINTENANCE MODE
# Update app to show maintenance screen

# 2. Notify stakeholders
echo "Database restore in progress - $(date)" | \
  slack-cli -c "#incidents" -m -

# 3. List available backups
aws s3 ls s3://your-backup-bucket/database/ | tail -10

# 4. Choose backup to restore
export BACKUP_FILE="20260207_120000.dump.gz"

# 5. Download backup
aws s3 cp \
  "s3://your-backup-bucket/database/$BACKUP_FILE" \
  /tmp/restore.dump.gz

# 6. Decompress
gunzip /tmp/restore.dump.gz

# 7. Create backup of current state (safety)
pg_dump \
  --host=$DB_HOST \
  --username=$DB_USER \
  --format=custom \
  --file="/tmp/pre_restore_backup.dump" \
  $DB_NAME

# 8. Terminate active connections
psql -h $DB_HOST -U $DB_USER -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# 9. Restore database
pg_restore \
  --host=$DB_HOST \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  /tmp/restore.dump

# 10. Verify critical tables
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT 'users' as table, count(*) as count FROM users
   UNION ALL
   SELECT 'tasks', count(*) FROM tasks
   UNION ALL
   SELECT 'sessions', count(*) FROM sessions;"

# 11. Run migrations (if needed)
npx supabase migration up

# 12. DISABLE MAINTENANCE MODE
# Update app to normal operation

# 13. Monitor for 1 hour
# Watch error rates, user reports
```

**Verification:**

```bash
# 1. Check table counts match expected
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT count(*) FROM users;"

# 2. Verify recent data exists
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT created_at FROM tasks ORDER BY created_at DESC LIMIT 5;"

# 3. Test authentication
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. Check Sentry for new errors
# Visit: https://sentry.io/organizations/your-org/issues/
```

**Rollback:**

```bash
# If restore fails or causes issues:

# 1. Restore from pre-restore backup
pg_restore \
  --host=$DB_HOST \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --clean \
  /tmp/pre_restore_backup.dump

# 2. Verify system is back to pre-restore state
# 3. Notify stakeholders of rollback
# 4. Investigate restore failure
```

---

### Run Database Migration

**When**: Schema changes, new features
**Duration**: 5-30 minutes
**Risk**: Medium

**Prerequisites:**
- Migration files created and tested
- Database backup completed
- Staging tested successfully

**Steps:**

```bash
# 1. Backup database first
./scripts/backup/backup-database.sh

# 2. Review migration
cat supabase/migrations/20260207_add_user_preferences.sql

# 3. Test migration in transaction
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
BEGIN;
\i supabase/migrations/20260207_add_user_preferences.sql
-- Review changes
SELECT * FROM information_schema.tables WHERE table_name = 'user_preferences';
ROLLBACK;
EOF

# 4. Apply migration
npx supabase migration up

# 5. Verify migration applied
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT * FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 5;"
```

**Verification:**

```bash
# 1. Check table exists
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt user_preferences"

# 2. Verify columns
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\d user_preferences"

# 3. Test insert
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "INSERT INTO user_preferences (user_id, theme) VALUES ('test-user', 'dark') RETURNING *;"

# 4. Test app functionality
# Manually test affected features
```

**Rollback:**

```bash
# Create rollback migration
cat > supabase/migrations/20260207_rollback_user_preferences.sql << 'EOF'
DROP TABLE IF EXISTS user_preferences CASCADE;
EOF

# Apply rollback
npx supabase migration up
```

---

## Deployment Operations

### Deploy New Version

**When**: New features, bug fixes
**Duration**: 30-45 minutes
**Risk**: Medium

**Prerequisites:**
- Code merged to main branch
- CI/CD tests passing
- Staging tested
- Release notes prepared

**Steps:**

```bash
# 1. Update version
npm version patch  # or minor, major

# 2. Create release tag
export VERSION=$(node -p "require('./package.json').version")
git tag -a "v$VERSION" -m "Release v$VERSION"
git push origin "v$VERSION"

# 3. Build for production
eas build --platform all --profile production

# 4. Wait for builds to complete
eas build:list --limit 2

# 5. Test builds locally
# Download and test on physical devices

# 6. Submit to stores
eas submit --platform ios --latest
eas submit --platform android --latest

# 7. Monitor submission status
eas submit:list --limit 2

# 8. Enable staged rollout (iOS: 1%, Android: 5%)
# iOS: App Store Connect > Phased Release
# Android: Play Console > Staged Rollout

# 9. Monitor metrics
# - Crash rate
# - Error rate
# - User reports
# - App Store reviews

# 10. Increase rollout if stable
# Day 1: 1% → 5%
# Day 2: 5% → 10%
# Day 3: 10% → 25%
# Day 4: 25% → 50%
# Day 5: 50% → 100%
```

**Verification:**

```bash
# 1. Check app version in stores
# iOS: App Store
# Android: Play Console

# 2. Monitor Sentry for crashes
# https://sentry.io/organizations/your-org/issues/

# 3. Check metrics dashboard
# - Active users
# - Crash-free rate
# - API error rate

# 4. Review user feedback
# - App Store reviews
# - Support tickets
# - Social media mentions
```

**Rollback:**

```bash
# Option 1: Halt rollout
# iOS: Pause Phased Release in App Store Connect
# Android: Halt rollout in Play Console

# Option 2: Release hotfix
npm version patch
# Fix critical bug
git commit -am "fix: critical bug"
git push
# Follow deployment steps with expedited review
```

---

### Rollback Deployment

**When**: Critical bugs, high crash rate
**Duration**: 15-30 minutes
**Risk**: High

**Steps:**

```bash
# 1. Halt current rollout
# iOS: App Store Connect > Pause Phased Release
# Android: Play Console > Halt Rollout

# 2. Identify last stable version
eas build:list --limit 10

# 3. Re-submit previous version
export PREVIOUS_BUILD_ID="abc123"
eas submit --platform ios --id $PREVIOUS_BUILD_ID
eas submit --platform android --id $PREVIOUS_BUILD_ID

# 4. Request expedited review
# iOS: Request through App Store Connect
# Android: Usually auto-approved

# 5. Notify users
cat > user_notification.md << 'EOF'
We've identified an issue in the latest update.
We're rolling back to the previous version while we fix it.
You may be asked to update again shortly.
EOF

# Send via:
# - In-app notification
# - Email
# - Status page

# 6. Monitor metrics after rollback
# Verify crash rate returns to normal
```

---

## User Management

### Reset User Password

**When**: User locked out, forgot password
**Duration**: 2 minutes
**Risk**: Low

**Prerequisites:**
- User verification completed
- Support ticket created

**Steps:**

```bash
# Via Supabase Dashboard:
# 1. Go to Authentication > Users
# 2. Find user by email
# 3. Click "..." > Reset Password
# 4. User receives password reset email

# Via SQL:
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
-- Generate password reset token
SELECT auth.send_reset_password_email('user@example.com');
EOF

# 5. Confirm with user
# 6. Update support ticket
```

**Verification:**

```bash
# User should receive email within 5 minutes
# Check email delivery logs

# User successfully logs in with new password
```

---

### Delete User Data (GDPR Request)

**When**: User requests data deletion
**Duration**: 10-15 minutes
**Risk**: Medium (irreversible)

**Prerequisites:**
- User identity verified
- Legal approval obtained
- Compliance checklist completed
- 30-day grace period passed

**Steps:**

```bash
# 1. Export user data first (for records)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
\copy (SELECT * FROM users WHERE email = 'user@example.com') TO '/tmp/user_data.csv' CSV HEADER
\copy (SELECT * FROM tasks WHERE user_id IN (SELECT id FROM users WHERE email = 'user@example.com')) TO '/tmp/user_tasks.csv' CSV HEADER
EOF

# 2. Compress and archive
tar -czf "/tmp/user_deletion_$(date +%Y%m%d).tar.gz" /tmp/user_*.csv
aws s3 cp "/tmp/user_deletion_$(date +%Y%m%d).tar.gz" \
  "s3://your-legal-bucket/gdpr-deletions/"

# 3. Delete user data
psql -h $DB_HOST -U $DB_USER -d $DB_NAME << 'EOF'
BEGIN;

-- Delete user's tasks
DELETE FROM tasks WHERE user_id IN (
  SELECT id FROM users WHERE email = 'user@example.com'
);

-- Delete user's sessions
DELETE FROM auth.sessions WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- Delete user account
DELETE FROM auth.users WHERE email = 'user@example.com';

-- Verify deletion
SELECT count(*) FROM auth.users WHERE email = 'user@example.com';
-- Should return 0

COMMIT;
EOF

# 4. Update support ticket
# 5. Send confirmation email to user
```

**Verification:**

```bash
# 1. Verify user cannot log in
curl -X POST https://api.yourdomain.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"any"}'
# Should return error

# 2. Verify data deleted
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT count(*) FROM users WHERE email = 'user@example.com';"
# Should return 0

# 3. Verify archived data exists
aws s3 ls "s3://your-legal-bucket/gdpr-deletions/"
```

---

## Cache Management

### Clear App Cache

**When**: Stale data issues, troubleshooting
**Duration**: Immediate
**Risk**: Low

**Remote Cache Clear:**

```bash
# Update remote config to trigger cache clear
# This will affect all users on next app open

curl -X POST https://api.yourdomain.com/admin/cache/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scope":"all"}'

# Or clear specific cache
curl -X POST https://api.yourdomain.com/admin/cache/clear \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"scope":"tasks"}'
```

**Individual User Cache Clear:**

```typescript
// Add support command in app
async function clearUserCache() {
  await AsyncStorage.clear();
  await queryClient.clear();
  Alert.alert('Cache cleared', 'Please restart the app');
}
```

---

### Clear CDN Cache

**When**: Asset updates, image changes
**Duration**: 5-10 minutes
**Risk**: Low

**Steps:**

```bash
# CloudFlare purge
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything":true}'

# Or purge specific files
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"files":["https://cdn.yourdomain.com/logo.png"]}'

# Verify cache cleared
curl -I https://cdn.yourdomain.com/logo.png | grep -i "cf-cache-status"
# Should show MISS on first request, HIT on subsequent
```

---

## Monitoring and Diagnostics

### Check System Health

**When**: Regular checks, troubleshooting
**Duration**: 2 minutes
**Risk**: None

**Steps:**

```bash
# 1. Check API health
curl https://api.yourdomain.com/health

# 2. Check database connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT count(*) as active_connections, state
   FROM pg_stat_activity
   GROUP BY state;"

# 3. Check error rate (Sentry)
curl "https://sentry.io/api/0/organizations/your-org/stats_v2/" \
  -H "Authorization: Bearer $SENTRY_TOKEN"

# 4. Check app metrics
curl https://api.yourdomain.com/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected output:
# {
#   "activeUsers": 1234,
#   "requestsPerMinute": 567,
#   "errorRate": 0.001,
#   "avgResponseTime": 150
# }
```

---

### Analyze Slow Queries

**When**: Performance issues
**Duration**: 10-15 minutes
**Risk**: None

**Steps:**

```bash
# 1. Enable query logging (if not already enabled)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "ALTER DATABASE $DB_NAME SET log_min_duration_statement = 1000;"

# 2. Find slow queries
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;"

# 3. Explain slow query
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "EXPLAIN ANALYZE
   SELECT * FROM tasks WHERE user_id = 'abc123';"

# 4. Add missing indexes
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "CREATE INDEX CONCURRENTLY idx_tasks_user_id ON tasks(user_id);"
```

---

### Investigate High Memory Usage

**When**: App crashes, performance issues
**Duration**: 15-20 minutes
**Risk**: None

**Steps:**

```bash
# 1. Check database memory
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT
    pg_size_pretty(pg_database_size('$DB_NAME')) as db_size,
    pg_size_pretty(pg_total_relation_size('tasks')) as tasks_size,
    pg_size_pretty(pg_total_relation_size('users')) as users_size;"

# 2. Check for connection leaks
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT
    client_addr,
    count(*) as connections
   FROM pg_stat_activity
   WHERE datname = '$DB_NAME'
   GROUP BY client_addr
   ORDER BY connections DESC;"

# 3. Check for long-running queries
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT
    pid,
    now() - query_start as duration,
    state,
    query
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY duration DESC
   LIMIT 10;"

# 4. Kill long-running query (if needed)
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT pg_terminate_backend(12345);"  # Replace with actual PID
```

---

## Emergency Procedures

### Emergency App Disable

**When**: Critical security vulnerability, data breach
**Duration**: 5 minutes
**Risk**: High (users locked out)

**Steps:**

```bash
# 1. Enable maintenance mode via remote config
curl -X POST https://api.yourdomain.com/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "message": "Emergency maintenance in progress. We will be back shortly."
  }'

# 2. Verify maintenance mode
curl https://api.yourdomain.com/health
# Should return maintenance message

# 3. Notify stakeholders
echo "EMERGENCY: App disabled - $(date)" | \
  slack-cli -c "#incidents" -m -

# 4. Update status page
# https://status.yourdomain.com

# 5. Send push notification to users
curl -X POST https://api.yourdomain.com/admin/notifications/send \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Temporary Maintenance",
    "body": "We are performing emergency maintenance. Thank you for your patience.",
    "priority": "high"
  }'
```

**Re-enable:**

```bash
# After issue resolved
curl -X POST https://api.yourdomain.com/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

### Kill All Database Connections

**When**: Database migration, emergency maintenance
**Duration**: 1 minute
**Risk**: Medium (interrupts active users)

**Steps:**

```bash
# 1. Warn users (5 minute warning)
# Send in-app notification

# 2. Wait 5 minutes

# 3. Kill all connections except current
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = '$DB_NAME'
   AND pid <> pg_backend_pid();"

# 4. Verify no connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';"
# Should return 1 (your connection)

# 5. Perform maintenance

# 6. Re-enable connections
# (connections automatically allowed after operations)
```

---

## Scheduled Maintenance

### Monthly Maintenance Checklist

**When**: First Sunday of each month, 2:00 AM PST
**Duration**: 2 hours
**Risk**: Medium

**Pre-Maintenance (T-72 hours):**

```bash
# 1. Notify users
curl -X POST https://api.yourdomain.com/admin/notifications/schedule \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "scheduledFor": "2026-03-02T02:00:00Z",
    "title": "Scheduled Maintenance",
    "body": "We will be performing scheduled maintenance on Sunday, March 2nd at 2:00 AM PST. Expected duration: 2 hours."
  }'

# 2. Update status page
# 3. Send email to all users
# 4. Update in-app banner

# 5. Create maintenance plan document
cat > maintenance_plan_$(date +%Y%m%d).md << 'EOF'
# Maintenance Plan - [Date]

## Tasks
- [ ] Database backup
- [ ] Apply pending migrations
- [ ] Update dependencies
- [ ] Rotate credentials
- [ ] Clear old logs
- [ ] Optimize database
- [ ] Update SSL certificates (if needed)

## Rollback Plan
- Backup created before each step
- Documented rollback procedure for each task

## Success Criteria
- All tests pass
- Error rate < 0.1%
- Response time < 500ms p95
EOF
```

**During Maintenance (T-0):**

```bash
#!/bin/bash
# maintenance.sh

set -e  # Exit on error

echo "=== Maintenance Started: $(date) ===" >> maintenance.log

# 1. Enable maintenance mode
curl -X POST https://api.yourdomain.com/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": true}' >> maintenance.log

# 2. Backup database
./scripts/backup/backup-database.sh >> maintenance.log

# 3. Apply migrations
npx supabase migration up >> maintenance.log

# 4. Update dependencies
npm update >> maintenance.log

# 5. Rotate credentials
./scripts/security/rotate-credentials.sh >> maintenance.log

# 6. Clear old logs
find /var/log/app -name "*.log" -mtime +30 -delete

# 7. Optimize database
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "VACUUM ANALYZE;" >> maintenance.log

# 8. Run smoke tests
npm run test:smoke >> maintenance.log

# 9. Disable maintenance mode
curl -X POST https://api.yourdomain.com/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": false}' >> maintenance.log

echo "=== Maintenance Completed: $(date) ===" >> maintenance.log
```

**Post-Maintenance (T+1 hour):**

```bash
# 1. Monitor metrics
watch -n 60 'curl https://api.yourdomain.com/metrics'

# 2. Check error rates
# Sentry dashboard

# 3. Review user reports
# Support ticket system

# 4. Update status page
# "All systems operational"

# 5. Send completion email
# "Scheduled maintenance completed successfully"
```

---

## Troubleshooting Guide

### Common Issues

**Issue: High Database Connection Count**

```bash
# Check connections
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Solution: Enable connection pooling
# Update Supabase client to use pooler
```

**Issue: Slow API Responses**

```bash
# Check slow queries
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"

# Solution: Add indexes, optimize queries
```

**Issue: High Memory Usage**

```bash
# Check database size
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \
  "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));"

# Solution: Archive old data, optimize tables
```

---

## Escalation Matrix

| Issue Type | Primary Contact | Escalation 1 | Escalation 2 |
|------------|-----------------|--------------|--------------|
| Database | DBA On-Call | Engineering Lead | CTO |
| Security | Security Team | CISO | CTO |
| Infrastructure | DevOps On-Call | Infrastructure Lead | CTO |
| Application | Dev On-Call | Engineering Lead | CTO |

**Contact Methods:**
- PagerDuty: Automatic notification
- Slack: #incidents channel
- Phone: On-call schedule

---

## Related Documentation

- [Production Operations](./PRODUCTION-OPERATIONS.md)
- [Incident Response](./INCIDENT-RESPONSE.md)
- [Security Checklist](../09-security/SECURITY-CHECKLIST.md)
- [Database Guide](../03-database/DATABASE-GUIDE.md)
