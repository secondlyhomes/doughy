# Database Naming Conventions

**Last Updated**: 2026-01-29
**Lead DBA**: Claude (Opus 4.5)
**Status**: Comprehensive standards including ENUM requirements, boolean prefixes, plurality rules

---

## Overview

This document establishes naming standards for database tables, columns, indexes, and constraints across the Doughy AI application. These conventions ensure consistency, readability, and maintainability.

**Key Decision**: We are **NOT renaming existing tables** to avoid breaking changes. New tables should follow the documented patterns within each domain.

---

## Table Naming Patterns

### Exception: Root Entities

Root entities may remain unprefixed when **ALL** of these conditions are met:

1. **Globally unique and unambiguous** - The name clearly represents a single, well-defined concept (e.g., `deals`, `workspaces`)
2. **Primary object of their domain** - They represent the main entity, not a supporting table
3. **Prefixing would create redundancy** - Adding a prefix would result in awkward repetition (e.g., `deal_deals`, `workspace_workspaces`)

#### Examples of Root Entities

**✅ Correct unprefixed roots:**
- `deals` (root entity) + `deal_events` (prefixed child)
- `workspaces` (root entity) + `workspace_members` (prefixed child)

**Why these work:**
- Short, clear, and unambiguous
- The root IS the domain name
- Child tables use the parent as prefix
- Unlikely to collide with future features

**❌ Would be incorrect:**
- `deal_deals` - redundant
- `workspace_workspaces` - redundant
- `messages` without prefix - too generic, would collide

#### When to Use Domain Prefixes

Use domain prefixes when:
- **The name is generic** and needs context (e.g., `messages` → `comms_messages`)
- **The name could collide** with future features (e.g., `profiles` → `user_profiles`)
- **Grouping related tables** is valuable for clarity (e.g., `user_*`, `system_*`, `re_*`)

#### Industry Precedent

This pattern is common in well-designed production schemas:

**Stripe:**
- `customers` (unprefixed root) + `customer_tax_ids` (prefixed child)
- `subscriptions` (unprefixed root) + `subscription_items` (prefixed child)

**GitHub:**
- `repositories` (unprefixed root) + `repository_collaborators` (prefixed child)
- `users` (unprefixed root) + `user_emails` (prefixed child)

#### Guardrail

**⚠️ No new root entities may be added without DBA approval.**

This prevents "exception creep" where developers add unprefixed tables because "my table is important too." The current list (`deals`, `workspaces`) should remain fixed unless a truly top-level object is introduced (e.g., `organizations`, `projects`).

---

### Table Plurality (REQUIRED: Plural)

**All table names MUST be plural.** This is a PostgreSQL/Rails convention that improves readability.

| ✅ Correct | ❌ Wrong |
|-----------|----------|
| `deals` | `deal` |
| `crm_leads` | `crm_lead` |
| `rental_bookings` | `rental_booking` |
| `user_profiles` | `user_profile` |

**Why plural:**
- Tables contain multiple rows (plural makes semantic sense)
- Matches Rails/ActiveRecord convention
- Distinguishes tables from types/enums (which are singular)
- Industry standard (Stripe, GitHub, etc. all use plural)

**Current violations to fix:**
- `booking` → `bookings` (or `rental_bookings` for consistency)

### Current Patterns (Keep As-Is)

#### 1. Auth/User Domain
**Pattern**: No prefix (historical) or `user_*` for new tables

| Table | Purpose | Status |
|-------|---------|--------|
| `profiles` | User profiles and roles | ✅ Existing |
| `api_keys` | Encrypted API credentials | ✅ Existing |
| `user_plans` | Subscription/billing plans | ✅ Existing |

**Future tables in this domain**: Use `user_*` prefix
```sql
CREATE TABLE user_sessions (...);
CREATE TABLE user_preferences (...);
CREATE TABLE user_notifications (...);
```

---

#### 2. CRM Domain
**Pattern**: `crm_*` prefix (REQUIRED for all CRM tables)

| Table | Purpose | Status |
|-------|---------|--------|
| `crm_leads` | Sales leads/prospects | ✅ Existing |
| `crm_contacts` | Contact records (guests, tenants, vendors) | ✅ Existing |
| `crm_lead_contacts` | Lead-contact junction | ✅ Existing |
| `crm_lead_notes` | Notes on leads | ✅ Existing |

**Future tables in this domain**: MUST use `crm_*` prefix
```sql
CREATE TABLE crm_lead_tags (...);
CREATE TABLE crm_contact_history (...);
```

---

#### 2b. Communications Domain
**Pattern**: `comms_*` prefix (REQUIRED for messaging/communication tables)

| Table | Purpose | Status |
|-------|---------|--------|
| `comms_messages` | Communication history | ✅ Existing |
| `comms_email_logs` | Email send logs | ✅ Existing |
| `comms_scheduled_messages` | Scheduled outbound messages | ✅ Existing |

**Future tables in this domain**: MUST use `comms_*` prefix
```sql
CREATE TABLE comms_templates (...);
CREATE TABLE comms_delivery_status (...);
```

---

#### 3. Real Estate Domain
**Pattern**: `re_*` prefix (REQUIRED for all real estate tables)

| Table | Purpose | Status |
|-------|---------|--------|
| `re_properties` | Property listings | ✅ Existing |
| `re_documents` | Property documents | ✅ Existing |
| `re_lead_documents` | Seller/lead documents | ✅ Existing |
| `re_property_documents` | Property-document junction | ✅ Existing |
| `re_comps` | Comparable sales | ✅ Existing |
| `re_property_analyses` | Property analyses | ✅ Existing |
| `re_financing_scenarios` | Financing options | ✅ Existing |
| `re_repair_estimates` | Repair cost estimates | ✅ Existing |
| `re_property_images` | Property photos | ✅ Existing |

**Future tables in this domain**: MUST use `re_*` prefix
```sql
CREATE TABLE re_portfolio_valuations (...);
CREATE TABLE re_market_trends (...);
CREATE TABLE re_inspection_reports (...);
```

---

#### 3b. Rental/Landlord Domain
**Pattern**: `rental_*` prefix (REQUIRED for all Landlord platform tables)

This domain supports the Landlord platform for medium-term rental management.

| Table | Purpose | Status |
|-------|---------|--------|
| `rental_properties` | Rental property listings | ✅ Existing |
| `rental_rooms` | Room-by-room management | ✅ Existing |
| `rental_bookings` | Guest reservations | ✅ Existing |
| `rental_conversations` | Guest communication threads | ✅ Existing |
| `rental_messages` | Individual messages in threads | ✅ Existing |
| `rental_ai_queue` | AI response suggestions queue | ✅ Existing |
| `rental_integrations` | Platform integrations (Airbnb, etc.) | ✅ Existing |
| `rental_templates` | Response templates | ✅ Existing |

**Relationship to RE domain**:
- `re_properties` = Deal research properties (RE Investor platform)
- `rental_properties` = Rental listings (Landlord platform)

These are **separate tables** serving different use cases.

**Future tables in this domain**: MUST use `rental_*` prefix
```sql
CREATE TABLE rental_availability (...);
CREATE TABLE rental_pricing_rules (...);
CREATE TABLE rental_reviews (...);
```

---

#### 3c. Investor Domain
**Pattern**: `investor_*` prefix (REQUIRED for all investor communication/CRM tables)

This domain supports the Investor platform for lead communication and follow-ups.

| Table | Purpose | Status |
|-------|---------|--------|
| `investor_conversations` | Lead conversation threads | ✅ Existing |
| `investor_messages` | Individual messages in threads | ✅ Existing |
| `investor_ai_queue` | AI response suggestions queue | ✅ Existing |
| `investor_ai_response_outcomes` | AI response outcome tracking | ✅ Existing |
| `investor_campaigns` | Outreach campaigns | ✅ Existing |
| `investor_outreach_templates` | Email/SMS templates | ✅ Existing |
| `investor_agents` | Follow-up agents | ✅ Existing |
| `investor_follow_ups` | Scheduled follow-ups | ✅ Existing |

**Future tables in this domain**: MUST use `investor_*` prefix

---

#### 3d. Drip Campaign Domain
**Pattern**: `drip_*` prefix (REQUIRED for all drip campaign tables)

This domain supports automated multi-channel outreach campaigns.

| Table | Purpose | Status |
|-------|---------|--------|
| `drip_campaigns` | Campaign definitions (via investor_campaigns) | ✅ Existing |
| `drip_campaign_steps` | Campaign step definitions | ✅ Existing |
| `drip_enrollments` | Contact enrollment in campaigns | ✅ Existing |
| `drip_touch_log` | Log of sent touches | ✅ Existing |

**Future tables in this domain**: MUST use `drip_*` prefix

---

#### 3e. MoltBot AI Domain
**Pattern**: `moltbot_*` prefix (REQUIRED for all AI/ML tables)

This domain supports the MoltBot AI assistant features.

| Table | Purpose | Status |
|-------|---------|--------|
| `moltbot_user_memory` | User preference memory | ✅ Existing |
| `moltbot_episodic_memory` | Contact interaction memory | ✅ Existing |
| `moltbot_knowledge_sources` | Knowledge base sources | ✅ Existing |
| `moltbot_knowledge_chunks` | Vectorized knowledge chunks | ✅ Existing |
| `moltbot_sync_history` | Sync operation history | ✅ Existing |
| `moltbot_security_events` | Security event logging | ✅ Existing |
| `moltbot_ip_blocks` | IP block list | ✅ Existing |
| `moltbot_rate_limits` | Rate limiting records | ✅ Existing |
| `moltbot_blocked_patterns` | Content filter patterns | ✅ Existing |
| `moltbot_email_analysis` | Email analysis cache | ✅ Existing |
| `moltbot_learning_queue` | Learning opportunity queue | ✅ Existing |

**Future tables in this domain**: MUST use `moltbot_*` prefix

---

#### 3f. Seam Smart Lock Domain
**Pattern**: `seam_*` prefix (REQUIRED for all smart lock integration tables)

This domain supports Seam API integration for smart lock management.

| Table | Purpose | Status |
|-------|---------|--------|
| `seam_devices` | Connected smart lock devices | ✅ Existing |
| `seam_access_codes` | Guest access codes | ✅ Existing |
| `seam_lock_events` | Lock event audit log | ✅ Existing |

**Future tables in this domain**: MUST use `seam_*` prefix

---

#### 3g. Property Operations Domain
**Pattern**: `property_*` prefix (REQUIRED for property management operations)

This domain supports rental property operations (inventory, maintenance, turnovers).

| Table | Purpose | Status |
|-------|---------|--------|
| `property_inventory` | Inventory items | ✅ Existing |
| `property_maintenance` | Maintenance records | ✅ Existing |
| `property_vendors` | Vendor contacts | ✅ Existing |
| `property_turnovers` | Turnover checklists | ✅ Existing |

**Future tables in this domain**: MUST use `property_*` prefix

---

#### 4. Deal Domain
**Pattern**: `deal_*` prefix OR no prefix (mixed historical)

| Table | Purpose | Status |
|-------|---------|--------|
| `deals` | Deal pipeline | ✅ Existing |
| `deal_events` | Deal timeline/audit | ✅ Existing |
| `ai_jobs` | AI processing jobs | ✅ Existing |

**Future tables in this domain**: Use `deal_*` prefix for clarity
```sql
CREATE TABLE deal_notes (...);
CREATE TABLE deal_attachments (...);
CREATE TABLE deal_stages (...);
```

**⚠️ NAMING INCONSISTENCY IDENTIFIED** (Pre-Production)

The Deal domain currently has an inconsistency:
- `deals` table has NO prefix (legacy naming)
- `deal_events` table HAS `deal_` prefix (follows convention)

This breaks the established pattern seen in Real Estate domain where ALL tables have the domain prefix (e.g., `re_properties`, `re_documents`, `re_comps`).

**Impact if we standardize:**
- 15+ foreign key relationships to update
- Multiple code files using `.from('deals')` queries
- RLS policies to recreate
- React Query cache keys to update

**Two options before production launch:**

**Option A: Standardize Now (Recommended for pre-production)**
- Rename `deals` → `deal_pipeline` (semantically clearer than `deal_deals`)
- Update all 15+ FK references, code files, queries
- Achieve 100% naming consistency across all domains
- See detailed migration plan in `/Users/dinosaur/.claude/plans/streamed-wandering-peach.md`

**Option B: Document Exception (Faster, less risk)**
- Keep `deals` as-is
- Document as legacy exception in this file
- Commit to `deal_*` prefix for ALL future tables
- Accept permanent inconsistency

**Decision Status**: Pending - Documented for review before production launch

---

#### 5. System/Admin Domain
**Pattern**: `system_*` prefix (REQUIRED)

| Table | Purpose | Status |
|-------|---------|--------|
| `system_logs` | Application logs | ✅ Existing |
| `feature_flags` | Feature toggles | ✅ Existing |
| `rate_limits` | API rate limiting | ✅ Existing |
| `usage_logs` | Usage tracking | ✅ Existing |

**Future tables in this domain**: MUST use `system_*` prefix
```sql
CREATE TABLE system_audit_trail (...);
CREATE TABLE system_health_checks (...);
CREATE TABLE system_config (...);
```

---

## Column Naming Standards

### Primary Keys
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```
**Pattern**: Always `id` (UUID type)

### Foreign Keys
```sql
user_id UUID REFERENCES auth.users(id)
lead_id UUID REFERENCES leads(id)
property_id UUID REFERENCES re_properties(id)
```
**Pattern**: `{table_name}_id`

### Timestamps
```sql
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()
deleted_at TIMESTAMPTZ  -- For soft deletes
```
**Pattern**: `{action}_at` (always `TIMESTAMPTZ`)

### Boolean Flags
```sql
is_deleted BOOLEAN DEFAULT FALSE
is_primary BOOLEAN DEFAULT FALSE
is_active BOOLEAN DEFAULT TRUE
```
**Pattern**: `is_{adjective}` or `has_{noun}`

### Status/State Fields
```sql
status TEXT CHECK(status IN ('active', 'inactive', 'archived'))
opt_status TEXT CHECK(opt_status IN ('opted_in', 'opted_out', 'pending'))
```
**Pattern**: `{context}_status` or just `status`
**Note**: Consider using PostgreSQL ENUMs for better type safety

### JSONB Columns
```sql
metadata JSONB DEFAULT '{}'::JSONB
preferences JSONB
input_json JSONB
result_json JSONB
```
**Pattern**: `{context}_json` or `metadata` or `{context}_data`

### Numeric Fields
```sql
price NUMERIC(12,2)          -- Currency
score INT                     -- Scores/ratings
probability INT               -- Percentage (0-100)
```
**Pattern**: Descriptive names without type suffixes

---

## Index Naming Standards

### Single Column Indexes
```sql
CREATE INDEX idx_{table}_{column} ON {table}({column});
```
**Example**:
```sql
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
```

### Composite Indexes
```sql
CREATE INDEX idx_{table}_{col1}_{col2} ON {table}({col1}, {col2});
```
**Example**:
```sql
CREATE INDEX idx_deals_user_status ON deals(user_id, status);
CREATE INDEX idx_leads_user_created ON leads(user_id, created_at DESC);
```

### Partial Indexes
```sql
CREATE INDEX idx_{table}_{column}_{condition} ON {table}({column}) WHERE {condition};
```
**Example**:
```sql
CREATE INDEX idx_leads_active ON leads(user_id) WHERE status = 'active' AND is_deleted = FALSE;
CREATE INDEX idx_deals_next_action ON deals(next_action_due) WHERE next_action_due IS NOT NULL;
```

### Unique Indexes
```sql
CREATE UNIQUE INDEX idx_{table}_{column}_unique ON {table}({column});
```
**Example**:
```sql
CREATE UNIQUE INDEX idx_api_keys_user_service ON api_keys(user_id, service);
CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);
```

---

## Constraint Naming Standards

### Foreign Key Constraints
```sql
CONSTRAINT fk_{table}_{column} FOREIGN KEY ({column}) REFERENCES {ref_table}(id)
```
**Example**:
```sql
CONSTRAINT fk_deals_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id)
```
**Note**: Supabase/PostgreSQL auto-generates FK constraint names, so explicit naming is optional.

### Check Constraints
```sql
CONSTRAINT check_{table}_{column}_{condition} CHECK ({condition})
```
**Example**:
```sql
CONSTRAINT check_deals_status CHECK(status IN ('active', 'won', 'lost', 'archived'))
CONSTRAINT check_leads_score CHECK(score >= 0 AND score <= 100)
```

### Unique Constraints
```sql
CONSTRAINT unique_{table}_{column} UNIQUE ({column})
```
**Example**:
```sql
CONSTRAINT unique_profiles_email UNIQUE (email)
```

---

## PostgreSQL Enum Types

### When to Use ENUMs (REQUIRED)

**ALWAYS use ENUMs for status/state columns.** TEXT columns for status values are NOT allowed for new tables.

| Use Case | ENUM | TEXT |
|----------|------|------|
| Status columns | ✅ Required | ❌ Not allowed |
| Channel types | ✅ Required | ❌ Not allowed |
| Role types | ✅ Required | ❌ Not allowed |
| Free-form user input | ❌ Wrong tool | ✅ Correct |
| Dynamic/configurable values | ❌ Wrong tool | ✅ Correct |

**Why ENUMs are mandatory:**
1. **Type safety** - Invalid values are rejected at the database level
2. **Self-documenting** - Schema defines all valid options
3. **Performance** - Stored as integers, faster comparisons
4. **TypeScript integration** - Generated types match exactly
5. **Data integrity** - No typos, no inconsistent casing

### Naming Conventions

#### ENUM Type Names
```sql
-- Pattern: {domain}_{concept}
CREATE TYPE deal_status AS ENUM (...);
CREATE TYPE lead_source AS ENUM (...);
CREATE TYPE rental_channel AS ENUM (...);
CREATE TYPE booking_status AS ENUM (...);
```

**Rules:**
- Use snake_case
- Use singular form (`deal_status` not `deal_statuses`)
- Domain prefix when needed for clarity (`rental_channel` vs `investor_channel`)
- No `_enum` suffix (redundant)

#### ENUM Values
```sql
-- Pattern: lowercase, underscores for multi-word
CREATE TYPE deal_status AS ENUM (
  'new',
  'active',
  'under_contract',
  'closed_won',
  'closed_lost',
  'archived'
);
```

**Rules:**
- All lowercase
- Use underscores for multi-word values (`under_contract`)
- Alphabetical order when no logical sequence exists
- Logical order when sequence matters (pipeline stages)

### Standard ENUM Definitions

The following ENUMs are defined for the Doughy application:

#### Deal/CRM Domain
```sql
CREATE TYPE deal_status AS ENUM (
  'new', 'qualifying', 'analyzing', 'negotiating',
  'under_contract', 'closed_won', 'closed_lost', 'archived'
);

CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'unqualified',
  'converted', 'dead'
);

CREATE TYPE lead_source AS ENUM (
  'driving_for_dollars', 'propstream', 'zillow',
  'referral', 'cold_call', 'direct_mail', 'other'
);
```

#### Rental/Landlord Domain
```sql
CREATE TYPE rental_channel AS ENUM (
  'email', 'sms', 'whatsapp', 'phone',
  'airbnb', 'vrbo', 'booking_com', 'direct'
);

CREATE TYPE booking_status AS ENUM (
  'inquiry', 'pending', 'confirmed', 'checked_in',
  'checked_out', 'cancelled', 'no_show'
);

CREATE TYPE property_status AS ENUM (
  'active', 'inactive', 'maintenance', 'archived'
);
```

#### Communication Domain
```sql
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'read');
CREATE TYPE sender_type AS ENUM ('user', 'ai', 'system', 'guest');
```

#### AI Domain
```sql
CREATE TYPE ai_queue_status AS ENUM (
  'pending', 'processing', 'ready_for_review',
  'approved', 'rejected', 'sent', 'expired'
);

CREATE TYPE ai_outcome AS ENUM (
  'approved_as_is', 'approved_with_edits',
  'rejected', 'ignored'
);
```

### Adding New ENUM Values

When you need to add a new value to an existing ENUM:

```sql
-- Add a new value (simple case)
ALTER TYPE deal_status ADD VALUE 'on_hold';

-- Add value in specific position
ALTER TYPE deal_status ADD VALUE 'on_hold' BEFORE 'archived';
ALTER TYPE deal_status ADD VALUE 'reviewing' AFTER 'analyzing';
```

**Important notes:**
- `ADD VALUE` cannot be run inside a transaction (in Supabase migrations, this is handled automatically)
- New values are added at the end by default
- Position matters if you use `<` or `>` comparisons on enum columns

### Converting TEXT to ENUM

When migrating existing TEXT columns to ENUM:

```sql
-- Step 1: Create the enum type
CREATE TYPE deal_status AS ENUM ('new', 'active', 'won', 'lost', 'archived');

-- Step 2: Add temporary column
ALTER TABLE deals ADD COLUMN status_new deal_status;

-- Step 3: Migrate data (handle invalid values)
UPDATE deals SET status_new = status::deal_status
WHERE status IN ('new', 'active', 'won', 'lost', 'archived');

-- Step 4: Handle any invalid data
UPDATE deals SET status_new = 'archived'
WHERE status_new IS NULL;

-- Step 5: Swap columns
ALTER TABLE deals DROP COLUMN status;
ALTER TABLE deals RENAME COLUMN status_new TO status;
ALTER TABLE deals ALTER COLUMN status SET NOT NULL;
ALTER TABLE deals ALTER COLUMN status SET DEFAULT 'new';
```

### TypeScript Integration

After adding/modifying ENUMs, regenerate types:

```bash
npm run db:types
```

The generated types will include:
```typescript
// In generated.ts
export type DealStatus = 'new' | 'active' | 'won' | 'lost' | 'archived';

// Usage in code
const status: Database['public']['Enums']['deal_status'] = 'active';
```

**Best Practice**: Export enum types from a constants file:
```typescript
// src/integrations/supabase/types/constants.ts
export type DealStatus = Database['public']['Enums']['deal_status'];
export const DEAL_STATUSES: DealStatus[] = ['new', 'active', 'won', 'lost', 'archived'];
```

### Existing TEXT Columns Requiring ENUM Migration

The following TEXT columns should be migrated to ENUMs (tracked in DATABASE_AUDIT):

| Table | Column | Target ENUM |
|-------|--------|-------------|
| `deals` | `status` | `deal_status` |
| `crm_leads` | `status` | `lead_status` |
| `crm_leads` | `source` | `lead_source` |
| `rental_bookings` | `status` | `booking_status` |
| `rental_properties` | `status` | `property_status` |
| `investor_conversations` | `status` | `conversation_status` |
| `rental_ai_queue` | `status` | `ai_queue_status` |
| `ai_response_outcomes` | `outcome_type` | `ai_outcome` |

**Migration Status**: See `DATABASE_AUDIT_2026-01-29.md` for current progress.

---

## RLS Policy Naming Standards

### Pattern
```
"{Subject} can {action} {object} {condition}"
```

### Examples
```sql
CREATE POLICY "Users can view their own leads"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deals"
  ON deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all properties"
  ON re_properties FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

## Multi-Tenancy (Workspace Isolation)

### Overview

Doughy supports team collaboration via workspaces. All team-shareable tables use `workspace_id` for access control, enabling multiple users to share data within their workspace.

**Key Concepts:**
- **Workspace** = Team container (platform-agnostic)
- Same `workspace_id` works across BOTH Investor and Landlord platforms
- Teams can use one platform, the other, or both
- RLS filters by workspace_id regardless of platform

### Required Columns for Workspace Tables

All team-shareable tables MUST have:

```sql
-- Required for workspace access control
workspace_id UUID REFERENCES workspaces(id)

-- Kept for audit trail (tracks record creator)
user_id UUID REFERENCES auth.users(id)
```

**Note**: Keep `user_id` even with workspace_id. They serve different purposes:
- `workspace_id` → Access control (who can see this)
- `user_id` → Audit trail (who created this)

### Tables by Scope

| Scope | Pattern | Example Tables |
|-------|---------|----------------|
| **Workspace-scoped** | Has `workspace_id` | `landlord_*`, `investor_*`, `crm_*` |
| **User-scoped** | Only `user_id` | `user_settings`, `user_profiles`, `user_mfa_*` |
| **System-scoped** | No user/workspace | `system_*`, `billing_*`, analytics tables |

### RLS Pattern for Workspace Tables

```sql
-- Helper functions for performance (cacheable by PostgreSQL)
CREATE FUNCTION user_workspace_ids() RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE FUNCTION user_owned_workspace_ids() RETURNS SETOF UUID AS $$
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid() AND is_active = true AND role = 'owner';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Standard workspace policies
CREATE POLICY "table_workspace_select" ON table_name
  FOR SELECT USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "table_workspace_insert" ON table_name
  FOR INSERT WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "table_workspace_update" ON table_name
  FOR UPDATE USING (workspace_id IN (SELECT user_workspace_ids()));

-- DELETE restricted to workspace owners only
CREATE POLICY "table_workspace_delete" ON table_name
  FOR DELETE USING (workspace_id IN (SELECT user_owned_workspace_ids()));
```

### Role Permissions

Simple Owner + Member model:

| Action | Owner | Member |
|--------|-------|--------|
| SELECT | ✓ | ✓ |
| INSERT | ✓ | ✓ |
| UPDATE | ✓ | ✓ |
| DELETE | ✓ | ✗ |
| Invite Members | ✓ | ✗ |

### Auto-Set Trigger Pattern

Always create triggers to auto-populate `workspace_id`:

```sql
CREATE OR REPLACE FUNCTION set_workspace_id_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.workspace_id IS NULL THEN
    SELECT wm.workspace_id INTO NEW.workspace_id
    FROM workspace_members wm
    WHERE wm.user_id = COALESCE(NEW.user_id, auth.uid())
      AND wm.is_active = true
    ORDER BY wm.created_at ASC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_workspace_id_trigger
  BEFORE INSERT ON table_name
  FOR EACH ROW EXECUTE FUNCTION set_workspace_id_from_user();
```

### Index Requirements

Every `workspace_id` column MUST have:

```sql
-- Basic index for RLS performance
CREATE INDEX idx_table_workspace_id ON table_name(workspace_id);

-- Composite indexes for common query patterns
CREATE INDEX idx_table_workspace_status ON table_name(workspace_id, status);
CREATE INDEX idx_table_workspace_dates ON table_name(workspace_id, created_at DESC);
```

### Child Table Inheritance

For child tables without `user_id`, inherit `workspace_id` from parent:

```sql
-- Example: landlord_rooms inherits from landlord_properties
CREATE OR REPLACE FUNCTION set_workspace_id_from_landlord_property()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.workspace_id IS NULL AND NEW.property_id IS NOT NULL THEN
    SELECT workspace_id INTO NEW.workspace_id
    FROM landlord_properties WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### Migration Checklist for New Workspace Tables

- [ ] Add `workspace_id UUID REFERENCES workspaces(id)` column
- [ ] Keep `user_id` for audit trail
- [ ] Create index on `workspace_id`
- [ ] Create composite indexes for common queries
- [ ] Create auto-set trigger for `workspace_id`
- [ ] Update RLS policies to use workspace membership pattern
- [ ] Add column comment: `'Team workspace for multi-tenant access control'`

---

## Migration File Naming

### Pattern
```
{YYYYMMDD}_{description}.sql
```

### Examples
```
20260116_create_core_tables.sql
20260116_add_rls_api_keys.sql
20260117_lead_documents.sql
20260118_add_enum_types.sql
```

### Rollback Files
```
{YYYYMMDD}_{description}_ROLLBACK.sql
```

---

## Summary of Rules

### ✅ DO
- Use snake_case for all table and column names
- Use descriptive, full-word names (not abbreviations)
- Use domain prefixes consistently within each domain (`re_*`, `user_*`, `system_*`)
- Use `TIMESTAMPTZ` for all timestamp columns
- Use `UUID` for all primary keys
- Add indexes on all foreign keys
- Document all naming decisions

### ❌ DON'T
- Mix camelCase and snake_case
- Use abbreviations unless universally understood (e.g., `id`, `url`)
- Rename existing tables without team approval
- Use reserved SQL keywords as column names
- Create tables without proper indexes
- Skip RLS policies on user-scoped tables

---

## Exceptions & Special Cases

### Junction Tables
Pattern: `{table1}_{table2}` (alphabetically)
```sql
CREATE TABLE re_lead_properties (
  lead_id UUID REFERENCES leads(id),
  property_id UUID REFERENCES re_properties(id),
  PRIMARY KEY (lead_id, property_id)
);
```

### Audit/History Tables
Pattern: `{table}_history` or `{table}_audit`
```sql
CREATE TABLE deals_audit (
  audit_id UUID PRIMARY KEY,
  deal_id UUID,
  changed_by UUID,
  changed_at TIMESTAMPTZ,
  changes JSONB
);
```

### View Names
Pattern: `v_{purpose}` or `{table}_view`
```sql
CREATE VIEW v_active_deals AS
  SELECT * FROM deals WHERE status = 'active';
```

---

## Migration Checklist

When creating a new table, ensure:
- [ ] Table name follows domain pattern
- [ ] `id UUID PRIMARY KEY` defined
- [ ] Foreign keys use `{table}_id` pattern
- [ ] `created_at` and `updated_at` timestamps included
- [ ] Indexes created on all foreign keys
- [ ] RLS policies defined (if user-scoped)
- [ ] Check constraints for enums/validations
- [ ] Migration logged to `system_logs` table

---

## Questions?

For clarification or exceptions to these rules, consult:
- [RLS_SECURITY_MODEL.md](./RLS_SECURITY_MODEL.md) - Row Level Security patterns
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Full schema reference

**Maintained by**: Zone A (Backend Developer)
