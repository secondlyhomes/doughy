# Supabase Migrations

This folder contains SQL migrations and policies that need to be applied to the Supabase project.

## Current Status

| Migration | Status | Applied Date | Notes |
|-----------|--------|--------------|-------|
| `001_storage_policies.sql` | PENDING | - | Storage RLS for property-documents |

## How to Apply

### Option A: Supabase Dashboard (Quick)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Follow migration-specific instructions below

### Option B: Supabase CLI (Recommended for Production)

```bash
# One-time setup
npx supabase init
npx supabase link --project-ref <your-project-ref>

# Apply migrations
npx supabase db push
```

---

## Migration Instructions

### 001_storage_policies.sql

**Purpose:** Secure the `property-documents` storage bucket with Row Level Security

**Prerequisites:**
- [ ] Bucket `property-documents` exists
- [ ] Bucket is set to **private** (not public)

**Dashboard Steps:**

1. **Create Bucket** (if needed)
   - Storage → New Bucket
   - Name: `property-documents`
   - Public bucket: **OFF**

2. **Apply Policies**
   - Storage → Policies → Select `property-documents`
   - Click "New Policy" → "For full customization"
   - Create each policy from the SQL file:

   | Policy Name | Operation |
   |-------------|-----------|
   | Users can upload to their folder | INSERT |
   | Users can read their documents | SELECT |
   | Users can delete their documents | DELETE |

3. **Verify**
   - All 3 policies should appear under the bucket
   - Test by uploading a document in the app

**Checklist:**
- [ ] Bucket exists and is private
- [ ] INSERT policy applied
- [ ] SELECT policy applied
- [ ] DELETE policy applied
- [ ] Tested document upload in app

---

## Future Migrations

When adding new migrations:

1. Create file with format: `NNN_description.sql`
2. Add entry to status table above
3. Include clear comments and instructions in the SQL file
4. Update this README with application steps

## Related Code

- `src/features/real-estate/hooks/usePropertyDocuments.ts` - Document upload/delete logic
- `src/features/real-estate/components/UploadDocumentSheet.tsx` - Upload UI
- Storage path format: `{userId}/{propertyId}/{timestamp}.{ext}`
