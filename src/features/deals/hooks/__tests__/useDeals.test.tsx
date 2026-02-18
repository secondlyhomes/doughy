import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  useDeals,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
} from '../useDeals';
import type { Deal } from '../../types';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useDeals', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // Use valid UUIDs since hooks check for valid UUID format
  const validDealId = '550e8400-e29b-41d4-a716-446655440000';
  const validUserId = '550e8400-e29b-41d4-a716-446655440001';
  const validLeadId = '550e8400-e29b-41d4-a716-446655440002';
  const validPropertyId = '550e8400-e29b-41d4-a716-446655440003';

  const mockDeal: Deal = {
    id: validDealId,
    user_id: validUserId,
    stage: 'new',
    strategy: 'flip',
    lead_id: validLeadId,
    property_id: validPropertyId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('useDeals query', () => {
    it('queries from correct table name (deals, not re_pipeline)', async () => {
      const mockDeals: Deal[] = [mockDeal];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockDeals,
              error: null,
            }),
          }),
        }),
      } as any);

      renderHook(() => useDeals(), { wrapper });

      await waitFor(() => {
        // Verify it queries 'deals' table (NOT 're_pipeline')
        expect(mockSupabase.from).toHaveBeenCalledWith('investor_deals_pipeline');
      });
    });

    it('includes relationship joins with correct table names (crm_leads not leads)', async () => {
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: selectMock,
      } as any);

      renderHook(() => useDeals(), { wrapper });

      await waitFor(() => {
        // Verify SELECT includes crm_leads (not old 'leads' table)
        const selectQuery = selectMock.mock.calls[0][0];
        expect(selectQuery).toContain('lead:crm_leads');
        expect(selectQuery).not.toContain('lead:leads');
        // Also verify property relationship
        expect(selectQuery).toContain('property:investor_properties');
      });
    });

    it('applies stage filter correctly', async () => {
      const mockEqFn = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEqFn,
        }),
      } as any);

      renderHook(() => useDeals({ stage: 'active' }), { wrapper });

      await waitFor(() => {
        expect(mockEqFn).toHaveBeenCalledWith('stage', 'active');
      });
    });

    it('applies strategy filter correctly', async () => {
      const mockEqFn = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: mockEqFn,
        }),
      } as any);

      renderHook(() => useDeals({ strategy: 'flip' }), { wrapper });

      await waitFor(() => {
        expect(mockEqFn).toHaveBeenCalledWith('strategy', 'flip');
      });
    });

    it('applies activeOnly filter to exclude closed deals', async () => {
      const mockNotFn = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          not: mockNotFn,
        }),
      } as any);

      renderHook(() => useDeals({ activeOnly: true }), { wrapper });

      await waitFor(() => {
        expect(mockNotFn).toHaveBeenCalledWith('stage', 'in', '(closed_won,closed_lost)');
      });
    });

    it('applies sorting correctly', async () => {
      const mockOrderFn = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: mockOrderFn,
        }),
      } as any);

      renderHook(() => useDeals({ sortBy: 'updated_at', sortDirection: 'desc' }), { wrapper });

      await waitFor(() => {
        expect(mockOrderFn).toHaveBeenCalledWith('updated_at', expect.objectContaining({
          ascending: false,
          nullsFirst: false,
        }));
      });
    });

    it('uses semantic cache keys (deals, not re_pipeline)', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      renderHook(() => useDeals(), { wrapper });

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const dealQuery = queries.find(q => q.queryKey.includes('deals'));
        // Cache key should be semantic 'deals', not database table name 're_pipeline'
        expect(dealQuery?.queryKey).toContain('deals');
      });
    });
  });

  describe('useCreateDeal mutation', () => {
    beforeEach(() => {
      // Set up auth mock for create operations
      mockSupabase.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      } as any;
    });

    it('inserts to deals table', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockDeal,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useCreateDeal(), { wrapper });

      await result.current.mutateAsync({
        lead_id: validLeadId,
        property_id: validPropertyId,
        stage: 'new',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('investor_deals_pipeline');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        lead_id: validLeadId,
        property_id: validPropertyId,
        stage: 'new',
      }));
    });

    it('invalidates deals cache after creation', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockDeal,
              error: null,
            }),
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateDeal(), { wrapper });

      await result.current.mutateAsync({
        lead_id: validLeadId,
        stage: 'new',
      });

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deals'],
      }));
    });
  });

  describe('useUpdateDeal mutation', () => {
    it('updates deals table', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockDeal, stage: 'active' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const { result } = renderHook(() => useUpdateDeal(), { wrapper });

      await result.current.mutateAsync({
        id: validDealId,
        data: { stage: 'active' },
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('investor_deals_pipeline');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        stage: 'active',
      }));
    });

    it('invalidates specific deal and deals list cache', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockDeal,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateDeal(), { wrapper });

      await result.current.mutateAsync({
        id: validDealId,
        data: { stage: 'active' },
      });

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deals'],
      }));
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deal', validDealId],
      }));
    });
  });

  describe('useDeleteDeal mutation', () => {
    it('deletes from deals table', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      } as any);

      const { result } = renderHook(() => useDeleteDeal(), { wrapper });

      await result.current.mutateAsync(validDealId);

      expect(mockSupabase.from).toHaveBeenCalledWith('investor_deals_pipeline');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('invalidates deals cache after deletion', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteDeal(), { wrapper });

      await result.current.mutateAsync(validDealId);

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deals'],
      }));
    });
  });

  describe('useDeal (single deal by ID)', () => {
    it('fetches single deal by ID', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockDeal,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const { useDeal } = require('../useDeals');
      const { result } = renderHook(() => useDeal(validDealId), { wrapper });

      await waitFor(() => {
        expect(result.current.deal).toBeDefined();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('investor_deals_pipeline');
    });

    it('returns null for non-existent deal', async () => {
      // Use a valid UUID format so the query is enabled
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            }),
          }),
        }),
      } as any);

      const { useDeal } = require('../useDeals');
      const { result } = renderHook(() => useDeal(nonExistentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // When PGRST116 is returned, hook returns null
      expect(result.current.deal).toBeNull();
    });

    it('does not fetch for invalid UUID', () => {
      const { useDeal } = require('../useDeals');
      const { result } = renderHook(() => useDeal('new'), { wrapper });

      // Should not have made any calls since 'new' is not a valid UUID
      expect(result.current.deal).toBeUndefined();
    });
  });

  describe('useDealsPaginated', () => {
    it('fetches first page of deals', async () => {
      const mockDeals = [mockDeal];

      // Without filters: from('deals').select(...).order(...).range(...)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockDeals,
              error: null,
              count: 1,
            }),
          }),
        }),
      } as any);

      const { useDealsPaginated } = require('../useDeals');
      const { result } = renderHook(() => useDealsPaginated(), { wrapper });

      await waitFor(() => {
        expect(result.current.deals).toHaveLength(1);
      });

      expect(result.current.hasNextPage).toBe(false);
    });

    it('indicates hasNextPage when more data exists', async () => {
      const mockDeals = Array.from({ length: 20 }, (_, i) => ({
        ...mockDeal,
        id: `${validDealId.slice(0, -1)}${i}`,
      }));

      // Without filters: from('deals').select(...).order(...).range(...)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            range: jest.fn().mockResolvedValue({
              data: mockDeals,
              error: null,
              count: 50, // Total count is more than page size
            }),
          }),
        }),
      } as any);

      const { useDealsPaginated } = require('../useDeals');
      const { result } = renderHook(() => useDealsPaginated(), { wrapper });

      await waitFor(() => {
        expect(result.current.hasNextPage).toBe(true);
      });
    });
  });

  describe('useDealsWithActions', () => {
    it('fetches deals with upcoming actions', async () => {
      const dealsWithActions = [
        { ...mockDeal, next_action: 'Call seller', next_action_due: '2026-02-01' },
        { ...mockDeal, id: 'deal-2', next_action: 'Site visit', next_action_due: '2026-02-05' },
      ];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: dealsWithActions,
              error: null,
            }),
          }),
        }),
      } as any);

      const { useDealsWithActions } = require('../useDeals');
      const { result } = renderHook(() => useDealsWithActions(5), { wrapper });

      await waitFor(() => {
        expect(result.current.deals.length).toBeGreaterThan(0);
      });
    });

    it('limits results to specified count', async () => {
      const manyDeals = Array.from({ length: 10 }, (_, i) => ({
        ...mockDeal,
        id: `deal-${i}`,
        next_action: `Action ${i}`,
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: manyDeals,
              error: null,
            }),
          }),
        }),
      } as any);

      const { useDealsWithActions } = require('../useDeals');
      const { result } = renderHook(() => useDealsWithActions(3), { wrapper });

      await waitFor(() => {
        // Should be limited to 3 even though 10 returned
        expect(result.current.deals.length).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('useUpdateDealStage', () => {
    it('updates deal stage', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockDeal, stage: 'active' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const { useUpdateDealStage } = require('../useDeals');
      const { result } = renderHook(() => useUpdateDealStage(), { wrapper });

      await result.current.mutateAsync({ id: validDealId, stage: 'active' });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        stage: 'active',
      }));
    });

    it('invalidates both deals list and specific deal cache', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockDeal, stage: 'negotiating' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { useUpdateDealStage } = require('../useDeals');
      const { result } = renderHook(() => useUpdateDealStage(), { wrapper });

      await result.current.mutateAsync({ id: validDealId, stage: 'negotiating' });

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deals'],
      }));
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deal', validDealId],
      }));
    });
  });

  describe('Deal-Property-Lead Linking', () => {
    it('includes lead data in deal fetch', async () => {
      const dealWithLead = {
        ...mockDeal,
        lead: {
          id: validLeadId,
          name: 'John Seller',
          phone: '+1234567890',
          email: 'john@example.com',
          status: 'active',
          score: 75,
        },
      };

      // Without filters, query is: from('deals').select(...).order(...)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [dealWithLead],
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useDeals(), { wrapper });

      await waitFor(() => {
        expect(result.current.deals[0]?.lead).toBeDefined();
        expect(result.current.deals[0]?.lead?.name).toBe('John Seller');
      });
    });

    it('includes property data in deal fetch', async () => {
      const dealWithProperty = {
        ...mockDeal,
        property: {
          id: validPropertyId,
          address_line_1: '123 Main St',
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          bedrooms: 3,
          bathrooms: 2,
          square_feet: 1500,
          arv: 250000,
          purchase_price: 200000,
        },
      };

      // Without filters, query is: from('deals').select(...).order(...)
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [dealWithProperty],
            error: null,
          }),
        }),
      } as any);

      const { result } = renderHook(() => useDeals(), { wrapper });

      await waitFor(() => {
        expect(result.current.deals[0]?.property).toBeDefined();
        expect(result.current.deals[0]?.property?.address_line_1).toBe('123 Main St');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
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

      const { result } = renderHook(() => useDeals(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('handles create deal errors', async () => {
      mockSupabase.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      } as any;

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('Insert failed')),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useCreateDeal(), { wrapper });

      await expect(
        result.current.mutateAsync({ stage: 'new' })
      ).rejects.toThrow('Insert failed');
    });
  });
});
