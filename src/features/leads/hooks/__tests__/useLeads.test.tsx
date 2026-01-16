import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '../useLeads';
import type { Lead } from '../../types';

// Mock Supabase
jest.mock('@/lib/supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('useLeads', () => {
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

  const mockLead: Lead = {
    id: 'lead-1',
    user_id: 'user-1',
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    status: 'new',
    score: 75,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('useLeads query', () => {
    it('queries from crm_leads table (not old leads table)', async () => {
      const mockLeads: Lead[] = [mockLead];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockLeads,
              error: null,
            }),
          }),
        }),
      } as any);

      renderHook(() => useLeads(), { wrapper });

      await waitFor(() => {
        // Verify it queries 'crm_leads' (NOT 'leads')
        expect(mockSupabase.from).toHaveBeenCalledWith('crm_leads');
      });
    });

    it('applies status filter correctly', async () => {
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

      renderHook(() => useLeads({ status: 'active' }), { wrapper });

      await waitFor(() => {
        expect(mockEqFn).toHaveBeenCalledWith('status', 'active');
      });
    });

    it('uses semantic cache keys (leads, not crm_leads)', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      } as any);

      renderHook(() => useLeads(), { wrapper });

      await waitFor(() => {
        const queries = queryClient.getQueryCache().getAll();
        const leadQuery = queries.find(q => q.queryKey.includes('leads'));
        // Cache key should be semantic 'leads', not database table name 'crm_leads'
        expect(leadQuery?.queryKey).toContain('leads');
      });
    });
  });

  describe('useCreateLead mutation', () => {
    it('inserts to crm_leads table', async () => {
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockLead,
            error: null,
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      } as any);

      const { result } = renderHook(() => useCreateLead(), { wrapper });

      await result.current.mutateAsync({
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        status: 'new',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('crm_leads');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        status: 'new',
      }));
    });

    it('invalidates leads cache after creation', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLead,
              error: null,
            }),
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateLead(), { wrapper });

      await result.current.mutateAsync({
        name: 'John Doe',
        phone: '+1234567890',
      });

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['leads'],
      }));
    });
  });

  describe('useUpdateLead mutation', () => {
    it('updates crm_leads table', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockLead, status: 'active' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const { result } = renderHook(() => useUpdateLead(), { wrapper });

      await result.current.mutateAsync({
        id: 'lead-1',
        status: 'active',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('crm_leads');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        status: 'active',
      }));
    });

    it('invalidates specific lead and leads list cache', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockLead,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateLead(), { wrapper });

      await result.current.mutateAsync({
        id: 'lead-1',
        status: 'active',
      });

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['leads'],
      }));
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['lead', 'lead-1'],
      }));
    });
  });

  describe('useDeleteLead mutation', () => {
    it('deletes from crm_leads table', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        delete: mockDelete,
      } as any);

      const { result } = renderHook(() => useDeleteLead(), { wrapper });

      await result.current.mutateAsync('lead-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('crm_leads');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('invalidates leads cache after deletion', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteLead(), { wrapper });

      await result.current.mutateAsync('lead-1');

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['leads'],
      }));
    });
  });
});
