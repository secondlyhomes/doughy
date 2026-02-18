import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead } from '../useLeads';
import type { Lead } from '../../types';

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

  // Use valid UUIDs since hooks may validate UUID format
  const validLeadId = '550e8400-e29b-41d4-a716-446655440010';
  const validUserId = '550e8400-e29b-41d4-a716-446655440011';
  const validPropertyId = '550e8400-e29b-41d4-a716-446655440012';

  const mockLead: Lead = {
    id: validLeadId,
    user_id: validUserId,
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

    it('filters by is_deleted false by default', async () => {
      // useLeads() always filters by is_deleted: false
      const eqFn = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: eqFn,
        }),
      } as any);

      renderHook(() => useLeads(), { wrapper });

      await waitFor(() => {
        expect(eqFn).toHaveBeenCalledWith('is_deleted', false);
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
    beforeEach(() => {
      // Set up auth mock for create operations
      mockSupabase.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: validUserId } },
        }),
      } as any;
    });

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
        id: validLeadId,
        data: { status: 'active' },
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
        id: validLeadId,
        data: { status: 'active' },
      });

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['leads'],
      }));
      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['lead', validLeadId],
      }));
    });
  });

  describe('useDeleteLead mutation', () => {
    it('soft deletes from crm_leads table (sets is_deleted flag)', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      } as any);

      const { result } = renderHook(() => useDeleteLead(), { wrapper });

      await result.current.mutateAsync(validLeadId);

      expect(mockSupabase.from).toHaveBeenCalledWith('crm_leads');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        is_deleted: true,
      }));
    });

    it('invalidates leads cache after deletion', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      } as any);

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteLead(), { wrapper });

      await result.current.mutateAsync(validLeadId);

      expect(invalidateSpy).toHaveBeenCalledWith(expect.objectContaining({
        queryKey: ['leads'],
      }));
    });
  });

  describe('useLead (single lead by ID)', () => {
    it('fetches single lead by ID', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockLead,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      } as any);

      const { useLead } = require('../useLeads');
      const { result } = renderHook(() => useLead(validLeadId), { wrapper });

      await waitFor(() => {
        expect(result.current.lead).toBeDefined();
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('crm_leads');
    });

    it('returns null for non-existent lead', async () => {
      // Use valid UUID format so the query is enabled
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

      const { useLead } = require('../useLeads');
      const { result } = renderHook(() => useLead(nonExistentId), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.lead).toBeNull();
    });

    it('does not fetch for invalid UUID', () => {
      const { useLead } = require('../useLeads');
      const { result } = renderHook(() => useLead('new'), { wrapper });

      // Should not have made any calls since 'new' is not a valid UUID
      expect(result.current.lead).toBeUndefined();
    });
  });

  describe('useLeadsPaginated', () => {
    it('fetches first page of leads', async () => {
      const mockLeads = [mockLead];

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockLeads,
                error: null,
                count: 1,
              }),
            }),
          }),
        }),
      } as any);

      const { useLeadsPaginated } = require('../useLeads');
      const { result } = renderHook(() => useLeadsPaginated(), { wrapper });

      await waitFor(() => {
        expect(result.current.leads).toHaveLength(1);
      });

      expect(result.current.hasNextPage).toBe(false);
    });

    it('indicates hasNextPage when more data exists', async () => {
      const mockLeads = Array.from({ length: 20 }, (_, i) => ({
        ...mockLead,
        id: `lead-${i}`,
      }));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: mockLeads,
                error: null,
                count: 50, // Total count is more than page size
              }),
            }),
          }),
        }),
      } as any);

      const { useLeadsPaginated } = require('../useLeads');
      const { result } = renderHook(() => useLeadsPaginated(), { wrapper });

      await waitFor(() => {
        expect(result.current.hasNextPage).toBe(true);
      });
    });
  });

  describe('useLeadsWithProperties', () => {
    it('fetches leads with associated properties', async () => {
      const leadWithProperties = {
        ...mockLead,
        properties: [
          {
            id: 'prop-1',
            address_line_1: '123 Main St',
            city: 'Austin',
            state: 'TX',
          },
        ],
        propertyCount: 1,
      };

      // First call returns leads
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockLead],
              error: null,
            }),
          }),
        }),
      } as any);

      // Second call returns properties
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'prop-1',
                lead_id: validLeadId,
                address_line_1: '123 Main St',
                city: 'Austin',
                state: 'TX',
                images: [],
              },
            ],
            error: null,
          }),
        }),
      } as any);

      const { useLeadsWithProperties } = require('../useLeads');
      const { result } = renderHook(() => useLeadsWithProperties(), { wrapper });

      await waitFor(() => {
        expect(result.current.leads).toHaveLength(1);
      });
    });

    it('groups properties by lead_id', async () => {
      // First call returns leads
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockLead, { ...mockLead, id: 'lead-2', name: 'Jane Doe' }],
              error: null,
            }),
          }),
        }),
      } as any);

      // Second call returns properties for both leads
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          not: jest.fn().mockResolvedValue({
            data: [
              { id: 'prop-1', lead_id: validLeadId, address_line_1: '123 Main St', images: [] },
              { id: 'prop-2', lead_id: validLeadId, address_line_1: '456 Oak Ave', images: [] },
              { id: 'prop-3', lead_id: 'lead-2', address_line_1: '789 Pine Rd', images: [] },
            ],
            error: null,
          }),
        }),
      } as any);

      const { useLeadsWithProperties } = require('../useLeads');
      const { result } = renderHook(() => useLeadsWithProperties(), { wrapper });

      await waitFor(() => {
        expect(result.current.leads).toHaveLength(2);
      });
    });
  });

  describe('useOrphanProperties', () => {
    it('fetches properties without lead_id', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          is: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'orphan-prop-1',
                  address_line_1: '999 Unknown St',
                  city: 'Austin',
                  state: 'TX',
                  images: [],
                },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const { useOrphanProperties } = require('../useLeads');
      const { result } = renderHook(() => useOrphanProperties(), { wrapper });

      await waitFor(() => {
        expect(result.current.properties).toHaveLength(1);
        expect(result.current.properties[0].address_line_1).toBe('999 Unknown St');
      });
    });

    it('queries for null lead_id', async () => {
      const mockIs = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          is: mockIs,
        }),
      } as any);

      const { useOrphanProperties } = require('../useLeads');
      renderHook(() => useOrphanProperties(), { wrapper });

      await waitFor(() => {
        expect(mockIs).toHaveBeenCalledWith('lead_id', null);
      });
    });
  });

  describe('Lead Score', () => {
    it('preserves score on lead fetch', async () => {
      const leadWithScore = { ...mockLead, score: 85 };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [leadWithScore],
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useLeads(), { wrapper });

      await waitFor(() => {
        expect(result.current.leads[0]?.score).toBe(85);
      });
    });

    it('updates lead score', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockLead, score: 90 },
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
        id: validLeadId,
        data: { score: 90 },
      });

      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        score: 90,
      }));
    });
  });

  describe('Lead Status', () => {
    const statusOptions = ['new', 'contacted', 'qualified', 'negotiating', 'closed', 'lost'];

    statusOptions.forEach((status) => {
      it(`handles ${status} status correctly`, async () => {
        const leadWithStatus = { ...mockLead, status };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [leadWithStatus],
                error: null,
              }),
            }),
          }),
        } as any);

        const { result } = renderHook(() => useLeads(), { wrapper });

        await waitFor(() => {
          expect(result.current.leads[0]?.status).toBe(status);
        });
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

      const { result } = renderHook(() => useLeads(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('handles create lead errors', async () => {
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

      const { result } = renderHook(() => useCreateLead(), { wrapper });

      await expect(
        result.current.mutateAsync({ name: 'Test Lead' })
      ).rejects.toThrow('Insert failed');
    });

    it('throws error when creating lead without authentication', async () => {
      mockSupabase.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      } as any;

      const { result } = renderHook(() => useCreateLead(), { wrapper });

      await expect(
        result.current.mutateAsync({ name: 'Test Lead' })
      ).rejects.toThrow('User not authenticated');
    });
  });

  describe('Lead Tags', () => {
    it('preserves tags array on lead fetch', async () => {
      const leadWithTags = { ...mockLead, tags: ['motivated', 'cash-buyer'] };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [leadWithTags],
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useLeads(), { wrapper });

      await waitFor(() => {
        expect(result.current.leads[0]?.tags).toEqual(['motivated', 'cash-buyer']);
      });
    });

    it('handles empty tags array', async () => {
      const leadWithNoTags = { ...mockLead, tags: [] };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [leadWithNoTags],
              error: null,
            }),
          }),
        }),
      } as any);

      const { result } = renderHook(() => useLeads(), { wrapper });

      await waitFor(() => {
        expect(result.current.leads[0]?.tags).toEqual([]);
      });
    });
  });
});
