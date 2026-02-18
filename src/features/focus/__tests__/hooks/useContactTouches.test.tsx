// src/features/focus/__tests__/hooks/useContactTouches.test.tsx
// Comprehensive tests for contact touches hooks

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  useTouchesForLead,
  useRecentTouches,
  useLeadTouchStats,
  useCreateTouch,
  useUpdateTouch,
  useDeleteTouch,
  type ContactTouch,
  type TouchInsert,
  type LeadTouchStats,
} from '../../hooks/useContactTouches';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useContactTouches Hooks', () => {
  let queryClient: QueryClient;

  // ============================================
  // Mock Data
  // ============================================

  const createMockTouch = (
    id: string,
    overrides?: Partial<ContactTouch>
  ): ContactTouch => ({
    id,
    user_id: 'user-1',
    lead_id: 'lead-1',
    property_id: null,
    deal_id: null,
    touch_type: 'follow_up',
    outcome: 'connected',
    responded: true,
    notes: 'Had a good conversation',
    callback_scheduled_at: null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  });

  const mockUser = { id: 'user-1', email: 'test@example.com' };

  // ============================================
  // Test Setup
  // ============================================

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  // ============================================
  // useTouchesForLead Tests
  // ============================================

  describe('useTouchesForLead', () => {
    it('fetches touches for a specific lead', async () => {
      const mockTouches = [
        createMockTouch('touch-1', { lead_id: 'lead-1' }),
        createMockTouch('touch-2', { lead_id: 'lead-1' }),
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTouches,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useTouchesForLead('lead-1'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.touches).toHaveLength(2);
      expect(result.current.touches[0].id).toBe('touch-1');
    });

    it('does not fetch when leadId is null', () => {
      const { result } = renderHook(() => useTouchesForLead(null), {
        wrapper,
      });

      expect(result.current.touches).toEqual([]);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('queries contact_touches table with correct lead_id', async () => {
      const eqMock = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      } as any);

      renderHook(() => useTouchesForLead('lead-123'), { wrapper });

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('contact_touches');
        expect(eqMock).toHaveBeenCalledWith('lead_id', 'lead-123');
      });
    });

    it('sorts touches by created_at descending', async () => {
      const orderMock = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: orderMock,
          }),
        }),
      } as any);

      renderHook(() => useTouchesForLead('lead-1'), { wrapper });

      await waitFor(() => {
        expect(orderMock).toHaveBeenCalledWith('created_at', {
          ascending: false,
        });
      });
    });

    it('handles fetch errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useTouchesForLead('lead-1'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('provides refetch function', async () => {
      const mockTouches = [createMockTouch('touch-1')];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockTouches,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useTouchesForLead('lead-1'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });
  });

  // ============================================
  // useRecentTouches Tests
  // ============================================

  describe('useRecentTouches', () => {
    it('fetches recent touches with default limit', async () => {
      const mockTouches = [createMockTouch('touch-1'), createMockTouch('touch-2')];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: mockTouches,
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useRecentTouches(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.touches).toHaveLength(2);
    });

    it('respects custom limit parameter', async () => {
      const limitMock = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: limitMock,
          }),
        }),
      } as any);

      renderHook(() => useRecentTouches(10), { wrapper });

      await waitFor(() => {
        expect(limitMock).toHaveBeenCalledWith(10);
      });
    });
  });

  // ============================================
  // useLeadTouchStats Tests
  // ============================================

  describe('useLeadTouchStats', () => {
    it('calculates touch statistics correctly', async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      const mockTouches = [
        createMockTouch('touch-1', {
          responded: true,
          created_at: now.toISOString(),
        }),
        createMockTouch('touch-2', {
          responded: false,
          created_at: threeDaysAgo.toISOString(),
        }),
        createMockTouch('touch-3', {
          responded: true,
          created_at: threeDaysAgo.toISOString(),
        }),
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockTouches,
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useLeadTouchStats('lead-1'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats?.totalTouches).toBe(3);
      expect(result.current.stats?.respondedTouches).toBe(2);
      expect(result.current.stats?.responsiveness).toBeCloseTo(2 / 3, 2);
      expect(result.current.stats?.daysSinceLastTouch).toBe(0); // Most recent is today
    });

    it('returns null stats when lead has no touches', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useLeadTouchStats('lead-1'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats?.totalTouches).toBe(0);
      expect(result.current.stats?.respondedTouches).toBe(0);
      expect(result.current.stats?.responsiveness).toBeNull();
      expect(result.current.stats?.lastTouchDate).toBeNull();
      expect(result.current.stats?.daysSinceLastTouch).toBeNull();
    });

    it('does not fetch when leadId is null', () => {
      const { result } = renderHook(() => useLeadTouchStats(null), { wrapper });

      expect(result.current.stats).toBeUndefined();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('calculates days since last touch correctly', async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

      const mockTouches = [
        createMockTouch('touch-1', {
          created_at: fiveDaysAgo.toISOString(),
        }),
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockTouches,
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useLeadTouchStats('lead-1'), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats?.daysSinceLastTouch).toBe(5);
    });
  });

  // ============================================
  // useCreateTouch Tests
  // ============================================

  describe('useCreateTouch', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);
    });

    it('creates a touch and invalidates queries', async () => {
      const newTouch = createMockTouch('touch-new');

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newTouch,
              error: null,
            }),
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTouch(), { wrapper });

      const touchData: TouchInsert = {
        lead_id: 'lead-1',
        touch_type: 'first_call',
        outcome: 'connected',
        responded: true,
      };

      await act(async () => {
        await result.current.mutateAsync(touchData);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['contact-touches'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['nudges-stale-leads'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['nudges-deals'],
      });
    });

    it('includes user_id from auth', async () => {
      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: createMockTouch('touch-new'),
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      } as any);

      const { result } = renderHook(() => useCreateTouch(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          lead_id: 'lead-1',
          touch_type: 'email',
          outcome: 'no_answer',
          responded: false,
        });
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
        })
      );
    });

    it('handles creation errors', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Insert failed')),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useCreateTouch(), { wrapper });

      await expect(
        result.current.mutateAsync({
          lead_id: 'lead-1',
          touch_type: 'voicemail',
          outcome: 'voicemail_left',
          responded: false,
        })
      ).rejects.toThrow('Insert failed');
    });

    it('handles unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const { result } = renderHook(() => useCreateTouch(), { wrapper });

      await expect(
        result.current.mutateAsync({
          lead_id: 'lead-1',
          touch_type: 'first_call',
          outcome: 'connected',
          responded: true,
        })
      ).rejects.toThrow('User not authenticated');
    });
  });

  // ============================================
  // useUpdateTouch Tests
  // ============================================

  describe('useUpdateTouch', () => {
    it('updates a touch and invalidates queries', async () => {
      const updatedTouch = createMockTouch('touch-1', {
        notes: 'Updated notes',
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedTouch,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateTouch(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'touch-1',
          updates: { notes: 'Updated notes' },
        });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['contact-touches'],
      });
    });

    it('updates the correct touch by id', async () => {
      const eqMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: createMockTouch('touch-1'),
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      } as any);

      const { result } = renderHook(() => useUpdateTouch(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          id: 'touch-123',
          updates: { outcome: 'callback_scheduled' },
        });
      });

      expect(eqMock).toHaveBeenCalledWith('id', 'touch-123');
    });
  });

  // ============================================
  // useDeleteTouch Tests
  // ============================================

  describe('useDeleteTouch', () => {
    it('deletes a touch and invalidates queries', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteTouch(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('touch-1');
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['contact-touches'],
      });
    });

    it('deletes the correct touch by id', async () => {
      const eqMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: eqMock,
        }),
      } as any);

      const { result } = renderHook(() => useDeleteTouch(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('touch-456');
      });

      expect(eqMock).toHaveBeenCalledWith('id', 'touch-456');
    });

    it('handles deletion errors', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValue(new Error('Delete failed')),
        }),
      } as any);

      const { result } = renderHook(() => useDeleteTouch(), { wrapper });

      await expect(result.current.mutateAsync('touch-1')).rejects.toThrow(
        'Delete failed'
      );
    });
  });

  // ============================================
  // Touch Type Coverage Tests
  // ============================================

  describe('Touch Types', () => {
    it.each([
      'first_call',
      'follow_up',
      'voicemail',
      'email',
      'text',
      'in_person',
    ] as const)('handles %s touch type', async (touchType) => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: createMockTouch('touch-1', { touch_type: touchType }),
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      } as any);

      const { result } = renderHook(() => useCreateTouch(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          lead_id: 'lead-1',
          touch_type: touchType,
          outcome: 'connected',
          responded: true,
        });
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          touch_type: touchType,
        })
      );
    });
  });

  // ============================================
  // Touch Outcome Coverage Tests
  // ============================================

  describe('Touch Outcomes', () => {
    it.each([
      'connected',
      'no_answer',
      'voicemail_left',
      'callback_scheduled',
      'not_interested',
      'other',
    ] as const)('handles %s outcome', async (outcome) => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const insertMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: createMockTouch('touch-1', { outcome }),
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: insertMock,
      } as any);

      const { result } = renderHook(() => useCreateTouch(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          lead_id: 'lead-1',
          touch_type: 'follow_up',
          outcome,
          responded: outcome === 'connected',
        });
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome,
        })
      );
    });
  });
});
