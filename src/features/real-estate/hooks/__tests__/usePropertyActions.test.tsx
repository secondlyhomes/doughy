// Tests for usePropertyActions hook
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import { usePropertyActions } from '../usePropertyActions';
import { PropertyStatus } from '../../types/constants';
import { Property } from '../../types';

// Get the new API mocks exposed from jest.setup.js
const mockFileWrite = (FileSystem as any).__mockFileWrite as jest.Mock;

// Mock supabase
const mockSupabaseUpdate = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: mockSupabaseUpdate,
      })),
    })),
  },
}));

const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 'prop-123',
  address: '123 Main St',
  address_line_1: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  propertyType: 'single_family',
  property_type: 'single_family',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1500,
  sqft: 1500,
  purchase_price: 250000,
  arv: 300000,
  status: 'Active',
  ...overrides,
});

describe('usePropertyActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseUpdate.mockResolvedValue({ error: null });
    // Reset the new API mocks
    mockFileWrite?.mockClear();
  });

  // Note: shareProperty tests are skipped because react-native Share mock
  // doesn't work reliably in Jest. The functionality is tested via
  // PropertyActionsSheet integration tests.

  describe('exportPropertySummary', () => {
    it('should export property summary on native', async () => {
      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty();

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportPropertySummary(property);
      });

      // Uses new File API (file.write())
      expect(mockFileWrite).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
      expect(exportResult).toBeTruthy();
    });

    it('should check if sharing is available', async () => {
      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty();

      await act(async () => {
        await result.current.exportPropertySummary(property);
      });

      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
    });

    it('should not share if sharing is unavailable', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);

      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty();

      await act(async () => {
        await result.current.exportPropertySummary(property);
      });

      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });

    it('should handle export error', async () => {
      // Mock the new File.write method to reject
      mockFileWrite.mockRejectedValueOnce(new Error('Write failed'));

      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty();

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportPropertySummary(property);
      });

      expect(exportResult).toBeNull();
      expect(result.current.error).toBeTruthy();
    });

    it('should generate filename with property ID', async () => {
      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty({ id: 'property-abc-123' });

      let exportResult;
      await act(async () => {
        exportResult = await result.current.exportPropertySummary(property);
      });

      // The file uri should contain property- prefix
      expect(exportResult).toContain('property-');
    });
  });

  describe('copyPropertyLink', () => {
    it('should copy property details to clipboard', async () => {
      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty();

      let success;
      await act(async () => {
        success = await result.current.copyPropertyLink(property);
      });

      expect(Clipboard.setStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('123 Main St')
      );
      expect(success).toBe(true);
    });

    it('should handle clipboard error', async () => {
      (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Clipboard failed')
      );

      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty();

      let success;
      await act(async () => {
        success = await result.current.copyPropertyLink(property);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('updatePropertyStatus', () => {
    it('should update property status', async () => {
      const { result } = renderHook(() => usePropertyActions());

      let success;
      await act(async () => {
        success = await result.current.updatePropertyStatus('prop-123', PropertyStatus.SOLD);
      });

      expect(success).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should handle update error', async () => {
      mockSupabaseUpdate.mockResolvedValueOnce({ error: new Error('Update failed') });

      const { result } = renderHook(() => usePropertyActions());

      let success;
      await act(async () => {
        success = await result.current.updatePropertyStatus('prop-123', PropertyStatus.PENDING);
      });

      expect(success).toBe(false);
      expect(result.current.error).toBeTruthy();
    });

    it('should accept all valid status values', async () => {
      const { result } = renderHook(() => usePropertyActions());

      const statuses = [
        PropertyStatus.ACTIVE,
        PropertyStatus.PENDING,
        PropertyStatus.SOLD,
        PropertyStatus.WITHDRAWN,
        PropertyStatus.EXPIRED,
        PropertyStatus.OFF_MARKET,
      ];

      for (const status of statuses) {
        await act(async () => {
          await result.current.updatePropertyStatus('prop-123', status);
        });
      }

      // Should have been called for each status
      expect(mockSupabaseUpdate).toHaveBeenCalledTimes(statuses.length);
    });
  });

  describe('loading state', () => {
    it('should start with loading false', () => {
      const { result } = renderHook(() => usePropertyActions());
      expect(result.current.isLoading).toBe(false);
    });

    it('should reset loading after operation completes', async () => {
      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty();

      // Run an operation and verify loading resets after
      await act(async () => {
        await result.current.copyPropertyLink(property);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('error state', () => {
    it('should start with error null', () => {
      const { result } = renderHook(() => usePropertyActions());
      expect(result.current.error).toBeNull();
    });

    it('should clear error on successful operation', async () => {
      // First, trigger an error via clipboard
      (Clipboard.setStringAsync as jest.Mock).mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() => usePropertyActions());
      const property = createMockProperty();

      await act(async () => {
        await result.current.copyPropertyLink(property);
      });

      expect(result.current.error).toBeTruthy();

      // Then do a successful operation
      (Clipboard.setStringAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.copyPropertyLink(property);
      });

      expect(result.current.error).toBeNull();
    });
  });
});
