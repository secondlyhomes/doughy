# Database Tools

Comprehensive database migration and seeding tools for Supabase.

## Quick Start

```bash
# Migrations
npm run db:migrate              # Run pending migrations
npm run db:migrate create name  # Create new migration
npm run db:migrate status       # Check migration status

# Seeding
npm run db:seed                 # Seed with test data
npm run db:seed users           # Seed specific table
npm run db:seed clear           # Clear all data
```

## Migration Tool

### Commands

#### Run Migrations

Apply all pending migrations:

```bash
npm run db:migrate
# or
npm run db:migrate up
```

**What it does:**
1. Checks if Supabase is running (starts if not)
2. Runs `supabase db reset` (applies all migrations)
3. Prompts to generate TypeScript types

**Output:**
```
🗄️  Database Migration Tool

Running migrations...

✅ Migrations complete!
? Generate TypeScript types? (Y/n)
```

#### Check Status

View migration status:

```bash
npm run db:migrate status
```

**Output:**
```
Migration Status:

Local Migrations: 3

Migrations:
  01. create users table
      supabase/migrations/20260207120000_create_users_table.sql
  02. add tasks table
      supabase/migrations/20260207120100_add_tasks_table.sql
  03. add rls policies
      supabase/migrations/20260207120200_add_rls_policies.sql

Supabase Status:
  ✓ Running
```

#### Create Migration

Create a new migration file:

```bash
npm run db:migrate create add_users_table
```

**What it does:**
1. Creates timestamped SQL file in `supabase/migrations/`
2. Includes helpful template with examples

**File created:**
```
supabase/migrations/20260207123045_add_users_table.sql
```

**Template:**
```sql
-- Migration: add users table
-- Created: 2026-02-07T12:30:45.000Z

-- Example: Create a table
create table users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  created_at timestamp with time zone default now()
);

-- Example: Enable RLS
alter table users enable row level security;

-- Example: Create policy
create policy "Users are viewable by owner"
  on users for select
  using (auth.uid() = id);
```

#### Rollback

Rollback the last migration:

```bash
npm run db:migrate rollback
# or
npm run db:migrate down
```

**Confirmation required:**
```
⚠️  Rollback Migration

Last migration: add rls policies
? This will rollback the last migration. Continue? (y/N)
```

**What it does:**
1. Deletes the last migration file
2. Runs `supabase db reset` to re-apply remaining migrations

#### Reset Database

**⚠️ DESTRUCTIVE - Development only!**

Reset database to clean state:

```bash
npm run db:migrate reset
```

**Double confirmation required:**
```
⚠️  RESET DATABASE

This will delete ALL data and re-run migrations.

? Are you absolutely sure? (y/N) y
? Type "RESET" to confirm: RESET

Resetting database...
✅ Database reset complete!
? Seed database with test data? (Y/n)
```

#### List Migrations

List all migration files:

```bash
npm run db:migrate list
```

**Output:**
```
Found 3 migrations:

01. create users table
    20260207120000
    supabase/migrations/20260207120000_create_users_table.sql

02. add tasks table
    20260207120100
    supabase/migrations/20260207120100_add_tasks_table.sql

03. add rls policies
    20260207120200
    supabase/migrations/20260207120200_add_rls_policies.sql
```

### Migration Workflow

#### 1. Create Feature Migration

```bash
# Create migration for new feature
npm run db:migrate create add_tasks_table
```

#### 2. Write Schema

Edit `supabase/migrations/TIMESTAMP_add_tasks_table.sql`:

```sql
-- Create tasks table
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text check (status in ('todo', 'in_progress', 'done')),
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Enable RLS
alter table tasks enable row level security;

-- Policies
create policy "Users can view own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete
  using (auth.uid() = user_id);

-- Indexes
create index tasks_user_id_idx on tasks(user_id);
create index tasks_status_idx on tasks(status);

-- Trigger for updated_at
create trigger update_tasks_updated_at
  before update on tasks
  for each row
  execute function update_updated_at_column();
```

#### 3. Run Migration

```bash
npm run db:migrate
```

#### 4. Generate Types

```bash
npm run gen:types
```

Now TypeScript types are available:

```tsx
import { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']
```

### Best Practices

#### 1. Naming Conventions

Use descriptive, action-based names:

```bash
# ✅ Good
npm run db:migrate create add_users_table
npm run db:migrate create add_email_to_profiles
npm run db:migrate create create_tasks_indexes

# ❌ Avoid
npm run db:migrate create users
npm run db:migrate create update
npm run db:migrate create changes
```

#### 2. One Concern Per Migration

Keep migrations focused:

```bash
# ✅ Good
npm run db:migrate create add_tasks_table
npm run db:migrate create add_tasks_rls_policies
npm run db:migrate create add_tasks_indexes

# ❌ Avoid
npm run db:migrate create everything_for_tasks
```

#### 3. Always Enable RLS

Never skip Row Level Security:

```sql
-- ✅ Always do this
create table tasks (...);
alter table tasks enable row level security;

-- ❌ Never skip RLS
create table tasks (...);
-- Missing: alter table tasks enable row level security;
```

#### 4. Test Before Committing

```bash
# Create migration
npm run db:migrate create add_feature

# Edit migration
# ...

# Test
npm run db:migrate
npm run gen:types
npm test

# Commit
git add supabase/migrations/
git commit -m "feat: add feature migration"
```

#### 5. Never Edit Applied Migrations

Once committed and deployed, create new migrations instead:

```bash
# ❌ Don't edit existing migration
vim supabase/migrations/20260207120000_add_users.sql

# ✅ Create new migration
npm run db:migrate create fix_users_table
```

## Seeding Tool

### Commands

#### Seed All Tables

Seed database with test data:

```bash
npm run db:seed
```

**Interactive:**
```
🌱 Database Seeding Tool

? Select tables to seed:
❯◉ Users
 ◉ Tasks

✅ Seed file created: supabase/seed.sql
? Run seed now? (Y/n)
```

#### Seed Specific Table

```bash
npm run db:seed users
```

**Output:**
```
Seeding Users...
✅ Users seeded!
   2 rows inserted
```

#### Clear Data

Clear all data:

```bash
npm run db:seed clear
```

**Confirmation required:**
```
⚠️  Clear Database

This will delete ALL data from ALL tables
? Continue? (y/N)
```

Clear specific table:

```bash
npm run db:seed clear users
```

#### Generate Seed File

Export current data to seed files:

```bash
npm run db:seed generate
```

**Output:**
```
Generate Seed File

This will export current database data to seed file
? Continue? (Y/n) y

Exporting Users...
✅ Users exported
   scripts/db/seed-data/users.sql

Exporting Tasks...
✅ Tasks exported
   scripts/db/seed-data/tasks.sql

✅ Seed data generated!

Location: scripts/db/seed-data
```

#### List Templates

View available seed templates:

```bash
npm run db:seed list
```

**Output:**
```
Available Seed Templates:

users (Users)
  Table: profiles
  Rows: 2

tasks (Tasks)
  Table: tasks
  Rows: 3
```

### Seed Data Templates

Templates are defined in `scripts/db/seed.js`:

```js
const SEED_TEMPLATES = {
  users: {
    name: 'Users',
    table: 'profiles',
    data: [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'user1@example.com',
        full_name: 'Test User 1',
      },
      // ...
    ],
  },
  tasks: {
    name: 'Tasks',
    table: 'tasks',
    data: [
      {
        title: 'Complete documentation',
        status: 'todo',
        user_id: '00000000-0000-0000-0000-000000000001',
      },
      // ...
    ],
  },
}
```

### Adding Custom Seed Data

Edit `scripts/db/seed.js` to add new templates:

```js
const SEED_TEMPLATES = {
  // ... existing templates

  products: {
    name: 'Products',
    table: 'products',
    data: [
      {
        name: 'Product 1',
        price: 29.99,
        description: 'Test product',
      },
      {
        name: 'Product 2',
        price: 49.99,
        description: 'Another test product',
      },
    ],
  },
}
```

Then seed:

```bash
npm run db:seed products
```

### Workflow

#### Development Workflow

```bash
# 1. Reset database
npm run db:migrate reset

# 2. Seed with test data
npm run db:seed

# 3. Develop and test
npm start

# 4. Clear data when done
npm run db:seed clear
```

#### Testing Workflow

```bash
# 1. Ensure clean state
npm run db:migrate reset

# 2. Seed test data
npm run db:seed

# 3. Run tests
npm test

# 4. Clean up
npm run db:seed clear
```

## Package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "db:migrate": "node scripts/db/migrate.js",
    "db:migrate:status": "node scripts/db/migrate.js status",
    "db:migrate:create": "node scripts/db/migrate.js create",
    "db:migrate:rollback": "node scripts/db/migrate.js rollback",
    "db:migrate:reset": "node scripts/db/migrate.js reset",
    "db:migrate:list": "node scripts/db/migrate.js list",

    "db:seed": "node scripts/db/seed.js",
    "db:seed:clear": "node scripts/db/seed.js clear",
    "db:seed:generate": "node scripts/db/seed.js generate",
    "db:seed:list": "node scripts/db/seed.js list",

    "db:reset": "npm run db:migrate reset && npm run db:seed"
  }
}
```

## Environment Setup

### Prerequisites

1. **Supabase CLI** installed:
```bash
npm install -g supabase
```

2. **Supabase project** initialized:
```bash
supabase init
```

3. **Local Supabase** running:
```bash
supabase start
```

### Configuration

Environment variables in `.env.local`:

```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
```

## Troubleshooting

### Supabase CLI Not Found

```
❌ Supabase CLI not found

Install with:
  npm install -g supabase
```

**Solution:**
```bash
npm install -g supabase
```

### Supabase Not Running

```
⚠️  Local Supabase not running
? Start Supabase now? (Y/n)
```

**Solution:**
Choose `Y` or run manually:
```bash
supabase start
```

### Migration Failed

```
❌ Migration failed: syntax error at or near "users"
```

**Solutions:**
1. Check SQL syntax in migration file
2. Ensure all referenced tables exist
3. Verify column types are correct
4. Check for missing commas or semicolons

### Type Generation Failed

```
⚠️  Type generation failed
Run manually: npm run gen:types
```

**Solutions:**
1. Ensure `SUPABASE_PROJECT_ID` is set in `.env.local`
2. Check Supabase is running
3. Run manually: `npm run gen:types`

## Related Documentation

- [Supabase Tables Pattern](../../docs/patterns/SUPABASE-TABLE.md)
- [Database Schema Best Practices](../../docs/03-database/SCHEMA-BEST-PRACTICES.md)
- [Security Checklist](../../docs/09-security/SECURITY-CHECKLIST.md)
- [Supabase Docs](https://supabase.com/docs)

## Examples

See `examples/migrations/` for:
- User table migration
- Tasks table migration
- RLS policies
- Indexes and triggers
- Seed data
