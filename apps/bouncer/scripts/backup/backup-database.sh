#!/bin/bash

###############################################################################
# Database Backup Script
#
# Performs automated backup of Supabase PostgreSQL database
# Uploads to AWS S3 for safe keeping
#
# Usage:
#   ./scripts/backup/backup-database.sh [--full|--incremental]
#
# Requirements:
#   - pg_dump installed
#   - AWS CLI configured
#   - Environment variables set (DB_HOST, DB_USER, DB_PASSWORD)
#
# Schedule:
#   - Full backup: Daily at 2:00 AM
#   - Incremental: Every 6 hours
###############################################################################

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/tmp/backups}"
BACKUP_TYPE="${1:-full}"
DATE=$(date +%Y%m%d_%H%M%S)
DATE_SHORT=$(date +%Y%m%d)

# Database connection
DB_HOST="${DB_HOST:-db.your-project.supabase.co}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"

# S3 configuration
S3_BUCKET="${S3_BUCKET:-your-backup-bucket}"
S3_PREFIX="${S3_PREFIX:-database}"

# Retention
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOCAL_RETENTION_DAYS="${LOCAL_RETENTION_DAYS:-7}"

# Logging
LOG_FILE="${BACKUP_DIR}/backup_${DATE}.log"

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

    # Check pg_dump
    if ! command -v pg_dump &> /dev/null; then
        error "pg_dump not found. Please install PostgreSQL client tools."
    fi

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "aws CLI not found. Please install AWS CLI."
    fi

    # Check gzip
    if ! command -v gzip &> /dev/null; then
        error "gzip not found."
    fi

    # Check environment variables
    if [ -z "${DB_PASSWORD:-}" ]; then
        error "DB_PASSWORD not set"
    fi

    log "Requirements check passed"
}

create_backup_dir() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
}

perform_full_backup() {
    local backup_file="$BACKUP_DIR/full_backup_${DATE}.dump"

    log "Starting full backup to: $backup_file"

    PGPASSWORD="$DB_PASSWORD" pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --format=custom \
        --compress=9 \
        --file="$backup_file" \
        --verbose \
        2>&1 | tee -a "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "Full backup completed successfully"
        echo "$backup_file"
    else
        error "Full backup failed"
    fi
}

perform_incremental_backup() {
    local backup_file="$BACKUP_DIR/incremental_backup_${DATE}.sql"
    local last_full_backup=$(find "$BACKUP_DIR" -name "full_backup_*.dump.gz" -type f | sort -r | head -n 1)

    if [ -z "$last_full_backup" ]; then
        log "No full backup found, performing full backup instead"
        perform_full_backup
        return
    fi

    log "Starting incremental backup (changes since last full backup)"
    log "Base backup: $last_full_backup"

    # Get timestamp of last full backup
    local base_backup_time=$(stat -f %m "$last_full_backup" 2>/dev/null || stat -c %Y "$last_full_backup")
    local base_backup_date=$(date -r "$base_backup_time" '+%Y-%m-%d %H:%M:%S')

    # Export only changed data
    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --output="$backup_file" \
        --command="
            -- Export modified users
            COPY (SELECT * FROM users WHERE updated_at > '$base_backup_date') TO STDOUT WITH CSV HEADER;

            -- Export modified tasks
            COPY (SELECT * FROM tasks WHERE updated_at > '$base_backup_date') TO STDOUT WITH CSV HEADER;

            -- Add other tables as needed
        " 2>&1 | tee -a "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "Incremental backup completed successfully"
        echo "$backup_file"
    else
        error "Incremental backup failed"
    fi
}

compress_backup() {
    local backup_file="$1"
    log "Compressing backup: $backup_file"

    gzip -9 "$backup_file"
    local compressed_file="${backup_file}.gz"

    if [ -f "$compressed_file" ]; then
        local original_size=$(du -h "$backup_file" 2>/dev/null | awk '{print $1}' || echo "unknown")
        local compressed_size=$(du -h "$compressed_file" | awk '{print $1}')
        log "Compression complete: $original_size -> $compressed_size"
        echo "$compressed_file"
    else
        error "Compression failed"
    fi
}

verify_backup() {
    local backup_file="$1"
    log "Verifying backup: $backup_file"

    # Check file exists and is not empty
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi

    if [ ! -s "$backup_file" ]; then
        error "Backup file is empty: $backup_file"
    fi

    # For .dump files, verify with pg_restore
    if [[ "$backup_file" == *.dump.gz ]]; then
        local temp_file="/tmp/verify_backup_$$.dump"
        gunzip -c "$backup_file" > "$temp_file"

        if pg_restore --list "$temp_file" > /dev/null 2>&1; then
            log "Backup verification successful"
            rm "$temp_file"
        else
            rm "$temp_file"
            error "Backup verification failed - file may be corrupt"
        fi
    fi

    # Check file size is reasonable (> 1KB)
    local file_size=$(stat -f %z "$backup_file" 2>/dev/null || stat -c %s "$backup_file")
    if [ "$file_size" -lt 1024 ]; then
        error "Backup file is suspiciously small: $file_size bytes"
    fi

    log "Backup verified successfully"
}

upload_to_s3() {
    local backup_file="$1"
    local s3_path="s3://${S3_BUCKET}/${S3_PREFIX}/$(basename "$backup_file")"

    log "Uploading to S3: $s3_path"

    aws s3 cp "$backup_file" "$s3_path" \
        --storage-class STANDARD_IA \
        --metadata "backup-date=$DATE,backup-type=$BACKUP_TYPE" \
        2>&1 | tee -a "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log "Upload successful"

        # Verify upload
        if aws s3 ls "$s3_path" > /dev/null 2>&1; then
            log "Upload verified in S3"
        else
            error "Upload verification failed - file not found in S3"
        fi
    else
        error "Upload failed"
    fi
}

cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Clean up local backups
    log "Removing local backups older than $LOCAL_RETENTION_DAYS days"
    find "$BACKUP_DIR" -name "*.dump.gz" -type f -mtime "+$LOCAL_RETENTION_DAYS" -delete
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime "+$LOCAL_RETENTION_DAYS" -delete

    # Clean up old logs
    find "$BACKUP_DIR" -name "*.log" -type f -mtime +7 -delete

    # Clean up S3 backups
    log "Removing S3 backups older than $RETENTION_DAYS days"
    local cutoff_date=$(date -d "$RETENTION_DAYS days ago" '+%Y-%m-%d' 2>/dev/null || date -v-${RETENTION_DAYS}d '+%Y-%m-%d')

    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | while read -r line; do
        local file_date=$(echo "$line" | awk '{print $1}')
        local file_name=$(echo "$line" | awk '{print $4}')

        if [[ "$file_date" < "$cutoff_date" ]]; then
            log "Deleting old S3 backup: $file_name"
            aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/$file_name"
        fi
    done

    log "Cleanup complete"
}

send_notification() {
    local status="$1"
    local message="$2"

    log "Sending notification: $status - $message"

    # Send to Slack (if configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Database Backup ${status}\",
                \"attachments\": [{
                    \"color\": \"$([ "$status" = "SUCCESS" ] && echo "good" || echo "danger")\",
                    \"fields\": [{
                        \"title\": \"Message\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Date\",
                        \"value\": \"$DATE\",
                        \"short\": true
                    }, {
                        \"title\": \"Type\",
                        \"value\": \"$BACKUP_TYPE\",
                        \"short\": true
                    }]
                }]
            }" > /dev/null 2>&1
    fi

    # Send email (if configured)
    if [ -n "${NOTIFICATION_EMAIL:-}" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "Database Backup $status" "$NOTIFICATION_EMAIL"
    fi
}

generate_backup_report() {
    local backup_file="$1"
    local file_size=$(du -h "$backup_file" | awk '{print $1}')

    cat > "$BACKUP_DIR/backup_report_${DATE}.txt" << EOF
Database Backup Report
======================

Date: $(date)
Type: $BACKUP_TYPE
Status: SUCCESS

Backup Details:
- File: $(basename "$backup_file")
- Size: $file_size
- Location: $backup_file
- S3 Path: s3://${S3_BUCKET}/${S3_PREFIX}/$(basename "$backup_file")

Database Details:
- Host: $DB_HOST
- Database: $DB_NAME
- Port: $DB_PORT

Retention:
- Local: $LOCAL_RETENTION_DAYS days
- S3: $RETENTION_DAYS days

EOF

    # Add table statistics
    PGPASSWORD="$DB_PASSWORD" psql \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --tuples-only \
        --command="
            SELECT
                schemaname || '.' || tablename AS table,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
                n_live_tup AS rows
            FROM pg_stat_user_tables
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
            LIMIT 10;
        " >> "$BACKUP_DIR/backup_report_${DATE}.txt"

    log "Backup report generated: $BACKUP_DIR/backup_report_${DATE}.txt"
}

# =============================================================================
# Main
# =============================================================================

main() {
    log "Starting database backup"
    log "Backup type: $BACKUP_TYPE"

    # Check requirements
    check_requirements

    # Create backup directory
    create_backup_dir

    # Perform backup
    local backup_file
    if [ "$BACKUP_TYPE" = "full" ]; then
        backup_file=$(perform_full_backup)
    elif [ "$BACKUP_TYPE" = "incremental" ]; then
        backup_file=$(perform_incremental_backup)
    else
        error "Invalid backup type: $BACKUP_TYPE"
    fi

    # Compress backup
    backup_file=$(compress_backup "$backup_file")

    # Verify backup
    verify_backup "$backup_file"

    # Upload to S3
    upload_to_s3 "$backup_file"

    # Generate report
    generate_backup_report "$backup_file"

    # Cleanup old backups
    cleanup_old_backups

    # Send success notification
    send_notification "SUCCESS" "Backup completed successfully: $(basename "$backup_file")"

    log "Backup completed successfully"
    log "Backup file: $backup_file"
    log "S3 path: s3://${S3_BUCKET}/${S3_PREFIX}/$(basename "$backup_file")"

    exit 0
}

# Trap errors and send failure notification
trap 'send_notification "FAILURE" "Backup failed - check logs: $LOG_FILE"; exit 1' ERR

# Run main
main "$@"
