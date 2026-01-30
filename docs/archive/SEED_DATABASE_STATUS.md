# Database Seeding - Status & Fix Required

## ✅ COMPLETED
1. **Admin Dashboard Connected** - Added "Admin Dashboard" link in Settings screen (only visible to admin users)
2. **Error Handling Fixed** - SeedService now correctly extracts Supabase error messages
3. **Schema Simplified** - Removed non-existent tables from clearDatabase()
4. **is_deleted Field Added** - Test leads now include `is_deleted: false` so they show up in queries
5. **Tests Passing** - All 15 seedService tests pass

## ❌ BLOCKING ISSUE: Incomplete Database Schema

Your database schema is missing fields that the test data factories expect.

### Current Schema (from migration)

**`leads` table has:**
- id, user_id, workspace_id
- name, phone, email, company
- status, score, tags, opt_status
- is_deleted, created_at, updated_at

**`re_properties` table has:**
- id, user_id
- city, state, zip (NO STREET ADDRESS!)
- bedrooms, bathrooms, square_feet, lot_size, year_built
- purchase_price, arv, status, property_type, mls_id, notes
- created_at, updated_at

### What's Missing

1. **Properties missing address fields** - No `street_address` column exists
2. **Factory expects fields that don't exist** - Factories were built for a different schema

## 🔧 HOW TO FIX

### Option 1: Add Missing Columns (RECOMMENDED)

Run this SQL in **Supabase Dashboard → SQL Editor**:

```sql
-- Add missing address columns to re_properties
ALTER TABLE re_properties
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS street_address_2 TEXT,
ADD COLUMN IF NOT EXISTS county TEXT;

CREATE INDEX IF NOT EXISTS idx_re_properties_street_address ON re_properties(street_address);
CREATE INDEX IF NOT EXISTS idx_re_properties_county ON re_properties(county);
```

### Option 2: Simplify Test Data (TEMPORARY FIX)

The factories have been updated to remove non-existent fields:
- ✅ Removed `notes` from leads (doesn't exist in schema)
- ✅ Removed `source`, `phone_opt_status`, `email_opt_status` from leads
- ✅ Changed to use `opt_status` (single field)
- ✅ Added `is_deleted: false`
- ⚠️  Properties still need `street_address` column added

## 📍 HOW TO ACCESS & TEST

1. **Launch App**: `npx expo start`
2. **Sign In**: admin@doughy.app / Doughy123!
3. **Navigate**: Settings Tab → "ADMINISTRATION" section → "Admin Dashboard"
4. **Scroll Down**: See "Developer Tools" section (DEV MODE ONLY)
5. **Click "Seed Database"**: This will:
   - Clear existing data
   - Create 50 leads
   - Create 20 properties (WILL FAIL without street_address column)
   - Create 15 deals (depends on leads + properties)

## 🐛 EXPECTED ERRORS (Until Fixed)

**Before adding street_address column:**
```
Property 0: Could not find the 'street_address' column of 're_properties' in the schema cache
```

**After adding street_address column:**
```
✅ Success!
Database seeded successfully!

Leads: 50
Properties: 20
Deals: 15
```

## 📊 WHY DATA WASN'T SHOWING

The app queries leads with:
```typescript
.from('leads')
.select('*')
.eq('is_deleted', false)  // ← This filter!
```

Test data wasn't including `is_deleted: false`, so all leads were filtered out.

**FIX APPLIED**: `createTestLead()` now includes `is_deleted: false`

## 🎯 NEXT STEPS

1. Run the SQL above to add `street_address` columns
2. Open the app and go to Admin Dashboard
3. Click "Seed Database"
4. Check Leads tab - you should see 50 test leads
5. Check Properties tab - you should see 20 test properties

## 📁 FILES MODIFIED

1. `src/features/admin/factories/testDataFactories.ts` - Added `is_deleted: false`, removed non-existent fields
2. `src/features/settings/screens/SettingsScreen.tsx` - Added Admin Dashboard link
3. `src/features/admin/services/seedService.ts` - Fixed error handling

## ⚠️ IMPORTANT

The seed function is **DEV MODE ONLY** with triple protection:
- Only runs when `__DEV__ = true`
- Blocks production database URLs
- Requires admin/support role
- Scoped to current user only (RLS)

Your production database is safe.
