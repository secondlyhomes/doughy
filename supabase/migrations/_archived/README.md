# Archived Migrations

This folder contains rollback migrations and historical migrations that are no longer executed but kept for reference.

## Contents

- `*_ROLLBACK.sql` - Rollback scripts for migrations (not executed, historical reference)
- Legacy test migrations
- Deprecated table creations

## File Count

**21 rollback files** archived from the main migrations folder.

### Database Standardization Rollbacks (Zone E)
- `20260117_comprehensive_database_standardization_ROLLBACK.sql` - Phase 1 standardization rollback
- `20260117_database_standardization_phase2_ROLLBACK.sql` - Phase 2 standardization rollback

### RLS Policy Rollbacks
- `20260116_add_rls_api_keys_ROLLBACK.sql`
- `20260116_add_rls_profiles_ROLLBACK.sql`
- `20260116_add_rls_user_plans_ROLLBACK.sql`

### Schema Enhancement Rollbacks
- `20260117_calculation_overrides_ROLLBACK.sql`
- `20260117_deals_portfolio_fields_ROLLBACK.sql`
- `20260117_lead_documents_ROLLBACK.sql`
- `20260117_leads_creative_finance_ROLLBACK.sql`
- `20260117_portfolio_valuations_ROLLBACK.sql`
- `20260117_property_documents_junction_ROLLBACK.sql`

### Index and Constraint Rollbacks
- `20260118_add_composite_indexes_ROLLBACK.sql`
- `20260118_add_enum_types_ROLLBACK.sql`
- `20260118_add_unique_constraints_ROLLBACK.sql`
- `20260119_additional_constraints_ROLLBACK.sql`
- `20260119_additional_performance_indexes_ROLLBACK.sql`

### Feature Rollbacks
- `20260118_document_templates_ROLLBACK.sql`
- `20260118_install_pgtap_ROLLBACK.sql`
- `20260118_sms_inbox_ROLLBACK.sql`
- `20260118_user_calc_preferences_ROLLBACK.sql`
- `20260119_notifications_infrastructure_ROLLBACK.sql`

## Why Archive Instead of Delete?

- Historical reference for understanding schema evolution
- Rollback capability if needed (though not recommended for old migrations)
- Audit trail for compliance

## Note

These files are **NOT executed** by Supabase. They are archived for reference only.

**Last archived:** 2026-01-16 (Zone H Code Cleanup)
