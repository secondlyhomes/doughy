# Database Backup & Recovery Scripts

## Overview

This directory contains scripts for backing up, verifying, and restoring the Supabase PostgreSQL database. These scripts are critical for disaster recovery and data protection.

## Scripts

### backup-database.sh

Performs automated backups of the database with compression and S3 upload.

**Features:**
- Full and incremental backups
- Automatic compression (gzip)
- S3 upload with versioning
- Backup verification
- Automatic retention management
- Slack/email notifications
- Detailed logging

**Usage:**

```bash
# Full backup (default)
./scripts/backup/backup-database.sh

# Incremental backup
./scripts/backup/backup-database.sh --incremental

# With custom configuration
DB_HOST=custom-db.supabase.co \
S3_BUCKET=my-backups \
RETENTION_DAYS=60 \
./scripts/backup/backup-database.sh
```

**Environment Variables:**

```bash
# Database connection
export DB_HOST="db.your-project.supabase.co"
export DB_PORT="5432"
export DB_USER="postgres"
export DB_PASSWORD="your-password"
export DB_NAME="postgres"

# S3 configuration
export S3_BUCKET="your-backup-bucket"
export S3_PREFIX="database"

# Retention
export RETENTION_DAYS="30"          # S3 retention
export LOCAL_RETENTION_DAYS="7"     # Local retention

# Notifications
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export NOTIFICATION_EMAIL="ops@yourdomain.com"
```

**Schedule:**

```bash
# Add to crontab for automated backups
# Daily full backup at 2 AM
0 2 * * * /path/to/scripts/backup/backup-database.sh

# Incremental every 6 hours
0 */6 * * * /path/to/scripts/backup/backup-database.sh --incremental
```

---

### restore-database.sh

Restores database from backup with safety checks and verification.

**Features:**
- Pre-restore backup creation
- Restore to temporary database
- Data verification before swap
- Database swap with rollback capability
- Detailed logging and reporting
- Approval gates for safety

**Usage:**

```bash
# Restore from specific backup
./scripts/backup/restore-database.sh full_backup_20260207_120000.dump.gz

# Restore from S3
./scripts/backup/restore-database.sh full_backup_20260207_120000.dump.gz

# Point-in-time recovery (if supported)
./scripts/backup/restore-database.sh full_backup_20260207_120000.dump.gz --target-time 2026-02-07
```

**Safety Features:**

1. **Approval Required**: Script requires typing "RESTORE" and "SWAP" to proceed
2. **Pre-Restore Backup**: Creates backup before restore
3. **Temporary Database**: Restores to temp DB first
4. **Verification**: Checks data integrity before swap
5. **Rollback**: Can rollback to pre-restore state if needed

**Restore Process:**

```
1. Request approval → User types "RESTORE"
2. Create pre-restore backup → Saved to S3
3. Download backup from S3 → Local temp directory
4. Verify backup integrity → Check file and format
5. Create temporary database → restore_temp_YYYYMMDD_HHMMSS
6. Restore to temp database → pg_restore
7. Verify restored data → Check tables and counts
8. Request swap approval → User types "SWAP"
9. Swap databases → production ↔ temp
10. Run post-restore checks → Verify functionality
11. Generate report → Log results
```

**Rollback:**

If issues are discovered after restore:

```bash
# The old database is kept as ${DB_NAME}_old
# To rollback:

psql -h $DB_HOST -U $DB_USER -d postgres -c "
  ALTER DATABASE postgres RENAME TO postgres_broken;
  ALTER DATABASE postgres_old RENAME TO postgres;
"
```

---

### verify-backup.sh

Verifies backup integrity and completeness without restoring to production.

**Features:**
- File integrity checks
- Format validation
- Critical table verification
- Data completeness checks
- Production comparison
- Automated reporting

**Usage:**

```bash
# Verify latest backup
./scripts/backup/verify-backup.sh

# Verify specific backup
./scripts/backup/verify-backup.sh full_backup_20260207_120000.dump.gz

# Verify from S3
./scripts/backup/verify-backup.sh full_backup_20260207_120000.dump.gz
```

**Verification Checks:**

1. **File Integrity**
   - File exists and is not empty
   - File size is reasonable (> 1KB)
   - Gzip compression is valid

2. **Backup Format**
   - pg_dump format is valid
   - Can list backup contents
   - Contains expected objects

3. **Critical Tables**
   - All critical tables present (users, tasks, sessions)
   - Tables contain data

4. **Data Completeness**
   - Restores to test database
   - Verifies row counts
   - Checks for NULL in required fields
   - Compares with production

5. **Metadata**
   - Backup age is reasonable (< 48 hours)
   - S3 metadata is present

**Schedule:**

```bash
# Verify daily backups automatically
0 3 * * * /path/to/scripts/backup/verify-backup.sh

# Or run after backup
0 2 * * * /path/to/scripts/backup/backup-database.sh && /path/to/scripts/backup/verify-backup.sh
```

---

## Backup Strategy

### Full Backups

**When**: Daily at 2:00 AM
**Retention**: 30 days in S3, 7 days local
**Format**: PostgreSQL custom format (.dump)
**Compression**: gzip -9

### Incremental Backups

**When**: Every 6 hours
**Retention**: 7 days
**Format**: SQL format (.sql)
**Contents**: Changed data since last full backup

### Point-in-Time Recovery

Supabase provides automatic point-in-time recovery (PITR) for paid plans:
- Restore to any point in the last 7 days
- Managed through Supabase dashboard

For additional PITR capability:
1. Enable WAL archiving
2. Configure continuous archiving to S3
3. Use pg_basebackup + WAL files for recovery

---

## Disaster Recovery Plan

### RPO (Recovery Point Objective)

- **Critical Data**: 6 hours (incremental backups)
- **Standard Data**: 24 hours (daily full backups)
- **With PITR**: < 1 minute (Supabase built-in)

### RTO (Recovery Time Objective)

- **Small Database (< 1GB)**: 30 minutes
- **Medium Database (1-10GB)**: 1-2 hours
- **Large Database (> 10GB)**: 2-4 hours

### Recovery Scenarios

#### 1. Accidental Data Deletion

**Scenario**: User accidentally deleted important data

**Steps:**
```bash
# 1. Identify time before deletion
# 2. Use Supabase PITR (if available)
#    Dashboard → Database → Backups → Point-in-time recovery

# 3. OR restore from backup to temp database
./restore-database.sh <backup-before-deletion> --temp-only

# 4. Extract deleted data
psql -h $DB_HOST -U $DB_USER -d restore_temp -c "
  COPY (SELECT * FROM tasks WHERE id IN ('deleted-ids'))
  TO STDOUT CSV HEADER;
" > deleted_data.csv

# 5. Re-insert into production
psql -h $DB_HOST -U $DB_USER -d postgres -c "
  COPY tasks FROM STDIN CSV HEADER;
" < deleted_data.csv
```

#### 2. Database Corruption

**Scenario**: Database corruption detected

**Steps:**
```bash
# 1. Create backup of corrupt state (for analysis)
./backup-database.sh

# 2. Identify last known good backup
./verify-backup.sh

# 3. Restore from last good backup
./restore-database.sh <last-good-backup>

# 4. Verify restoration
# 5. Resume operations
# 6. Analyze corruption cause
```

#### 3. Complete Infrastructure Failure

**Scenario**: Supabase project unavailable

**Steps:**
```bash
# 1. Provision new Supabase project
# 2. Configure database settings
# 3. Download latest backup from S3
# 4. Restore to new database
./restore-database.sh <latest-backup>

# 5. Update application configuration
# 6. Deploy updated app
# 7. Test thoroughly
# 8. Switch DNS/routing to new infrastructure
```

#### 4. Ransomware Attack

**Scenario**: Database encrypted by ransomware

**Steps:**
```bash
# 1. IMMEDIATELY isolate infected systems
# 2. DO NOT pay ransom
# 3. Identify infection time
# 4. Find backup before infection
./verify-backup.sh <backup-before-infection>

# 5. Provision clean infrastructure
# 6. Restore from clean backup
# 7. Rotate ALL credentials
# 8. Audit all access
# 9. Notify affected users
```

---

## Testing Backups

### Monthly Test Restore

**Schedule**: First Sunday of each month

```bash
# 1. Select random recent backup
BACKUP=$(aws s3 ls s3://your-backup-bucket/database/ \
  | grep "full_backup" \
  | sort -r \
  | shuf -n 1 \
  | awk '{print $4}')

# 2. Verify backup
./verify-backup.sh $BACKUP

# 3. Perform test restore to temp database
DB_NAME=restore_test_$(date +%Y%m%d) \
./restore-database.sh $BACKUP

# 4. Run test queries
psql -h $DB_HOST -U $DB_USER -d restore_test_* -c "
  SELECT count(*) FROM users;
  SELECT count(*) FROM tasks;
  -- Add other verification queries
"

# 5. Cleanup test database
psql -h $DB_HOST -U $DB_USER -d postgres -c "
  DROP DATABASE restore_test_*;
"

# 6. Document results
```

### Quarterly Disaster Recovery Drill

**Schedule**: Quarterly (Jan, Apr, Jul, Oct)

```bash
# Complete end-to-end disaster recovery test
# 1. Simulate infrastructure failure
# 2. Provision new environment
# 3. Restore from backup
# 4. Verify all functionality
# 5. Document time to recovery
# 6. Identify improvements
```

---

## Monitoring and Alerts

### Backup Success/Failure

```bash
# Configure alerts in backup script
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Or check logs
tail -f /tmp/backups/backup_*.log
```

### S3 Backup Monitoring

```bash
# Check for recent backups
aws s3 ls s3://your-backup-bucket/database/ \
  | tail -10

# Verify daily backup exists
TODAY=$(date +%Y%m%d)
aws s3 ls s3://your-backup-bucket/database/ \
  | grep "full_backup_${TODAY}"

# Alert if no backup in last 24 hours
LATEST=$(aws s3 ls s3://your-backup-bucket/database/ \
  | tail -1 \
  | awk '{print $1 " " $2}')

if [ $(( ($(date +%s) - $(date -d "$LATEST" +%s)) / 3600 )) -gt 24 ]; then
  echo "ALERT: No backup in last 24 hours"
fi
```

### Backup Size Monitoring

```bash
# Track backup size growth
aws s3 ls s3://your-backup-bucket/database/ \
  | awk '{print $3, $4}' \
  | sort -k1 -n
```

---

## Troubleshooting

### Backup Fails with "Permission Denied"

```bash
# Check database permissions
psql -h $DB_HOST -U $DB_USER -d postgres -c "
  SELECT has_database_privilege('postgres', 'postgres', 'CONNECT');
"

# Ensure pg_dump has correct version
pg_dump --version

# Check AWS credentials
aws sts get-caller-identity
```

### Restore Fails with "Database Exists"

```bash
# Drop existing database first
psql -h $DB_HOST -U $DB_USER -d postgres -c "
  DROP DATABASE IF EXISTS restore_temp;
"

# Or use --clean flag in pg_restore (included in script)
```

### Backup File Corrupt

```bash
# Verify gzip
gunzip -t backup.dump.gz

# Verify pg_dump format
pg_restore --list backup.dump

# Re-download from S3
aws s3 cp s3://bucket/path/backup.dump.gz ./backup.dump.gz
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up old backups
find /tmp/backups -name "*.dump.gz" -mtime +7 -delete

# Use external storage
export BACKUP_DIR="/mnt/external/backups"
```

---

## Security

### Encryption

**In Transit:**
- All S3 uploads use HTTPS
- Database connections use SSL

**At Rest:**
- S3 server-side encryption enabled (AES-256)
- Consider client-side encryption for sensitive data

```bash
# Encrypt before upload
gpg --encrypt --recipient ops@yourdomain.com backup.dump.gz

# Decrypt before restore
gpg --decrypt backup.dump.gz.gpg > backup.dump.gz
```

### Access Control

**Database:**
- Use read-only user for backups
- Rotate passwords monthly
- Audit access logs

**S3:**
- Restrict bucket access with IAM
- Enable bucket versioning
- Enable MFA delete

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:PutObject",
      "s3:GetObject",
      "s3:ListBucket"
    ],
    "Resource": [
      "arn:aws:s3:::your-backup-bucket/*",
      "arn:aws:s3:::your-backup-bucket"
    ]
  }]
}
```

### Compliance

**Data Retention:**
- Keep backups for required retention period (e.g., 7 years for financial data)
- Document retention policy
- Securely delete expired backups

**Audit Trail:**
- Log all backup/restore operations
- Track who initiated operations
- Monitor access to backups

---

## Best Practices

1. **Test Restores Regularly**: Monthly test restores verify backups work
2. **Monitor Backup Size**: Track growth and optimize if needed
3. **Automate Everything**: No manual backups, always scripted
4. **Verify After Backup**: Run verify-backup.sh after each backup
5. **Keep Multiple Copies**: Local + S3 + offsite
6. **Encrypt Sensitive Data**: Especially for long-term retention
7. **Document Procedures**: Keep runbooks up to date
8. **Train Team**: Everyone should know restore procedure
9. **Test Disaster Recovery**: Quarterly full DR drills
10. **Monitor Continuously**: Alert on backup failures immediately

---

## Related Documentation

- [Production Operations Guide](../../docs/13-lifecycle/PRODUCTION-OPERATIONS.md)
- [Runbook](../../docs/13-lifecycle/RUNBOOK.md)
- [Incident Response](../../docs/13-lifecycle/INCIDENT-RESPONSE.md)
- [Database Guide](../../docs/03-database/DATABASE-GUIDE.md)
