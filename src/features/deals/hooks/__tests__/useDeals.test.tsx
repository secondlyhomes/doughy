import { renderHook, waitFor } from '@testing-library/react';
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
jest.mock('@/lib/supabase');

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

  const mockDeal: Deal = {
    id: 'deal-1',
    user_id: 'user-1',
    stage: 'new',
    strategy: 'flip',
    lead_id: 'lead-1',
    property_id: 'property-1',
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
        expect(mockSupabase.from).toHaveBeenCalledWith('deals');
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
        expect(selectQuery).toContain('property:re_properties');
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
        lead_id: 'lead-1',
        property_id: 'property-1',
        stage: 'new',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        lead_id: 'lead-1',
        property_id: 'property-1',
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
        lead_id: 'lead-1',
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
        id: 'deal-1',
        stage: 'active',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
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
        id: 'deal-1',
        stage: 'active',
      });

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deals'],
      }));
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deal', 'deal-1'],
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

      await result.current.mutateAsync('deal-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
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

      await result.current.mutateAsync('deal-1');

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['deals'],
      }));
    });
  });
});
