# Database Seeding Feature

**Status:** Essential (Recommended for all projects)
**Cost:** FREE
**Dependencies:** Supabase CLI

## What It Does

Automatically populate your local development database with sample data:
- 👤 Test user accounts
- 📊 Example data for all tables
- 🔄 Reproducible dev environment across team

**Result:** Every developer gets the same data. `npm run db:reset` gives you fresh, known state.

## When to Enable

✅ **Enable if:**
- Working on a team (everyone needs same data)
- Testing features that need existing data
- Want reproducible development environment

❌ **Skip if:**
- Database schema not finalized yet
- Prefer manual data entry

## Installation

When you enable this feature, the setup script will:
1. Create `supabase/seeds/` folder structure
2. Add template seed files (users, profiles, example data)
3. Update `supabase/config.toml` to include seed files
4. Add npm scripts for seeding

**Time to enable:** 1-2 minutes

## Usage

### After Enabling

**Reset database with seeds:**
```bash
npm run db:reset          # Runs all migrations + seeds
```

**Seed only (no schema changes):**
```bash
npm run db:seed           # Runs seeds without migrations
```

**Create new migration:**
```bash
npx supabase migration new your_migration_name
```

**Generate TypeScript types:**
```bash
npm run db:generate       # Updates src/types/database.ts
```

### Seed Files Location

```
supabase/
├── migrations/
│   └── [timestamped migrations]
├── seed.sql                    # Main orchestrator
└── seeds/
    ├── 01-users.sql            # Test users
    ├── 02-profiles.sql         # User profiles
    ├── 03-example-data.sql     # Your app-specific data
    └── README.md
```

## Customizing Seeds

### Add New Seed File

1. Create file in `supabase/seeds/`:
```sql
-- supabase/seeds/04-tasks.sql
INSERT INTO tasks (id, title, user_id, status) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Example Task 1', '550e8400-e29b-41d4-a716-446655440000', 'pending'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Example Task 2', '550e8400-e29b-41d4-a716-446655440000', 'completed');
```

2. Update `supabase/config.toml`:
```toml
[db]
seed_sql_paths = [
  "seed.sql",
  "seeds/01-users.sql",
  "seeds/02-profiles.sql",
  "seeds/03-example-data.sql",
  "seeds/04-tasks.sql"  # Add your new file
]
```

3. Run `npm run db:reset`

### Seed File Best Practices

**✅ DO:**
- Use consistent UUIDs across seed files (easier to reference)
- Add comments explaining what data represents
- Keep seed data minimal (only what's needed for development)
- Use realistic but fake data (names, emails)

**❌ DON'T:**
- Include production data (security/privacy risk)
- Hardcode real user passwords
- Create thousands of records (slows down reset)

## Example Seed File

```sql
-- supabase/seeds/03-example-data.sql
-- Example tasks for development

-- Disable triggers for faster seeding
SET session_replication_role = replica;

-- Clear existing data (only in local dev)
DO $$
BEGIN
  IF current_database() = 'postgres' THEN
    TRUNCATE TABLE tasks CASCADE;
  END IF;
END $$;

-- Insert test data
INSERT INTO tasks (id, title, description, user_id, status, created_at) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440010',
    'Complete project setup',
    'Set up development environment and install dependencies',
    '550e8400-e29b-41d4-a716-446655440000', -- Test user ID from 01-users.sql
    'completed',
    NOW() - INTERVAL '2 days'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440011',
    'Build authentication',
    'Implement user login and registration',
    '550e8400-e29b-41d4-a716-446655440000',
    'in_progress',
    NOW() - INTERVAL '1 day'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440012',
    'Design UI mockups',
    'Create Figma designs for main screens',
    '550e8400-e29b-41d4-a716-446655440000',
    'pending',
    NOW()
  );

-- Re-enable triggers
SET session_replication_role = DEFAULT;
```

## Advanced: Snaplet for Realistic Data

For generating large amounts of realistic fake data, consider [Snaplet Seed](https://www.snaplet.dev/seed):

```bash
npm install --save-dev @snaplet/seed
npx @snaplet/seed init
```

Creates type-safe seed data generators based on your schema.

## Troubleshooting

### Seeds Not Running

```bash
# Check config
cat supabase/config.toml

# Verify seed files exist
ls supabase/seeds/

# Run manually
npx supabase db reset
```

### Foreign Key Errors

Ensure seed files run in correct order:
1. First: Tables with no dependencies (users)
2. Then: Tables that reference others (profiles, tasks)

Update `seed_sql_paths` order in `config.toml`.

### Data Persisting Between Resets

`npm run db:reset` should clear all data. If not:

```sql
-- Add to seed.sql
TRUNCATE TABLE your_table CASCADE;
```

## Performance

**Typical reset time:** 2-5 seconds (small seeds)

**Tips for faster seeding:**
- Disable triggers during seeding (see examples)
- Keep seed data minimal
- Use batch inserts instead of individual INSERTs

## Further Reading

- [Supabase Seeding Guide](https://supabase.com/docs/guides/local-development/seeding-your-database)
- [Supabase Migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Snaplet Seed](https://www.snaplet.dev/seed)
