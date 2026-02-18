/**
 * Storage Service
 *
 * Reusable utilities for Supabase Storage operations:
 * - Upload files with progress
 * - Download files
 * - Delete files
 * - List files
 * - Get public/signed URLs
 */

import { supabase } from '@/services/supabase-client';
import * as FileSystem from 'expo-file-system';

// Types
export interface UploadOptions {
  bucket: string;
  path: string;
  file: Blob | File;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  path: string;
  url: string;
  error: Error | null;
}

export interface FileMetadata {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

// Upload Operations
export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
  cacheControl = '3600',
  upsert = false,
  onProgress,
}: UploadOptions): Promise<UploadResult> {
  try {
    onProgress?.(0);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl,
        upsert,
        contentType,
      });

    onProgress?.(100);

    if (error) {
      throw error;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

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

export async function uploadFileFromUri({
  bucket,
  path,
  fileUri,
  contentType,
  onProgress,
}: Omit<UploadOptions, 'file'> & { fileUri: string }): Promise<UploadResult> {
  try {
    onProgress?.(10);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    onProgress?.(30);

    // Convert to blob
    const blob = base64ToBlob(base64, contentType || getMimeType(fileUri));

    onProgress?.(50);

    // Upload
    return await uploadFile({
      bucket,
      path,
      file: blob,
      contentType,
      onProgress: (p) => onProgress?.(50 + p * 0.5),
    });
  } catch (error) {
    return {
      path: '',
      url: '',
      error: error as Error,
    };
  }
}

// Download Operations
export async function downloadFile(
  bucket: string,
  path: string
): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
}

export async function downloadFileToDevice(
  bucket: string,
  path: string,
  localPath: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    const downloadResumable = FileSystem.createDownloadResumable(
      urlData.publicUrl,
      localPath,
      {},
      (downloadProgress) => {
        const progress =
          (downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite) *
          100;
        onProgress?.(Math.round(progress));
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (!result) {
      throw new Error('Download failed');
    }

    return result.uri;
  } catch (error) {
    console.error('Download to device error:', error);
    return null;
  }
}

// Delete Operations
export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Batch delete error:', error);
    return false;
  }
}

// List Operations
export async function listFiles(
  bucket: string,
  path: string = '',
  options: {
    limit?: number;
    offset?: number;
    sortBy?: { column: string; order: 'asc' | 'desc' };
  } = {}
): Promise<FileMetadata[]> {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit: options.limit || 100,
      offset: options.offset || 0,
      sortBy: options.sortBy || { column: 'created_at', order: 'desc' },
    });

    if (error) {
      throw error;
    }

    return data as FileMetadata[];
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}

// URL Operations
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Create signed URL error:', error);
    return null;
  }
}

export async function createSignedUrls(
  bucket: string,
  paths: string[],
  expiresIn: number = 3600
): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);

    if (error) {
      throw error;
    }

    const urlMap: Record<string, string> = {};
    data?.forEach((item) => {
      if (item.signedUrl) {
        urlMap[item.path] = item.signedUrl;
      }
    });

    return urlMap;
  } catch (error) {
    console.error('Create signed URLs error:', error);
    return {};
  }
}

// Move/Copy Operations
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Move file error:', error);
    return false;
  }
}

export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).copy(fromPath, toPath);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Copy file error:', error);
    return false;
  }
}

// Utility Functions
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

export function getMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase() || '';

  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    // Videos
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

export function generateUniquePath(
  userId: string,
  fileName: string,
  prefix: string = ''
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();

  return `${prefix}${userId}/${timestamp}-${random}-${sanitizedName}`;
}

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function getFileName(path: string): string {
  return path.split('/').pop() || '';
}

export function getFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Validation
export function validateFileSize(
  sizeInBytes: number,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const sizeMB = sizeInBytes / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size ${sizeMB.toFixed(2)}MB exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

export function validateFileType(
  mimeType: string,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} is not allowed`,
    };
  }

  return { valid: true };
}
