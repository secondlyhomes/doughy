// src/features/real-estate/hooks/usePropertyDocuments.ts
// Hook for managing property documents

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { Document } from '../types';

// Type helper for re_documents table that isn't in generated types yet
// TODO: Add re_documents to database types generation
type SupabaseDocumentsClient = {
  from: (table: 'investor_documents') => {
    select: (columns: string) => {
      eq: (field: string, value: string) => {
        order: (column: string, opts: { ascending: boolean }) => Promise<{ data: Document[] | null; error: Error | null }>;
      };
    };
    insert: (data: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{ data: Document | null; error: Error | null }>;
      };
    };
    delete: () => {
      eq: (field: string, value: string) => Promise<{ error: Error | null }>;
    };
  };
};

interface UsePropertyDocumentsOptions {
  propertyId: string | null;
}

export type DocumentCategory = 'contract' | 'inspection' | 'appraisal' | 'photo' | 'receipt' | 'other';

export const DOCUMENT_CATEGORIES: { id: DocumentCategory; label: string }[] = [
  { id: 'contract', label: 'Contract' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'appraisal', label: 'Appraisal' },
  { id: 'photo', label: 'Photo' },
  { id: 'receipt', label: 'Receipt' },
  { id: 'other', label: 'Other' },
];

interface UsePropertyDocumentsReturn {
  documents: Document[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  documentsByCategory: Map<DocumentCategory, Document[]>;
}

/**
 * Hook for fetching documents for a property
 */
export function usePropertyDocuments({ propertyId }: UsePropertyDocumentsOptions): UsePropertyDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!propertyId) {
      setDocuments([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use type assertion for table that may not be in generated types yet
      const { data, error: queryError } = await (supabase as unknown as SupabaseDocumentsClient)
        .schema('investor').from('documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setDocuments((data as Document[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching documents:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    const map = new Map<DocumentCategory, Document[]>();
    DOCUMENT_CATEGORIES.forEach(cat => map.set(cat.id, []));

    documents.forEach(doc => {
      const category = (doc.type || doc.category || 'other') as DocumentCategory;
      const existing = map.get(category) || map.get('other') || [];
      existing.push(doc);
      map.set(category, existing);
    });

    return map;
  }, [documents]);

  return {
    documents,
    isLoading,
    error,
    refetch: fetchDocuments,
    documentsByCategory,
  };
}

/**
 * Hook for document mutations (upload, delete)
 */
export function useDocumentMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickDocument = useCallback(async (): Promise<DocumentPicker.DocumentPickerResult> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      return result;
    } catch (err) {
      console.error('Error picking document:', err);
      throw err;
    }
  }, []);

  const uploadDocument = useCallback(async (
    propertyId: string,
    file: DocumentPicker.DocumentPickerAsset,
    metadata: {
      title: string;
      category: DocumentCategory;
      description?: string;
    }
  ): Promise<Document | null> => {
    try {
      setIsLoading(true);
      setError(null);
      setUploadProgress(0);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Generate unique file path
      const fileExt = file.name.split('.').pop() || 'file';
      const fileName = `${user.id}/${propertyId}/${Date.now()}.${fileExt}`;

      // Read file content
      let fileData: string | Blob;

      if (Platform.OS === 'web') {
        // On web, fetch the file as blob
        const response = await fetch(file.uri);
        fileData = await response.blob();
      } else {
        // On native, read as base64
        const base64 = await FileSystem.readAsStringAsync(file.uri, {
          encoding: 'base64',
        });
        fileData = base64;
      }

      setUploadProgress(30);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = Platform.OS === 'web'
        ? await supabase.storage
            .from('property-documents')
            .upload(fileName, fileData as Blob, {
              contentType: file.mimeType || 'application/octet-stream',
            })
        : await supabase.storage
            .from('property-documents')
            .upload(fileName, decode(fileData as string), {
              contentType: file.mimeType || 'application/octet-stream',
            });

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(70);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      // Create document record
      const insertData = {
        property_id: propertyId,
        title: metadata.title,
        name: metadata.title,
        type: metadata.category,
        category: metadata.category,
        description: metadata.description || null,
        url: urlData.publicUrl,
        fileUrl: urlData.publicUrl,
        fileType: file.mimeType || 'unknown',
        status: 'active',
      };

      // Use type assertion for table that may not be in generated types yet
      const { data: docData, error: insertError } = await (supabase as unknown as SupabaseDocumentsClient)
        .schema('investor').from('documents')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setUploadProgress(100);
      return docData as Document;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error uploading document:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }, []);

  const deleteDocument = useCallback(async (document: Document): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Delete from storage if we have a URL
      if (document.url || document.fileUrl) {
        const url = document.url || document.fileUrl || '';
        // Extract file path from URL
        const urlParts = url.split('/property-documents/');
        if (urlParts.length > 1) {
          // Remove query params if present (e.g., ?token=xxx)
          const filePath = urlParts[1].split('?')[0];

          const { error: removeError } = await supabase.storage
            .from('property-documents')
            .remove([filePath]);

          if (removeError) {
            // Fail the entire operation to avoid orphaned DB records
            throw new Error(`Failed to remove file from storage: ${removeError.message}`);
          }
        }
      }

      // Delete database record - use type assertion for table not in generated types yet
      const { error: deleteError } = await (supabase as unknown as SupabaseDocumentsClient)
        .schema('investor').from('documents')
        .delete()
        .eq('id', document.id);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting document:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    pickDocument,
    uploadDocument,
    deleteDocument,
    isLoading,
    error,
    uploadProgress,
  };
}

// Helper function to decode base64 for native platforms
// Uses a React Native compatible approach (atob is not available in RN runtime)
function decode(base64: string): Uint8Array {
  // Base64 character lookup table
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  // Remove padding and calculate output length
  let bufferLength = base64.length * 0.75;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);
  let p = 0;

  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (base64[i + 2] !== '=') {
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    }
    if (base64[i + 3] !== '=') {
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }
  }

  return bytes;
}
