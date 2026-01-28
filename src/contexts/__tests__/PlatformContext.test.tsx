// src/contexts/__tests__/PlatformContext.test.tsx
// Comprehensive tests for PlatformContext - multi-platform switching between investor and landlord

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PlatformProvider,
  usePlatform,
  useIsPlatformActive,
  useIsPlatformEnabled,
  Platform,
} from '../PlatformContext';
import { supabase } from '@/lib/supabase';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      upsert: jest.fn(),
    })),
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Helper to create wrapper with provider
const createWrapper = (defaultPlatform?: Platform) => {
  return ({ children }: { children: React.ReactNode }) => (
    <PlatformProvider defaultPlatform={defaultPlatform}>{children}</PlatformProvider>
  );
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  mockAsyncStorage.getItem.mockResolvedValue(null);
  mockAsyncStorage.setItem.mockResolvedValue(undefined);
  (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: null },
  });
});

describe('PlatformContext', () => {
  describe('Initial State', () => {
    it('should have investor as default platform', async () => {
      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activePlatform).toBe('investor');
      expect(result.current.enabledPlatforms).toContain('investor');
    });

    it('should use defaultPlatform prop when provided', async () => {
      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper('landlord'),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activePlatform).toBe('landlord');
    });

    it('should start with isLoading true', () => {
      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should have no error initially', async () => {
      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Local Storage Integration', () => {
    it('should load settings from AsyncStorage on mount', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'landlord',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activePlatform).toBe('landlord');
      expect(result.current.enabledPlatforms).toEqual(['investor', 'landlord']);
    });

    it('should handle malformed JSON in AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should fall back to defaults
      expect(result.current.activePlatform).toBe('investor');
      expect(result.current.error).not.toBeNull();
    });

    it('should save to AsyncStorage when switching platform', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.switchPlatform('landlord');
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'doughy-platform-settings',
        expect.stringContaining('"activePlatform":"landlord"')
      );
    });
  });

  describe('Database Sync', () => {
    it('should sync with database when user is authenticated', async () => {
      const mockUserId = 'test-user-123';
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: mockUserId } } },
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              enabled_platforms: ['investor', 'landlord'],
              active_platform: 'landlord',
            },
            error: null,
          }),
        }),
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('user_platform_settings');
      expect(result.current.activePlatform).toBe('landlord');
    });

    it('should handle missing database settings gracefully', async () => {
      const mockUserId = 'test-user-123';
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: mockUserId } } },
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Not found error
          }),
        }),
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should use defaults without error
      expect(result.current.activePlatform).toBe('investor');
      expect(result.current.error).toBeNull();
    });
  });

  describe('switchPlatform', () => {
    it('should switch to an enabled platform', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.switchPlatform('landlord');
      });

      expect(result.current.activePlatform).toBe('landlord');
    });

    it('should set error when switching to disabled platform', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.switchPlatform('landlord');
      });

      expect(result.current.activePlatform).toBe('investor'); // Should not change
      expect(result.current.error).toContain('not enabled');
    });

    it('should revert on database save failure', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'investor',
        })
      );

      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
        upsert: jest.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      });

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.switchPlatform('landlord');
      });

      // Should revert to original platform
      expect(result.current.activePlatform).toBe('investor');
      expect(result.current.error).toContain('Failed to save');
    });
  });

  describe('enablePlatform', () => {
    it('should add platform to enabled list', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.enablePlatform('landlord');
      });

      expect(result.current.enabledPlatforms).toContain('landlord');
    });

    it('should do nothing if platform already enabled', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.enablePlatform('landlord');
      });

      // Should still have same length (not duplicated)
      expect(result.current.enabledPlatforms.filter((p) => p === 'landlord').length).toBe(1);
    });
  });

  describe('disablePlatform', () => {
    it('should remove platform from enabled list', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.disablePlatform('landlord');
      });

      expect(result.current.enabledPlatforms).not.toContain('landlord');
    });

    it('should prevent disabling the only enabled platform', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.disablePlatform('investor');
      });

      expect(result.current.enabledPlatforms).toContain('investor');
      expect(result.current.error).toContain('Cannot disable the only enabled platform');
    });

    it('should switch to another platform when disabling active platform', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'landlord',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.disablePlatform('landlord');
      });

      expect(result.current.activePlatform).toBe('investor');
      expect(result.current.enabledPlatforms).not.toContain('landlord');
    });
  });

  describe('refreshSettings', () => {
    it('should reload settings from database', async () => {
      const mockUserId = 'test-user-123';
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: mockUserId } } },
      });

      let callCount = 0;
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockImplementation(() => {
            callCount++;
            return Promise.resolve({
              data: {
                enabled_platforms: callCount === 1 ? ['investor'] : ['investor', 'landlord'],
                active_platform: callCount === 1 ? 'investor' : 'landlord',
              },
              error: null,
            });
          }),
        }),
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activePlatform).toBe('investor');

      await act(async () => {
        await result.current.refreshSettings();
      });

      expect(result.current.activePlatform).toBe('landlord');
    });

    it('should set isLoading during refresh', async () => {
      (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: 'test-user' } } },
      });

      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { enabled_platforms: ['investor'], active_platform: 'investor' },
              error: null,
            }),
          }),
        }),
        upsert: jest.fn().mockResolvedValue({ error: null }),
      });

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start refresh and check loading state
      let loadingDuringRefresh = false;
      const refreshPromise = act(async () => {
        const promise = result.current.refreshSettings();
        // Check loading state immediately
        loadingDuringRefresh = result.current.isLoading;
        await promise;
      });

      await refreshPromise;
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear the error state', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => usePlatform(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger an error
      await act(async () => {
        await result.current.switchPlatform('landlord');
      });

      expect(result.current.error).not.toBeNull();

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('usePlatform Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => usePlatform());
      }).toThrow('usePlatform must be used within a PlatformProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('useIsPlatformActive Hook', () => {
    it('should return true when platform is active', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'landlord',
        })
      );

      const { result } = renderHook(() => useIsPlatformActive('landlord'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should return false when platform is not active', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => useIsPlatformActive('landlord'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  describe('useIsPlatformEnabled Hook', () => {
    it('should return true when platform is enabled', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor', 'landlord'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => useIsPlatformEnabled('landlord'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should return false when platform is not enabled', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify({
          enabledPlatforms: ['investor'],
          activePlatform: 'investor',
        })
      );

      const { result } = renderHook(() => useIsPlatformEnabled('landlord'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });
});
