# Database Naming Conventions

**Last Updated**: 2026-01-16
**Status**: Current naming patterns documented; no breaking changes to existing tables

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
**Pattern**: No prefix (leads, contacts, messages)

| Table | Purpose | Status |
|-------|---------|--------|
| `leads` | Sales leads/prospects | ✅ Existing |
| `contacts` | Contact records | ✅ Existing |
| `messages` | Communication history | ✅ Existing |
| `calls` | Call records | ✅ Existing |
| `transcripts` | Call transcripts | ✅ Existing |

**Future tables in this domain**: Maintain consistency (no prefix)
```sql
CREATE TABLE scheduled_messages (...);
CREATE TABLE lead_contacts (...);  -- Junction table
CREATE TABLE conversation_threads (...);
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

### Naming Pattern
```sql
CREATE TYPE {table}_{column}_enum AS ENUM ('value1', 'value2');
```

### Examples
```sql
CREATE TYPE deal_status AS ENUM ('active', 'won', 'lost', 'archived');
CREATE TYPE lead_status AS ENUM ('new', 'active', 'qualified', 'unqualified', 'closed');
CREATE TYPE message_channel AS ENUM ('sms', 'email', 'voice');
CREATE TYPE message_direction AS ENUM ('incoming', 'outgoing');
```

**Usage**:
```sql
CREATE TABLE deals (
  ...
  status deal_status NOT NULL DEFAULT 'active',
  ...
);
```

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
