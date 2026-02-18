# Database Standards Audit - January 29, 2026

## Executive Summary

**Project**: Doughy App (Dev/Stage) - `lqmbyobweeaigrwmvizo`
**Audit Date**: January 29, 2026
**Status**: Pre-production - Remediation Applied

This document archives the database audit findings and remediation actions taken.

## Issues Found & Remediation

### CRITICAL: Security Issues

| Issue | Count | Status | Migration |
|-------|-------|--------|-----------|
| Functions without `search_path` | 68 | ✅ Fixed | `20260130400000_fix_function_search_paths.sql` |
| Tables without RLS | 2 | ⚠️ N/A | Extension-owned tables (cannot be modified) |
| Overly permissive RLS policies | 6 | ✅ Fixed | `20260130400002_fix_permissive_rls_policies.sql` |

### HIGH: Performance Issues

| Issue | Count | Status | Migration |
|-------|-------|--------|-----------|
| Missing FK indexes | 31 | ✅ Fixed | `20260130400003_add_missing_fk_indexes.sql` |
| Missing user_id indexes | 8 | ✅ Fixed | `20260130400004_add_missing_user_id_indexes.sql` |

### MEDIUM: Data Type Issues

| Issue | Count | Status | Migration |
|-------|-------|--------|-----------|
| Timestamp without timezone | 2 | ✅ Fixed | `20260130400005_fix_timestamp_columns.sql` |

## Migrations Applied

### 1. `20260130400000_fix_function_search_paths.sql`

Fixed 68 functions that were missing `SET search_path = public`:

- All SECURITY DEFINER functions now have explicit search_path
- All trigger functions have search_path set
- Helper functions updated for consistency

**Key functions fixed:**
- `handle_new_user` - Auth trigger
- `log_security_event` - Security logging
- `check_rate_limit` - API rate limiting
- `deduct_mail_credits` / `add_mail_credits` - Billing
- All MoltBot AI functions
- All drip campaign functions
- All rental/investor messaging functions

### 2. `20260130400001_enable_rls_system_tables.sql`

**Note**: Both `spatial_ref_sys` and `wrappers_fdw_stats` are extension-owned tables that cannot have RLS enabled via application migrations. This is expected and acceptable:

- `spatial_ref_sys` - PostGIS coordinate systems (public reference data, no user data)
- `wrappers_fdw_stats` - FDW statistics (internal system metrics, no user data)

### 3. `20260130400002_fix_permissive_rls_policies.sql`

Fixed overly permissive policies:

- `re_comps` - Now workspace-scoped instead of public access
- `comms_messages` - Update restricted to own leads

Documented intentionally permissive policies:
- `system_logs_insert_any` - Needed for logging
- `workspace_insert_authenticated` - Needed for onboarding

### 4. `20260130400003_add_missing_fk_indexes.sql`

Added 31 indexes on foreign key columns:

- `ai_response_outcomes` (4 indexes)
- `capture_items` (2 indexes)
- `contact_opt_outs` (2 indexes)
- `conversation_items` (1 index)
- `crm_contacts` (1 index)
- `crm_skip_trace_results` (2 indexes)
- `drip_campaign_steps` (1 index)
- `drip_enrollments` (2 indexes)
- `drip_touch_log` (1 index)
- `investor_ai_queue` (1 index)
- `investor_ai_response_outcomes` (2 indexes)
- `investor_follow_ups` (2 indexes)
- `mail_credit_transactions` (2 indexes)
- `moltbot_sync_history` (1 index)
- `property_turnovers` (1 index)
- `re_portfolio_entries` (1 index)
- `rental_ai_queue` (2 indexes)
- `seam_access_codes` (1 index)
- `seam_lock_events` (1 index)
- `vendor_messages` (1 index)

### 5. `20260130400004_add_missing_user_id_indexes.sql`

Added indexes on user_id columns for RLS performance:

- `conversation_items`
- `moltbot_blocked_patterns`
- `moltbot_email_analysis`
- `moltbot_learning_queue`
- `moltbot_sync_history`
- `re_properties`
- `seam_access_codes`
- `seam_lock_events`

Plus additional performance indexes on frequently queried tables.

### 6. `20260130400005_fix_timestamp_columns.sql`

Converted timestamp columns to timestamptz:

- `user_profiles.created_at`
- `comms_messages.inserted_at`

## Post-Migration Verification

Run these queries to verify the migrations:

```sql
-- Verify functions have search_path
SELECT COUNT(*) as functions_with_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proconfig @> ARRAY['search_path=public'];

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- Verify indexes exist
SELECT COUNT(*) as fk_indexes
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
```

## Phase 4: Naming Convention Fixes (COMPLETED)

### 7. `20260130400006_add_missing_updated_at_columns.sql`

Added `updated_at` columns and triggers to 48 tables that were missing them.

### 8. `20260130400007_rename_boolean_columns_part1.sql`

Renamed ~20 boolean columns to use is_/has_ prefixes.

### 9. `20260130400008_rename_boolean_columns_part2.sql`

Renamed remaining ~46 boolean columns:
- property_maintenance, property_turnovers, property_vendors
- re_properties (hoa → has_hoa, owner_occupied → is_owner_occupied, vacant → is_vacant)
- rental_conversations, rental_integrations, rental_messages, rental_properties, rental_rooms, rental_templates
- security_*, user_*, vendor_messages, workspace_members
- seam_access_codes, seam_locks

**TypeScript code updates applied to:**
- All type definition files regenerated
- All stores updated (rental-conversations, investor-conversations, landlord-settings, rental-properties, rental-rooms)
- All hooks updated (useRentalProperties, useRentalPropertyDetail, useInbox)
- All screens/components updated (ConversationDetailScreen, LeadConversationScreen, ConversationCard, RentalPropertyCard, RentalPropertyDetailScreen)
- All test files updated
- Seeder files updated

### 10. TEXT Status Columns Converted to ENUMs (COMPLETED)

All TEXT status columns have been converted to proper PostgreSQL ENUM types for type safety and data integrity.

**Tables converted (25 tables, 27 columns):**

| Table | Column | ENUM Type |
|-------|--------|-----------|
| `deals` | `status` | `deal_status` |
| `capture_items` | `status` | `capture_item_status` |
| `re_properties` | `status` | `re_property_status` |
| `re_comps` | `status` | `re_comp_status` |
| `deposit_settlements` | `status` | `deposit_settlement_status` |
| `assistant_jobs` | `status` | `assistant_job_status` |
| `guest_messages` | `status` | `guest_message_status` |
| `moltbot_learning_queue` | `status` | `moltbot_learning_status` |
| `moltbot_sync_history` | `status` | `moltbot_sync_status` |
| `user_plans` | `status` | `user_plan_status` |
| `user_subscriptions` | `status` | `user_subscription_status` |
| `user_subscriptions` | `payment_status` | `payment_status` |
| `vendor_messages` | `status` | `vendor_message_status` |
| `system_scheduled_deletions` | `status` | `scheduled_deletion_status` |
| `investor_campaigns` | `status` | `investor_campaign_status` |
| `investor_follow_ups` | `status` | `investor_follow_up_status` |
| `seam_access_codes` | `status` | `seam_access_code_status` |
| `security_api_keys` | `status` | `security_api_key_status` |
| `comms_scheduled_messages` | `status` | `scheduled_message_status` |
| `call_transcripts` | `status` | `call_transcript_status` |
| `re_document_processing_queue` | `status` | `document_processing_status` |
| `re_portfolio_monthly_records` | `occupancy_status` | `occupancy_status` |
| `rental_bookings` | `deposit_status` | `deposit_status` |
| `comms_messages` | `conversation_status` | `conversation_status` |
| `crm_contacts` | `campaign_status` | `campaign_status` |
| `investor_agents` | `relationship_status` | `relationship_status` |
| `rental_integrations` | `last_sync_status` | `sync_status` |

**Data quality fixes applied:**
- `re_properties.status`: Normalized "Active" → "active" (case inconsistency)
- `re_comps.status`: Normalized "Closed" → "closed" (case inconsistency)

**TypeScript types regenerated** via `npm run db:types`

## Outstanding Items (Low Priority)

These items were identified but not addressed in this remediation:

1. **Non-plural table names** (~20 tables) - Would require extensive code changes

## References

- [Supabase RLS Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Function Search Path Security](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
