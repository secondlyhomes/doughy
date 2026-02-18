-- ============================================================================
-- Migration: Storage Policies for property-documents bucket
-- Created: 2026-01-13
-- Status: PENDING - Apply via Supabase Dashboard or CLI
-- ============================================================================
--
-- This migration sets up Row Level Security (RLS) policies for the
-- property-documents storage bucket used by the real estate document
-- management feature.
--
-- Path Convention: {userId}/{propertyId}/{timestamp}.{ext}
-- Example: 123e4567-e89b-12d3-a456-426614174000/prop-abc123/1704067200.pdf
--
-- ============================================================================

-- Step 1: Create the bucket (if not exists)
-- Note: This must be done via Dashboard or Supabase CLI, not raw SQL
-- Dashboard: Storage → New Bucket → Name: "property-documents" → Private: ON

-- Step 2: Enable RLS on storage.objects (usually enabled by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICY 1: INSERT - Users can upload to their own folder
-- ============================================================================
CREATE POLICY "Users can upload to their folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- POLICY 2: SELECT - Users can read their own documents
-- ============================================================================
CREATE POLICY "Users can read their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'property-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- POLICY 3: DELETE - Users can delete their own documents
-- ============================================================================
CREATE POLICY "Users can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- OPTIONAL: UPDATE policy (if documents can be replaced in-place)
-- ============================================================================
-- CREATE POLICY "Users can update their documents"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'property-documents' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- )
-- WITH CHECK (
--   bucket_id = 'property-documents' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying policies to verify they're active:
--
-- List all policies on storage.objects:
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'objects' AND schemaname = 'storage';
--
-- Test upload permission (replace with actual user ID):
-- SELECT storage.foldername('user-id-here/property-id/file.pdf');
