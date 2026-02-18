# File Upload to Supabase Storage

Complete guide for uploading files to Supabase Storage with progress tracking, optimization, and error handling.

## Basic File Upload

```typescript
import { supabase } from '@/services/supabase-client';

interface UploadResult {
  path: string;
  url: string;
  error: Error | null;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
      error: null,
    };
  } catch (error) {
    return {
      path: '',
      url: '',
      error: error as Error,
    };
  }
}
```

## Upload with Progress Tracking

```typescript
import * as FileSystem from 'expo-file-system';

interface UploadOptions {
  bucket: string;
  path: string;
  fileUri: string;
  onProgress?: (progress: number) => void;
  maxSizeMB?: number;
}

export async function uploadFileWithProgress({
  bucket,
  path,
  fileUri,
  onProgress,
  maxSizeMB = 10,
}: UploadOptions): Promise<UploadResult> {
  try {
    // Check file size
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    const fileSizeMB = (fileInfo.size || 0) / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const blob = base64ToBlob(base64, getMimeType(fileUri));

    // Track upload progress with chunks
    const chunkSize = 256 * 1024; // 256KB chunks
    const totalSize = blob.size;
    let uploadedSize = 0;

    // For actual progress tracking, you would need to implement chunked uploads
    // This is a simplified version that reports progress in stages
    onProgress?.(0);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    onProgress?.(100);

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      path: data.path,
      url: urlData.publicUrl,
      error: null,
    };
  } catch (error) {
    return {
      path: '',
      url: '',
      error: error as Error,
    };
  }
}
```

## File Size Validation

```typescript
export const FILE_SIZE_LIMITS = {
  image: 5, // 5MB
  video: 50, // 50MB
  document: 10, // 10MB
  audio: 20, // 20MB
} as const;

export function getFileSizeMB(sizeInBytes: number): number {
  return sizeInBytes / (1024 * 1024);
}

export function validateFileSize(
  sizeInBytes: number,
  type: keyof typeof FILE_SIZE_LIMITS
): { valid: boolean; error?: string } {
  const sizeMB = getFileSizeMB(sizeInBytes);
  const limit = FILE_SIZE_LIMITS[type];

  if (sizeMB > limit) {
    return {
      valid: false,
      error: `File size ${sizeMB.toFixed(2)}MB exceeds ${limit}MB limit`,
    };
  }

  return { valid: true };
}
```

## File Type Validation

```typescript
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/quicktime'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  audio: ['audio/mpeg', 'audio/wav', 'audio/mp4'],
} as const;

export function validateFileType(
  mimeType: string,
  category: keyof typeof ALLOWED_FILE_TYPES
): { valid: boolean; error?: string } {
  const allowedTypes = ALLOWED_FILE_TYPES[category];

  if (!allowedTypes.includes(mimeType as any)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}
```

## Complete Upload Hook

```typescript
import { useState } from 'react';

interface UseFileUploadOptions {
  bucket: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload({
  bucket,
  maxSizeMB = 10,
  allowedTypes,
  onSuccess,
  onError,
}: UseFileUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = async (fileUri: string, path: string) => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Validate file
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Check size
      const sizeMB = getFileSizeMB(fileInfo.size || 0);
      if (sizeMB > maxSizeMB) {
        throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
      }

      // Check type
      if (allowedTypes && allowedTypes.length > 0) {
        const mimeType = getMimeType(fileUri);
        if (!allowedTypes.includes(mimeType)) {
          throw new Error(`File type ${mimeType} is not allowed`);
        }
      }

      // Upload
      const result = await uploadFileWithProgress({
        bucket,
        path,
        fileUri,
        maxSizeMB,
        onProgress: setProgress,
      });

      if (result.error) {
        throw result.error;
      }

      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setProgress(0);
    setError(null);
  };

  return {
    upload,
    uploading,
    progress,
    error,
    reset,
  };
}
```

## Utility Functions

```typescript
/**
 * Convert base64 string to Blob
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);

    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Get MIME type from file URI
 */
export function getMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase() || '';

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Generate unique file path
 */
export function generateFilePath(
  userId: string,
  fileName: string,
  prefix = ''
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop();
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();

  return `${prefix}${userId}/${timestamp}-${random}-${sanitizedName}`;
}
```

## Usage Example

```typescript
import { useFileUpload } from '@/hooks/useFileUpload';
import { View, Button, Text, ProgressBarAndroid } from 'react-native';

export function FileUploadExample() {
  const { upload, uploading, progress, error } = useFileUpload({
    bucket: 'documents',
    maxSizeMB: 10,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    onSuccess: (result) => {
      console.log('Upload successful:', result.url);
    },
    onError: (error) => {
      console.error('Upload failed:', error.message);
    },
  });

  const handleUpload = async () => {
    const fileUri = 'file:///path/to/file.pdf';
    const path = generateFilePath('user-123', 'document.pdf', 'documents/');

    try {
      await upload(fileUri, path);
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <View>
      <Button
        title={uploading ? 'Uploading...' : 'Upload File'}
        onPress={handleUpload}
        disabled={uploading}
      />

      {uploading && (
        <View>
          <ProgressBarAndroid
            styleAttr="Horizontal"
            indeterminate={false}
            progress={progress / 100}
          />
          <Text>{progress}%</Text>
        </View>
      )}

      {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
    </View>
  );
}
```

## Best Practices

1. Always validate file size and type before uploading
2. Use unique file paths to prevent overwrites
3. Implement progress tracking for better UX
4. Handle errors gracefully with user-friendly messages
5. Set appropriate cache headers
6. Use `upsert: false` to prevent accidental overwrites
7. Store file metadata in your database
8. Clean up failed uploads
9. Implement retry logic for network failures
10. Consider using presigned URLs for secure uploads

## Error Handling

```typescript
export function handleUploadError(error: any): string {
  if (error.message?.includes('exceeds')) {
    return 'File is too large';
  }

  if (error.message?.includes('not allowed')) {
    return 'File type not supported';
  }

  if (error.statusCode === 403) {
    return 'Permission denied. Check storage policies.';
  }

  if (error.statusCode === 413) {
    return 'File too large for server';
  }

  return error.message || 'Upload failed. Please try again.';
}
```

## See Also

- [Image Handling](./image-handling.md) - Image-specific upload features
- [Avatar Upload](./avatar-upload.md) - Complete avatar upload flow
- [Storage Service](./storageService.ts) - Reusable storage utilities
