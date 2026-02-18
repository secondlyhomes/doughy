# Database Schema Documentation

**Zone A: Backend & Database**
**Last Updated:** 2026-01-15
**Phase:** 5 - Testing & Documentation

---

## Overview

This document provides a comprehensive reference for the Doughy AI database schema. The database is organized into logical domains, each with consistent naming conventions and security policies.

---

## Domain Organization

### 1. User Management Domain

**Naming Convention:** `profiles`, `user_plans`, `api_keys`
**Security:** User-scoped RLS policies (users can only access their own data)

#### `profiles`
User profile information and role assignments.

**Columns:**
- `id` (UUID, PK) - References `auth.users.id`
- `email` (TEXT, NOT NULL, UNIQUE) - User email address
- `full_name` (TEXT) - User's full name
- `role` (user_role ENUM, NOT NULL) - User role: `user`, `admin`, `support`, `standard`
- `avatar_url` (TEXT) - Profile picture URL
- `created_at` (TIMESTAMPTZ) - Profile creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `email`

**RLS Policies:**
- Users can view and update their own profile
- Users cannot change their own role
- Admins can view and update all profiles

**Triggers:**
- Auto-creates profile on user signup (`create_profile_on_signup`)

---

#### `api_keys`
Encrypted third-party API credentials.

**Columns:**
- `id` (UUID, PK) - Primary key
- `user_id` (UUID, NOT NULL, FK) - References `auth.users.id`
- `service` (TEXT, NOT NULL) - Service name: `openai`, `stripe`, `twilio`, `sendgrid`
- `key_ciphertext` (TEXT, NOT NULL) - PBKDF2-encrypted API key
- `nonce` (TEXT) - Encryption nonce
- `salt` (TEXT) - PBKDF2 salt
- `status` (TEXT) - Health status: `active`, `healthy`, `unhealthy`, `inactive`
- `last_checked` (TIMESTAMPTZ) - Last health check timestamp
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- PRIMARY KEY on `id`
- `idx_api_keys_user_id` on `user_id`
- `idx_api_keys_service` on `service`
- `idx_api_keys_user_service` composite on `(user_id, service)`
- UNIQUE index `idx_api_keys_user_service_unique` on `(user_id, service)` - One key per service per user

**RLS Policies:**
- Users can view, insert, update, delete their own API keys
- Admins can view all API keys (read-only)

**Security:**
- All API keys encrypted using PBKDF2 with 100,000 iterations
- Timing-safe HMAC validation prevents timing attacks
- See `src/lib/cryptoNative.ts` for encryption implementation

---

#### `user_plans`
User subscription and billing information.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK, UNIQUE) - References `auth.users.id`
- `plan_name` (TEXT) - Subscription plan: `free`, `pro`, `enterprise`
- `stripe_customer_id` (TEXT) - Stripe customer ID
- `stripe_subscription_id` (TEXT) - Stripe subscription ID
- `status` (TEXT) - Subscription status
- `current_period_start` (TIMESTAMPTZ)
- `current_period_end` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE index `idx_user_plans_user_unique` on `user_id` - One plan per user

**RLS Policies:**
- Users can view their own plan
- Only admins can modify plans

---

### 2. CRM Domain

**Naming Convention:** `leads`, `contacts`, `messages`, `calls`, `transcripts`
**Security:** User-scoped RLS policies

#### `leads`
Sales leads and prospects.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK) - References `auth.users.id`
- `workspace_id` (UUID, FK) - References `workspaces.id`
- `name` (TEXT, NOT NULL) - Lead name
- `phone` (TEXT) - Phone number
- `email` (TEXT) - Email address
- `company` (TEXT) - Company name
- `status` (lead_status ENUM, NOT NULL) - `new`, `active`, `qualified`, `unqualified`, `closed`
- `score` (INT) - Lead score 0-100
- `tags` (TEXT[]) - Array of tags
- `opt_status` (opt_status ENUM) - `opted_in`, `opted_out`, `pending`
- `is_deleted` (BOOLEAN) - Soft delete flag
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- PRIMARY KEY on `id`
- `idx_leads_user_id` on `user_id`
- `idx_leads_workspace_id` on `workspace_id`
- `idx_leads_status` on `status`
- `idx_leads_email` on `email`
- `idx_leads_phone` on `phone`
- `idx_leads_user_status` composite on `(user_id, status)`
- `idx_leads_user_created` composite on `(user_id, created_at DESC)`
- `idx_leads_active` partial on `(user_id, created_at DESC)` WHERE `status IN ('active', 'qualified') AND is_deleted = FALSE`
- `idx_leads_tags_gin` GIN index on `tags`
- `idx_leads_email_lower` expression index on `LOWER(email)`
- `idx_leads_name_lower` expression index on `LOWER(name)`
- UNIQUE partial index `idx_leads_email_unique` on `LOWER(email)` WHERE `email IS NOT NULL AND is_deleted = FALSE`
- UNIQUE partial index `idx_leads_phone_unique` on `phone` WHERE `phone IS NOT NULL AND is_deleted = FALSE`

**RLS Policies:**
- Users can view, insert, update, delete their own leads
- Admins can view all leads

**CHECK Constraints:**
- `score` must be between 0 and 100 (if not NULL)

**Covering Index:**
- `idx_leads_user_status_covering` on `(user_id, status)` INCLUDE `(name, email, phone, score, created_at)`

---

### 3. Real Estate Domain

**Naming Convention:** ALL tables use `re_*` prefix
**Security:** User-scoped RLS policies

#### `re_properties`
Real estate property listings.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK) - References `auth.users.id`
- `address_line_1` (TEXT, NOT NULL)
- `address_line_2` (TEXT)
- `city` (TEXT, NOT NULL)
- `state` (TEXT, NOT NULL)
- `zip` (TEXT, NOT NULL)
- `bedrooms` (INT) - Must be >= 0
- `bathrooms` (NUMERIC(3,1)) - Must be >= 0
- `square_feet` (INT) - Must be > 0
- `lot_size` (INT) - Must be > 0
- `year_built` (INT) - Must be between 1800 and current year + 5
- `purchase_price` (NUMERIC(12,2))
- `arv` (NUMERIC(12,2)) - After Repair Value
- `status` (TEXT) - Property status
- `property_type` (TEXT)
- `mls_id` (TEXT) - MLS listing ID
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- PRIMARY KEY on `id`
- `idx_re_properties_user_id` on `user_id`
- `idx_re_properties_status` on `status`
- `idx_re_properties_city_state` composite on `(city, state)`
- `idx_re_properties_zip` on `zip`
- `idx_re_properties_location` composite on `(city, state, zip)`
- `idx_re_properties_user_status` composite on `(user_id, status)`
- `idx_re_properties_active` partial on `(user_id, created_at DESC)` WHERE `status = 'active'`

**RLS Policies:**
- Users can view, insert, update, delete their own properties
- Admins can view all properties

**CHECK Constraints:**
- `bedrooms >= 0` (if not NULL)
- `bathrooms >= 0` (if not NULL)
- `square_feet > 0` (if not NULL)
- `lot_size > 0` (if not NULL)
- `year_built >= 1800 AND year_built <= CURRENT_YEAR + 5` (if not NULL)

---

#### `re_documents`
Property-related documents (inspections, appraisals, contracts).

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK) - References `auth.users.id`
- `property_id` (UUID, FK) - References `re_properties.id`
- `deal_id` (UUID, FK) - References `deals.id`
- `title` (TEXT, NOT NULL)
- `type` (document_type ENUM, NOT NULL) - See Document Types below
- `file_url` (TEXT, NOT NULL)
- `file_size` (INT) - Must be > 0 (if not NULL)
- `content_type` (VARCHAR(100))
- `uploaded_by` (UUID, FK) - References `auth.users.id`
- `metadata` (JSONB) - Additional document metadata
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Document Types (ENUM):**
- Research phase: `inspection`, `appraisal`, `title_search`, `survey`, `photo`, `comp`
- Transaction phase: `offer`, `counter_offer`, `purchase_agreement`, `addendum`, `closing_statement`, `hud1`, `deed`, `contract`
- Other: `receipt`, `other`

**Indexes:**
- PRIMARY KEY on `id`
- `idx_re_documents_user_id` on `user_id`
- `idx_re_documents_property_id` on `property_id`
- `idx_re_documents_deal_id` on `deal_id`
- `idx_re_documents_type` on `type`
- `idx_re_documents_created_at` on `created_at DESC`
- `idx_re_documents_user_type` composite on `(user_id, type)`
- `idx_re_documents_property_created` composite on `(property_id, created_at DESC)` WHERE `property_id IS NOT NULL`
- `idx_re_documents_metadata_gin` GIN index on `metadata`

**RLS Policies:**
- Users can view, insert, update, delete their own documents
- Admins can view all documents

**CHECK Constraints:**
- `file_size > 0` (if not NULL)

---

#### `re_lead_documents`
Seller/lead-specific documents (tax returns, IDs, W9s).

**Columns:**
- `id` (UUID, PK)
- `lead_id` (UUID, NOT NULL, FK) - References `leads.id` ON DELETE CASCADE
- `title` (TEXT, NOT NULL)
- `type` (lead_document_type ENUM, NOT NULL) - See Lead Document Types below
- `file_url` (TEXT, NOT NULL)
- `file_size` (INT) - Must be > 0 (if not NULL)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Lead Document Types (ENUM):**
- `id` - Government ID
- `tax_return` - Tax returns
- `bank_statement` - Bank statements
- `w9` - W-9 form
- `death_cert` - Death certificate
- `poa` - Power of Attorney
- `other` - Other documents

**Indexes:**
- PRIMARY KEY on `id`
- `idx_lead_documents_lead_id` on `lead_id`
- `idx_lead_documents_type` on `type`

**RLS Policies:**
- Users can view, insert, update, delete lead documents for their own leads
- Access control via lead ownership (subquery checks `leads.user_id`)

**CHECK Constraints:**
- `file_size > 0` (if not NULL)

---

#### `re_property_documents`
Junction table for property-document relationships (supports package deals).

**Columns:**
- `property_id` (UUID, NOT NULL, FK) - References `re_properties.id` ON DELETE CASCADE
- `document_id` (UUID, NOT NULL, FK) - References `re_documents.id` ON DELETE CASCADE
- `is_primary` (BOOLEAN, DEFAULT FALSE) - Primary document flag
- `created_at` (TIMESTAMPTZ)

**Indexes:**
- PRIMARY KEY on `(property_id, document_id)` - Composite primary key
- `idx_property_documents_property` on `property_id`
- `idx_property_documents_document` on `document_id`

**RLS Policies:**
- Users can view, insert, delete links for their own properties
- Access control via property ownership (subquery checks `re_properties.user_id`)

---

### 4. Deal Domain

**Naming Convention:** `deals`, `deal_events`
**Security:** User-scoped RLS policies

#### `deals`
Deal pipeline and opportunity tracking.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, NOT NULL, FK) - References `auth.users.id`
- `lead_id` (UUID, FK) - References `leads.id` ON DELETE SET NULL
- `property_id` (UUID, FK) - References `re_properties.id` ON DELETE SET NULL
- `status` (deal_status ENUM, NOT NULL) - `active`, `won`, `lost`, `archived`
- `stage` (TEXT, NOT NULL) - Deal stage (e.g., `initial_contact`, `negotiation`, `under_contract`)
- `title` (TEXT, NOT NULL) - Deal title
- `estimated_value` (NUMERIC(12,2)) - Estimated deal value
- `probability` (INT) - Win probability 0-100
- `expected_close_date` (DATE)
- `next_action` (TEXT)
- `next_action_due` (TIMESTAMPTZ)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- PRIMARY KEY on `id`
- `idx_deals_user_id` on `user_id`
- `idx_deals_status` on `status`
- `idx_deals_stage` on `stage`
- `idx_deals_next_action_due` on `next_action_due` WHERE `next_action_due IS NOT NULL`
- `idx_deals_lead_id` on `lead_id` WHERE `lead_id IS NOT NULL`
- `idx_deals_property_id` on `property_id` WHERE `property_id IS NOT NULL`
- `idx_deals_user_status` composite on `(user_id, status)`
- `idx_deals_user_stage` composite on `(user_id, stage)`
- `idx_deals_user_created` composite on `(user_id, created_at DESC)`
- `idx_deals_active_next_action` partial on `(user_id, next_action_due)` WHERE `status = 'active' AND next_action_due IS NOT NULL`
- UNIQUE partial index `idx_deals_property_active_unique` on `property_id` WHERE `status = 'active' AND property_id IS NOT NULL`

**RLS Policies:**
- Users can view, insert, update, delete their own deals
- Admins can view all deals

**CHECK Constraints:**
- `probability >= 0 AND probability <= 100` (if not NULL)

**Covering Index:**
- `idx_deals_user_status_covering` on `(user_id, status)` INCLUDE `(title, estimated_value, next_action_due, created_at)`

---

#### `deal_events`
Deal timeline and activity tracking.

**Columns:**
- `id` (UUID, PK)
- `deal_id` (UUID, NOT NULL, FK) - References `deals.id` ON DELETE CASCADE
- `event_type` (TEXT, NOT NULL) - Event type (e.g., `note_added`, `status_changed`, `document_uploaded`)
- `description` (TEXT)
- `metadata` (JSONB) - Event-specific data
- `created_at` (TIMESTAMPTZ)
- `created_by` (UUID, FK) - References `auth.users.id`

**Indexes:**
- PRIMARY KEY on `id`
- `idx_deal_events_deal_id` on `deal_id`
- `idx_deal_events_created_at` on `created_at DESC`
- `idx_deal_events_metadata_gin` GIN index on `metadata`

**RLS Policies:**
- Users can view events for their own deals
- Access control via deal ownership (subquery checks `deals.user_id`)

---

### 5. AI & Automation Domain

**Naming Convention:** `ai_jobs`
**Security:** User-scoped RLS policies

#### `ai_jobs`
AI processing job queue.

**Columns:**
- `id` (UUID, PK)
- `deal_id` (UUID, FK) - References `deals.id`
- `job_type` (TEXT, NOT NULL) - Job type (e.g., `document_analysis`, `property_valuation`)
- `status` (job_status ENUM, NOT NULL) - `queued`, `running`, `succeeded`, `failed`, `cancelled`
- `input_data` (JSONB) - Job input parameters
- `output_data` (JSONB) - Job results
- `error_message` (TEXT) - Error details if failed
- `attempts` (INT, DEFAULT 0) - Retry count
- `created_at` (TIMESTAMPTZ)
- `started_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)

**Indexes:**
- PRIMARY KEY on `id`
- `idx_ai_jobs_deal_id` on `deal_id`
- `idx_ai_jobs_status` on `status`
- `idx_ai_jobs_created_at` on `created_at DESC`
- `idx_ai_jobs_pending` partial on `created_at DESC` WHERE `status IN ('queued', 'failed')`

**RLS Policies:**
- Users can view AI jobs for their own deals
- Access control via deal ownership (subquery checks `deals.user_id`)

---

### 6. System Domain

**Naming Convention:** ALL tables use `system_*` prefix
**Security:** Admin-only or public read access

#### `system_logs`
Application and system event logs.

**Columns:**
- `id` (UUID, PK)
- `level` (TEXT, NOT NULL) - Log level: `debug`, `info`, `warning`, `error`, `critical`
- `source` (TEXT, NOT NULL) - Log source (e.g., `migration`, `edge-function`, `trigger`)
- `message` (TEXT, NOT NULL)
- `details` (JSONB) - Additional log data
- `created_at` (TIMESTAMPTZ, DEFAULT NOW())

**Indexes:**
- PRIMARY KEY on `id`
- `idx_system_logs_level` on `level`
- `idx_system_logs_created_at` on `created_at DESC`
- `idx_system_logs_recent` partial on `(created_at DESC, level)` WHERE `created_at > NOW() - INTERVAL '7 days'`

**RLS Policies:**
- Admins can view all logs
- Regular users have no access (admin-only table)

---

## ENUM Types

All ENUM types were created in Phase 4 to replace TEXT + CHECK constraint patterns.

### User & Auth
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin', 'support', 'standard');
```

### Deals
```sql
CREATE TYPE deal_status AS ENUM ('active', 'won', 'lost', 'archived');
```

### Leads
```sql
CREATE TYPE lead_status AS ENUM ('new', 'active', 'qualified', 'unqualified', 'closed');
CREATE TYPE opt_status AS ENUM ('opted_in', 'opted_out', 'pending');
```

### Documents
```sql
CREATE TYPE document_type AS ENUM (
  -- Research phase
  'inspection', 'appraisal', 'title_search', 'survey', 'photo', 'comp',
  -- Transaction phase
  'offer', 'counter_offer', 'purchase_agreement', 'addendum',
  'closing_statement', 'hud1', 'deed', 'contract',
  -- Other
  'receipt', 'other'
);

CREATE TYPE lead_document_type AS ENUM (
  'id', 'tax_return', 'bank_statement', 'w9', 'death_cert', 'poa', 'other'
);
```

### Messages
```sql
CREATE TYPE message_channel AS ENUM ('sms', 'email', 'voice');
CREATE TYPE message_direction AS ENUM ('incoming', 'outgoing');
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'failed', 'pending', 'read');
```

### AI Jobs
```sql
CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');
```

---

## Migrations Summary

**Phase 1: Critical Security**
- `20260116_add_rls_api_keys.sql` - RLS policies for API keys
- `20260116_add_rls_profiles.sql` - RLS policies for profiles
- `20260116_add_rls_user_plans.sql` - RLS policies for user plans
- `20260116_create_core_tables.sql` - Created `deals`, `leads`, `re_properties`, `re_documents`

**Phase 2: Sprint 1 Completion**
- `20260117_lead_documents.sql` - Created `re_lead_documents` table
- `20260117_property_documents_junction.sql` - Created `re_property_documents` junction table

**Phase 4: Performance & Quality**
- `20260118_add_enum_types.sql` - Replaced TEXT+CHECK with PostgreSQL ENUMs
- `20260118_add_composite_indexes.sql` - Added 24 performance indexes
- `20260118_add_unique_constraints.sql` - Added UNIQUE, NOT NULL, and CHECK constraints

**Phase 5: Testing**
- `20260118_install_pgtap.sql` - Installed pgTAP testing framework

**Total Migrations:** 10
**Total Tables:** 13 (documented in this file)
**Total Indexes:** 80+ (including unique, composite, partial, GIN, and expression indexes)
**Total RLS Policies:** 50+ (across all user-scoped tables)

---

## Related Documentation

- [DATABASE_NAMING_CONVENTIONS.md](./DATABASE_NAMING_CONVENTIONS.md) - Naming standards and patterns
- [RLS_SECURITY_MODEL.md](./RLS_SECURITY_MODEL.md) - Row Level Security implementation

---

**Last Review:** 2026-01-15
**Maintainer:** Zone A Team (Backend & Database)
