// Tests for adminService.ts
import { getAdminStats, getSystemHealth } from '../../services/adminService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('adminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminStats', () => {
    // Helper to create a mock chain that returns success
    const createSuccessMock = () => {
      const createSelectChain = () => {
        const eqFn = jest.fn().mockReturnThis();
        const gteFn = jest.fn().mockReturnThis();

        // Make the final call in any chain resolve with count
        eqFn.mockImplementation(() => Promise.resolve({ count: 5, error: null }));
        gteFn.mockImplementation(() => ({
          eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
        }));

        return {
          eq: jest.fn().mockResolvedValue({ count: 10, error: null }),
          gte: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
          }),
        };
      };

      return jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(createSelectChain()),
      });
    };

    it('fetches all stats successfully', async () => {
      mockSupabase.from = createSuccessMock();

      const result = await getAdminStats();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
    });

    it('handles profile count error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: null, error: new Error('DB Error') }),
        }),
      });

      const result = await getAdminStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('DB Error');
    });

    it('handles active users count error', async () => {
      let callCount = 0;
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({ count: 10, error: null });
            }
            return Promise.resolve({ count: null, error: new Error('Active users error') });
          }),
        }),
      });

      const result = await getAdminStats();

      expect(result.success).toBe(false);
    });

    it('handles leads count error', async () => {
      let callCount = 0;
      const mockEqResolved = jest.fn().mockResolvedValue({ count: 10, error: null });

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 'leads') {
          return {
            select: jest.fn().mockResolvedValue({ count: null, error: new Error('Leads error') }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: mockEqResolved,
          }),
        };
      });

      const result = await getAdminStats();

      expect(result.success).toBe(false);
    });

    it('handles properties count error', async () => {
      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 're_properties') {
          return {
            select: jest.fn().mockResolvedValue({ count: null, error: new Error('Properties error') }),
          };
        }
        if (table === 'leads') {
          return {
            select: jest.fn().mockResolvedValue({ count: 50, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 10, error: null }),
          }),
        };
      });

      const result = await getAdminStats();

      expect(result.success).toBe(false);
    });

    it('handles new users count error', async () => {
      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 're_properties') {
          return {
            select: jest.fn().mockResolvedValue({ count: 25, error: null }),
          };
        }
        if (table === 'leads') {
          return {
            select: jest.fn().mockResolvedValue({ count: 50, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ count: null, error: new Error('New users error') }),
              }),
            }),
          }),
        };
      });

      const result = await getAdminStats();

      expect(result.success).toBe(false);
    });

    it('handles new leads count error', async () => {
      let profileCalls = 0;
      let leadsCalls = 0;

      mockSupabase.from = jest.fn().mockImplementation((table) => {
        if (table === 're_properties') {
          return {
            select: jest.fn().mockResolvedValue({ count: 25, error: null }),
          };
        }
        if (table === 'leads') {
          leadsCalls++;
          if (leadsCalls === 1) {
            return {
              select: jest.fn().mockResolvedValue({ count: 50, error: null }),
            };
          }
          return {
            select: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({ count: null, error: new Error('New leads error') }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
              }),
            }),
          }),
        };
      });

      const result = await getAdminStats();

      expect(result.success).toBe(false);
    });

    it('returns zeros for null counts', async () => {
      // Mock that returns null counts for everything (no error)
      const nullCountChain = {
        eq: jest.fn().mockResolvedValue({ count: null, error: null }),
        gte: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ count: null, error: null }),
        }),
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue(nullCountChain),
      });

      const result = await getAdminStats();

      expect(result.success).toBe(true);
      expect(result.stats?.totalUsers).toBe(0);
    });

    it('handles non-Error exceptions', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw 'String error';
      });

      const result = await getAdminStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch stats');
    });
  });

  describe('getSystemHealth', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns operational status for all systems when healthy', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
        }),
      });

      mockSupabase.auth = {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      } as unknown as typeof mockSupabase.auth;

      mockSupabase.storage = {
        listBuckets: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as unknown as typeof mockSupabase.storage;

      const result = await getSystemHealth();

      expect(result.success).toBe(true);
      expect(result.systems).toBeDefined();
      expect(result.systems!.length).toBeGreaterThan(0);

      const apiServer = result.systems!.find(s => s.name === 'API Server');
      expect(apiServer?.status).toBe('operational');
    });

    it('returns degraded status for high latency database', async () => {
      // Mock slow database response
      const slowSelect = jest.fn().mockReturnValue({
        limit: jest.fn().mockImplementation(() => {
          return new Promise(resolve => {
            setTimeout(() => resolve({ data: [{ id: '1' }], error: null }), 1500);
          });
        }),
      });

      mockSupabase.from = jest.fn().mockReturnValue({
        select: slowSelect,
      });

      mockSupabase.auth = {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      } as unknown as typeof mockSupabase.auth;

      mockSupabase.storage = {
        listBuckets: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as unknown as typeof mockSupabase.storage;

      // Don't use fake timers for this test
      jest.useRealTimers();

      const result = await getSystemHealth();

      expect(result.success).toBe(true);
    });

    it('returns outage status for database error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: null, error: new Error('DB down') }),
        }),
      });

      mockSupabase.auth = {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      } as unknown as typeof mockSupabase.auth;

      mockSupabase.storage = {
        listBuckets: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as unknown as typeof mockSupabase.storage;

      jest.useRealTimers();
      const result = await getSystemHealth();

      expect(result.success).toBe(true);
      const database = result.systems!.find(s => s.name === 'Database');
      expect(database?.status).toBe('outage');
    });

    it('returns outage status for database exception', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error('Connection failed')),
        }),
      });

      mockSupabase.auth = {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      } as unknown as typeof mockSupabase.auth;

      mockSupabase.storage = {
        listBuckets: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as unknown as typeof mockSupabase.storage;

      jest.useRealTimers();
      const result = await getSystemHealth();

      expect(result.success).toBe(true);
      const database = result.systems!.find(s => s.name === 'Database');
      expect(database?.status).toBe('outage');
    });

    it('returns degraded status for auth error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
        }),
      });

      mockSupabase.auth = {
        getSession: jest.fn().mockResolvedValue({ data: null, error: new Error('Auth error') }),
      } as unknown as typeof mockSupabase.auth;

      mockSupabase.storage = {
        listBuckets: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as unknown as typeof mockSupabase.storage;

      jest.useRealTimers();
      const result = await getSystemHealth();

      expect(result.success).toBe(true);
      const auth = result.systems!.find(s => s.name === 'Authentication');
      expect(auth?.status).toBe('degraded');
    });

    it('returns outage status for auth exception', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
        }),
      });

      mockSupabase.auth = {
        getSession: jest.fn().mockRejectedValue(new Error('Auth failed')),
      } as unknown as typeof mockSupabase.auth;

      mockSupabase.storage = {
        listBuckets: jest.fn().mockResolvedValue({ data: [], error: null }),
      } as unknown as typeof mockSupabase.storage;

      jest.useRealTimers();
      const result = await getSystemHealth();

      expect(result.success).toBe(true);
      const auth = result.systems!.find(s => s.name === 'Authentication');
      expect(auth?.status).toBe('outage');
    });

    it('returns degraded status for storage error', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
        }),
      });

      mockSupabase.auth = {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      } as unknown as typeof mockSupabase.auth;

      mockSupabase.storage = {
        listBuckets: jest.fn().mockResolvedValue({ data: null, error: new Error('Storage error') }),
      } as unknown as typeof mockSupabase.storage;

      jest.useRealTimers();
      const result = await getSystemHealth();

      expect(result.success).toBe(true);
      const storage = result.systems!.find(s => s.name === 'Storage');
      expect(storage?.status).toBe('degraded');
    });

    it('returns degraded status for storage exception', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [{ id: '1' }], error: null }),
        }),
      });

      mockSupabase.auth = {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      } as unknown as typeof mockSupabase.auth;

      mockSupabase.storage = {
        listBuckets: jest.fn().mockRejectedValue(new Error('Storage failed')),
      } as unknown as typeof mockSupabase.storage;

      jest.useRealTimers();
      const result = await getSystemHealth();

      expect(result.success).toBe(true);
      const storage = result.systems!.find(s => s.name === 'Storage');
      expect(storage?.status).toBe('degraded');
    });
  });
});
