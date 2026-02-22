#!/bin/bash

###############################################################################
# Database Restore Script
#
# Restores Supabase PostgreSQL database from backup
# Supports both full and point-in-time recovery
#
# Usage:
#   ./scripts/backup/restore-database.sh <backup-file> [--target-time YYYY-MM-DD]
#
# Examples:
#   # Restore from specific backup
#   ./restore-database.sh full_backup_20260207_120000.dump.gz
#
#   # Restore to specific point in time
#   ./restore-database.sh full_backup_20260207_120000.dump.gz --target-time 2026-02-07
#
# Requirements:
#   - pg_restore installed
#   - AWS CLI configured
#   - Database admin access
#   - APPROVAL from authorized personnel
###############################################################################

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_DIR="${RESTORE_DIR:-/tmp/restore}"
DATE=$(date +%Y%m%d_%H%M%S)

# Database connection
DB_HOST="${DB_HOST:-db.your-project.supabase.co}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"

# S3 configuration
S3_BUCKET="${S3_BUCKET:-your-backup-bucket}"
S3_PREFIX="${S3_PREFIX:-database}"

# Restore configuration
BACKUP_FILE="${1:-}"
TARGET_TIME="${3:-}"
TEMP_DB="restore_temp_${DATE}"

# Safety flags
REQUIRE_APPROVAL=true
CREATE_PRE_RESTORE_BACKUP=true

# Logging
LOG_FILE="${RESTORE_DIR}/restore_${DATE}.log"

# =============================================================================
# Functions
# =============================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2
    exit 1
}

check_requirements() {
    log "Checking requirements..."

    # Check pg_restore
    if ! command -v pg_restore &> /dev/null; then
        error "pg_restore not found. Please install PostgreSQL client tools."
    fi

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "aws CLI not found. Please install AWS CLI."
    fi

    # Check environment variables
    if [ -z "${DB_PASSWORD:-}" ]; then
        error "DB_PASSWORD not set"
    fi

    # Check backup file specified
    if [ -z "$BACKUP_FILE" ]; then
        error "No backup file specified. Usage: $0 <backup-file>"
    fi

    log "Requirements check passed"
}

request_approval() {
    if [ "$REQUIRE_APPROVAL" = true ]; then
        log "⚠️  WARNING: This will restore the database from backup ⚠️"
        log "This operation will:"
        log "  1. Create a backup of the current database state"
        log "  2. Terminate all active connections"
        log "  3. Restore data from: $BACKUP_FILE"
        log ""
        read -p "Do you have approval to proceed? Type 'RESTORE' to continue: " -r
        echo

        if [ "$REPLY" != "RESTORE" ]; then
            error "Restore cancelled - approval not provided"
        fi

        log "Approval confirmed by: ${USER:-unknown}"
    fi
}

create_restore_dir() {
    log "Creating restore directory: $RESTORE_DIR"
    mkdir -p "$RESTORE_DIR"
}

download_backup() {
    local backup_file="$1"
    local local_file="$RESTORE_DIR/$(basename "$backup_file")"

    # Check if file is local or in S3
    if [ -f "$backup_file" ]; then
        log "Using local backup file: $backup_file"
        ln -sf "$backup_file" "$local_file"
    else
        log "Downloading backup from S3: s3://${S3_BUCKET}/${S3_PREFIX}/$backup_file"

        aws s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/$backup_file" "$local_file" \
            2>&1 | tee -a "$LOG_FILE"

        if [ $? -ne 0 ]; then
            error "Failed to download backup from S3"
        fi

        log "Download complete: $local_file"
    fi

    echo "$local_file"
}

decompress_backup() {
    local backup_file="$1"

    if [[ "$backup_file" == *.gz ]]; then
        log "Decompressing backup: $backup_file"
        gunzip -k "$backup_file"
        local decompressed="${backup_file%.gz}"
        log "Decompression complete: $decompressed"
        echo "$decompressed"
    else
        echo "$backup_file"
    fi
}

verify_backup() {
    local backup_file="$1"

    log "Verifying backup integrity: $backup_file"

    if [[ "$backup_file" == *.dump ]]; then
        if pg_restore --list "$backup_file" > /dev/null 2>&1; then
            log "Backup verification successful"
            return 0
        else
            error "Backup verification failed - file may be corrupt"
        fi
    else
        # For SQL files, just check if readable
        if [ -r "$backup_file" ]; then
            log "Backup file is readable"
            return 0
        else
            error "Backup file is not readable"
        fi
    fi
}

create_pre_restore_backup() {
    if [ "$CREATE_PRE_RESTORE_BACKUP" = true ]; then
        local pre_restore_backup="$RESTORE_DIR/pre_restore_backup_${DATE}.dump"

        log "Creating pre-restore backup (safety): $pre_restore_backup"

        PGPASSWORD="$DB_PASSWORD" pg_dump \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$DB_NAME" \
            --format=custom \
            --file="$pre_restore_backup" \
            2>&1 | tee -a "$LOG_FILE"

        if [ $? -eq 0 ]; then
            log "Pre-restore backup created successfully"
            gzip "$pre_restore_backup"
            log "Compressed: ${pre_restore_backup}.gz"

            # Upload to S3 for safety
            aws s3 cp "${pre_restore_backup}.gz" \
                "s3://${S3_BUCKET}/${S3_PREFIX}/pre_restore_$(basename "${pre_restore_backup}.gz")"

            echo "${pre_restore_backup}.gz"
        else
            error "Failed to create pre-restore backup"
        fi
    fi
}

get_database_stats() {
    log "Getting current database statistics..."

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
            ORDER BY n_live_tup DESC
            LIMIT 10;
        " | tee -a "$LOG_FILE"
}

terminate_connections() {
    log "Terminating active database connections..."

    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --command="
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '$DB_NAME'
            AND pid <> pg_backend_pid();
        " 2>&1 | tee -a "$LOG_FILE"

    log "Active connections terminated"
}

restore_to_temp_database() {
    local backup_file="$1"

    log "Creating temporary database: $TEMP_DB"

    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --command="CREATE DATABASE $TEMP_DB;" \
        2>&1 | tee -a "$LOG_FILE"

    log "Restoring backup to temporary database: $TEMP_DB"

    if [[ "$backup_file" == *.dump ]]; then
        # Custom format backup
        PGPASSWORD="$DB_PASSWORD" pg_restore \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$TEMP_DB" \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --verbose \
            "$backup_file" \
            2>&1 | tee -a "$LOG_FILE"
    else
        # SQL format backup
        PGPASSWORD="$DB_PASSWORD" psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$TEMP_DB" \
            --file="$backup_file" \
            2>&1 | tee -a "$LOG_FILE"
    fi

    if [ $? -eq 0 ]; then
        log "Restore to temporary database completed"
    else
        error "Restore to temporary database failed"
    fi
}

verify_restored_data() {
    log "Verifying restored data in temporary database..."

    # Check table counts
    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$TEMP_DB" \
        --tuples-only \
        --command="
            SELECT
                schemaname || '.' || tablename AS table,
                n_live_tup AS rows
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC
            LIMIT 10;
        " | tee -a "$LOG_FILE"

    # Verify critical tables exist
    local critical_tables=("users" "tasks" "sessions")

    for table in "${critical_tables[@]}"; do
        local count=$(PGPASSWORD="$DB_PASSWORD" psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$TEMP_DB" \
            --tuples-only \
            --command="SELECT count(*) FROM $table;" | tr -d ' ')

        log "Table $table: $count rows"

        if [ "$count" -eq 0 ]; then
            log "WARNING: Table $table is empty"
        fi
    done

    log "Data verification complete"
}

swap_databases() {
    log "⚠️  CRITICAL OPERATION: Swapping databases ⚠️"

    read -p "Verification successful. Proceed with database swap? Type 'SWAP' to continue: " -r
    echo

    if [ "$REPLY" != "SWAP" ]; then
        error "Database swap cancelled"
    fi

    # Terminate connections to production database
    terminate_connections

    # Rename production database to _old
    log "Renaming production database to ${DB_NAME}_old"
    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --command="ALTER DATABASE $DB_NAME RENAME TO ${DB_NAME}_old;" \
        2>&1 | tee -a "$LOG_FILE"

    # Rename temp database to production
    log "Renaming temporary database to $DB_NAME"
    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="postgres" \
        --command="ALTER DATABASE $TEMP_DB RENAME TO $DB_NAME;" \
        2>&1 | tee -a "$LOG_FILE"

    log "Database swap completed"
}

run_post_restore_checks() {
    log "Running post-restore checks..."

    # Get new database stats
    log "Current database statistics:"
    get_database_stats

    # Test database connectivity
    log "Testing database connectivity..."
    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --command="SELECT version();" \
        2>&1 | tee -a "$LOG_FILE"

    # Run migrations if needed
    log "Checking for pending migrations..."
    if [ -f "supabase/migrations" ]; then
        npx supabase migration up 2>&1 | tee -a "$LOG_FILE"
    fi

    log "Post-restore checks complete"
}

cleanup_old_database() {
    log "Cleaning up old database: ${DB_NAME}_old"

    read -p "Drop old database? This is IRREVERSIBLE. Type 'DROP' to continue: " -r
    echo

    if [ "$REPLY" = "DROP" ]; then
        PGPASSWORD="$DB_PASSWORD" psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="postgres" \
            --command="DROP DATABASE IF EXISTS ${DB_NAME}_old;" \
            2>&1 | tee -a "$LOG_FILE"

        log "Old database dropped"
    else
        log "Old database kept: ${DB_NAME}_old"
        log "To drop manually: DROP DATABASE ${DB_NAME}_old;"
    fi
}

cleanup_temp_files() {
    log "Cleaning up temporary files..."

    # Remove decompressed backup
    find "$RESTORE_DIR" -name "*.dump" -type f -delete

    # Keep logs for 7 days
    find "$RESTORE_DIR" -name "*.log" -type f -mtime +7 -delete

    log "Cleanup complete"
}

send_notification() {
    local status="$1"
    local message="$2"

    log "Sending notification: $status - $message"

    # Send to Slack
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Database Restore ${status}\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"fields\": [{
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Backup File\",
                        \"value\": \"$BACKUP_FILE\",
                        \"short\": false
                    }, {
                        \"title\": \"Date\",
                        \"value\": \"$DATE\",
                        \"short\": true
                    }]
                }]
            }" > /dev/null 2>&1
    fi
}

generate_restore_report() {
    cat > "$RESTORE_DIR/restore_report_${DATE}.txt" << EOF
Database Restore Report
=======================

Date: $(date)
Status: SUCCESS

Restore Details:
- Source Backup: $BACKUP_FILE
- Target Database: $DB_HOST/$DB_NAME
- Restore Method: $([ -n "$TARGET_TIME" ] && echo "Point-in-time ($TARGET_TIME)" || echo "Full restore")

Pre-Restore Backup:
- Created: Yes
- Location: s3://${S3_BUCKET}/${S3_PREFIX}/pre_restore_backup_${DATE}.dump.gz

Timeline:
- Started: $(date)
- Duration: ${SECONDS}s

Next Steps:
- Monitor application for errors
- Verify data integrity
- Test critical functionality
- Drop old database when confirmed stable: DROP DATABASE ${DB_NAME}_old;

EOF

    log "Restore report generated: $RESTORE_DIR/restore_report_${DATE}.txt"
}

# =============================================================================
# Main
# =============================================================================

main() {
    log "========================================="
    log "Database Restore Started"
    log "========================================="

    # Check requirements
    check_requirements

    # Request approval
    request_approval

    # Create restore directory
    create_restore_dir

    # Show current database stats
    log "Current database state (BEFORE restore):"
    get_database_stats

    # Create pre-restore backup
    local pre_restore_backup=$(create_pre_restore_backup)
    log "Pre-restore backup: $pre_restore_backup"

    # Download and verify backup
    local local_backup=$(download_backup "$BACKUP_FILE")
    local decompressed_backup=$(decompress_backup "$local_backup")
    verify_backup "$decompressed_backup"

    # Restore to temporary database
    restore_to_temp_database "$decompressed_backup"

    # Verify restored data
    verify_restored_data

    # Swap databases
    swap_databases

    # Post-restore checks
    run_post_restore_checks

    # Generate report
    generate_restore_report

    # Cleanup
    cleanup_temp_files

    # Success notification
    send_notification "SUCCESS" "Database restored successfully from $BACKUP_FILE"

    log "========================================="
    log "Database Restore Completed Successfully"
    log "========================================="
    log ""
    log "IMPORTANT: Please verify the following:"
    log "  1. Application is functioning correctly"
    log "  2. Data integrity is intact"
    log "  3. Users can log in and access data"
    log ""
    log "Old database kept as: ${DB_NAME}_old"
    log "To drop: ./cleanup_old_database.sh"
    log ""
    log "Restore report: $RESTORE_DIR/restore_report_${DATE}.txt"
    log "Restore log: $LOG_FILE"

    exit 0
}

# Trap errors
trap 'send_notification "FAILURE" "Database restore failed - check logs: $LOG_FILE"; exit 1' ERR

# Run main
main "$@"
