#!/bin/bash

###############################################################################
# Backup Verification Script
#
# Verifies backup integrity and completeness
# Should be run after each backup to ensure recoverability
#
# Usage:
#   ./scripts/backup/verify-backup.sh [backup-file]
#
# If no backup file specified, verifies the most recent backup
###############################################################################

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERIFY_DIR="${VERIFY_DIR:-/tmp/verify}"
DATE=$(date +%Y%m%d_%H%M%S)

# S3 configuration
S3_BUCKET="${S3_BUCKET:-your-backup-bucket}"
S3_PREFIX="${S3_PREFIX:-database}"

# Database connection (for comparison)
DB_HOST="${DB_HOST:-db.your-project.supabase.co}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"

# Backup file
BACKUP_FILE="${1:-}"

# Logging
LOG_FILE="${VERIFY_DIR}/verify_${DATE}.log"

# Verification results
VERIFICATION_PASSED=true

# =============================================================================
# Functions
# =============================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
    VERIFICATION_PASSED=false
}

warn() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $*" | tee -a "$LOG_FILE"
}

create_verify_dir() {
    mkdir -p "$VERIFY_DIR"
}

get_latest_backup() {
    log "Finding latest backup in S3..."

    local latest=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" \
        | grep "full_backup_" \
        | sort -r \
        | head -n 1 \
        | awk '{print $4}')

    if [ -z "$latest" ]; then
        error "No backups found in S3"
        exit 1
    fi

    log "Latest backup: $latest"
    echo "$latest"
}

download_backup() {
    local backup_file="$1"
    local local_file="$VERIFY_DIR/$(basename "$backup_file")"

    if [ -f "$backup_file" ]; then
        log "Using local backup file: $backup_file"
        cp "$backup_file" "$local_file"
    else
        log "Downloading from S3: s3://${S3_BUCKET}/${S3_PREFIX}/$backup_file"

        aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/$backup_file" "$local_file"

        if [ $? -ne 0 ]; then
            error "Failed to download backup"
            exit 1
        fi
    fi

    echo "$local_file"
}

verify_file_integrity() {
    local backup_file="$1"

    log "=== File Integrity Check ==="

    # Check file exists
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    log "✓ File exists"

    # Check file is not empty
    if [ ! -s "$backup_file" ]; then
        error "Backup file is empty"
        return 1
    fi
    log "✓ File is not empty"

    # Check file size
    local file_size=$(stat -f %z "$backup_file" 2>/dev/null || stat -c %s "$backup_file")
    log "File size: $(numfmt --to=iec-i --suffix=B $file_size 2>/dev/null || echo "$file_size bytes")"

    if [ "$file_size" -lt 1024 ]; then
        error "File is suspiciously small: $file_size bytes"
        return 1
    fi
    log "✓ File size is reasonable"

    # Check if compressed
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file" 2>&1 | tee -a "$LOG_FILE"; then
            log "✓ Gzip compression is valid"
        else
            error "Gzip compression is corrupt"
            return 1
        fi
    fi

    return 0
}

verify_backup_format() {
    local backup_file="$1"

    log "=== Backup Format Check ==="

    # Decompress if needed
    local work_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        work_file="${backup_file%.gz}"
        if [ ! -f "$work_file" ]; then
            log "Decompressing for verification..."
            gunzip -c "$backup_file" > "$work_file"
        fi
    fi

    # Check pg_dump custom format
    if [[ "$work_file" == *.dump ]]; then
        log "Checking pg_dump custom format..."

        if pg_restore --list "$work_file" > "$VERIFY_DIR/backup_contents.txt" 2>&1; then
            log "✓ pg_dump format is valid"

            # Count objects
            local table_count=$(grep -c "TABLE DATA" "$VERIFY_DIR/backup_contents.txt" || echo 0)
            local index_count=$(grep -c "INDEX" "$VERIFY_DIR/backup_contents.txt" || echo 0)
            local constraint_count=$(grep -c "CONSTRAINT" "$VERIFY_DIR/backup_contents.txt" || echo 0)

            log "Backup contains:"
            log "  - Tables: $table_count"
            log "  - Indexes: $index_count"
            log "  - Constraints: $constraint_count"

            if [ "$table_count" -eq 0 ]; then
                error "No tables found in backup"
                return 1
            fi
            log "✓ Backup contains tables"
        else
            error "Invalid pg_dump format"
            cat "$VERIFY_DIR/backup_contents.txt" | tee -a "$LOG_FILE"
            return 1
        fi
    fi

    # Check SQL format
    if [[ "$work_file" == *.sql ]]; then
        log "Checking SQL format..."

        if head -n 100 "$work_file" | grep -q "PostgreSQL database dump"; then
            log "✓ SQL format appears valid"
        else
            warn "SQL file may not be a valid PostgreSQL dump"
        fi
    fi

    return 0
}

verify_critical_tables() {
    local backup_file="$1"

    log "=== Critical Tables Check ==="

    # Decompress if needed
    local work_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        work_file="${backup_file%.gz}"
    fi

    # Critical tables that must be present
    local critical_tables=("users" "tasks" "sessions")

    for table in "${critical_tables[@]}"; do
        if grep -q "TABLE DATA.*$table" "$VERIFY_DIR/backup_contents.txt" 2>/dev/null; then
            log "✓ Critical table found: $table"
        else
            error "Critical table missing: $table"
        fi
    done

    return 0
}

verify_data_completeness() {
    local backup_file="$1"

    log "=== Data Completeness Check ==="

    # Create temporary test database
    local test_db="verify_test_${DATE}"

    log "Creating test database: $test_db"
    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --command="CREATE DATABASE $test_db;" \
        2>&1 | tee -a "$LOG_FILE"

    # Decompress if needed
    local work_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        work_file="${backup_file%.gz}"
    fi

    # Restore to test database
    log "Restoring backup to test database..."

    if [[ "$work_file" == *.dump ]]; then
        PGPASSWORD="$DB_PASSWORD" pg_restore \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$test_db" \
            --no-owner \
            --no-privileges \
            "$work_file" \
            2>&1 | tee -a "$LOG_FILE"
    else
        PGPASSWORD="$DB_PASSWORD" psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$test_db" \
            --file="$work_file" \
            2>&1 | tee -a "$LOG_FILE"
    fi

    if [ $? -ne 0 ]; then
        error "Failed to restore backup to test database"
        cleanup_test_database "$test_db"
        return 1
    fi
    log "✓ Backup restored successfully"

    # Verify table counts
    log "Checking table row counts..."

    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$test_db" \
        --tuples-only \
        --command="
            SELECT
                schemaname || '.' || tablename AS table,
                n_live_tup AS rows
            FROM pg_stat_user_tables
            WHERE n_live_tup > 0
            ORDER BY n_live_tup DESC;
        " | tee -a "$LOG_FILE"

    # Verify critical tables have data
    local critical_tables=("users" "tasks")
    for table in "${critical_tables[@]}"; do
        local count=$(PGPASSWORD="$DB_PASSWORD" psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$test_db" \
            --tuples-only \
            --command="SELECT count(*) FROM $table;" | tr -d ' ')

        if [ "$count" -gt 0 ]; then
            log "✓ Table $table has $count rows"
        else
            warn "Table $table is empty"
        fi
    done

    # Verify data integrity
    log "Running data integrity checks..."

    # Check for NULL in required fields
    local null_users=$(PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$test_db" \
        --tuples-only \
        --command="SELECT count(*) FROM users WHERE id IS NULL OR email IS NULL;" | tr -d ' ')

    if [ "$null_users" -eq 0 ]; then
        log "✓ No NULL values in required user fields"
    else
        error "Found $null_users users with NULL required fields"
    fi

    # Cleanup
    cleanup_test_database "$test_db"

    return 0
}

cleanup_test_database() {
    local test_db="$1"

    log "Cleaning up test database: $test_db"

    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --command="DROP DATABASE IF EXISTS $test_db;" \
        2>&1 | tee -a "$LOG_FILE"
}

compare_with_production() {
    local backup_file="$1"

    log "=== Production Comparison ==="

    # Get production table counts
    log "Production database statistics:"

    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --tuples-only \
        --command="
            SELECT
                schemaname || '.' || tablename AS table,
                n_live_tup AS rows
            FROM pg_stat_user_tables
            WHERE n_live_tup > 0
            ORDER BY n_live_tup DESC
            LIMIT 10;
        " | tee "$VERIFY_DIR/production_stats.txt" | tee -a "$LOG_FILE"

    # Note: Full comparison would require restoring backup
    # For now, just ensure production database is accessible
    log "✓ Production database accessible"

    return 0
}

verify_backup_metadata() {
    local backup_file="$1"

    log "=== Backup Metadata Check ==="

    # Get S3 metadata
    if [[ "$backup_file" != /* ]]; then
        local s3_path="s3://${S3_BUCKET}/${S3_PREFIX}/$backup_file"

        log "Checking S3 metadata for: $s3_path"

        aws s3api head-object \
            --bucket "$S3_BUCKET" \
            --key "${S3_PREFIX}/$backup_file" \
            --query 'Metadata' \
            2>&1 | tee -a "$LOG_FILE"
    fi

    # Check file timestamp
    local file_age_hours=$(( ($(date +%s) - $(stat -f %m "$backup_file" 2>/dev/null || stat -c %Y "$backup_file")) / 3600 ))
    log "Backup age: ${file_age_hours} hours"

    if [ "$file_age_hours" -gt 48 ]; then
        warn "Backup is more than 48 hours old"
    else
        log "✓ Backup is recent"
    fi

    return 0
}

generate_verification_report() {
    local backup_file="$1"

    log "=== Generating Verification Report ==="

    cat > "$VERIFY_DIR/verification_report_${DATE}.txt" << EOF
Backup Verification Report
==========================

Date: $(date)
Backup File: $(basename "$backup_file")
Status: $([ "$VERIFICATION_PASSED" = true ] && echo "PASSED ✓" || echo "FAILED ✗")

Checks Performed:
- File Integrity: $([ "$VERIFICATION_PASSED" = true ] && echo "✓" || echo "✗")
- Backup Format: $([ "$VERIFICATION_PASSED" = true ] && echo "✓" || echo "✗")
- Critical Tables: $([ "$VERIFICATION_PASSED" = true ] && echo "✓" || echo "✗")
- Data Completeness: $([ "$VERIFICATION_PASSED" = true ] && echo "✓" || echo "✗")

Backup Details:
- Size: $(du -h "$backup_file" | awk '{print $1}')
- Created: $(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$backup_file" 2>/dev/null || stat -c "%y" "$backup_file")
- Age: $(( ($(date +%s) - $(stat -f %m "$backup_file" 2>/dev/null || stat -c %Y "$backup_file")) / 3600 )) hours

$([ "$VERIFICATION_PASSED" = true ] && echo "
✓ This backup is verified and ready for use in disaster recovery.
" || echo "
✗ This backup FAILED verification. Do not use for disaster recovery.
Please investigate and create a new backup.
")

Full verification log: $LOG_FILE
EOF

    cat "$VERIFY_DIR/verification_report_${DATE}.txt" | tee -a "$LOG_FILE"
}

send_notification() {
    local status="$1"

    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Backup Verification ${status}\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "PASSED" ] && echo "good" || echo "danger")\",
                    \"fields\": [{
                        \"title\": \"Backup File\",
                        \"value\": \"$BACKUP_FILE\",
                        \"short\": false
                    }, {
                        \"title\": \"Status\",
                        \"value\": \"$status\",
                        \"short\": true
                    }]
                }]
            }" > /dev/null 2>&1
    fi
}

# =============================================================================
# Main
# =============================================================================

main() {
    log "========================================="
    log "Backup Verification Started"
    log "========================================="

    create_verify_dir

    # Get backup file
    if [ -z "$BACKUP_FILE" ]; then
        BACKUP_FILE=$(get_latest_backup)
    fi

    log "Verifying backup: $BACKUP_FILE"

    # Download backup
    local local_backup=$(download_backup "$BACKUP_FILE")

    # Run verification checks
    verify_file_integrity "$local_backup" || true
    verify_backup_format "$local_backup" || true
    verify_critical_tables "$local_backup" || true
    verify_data_completeness "$local_backup" || true
    compare_with_production "$local_backup" || true
    verify_backup_metadata "$local_backup" || true

    # Generate report
    generate_verification_report "$local_backup"

    # Send notification
    if [ "$VERIFICATION_PASSED" = true ]; then
        send_notification "PASSED"
        log "========================================="
        log "✓ Verification PASSED"
        log "========================================="
        exit 0
    else
        send_notification "FAILED"
        log "========================================="
        log "✗ Verification FAILED"
        log "========================================="
        exit 1
    fi
}

# Run main
main "$@"
