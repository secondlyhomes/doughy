// src/features/portfolio/hooks/__tests__/usePortfolio.test.tsx
// Comprehensive tests for usePortfolio hook - portfolio property management

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePortfolio } from '../usePortfolio';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Create wrapper with React Query provider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

const mockDealWithProperty = {
  id: 'deal-1',
  user_id: 'user-123',
  stage: 'closed_won',
  updated_at: '2026-01-15T10:00:00Z',
  property: {
    id: 'prop-1',
    address_line_1: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    square_feet: 2000,
    bedrooms: 3,
    bathrooms: 2,
    year_built: 2005,
    property_type: 'single_family',
    purchase_price: 350000,
    images: [{ id: 'img-1', url: 'http://example.com/img.jpg', is_primary: true }],
  },
};

const mockPortfolioEntry = {
  id: 'entry-1',
  user_id: 'user-123',
  property_id: 'prop-2',
  acquisition_date: '2025-06-01',
  acquisition_price: 400000,
  monthly_rent: 2500,
  monthly_expenses: 800,
  is_active: true,
  group_id: 'group-1',
  deal_id: null,
  property: {
    id: 'prop-2',
    address_line_1: '456 Oak Ave',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    square_feet: 2500,
    bedrooms: 4,
    bathrooms: 3,
    year_built: 2010,
    property_type: 'single_family',
    purchase_price: 400000,
    images: [],
  },
};

// Helper to setup supabase mock chain
const setupMockChain = (dealsData: any[], entriesData: any[], dealsError?: any, entriesError?: any) => {
  const mockFrom = jest.fn((table: string) => {
    if (table === 'deals') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: dealsData, error: dealsError })),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }
    if (table === 're_portfolio_entries') {
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ data: entriesData, error: entriesError })),
          })),
        })),
        upsert: jest.fn(() => Promise.resolve({ error: null })),
      };
    }
    if (table === 'investor_properties') {
      return {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: { id: 'new-prop-123' },
              error: null,
            })),
          })),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null })),
        })),
      };
    }
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    };
  });

  (mockSupabase.from as jest.Mock).mockImplementation(mockFrom);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({
    user: mockUser,
    session: { user: mockUser } as any,
    isLoading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
  });
});

describe('usePortfolio', () => {
  describe('Initial State', () => {
    it('should return empty portfolio when no user', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        signIn: jest.fn(),
        signOut: jest.fn(),
        signUp: jest.fn(),
      });

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.properties).toEqual([]);
      expect(result.current.summary.totalProperties).toBe(0);
    });

    it('should start with loading true', () => {
      setupMockChain([], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Fetching Portfolio', () => {
    it('should fetch properties from closed_won deals', async () => {
      setupMockChain([mockDealWithProperty], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.properties).toHaveLength(1);
      expect(result.current.properties[0].id).toBe('prop-1');
      expect(result.current.properties[0].address).toBe('123 Main St');
      expect(result.current.properties[0].deal_id).toBe('deal-1');
    });

    it('should fetch properties from portfolio entries', async () => {
      setupMockChain([], [mockPortfolioEntry]);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.properties).toHaveLength(1);
      expect(result.current.properties[0].id).toBe('prop-2');
      expect(result.current.properties[0].monthly_rent).toBe(2500);
      expect(result.current.properties[0].monthly_expenses).toBe(800);
      expect(result.current.properties[0].monthly_cash_flow).toBe(1700);
    });

    it('should combine deals and entries without duplicates', async () => {
      // Two different properties from different sources
      setupMockChain([mockDealWithProperty], [mockPortfolioEntry]);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.properties).toHaveLength(2);
    });

    it('should prioritize portfolio entry over deal for same property', async () => {
      // Same property ID in both deal and entry - entry should win
      const entryWithSameProperty = {
        ...mockPortfolioEntry,
        property_id: 'prop-1',
        property: mockDealWithProperty.property,
        monthly_rent: 3000, // Higher rent from entry
      };

      setupMockChain([mockDealWithProperty], [entryWithSameProperty]);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have only 1 property (entry overrides deal)
      expect(result.current.properties).toHaveLength(1);
      expect(result.current.properties[0].monthly_rent).toBe(3000);
    });
  });

  describe('Summary Calculation', () => {
    it('should calculate total properties correctly', async () => {
      setupMockChain([mockDealWithProperty], [mockPortfolioEntry]);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary.totalProperties).toBe(2);
    });

    it('should calculate total value correctly', async () => {
      setupMockChain([mockDealWithProperty], [mockPortfolioEntry]);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Deal property: 350000, Entry property: 400000
      expect(result.current.summary.totalValue).toBe(750000);
    });

    it('should calculate monthly cash flow correctly', async () => {
      setupMockChain([], [mockPortfolioEntry]);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Entry: 2500 rent - 800 expenses = 1700
      expect(result.current.summary.monthlyCashFlow).toBe(1700);
    });

    it('should return empty summary when no properties', async () => {
      setupMockChain([], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.summary).toEqual({
        totalProperties: 0,
        totalValue: 0,
        totalEquity: 0,
        monthlyCashFlow: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle deals fetch error', async () => {
      setupMockChain([], [], { message: 'Database error' }, null);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });

    it('should continue gracefully when entries table does not exist', async () => {
      // Set up mock to return "table does not exist" error for entries
      const mockFrom = jest.fn((table: string) => {
        if (table === 'deals') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [mockDealWithProperty], error: null })),
              })),
            })),
          };
        }
        if (table === 're_portfolio_entries') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'relation "re_portfolio_entries" does not exist' },
                })),
              })),
            })),
          };
        }
        return {};
      });

      (mockSupabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should still have the deal-based property
      expect(result.current.properties).toHaveLength(1);
      expect(result.current.error).toBeNull();
    });
  });

  describe('addToPortfolio', () => {
    it('should update deal stage to closed_won', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      }));

      const mockFrom = jest.fn((table: string) => {
        if (table === 'deals') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
            update: mockUpdate,
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        };
      });

      (mockSupabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.addToPortfolio('deal-123');
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: 'closed_won',
          })
        );
      });
    });
  });

  describe('addManualEntry', () => {
    it('should create portfolio entry for existing property', async () => {
      const mockUpsert = jest.fn(() => Promise.resolve({ error: null }));

      const mockFrom = jest.fn((table: string) => {
        if (table === 'deals') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          };
        }
        if (table === 're_portfolio_entries') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
            upsert: mockUpsert,
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        };
      });

      (mockSupabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addManualEntry({
          property_id: 'existing-prop-123',
          acquisition_date: '2025-01-01',
          acquisition_price: 300000,
          monthly_rent: 2000,
          monthly_expenses: 500,
        });
      });

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          property_id: 'existing-prop-123',
          acquisition_price: 300000,
          monthly_rent: 2000,
          monthly_expenses: 500,
        }),
        expect.any(Object)
      );
    });

    it('should create new property when newProperty provided', async () => {
      const mockInsert = jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: { id: 'new-prop-456' },
              error: null,
            })
          ),
        })),
      }));

      const mockUpsert = jest.fn(() => Promise.resolve({ error: null }));

      const mockFrom = jest.fn((table: string) => {
        if (table === 'deals') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          };
        }
        if (table === 're_portfolio_entries') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
            upsert: mockUpsert,
          };
        }
        if (table === 'investor_properties') {
          return {
            insert: mockInsert,
            delete: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ error: null })),
            })),
          };
        }
        return {};
      });

      (mockSupabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addManualEntry({
          acquisition_date: '2025-01-01',
          acquisition_price: 250000,
          newProperty: {
            address: '789 New St',
            city: 'Houston',
            state: 'TX',
            zip: '77001',
            property_type: 'single_family',
          },
        });
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          address_line_1: '789 New St',
          city: 'Houston',
          state: 'TX',
        })
      );
    });

    it('should throw error when no property_id and no newProperty', async () => {
      setupMockChain([], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.addManualEntry({
            acquisition_date: '2025-01-01',
            acquisition_price: 250000,
          });
        })
      ).rejects.toThrow('Property ID is required');
    });
  });

  describe('removeFromPortfolio', () => {
    it('should revert deal stage to negotiating', async () => {
      const mockUpdate = jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      }));

      const mockFrom = jest.fn((table: string) => {
        if (table === 'deals') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
            update: mockUpdate,
          };
        }
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        };
      });

      (mockSupabase.from as jest.Mock).mockImplementation(mockFrom);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.removeFromPortfolio('deal-123');
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            stage: 'negotiating',
          })
        );
      });
    });
  });

  describe('Refetch', () => {
    it('should refetch portfolio data', async () => {
      setupMockChain([], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initial call
      expect(mockSupabase.from).toHaveBeenCalled();
      const initialCallCount = (mockSupabase.from as jest.Mock).mock.calls.length;

      await act(async () => {
        await result.current.refetch();
      });

      // Should have made additional calls
      expect((mockSupabase.from as jest.Mock).mock.calls.length).toBeGreaterThan(initialCallCount);
    });
  });

  describe('Property Transformation', () => {
    it('should transform database property to PortfolioProperty correctly', async () => {
      setupMockChain([mockDealWithProperty], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const property = result.current.properties[0];

      expect(property).toMatchObject({
        id: 'prop-1',
        address: '123 Main St',
        address_line_1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        square_feet: 2000,
        sqft: 2000,
        bedrooms: 3,
        bathrooms: 2,
        year_built: 2005,
        property_type: 'single_family',
        propertyType: 'single_family',
        purchase_price: 350000,
      });
    });

    it('should handle missing optional fields', async () => {
      const minimalDeal = {
        id: 'deal-minimal',
        user_id: 'user-123',
        stage: 'closed_won',
        property: {
          id: 'prop-minimal',
          address_line_1: '100 Simple St',
          // Missing most optional fields
        },
      };

      setupMockChain([minimalDeal], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const property = result.current.properties[0];

      // Should have defaults for missing fields
      expect(property.city).toBe('');
      expect(property.state).toBe('');
      expect(property.square_feet).toBe(0);
      expect(property.bedrooms).toBe(0);
      expect(property.bathrooms).toBe(0);
    });

    it('should include images from property', async () => {
      setupMockChain([mockDealWithProperty], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.properties[0].images).toHaveLength(1);
      expect(result.current.properties[0].images?.[0].is_primary).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should indicate adding state', async () => {
      setupMockChain([], []);

      const { result } = renderHook(() => usePortfolio(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAdding).toBe(false);
      expect(result.current.isRemoving).toBe(false);
      expect(result.current.isAddingManual).toBe(false);
    });
  });
});
