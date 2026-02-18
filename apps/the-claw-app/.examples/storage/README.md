# Supabase Storage Examples

Complete examples and utilities for working with Supabase Storage in React Native.

## Overview

This directory contains production-ready examples for:
- File uploads with progress tracking
- Image handling and optimization
- Avatar upload flows
- Gallery components
- Storage utilities and helpers

## Contents

### Documentation

- **[file-upload.md](./file-upload.md)** - Complete file upload patterns with validation and progress
- **[image-handling.md](./image-handling.md)** - Image-specific operations including compression and thumbnails
- **[avatar-upload.md](./avatar-upload.md)** - Full avatar upload implementation with profile updates

### Components

- **[AvatarUpload.tsx](./AvatarUpload.tsx)** - Complete avatar upload component
- **[FileUpload.tsx](./FileUpload.tsx)** - Generic file upload component
- **[ImageGallery.tsx](./ImageGallery.tsx)** - Image gallery with multiple layouts

### Utilities

- **[storageService.ts](./storageService.ts)** - Reusable storage operations (upload, download, delete, list)
- **[imageOptimization.ts](./imageOptimization.ts)** - Image compression, resizing, and CDN optimization

## Quick Start

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
npx expo install expo-image-picker expo-image-manipulator expo-file-system expo-document-picker
```

### 2. Setup Storage in Supabase

```sql
-- Create storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Enable RLS
alter table storage.objects enable row level security;

-- Public read access
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload to their folder
create policy "Users can upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own files
create policy "Users can update own files"
  on storage.objects for update
  using (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files
create policy "Users can delete own files"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### 3. Configure Bucket Settings

In Supabase Dashboard:

1. Go to Storage > Buckets
2. Click on your bucket
3. Set configuration:
   - **File size limit**: 50MB (adjust as needed)
   - **Allowed MIME types**: image/*, video/*, etc.
   - **Public bucket**: Enable for public access

### 4. Use in Your App

```typescript
import { AvatarUpload } from '@/components/AvatarUpload';

function ProfileScreen() {
  const { user } = useAuth();

  return (
    <AvatarUpload
      userId={user.id}
      currentAvatarUrl={user.avatar_url}
      onUploadSuccess={(url) => console.log('New avatar:', url)}
    />
  );
}
```

## Storage Architecture

### Bucket Structure

```
avatars/
├── {user_id}/
│   ├── {timestamp}-{random}-avatar.jpg
│   └── {timestamp}-{random}-avatar.jpg

images/
├── {user_id}/
│   ├── photos/
│   │   ├── {timestamp}-{random}-photo.jpg
│   │   └── {timestamp}-{random}-photo.jpg
│   └── thumbnails/
│       ├── {timestamp}-{random}-photo-small.jpg
│       └── {timestamp}-{random}-photo-medium.jpg

documents/
└── {user_id}/
    ├── {timestamp}-{random}-document.pdf
    └── {timestamp}-{random}-report.pdf
```

### File Naming Convention

```typescript
{prefix}{user_id}/{timestamp}-{random}-{sanitized_filename}.{ext}
```

- **prefix**: Optional folder prefix (e.g., `photos/`, `documents/`)
- **user_id**: User's UUID for isolation
- **timestamp**: Unix timestamp for uniqueness
- **random**: 6-character random string
- **sanitized_filename**: Original filename with special characters replaced
- **ext**: File extension

## RLS Policies

### Basic User Isolation

```sql
-- Users can only access their own folder
create policy "User folder access"
  on storage.objects
  using (
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Public Read, Private Write

```sql
-- Anyone can read
create policy "Public read"
  on storage.objects for select
  using (bucket_id = 'public-images');

-- Only owner can write
create policy "Owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'public-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Shared Folders

```sql
-- Team members can access team folder
create policy "Team folder access"
  on storage.objects
  using (
    bucket_id = 'team-files' AND
    exists (
      select 1 from team_members
      where team_members.user_id = auth.uid()
      and team_members.team_id = (storage.foldername(name))[1]::uuid
    )
  );
```

## File Size Limits

### Recommended Limits by Type

```typescript
export const FILE_SIZE_LIMITS = {
  avatar: 5,      // 5MB - Profile pictures
  image: 10,      // 10MB - General images
  video: 100,     // 100MB - Video files
  document: 20,   // 20MB - PDFs, docs
  audio: 50,      // 50MB - Audio files
} as const;
```

### Supabase Storage Limits

- **Free tier**: 1GB storage, 2GB bandwidth
- **Pro tier**: 100GB storage, 200GB bandwidth
- **Max file size**: 50MB (default, configurable up to 5GB)
- **Max request size**: 50MB (default)

## CDN and Performance

### Image Transformations

Supabase Storage supports image transformations via URL parameters:

```typescript
const url = 'https://xxx.supabase.co/storage/v1/object/public/bucket/path';

// Resize
const resized = `${url}?width=400&height=400`;

// Change quality
const compressed = `${url}?quality=80`;

// Convert format
const webp = `${url}?format=webp`;

// Combine transformations
const optimized = `${url}?width=800&quality=85&format=webp`;
```

### Caching Strategy

```typescript
// Upload with cache headers
await supabase.storage.from('images').upload(path, file, {
  cacheControl: '3600',  // Cache for 1 hour
  upsert: false,
});

// Longer cache for static assets
cacheControl: '31536000'  // Cache for 1 year
```

### CDN Best Practices

1. **Use appropriate cache headers** - Set based on update frequency
2. **Generate thumbnails** - Don't rely on CDN transforms for lists
3. **Use WebP format** - Smaller file sizes with same quality
4. **Lazy load images** - Only load visible images
5. **Use progressive JPEGs** - Better perceived performance

## Presigned URLs

For private files that need temporary public access:

```typescript
import { createSignedUrl } from '@/services/storageService';

// Create URL valid for 1 hour
const signedUrl = await createSignedUrl('private-bucket', 'file.pdf', 3600);

// Share this URL with users
console.log(signedUrl); // Expires after 1 hour
```

### Use Cases

- Private documents that need temporary sharing
- Payment receipts
- Medical records
- Private user content
- Time-limited downloads

## Security Best Practices

### 1. Always Use RLS

```sql
-- Enable RLS on storage.objects
alter table storage.objects enable row level security;
```

### 2. Validate File Types

```typescript
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

function validateFileType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}
```

### 3. Validate File Sizes

```typescript
function validateFileSize(sizeInBytes: number, maxMB: number): boolean {
  const sizeMB = sizeInBytes / (1024 * 1024);
  return sizeMB <= maxMB;
}
```

### 4. Sanitize Filenames

```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
}
```

### 5. Use Unique Paths

```typescript
function generateUniquePath(userId: string, filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${userId}/${timestamp}-${random}-${filename}`;
}
```

### 6. Never Store Sensitive Data

- Don't upload passwords or API keys
- Don't upload unencrypted PII
- Don't upload credit card information
- Use Supabase Vault for secrets

## Error Handling

### Common Errors

```typescript
function handleStorageError(error: any): string {
  // File too large
  if (error.statusCode === 413) {
    return 'File is too large. Please choose a smaller file.';
  }

  // Permission denied
  if (error.statusCode === 403) {
    return 'You do not have permission to upload to this location.';
  }

  // Not found
  if (error.statusCode === 404) {
    return 'File or bucket not found.';
  }

  // Invalid file type
  if (error.message?.includes('type')) {
    return 'Invalid file type. Please choose a different file.';
  }

  // Network error
  if (error.message?.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Upload failed. Please try again.';
}
```

### Retry Logic

```typescript
async function uploadWithRetry(
  uploadFn: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Testing

### Test Upload Flow

```typescript
describe('File Upload', () => {
  it('should upload file successfully', async () => {
    const result = await uploadFile({
      bucket: 'test-bucket',
      path: 'test/file.jpg',
      file: mockFile,
    });

    expect(result.error).toBeNull();
    expect(result.url).toBeDefined();
  });

  it('should reject oversized files', async () => {
    const largeFile = createMockFile(20 * 1024 * 1024); // 20MB

    const validation = validateFileSize(largeFile.size, 10);
    expect(validation.valid).toBe(false);
  });

  it('should reject invalid file types', async () => {
    const validation = validateFileType('application/exe', 'image');
    expect(validation.valid).toBe(false);
  });
});
```

## Migration from Other Storage

### From Firebase Storage

```typescript
// Firebase
const storageRef = ref(storage, 'images/photo.jpg');
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);

// Supabase
const { data } = await supabase.storage
  .from('images')
  .upload('photo.jpg', file);
const url = supabase.storage
  .from('images')
  .getPublicUrl(data.path).data.publicUrl;
```

### From AWS S3

```typescript
// S3
await s3.putObject({
  Bucket: 'my-bucket',
  Key: 'photo.jpg',
  Body: file,
});

// Supabase
await supabase.storage
  .from('my-bucket')
  .upload('photo.jpg', file);
```

## Performance Tips

1. **Compress images before upload** - Reduce upload time and storage costs
2. **Generate thumbnails** - Don't load full-size images in lists
3. **Use lazy loading** - Only load visible images
4. **Batch operations** - Upload multiple files in parallel
5. **Cache locally** - Store recently accessed files
6. **Use CDN transformations** - Let the CDN resize images
7. **Monitor storage usage** - Set up alerts for quota limits

## Cost Optimization

1. **Delete unused files** - Clean up old avatars and temp files
2. **Use appropriate image quality** - 80% quality is usually sufficient
3. **Generate thumbnails once** - Store them, don't transform on-the-fly
4. **Set cache headers** - Reduce bandwidth costs
5. **Use WebP format** - 25-35% smaller than JPEG
6. **Implement cleanup jobs** - Remove files older than X days

## Advanced Patterns

### Image Processing Pipeline

```typescript
async function processAndUpload(imageUri: string, userId: string) {
  // 1. Compress original
  const compressed = await compressImage(imageUri, { quality: 0.85 });

  // 2. Generate thumbnails
  const thumbnails = await generateMultipleThumbnails(compressed);

  // 3. Upload all versions
  const [original, small, medium, large] = await Promise.all([
    uploadFile({ bucket: 'images', path: `${userId}/original.jpg`, fileUri: compressed }),
    uploadFile({ bucket: 'images', path: `${userId}/small.jpg`, fileUri: thumbnails.small }),
    uploadFile({ bucket: 'images', path: `${userId}/medium.jpg`, fileUri: thumbnails.medium }),
    uploadFile({ bucket: 'images', path: `${userId}/large.jpg`, fileUri: thumbnails.large }),
  ]);

  // 4. Save metadata to database
  await supabase.from('images').insert({
    user_id: userId,
    original_url: original.url,
    small_url: small.url,
    medium_url: medium.url,
    large_url: large.url,
  });
}
```

### Signed Upload URLs

For client-side uploads without exposing credentials:

```typescript
// Server-side: Generate signed URL
const { data, error } = await supabase.storage
  .from('bucket')
  .createSignedUploadUrl('path/to/file.jpg');

// Client-side: Upload using signed URL
await fetch(data.signedUrl, {
  method: 'PUT',
  body: file,
  headers: {
    'Content-Type': 'image/jpeg',
  },
});
```

## Troubleshooting

### Issue: "New row violates row-level security policy"

**Solution**: Check your RLS policies and ensure the user has permission.

```sql
-- Debug: Disable RLS temporarily to test
alter table storage.objects disable row level security;

-- Fix: Update policy
create policy "Fix policy"
  on storage.objects
  using (auth.uid() = (storage.foldername(name))[1]::uuid);
```

### Issue: "File size exceeds maximum allowed"

**Solution**: Compress images before upload or increase bucket limits.

```typescript
const compressed = await compressImage(uri, {
  maxWidth: 1920,
  quality: 0.8,
});
```

### Issue: "Invalid MIME type"

**Solution**: Configure allowed MIME types in bucket settings or validate client-side.

## Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Image Manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [File Upload Pattern](./file-upload.md)
- [Image Handling Guide](./image-handling.md)
- [Avatar Upload Flow](./avatar-upload.md)

## Contributing

When adding new examples:

1. Include TypeScript types
2. Add error handling
3. Document RLS policies
4. Provide usage examples
5. Test on both iOS and Android
