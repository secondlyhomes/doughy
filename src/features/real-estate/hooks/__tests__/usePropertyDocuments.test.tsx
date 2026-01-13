// Tests for usePropertyDocuments hook
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import { usePropertyDocuments, useDocumentMutations, DOCUMENT_CATEGORIES } from '../usePropertyDocuments';

// Mock supabase for this test file
const mockSupabaseFrom = jest.fn();
const mockSupabaseStorage = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => mockSupabaseFrom(table),
    storage: {
      from: (bucket: string) => mockSupabaseStorage(bucket),
    },
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: { user: { id: 'user-123' } },
          error: null,
        })
      ),
    },
  },
}));

describe('DOCUMENT_CATEGORIES', () => {
  it('should have all expected categories', () => {
    const categoryIds = DOCUMENT_CATEGORIES.map((c) => c.id);
    expect(categoryIds).toContain('contract');
    expect(categoryIds).toContain('inspection');
    expect(categoryIds).toContain('appraisal');
    expect(categoryIds).toContain('photo');
    expect(categoryIds).toContain('receipt');
    expect(categoryIds).toContain('other');
  });

  it('should have labels for all categories', () => {
    DOCUMENT_CATEGORIES.forEach((cat) => {
      expect(cat.label).toBeTruthy();
      expect(typeof cat.label).toBe('string');
    });
  });
});

describe('usePropertyDocuments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty documents when propertyId is null', async () => {
    const { result } = renderHook(() => usePropertyDocuments({ propertyId: null }));

    expect(result.current.documents).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch documents for a property', async () => {
    const mockDocuments = [
      { id: 'doc-1', title: 'Contract', type: 'contract', property_id: 'prop-1' },
      { id: 'doc-2', title: 'Inspection Report', type: 'inspection', property_id: 'prop-1' },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockDocuments, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => usePropertyDocuments({ propertyId: 'prop-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.documents).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch error', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') }),
        }),
      }),
    });

    const { result } = renderHook(() => usePropertyDocuments({ propertyId: 'prop-1' }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });

  it('should group documents by category', async () => {
    const mockDocuments = [
      { id: 'doc-1', title: 'Contract 1', type: 'contract', property_id: 'prop-1' },
      { id: 'doc-2', title: 'Contract 2', type: 'contract', property_id: 'prop-1' },
      { id: 'doc-3', title: 'Photo 1', type: 'photo', property_id: 'prop-1' },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockDocuments, error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => usePropertyDocuments({ propertyId: 'prop-1' }));

    await waitFor(() => {
      expect(result.current.documents).toHaveLength(3);
    });

    const contractDocs = result.current.documentsByCategory.get('contract');
    const photoDocs = result.current.documentsByCategory.get('photo');

    expect(contractDocs).toHaveLength(2);
    expect(photoDocs).toHaveLength(1);
  });

  it('should have refetch function', async () => {
    mockSupabaseFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });

    const { result } = renderHook(() => usePropertyDocuments({ propertyId: 'prop-1' }));

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('useDocumentMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pickDocument', () => {
    it('should call DocumentPicker.getDocumentAsync', async () => {
      const { result } = renderHook(() => useDocumentMutations());

      await act(async () => {
        await result.current.pickDocument();
      });

      expect(DocumentPicker.getDocumentAsync).toHaveBeenCalledWith({
        type: expect.arrayContaining(['application/pdf', 'image/*']),
        copyToCacheDirectory: true,
      });
    });

    it('should return document picker result', async () => {
      const { result } = renderHook(() => useDocumentMutations());

      let pickerResult;
      await act(async () => {
        pickerResult = await result.current.pickDocument();
      });

      expect(pickerResult).toHaveProperty('canceled', false);
      expect(pickerResult).toHaveProperty('assets');
    });
  });

  describe('uploadDocument', () => {
    it('should upload document and create record', async () => {
      const mockUploadResult = { data: { path: 'test/path.pdf' }, error: null };
      const mockPublicUrl = { data: { publicUrl: 'https://example.com/doc.pdf' } };
      const mockInsertResult = {
        data: { id: 'doc-1', title: 'Test Doc', type: 'contract' },
        error: null,
      };

      mockSupabaseStorage.mockReturnValue({
        upload: jest.fn().mockResolvedValue(mockUploadResult),
        getPublicUrl: jest.fn().mockReturnValue(mockPublicUrl),
      });

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(mockInsertResult),
          }),
        }),
      });

      const { result } = renderHook(() => useDocumentMutations());

      const mockFile = {
        uri: 'file:///test/doc.pdf',
        name: 'doc.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      };

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadDocument('prop-1', mockFile as any, {
          title: 'Test Doc',
          category: 'contract',
        });
      });

      expect(uploadResult).toBeTruthy();
      expect(result.current.error).toBeNull();
    });

    it('should return null on upload error', async () => {
      mockSupabaseStorage.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: null, error: new Error('Upload failed') }),
      });

      const { result } = renderHook(() => useDocumentMutations());

      const mockFile = {
        uri: 'file:///test/doc.pdf',
        name: 'doc.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      };

      let uploadResult;
      await act(async () => {
        uploadResult = await result.current.uploadDocument('prop-1', mockFile as any, {
          title: 'Test Doc',
          category: 'contract',
        });
      });

      expect(uploadResult).toBeNull();
      expect(result.current.error).toBeTruthy();
    });

    it('should track upload progress', async () => {
      mockSupabaseStorage.mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test/path.pdf' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/doc.pdf' } }),
      });

      mockSupabaseFrom.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: { id: 'doc-1' }, error: null }),
          }),
        }),
      });

      const { result } = renderHook(() => useDocumentMutations());

      expect(result.current.uploadProgress).toBe(0);

      const mockFile = {
        uri: 'file:///test/doc.pdf',
        name: 'doc.pdf',
        size: 1024,
        mimeType: 'application/pdf',
      };

      await act(async () => {
        await result.current.uploadDocument('prop-1', mockFile as any, {
          title: 'Test',
          category: 'other',
        });
      });

      // Progress should reset after completion
      expect(result.current.uploadProgress).toBe(0);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document from storage and database', async () => {
      mockSupabaseStorage.mockReturnValue({
        remove: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      mockSupabaseFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const { result } = renderHook(() => useDocumentMutations());

      const mockDocument = {
        id: 'doc-1',
        url: 'https://example.com/storage/v1/object/public/property-documents/user-1/prop-1/file.pdf',
      };

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteDocument(mockDocument as any);
      });

      expect(deleteResult).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should return false on delete error', async () => {
      mockSupabaseFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') }),
        }),
      });

      const { result } = renderHook(() => useDocumentMutations());

      const mockDocument = { id: 'doc-1' };

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteDocument(mockDocument as any);
      });

      expect(deleteResult).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should handle document without URL gracefully', async () => {
      mockSupabaseFrom.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      const { result } = renderHook(() => useDocumentMutations());

      const mockDocument = { id: 'doc-1' }; // No URL

      let deleteResult;
      await act(async () => {
        deleteResult = await result.current.deleteDocument(mockDocument as any);
      });

      expect(deleteResult).toBe(true);
    });
  });

  it('should have loading state', () => {
    const { result } = renderHook(() => useDocumentMutations());

    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should have error state', () => {
    const { result } = renderHook(() => useDocumentMutations());

    expect(result.current.error).toBeNull();
  });
});
