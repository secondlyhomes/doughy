// Tests for investorSeeder.ts
import { investorSeeder, seedService } from '../investorSeeder';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

jest.mock('@/lib/supabase');
jest.mock('expo-constants');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockConstants = Constants as jest.Mocked<typeof Constants>;

describe('investorSeeder', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default to dev environment
    (global as any).__DEV__ = true;
    mockConstants.expoConfig = {
      extra: {
        supabaseUrl: 'https://dev.supabase.co',
        env: 'development',
      },
    } as any;
  });

  describe('canSeedDatabase', () => {
    it('allows seeding in dev mode with dev URL', () => {
      const result = seedService.canSeedDatabase();

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('blocks seeding when __DEV__ is false', () => {
      (global as any).__DEV__ = false;

      const result = seedService.canSeedDatabase();

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('development mode');
    });

    it('blocks seeding with production URL', () => {
      mockConstants.expoConfig = {
        extra: {
          supabaseUrl: 'https://vpqglbaedcpeprnlnfxd.supabase.co',
          env: 'development',
        },
      } as any;

      const result = seedService.canSeedDatabase();

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('production');
    });

    it('blocks seeding when env is production', () => {
      mockConstants.expoConfig = {
        extra: {
          supabaseUrl: 'https://dev.supabase.co',
          env: 'production',
        },
      } as any;

      const result = seedService.canSeedDatabase();

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('production');
    });
  });

  describe('clearDatabase', () => {
    it('clears all user data successfully', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 10 }),
      };

      mockSupabase.from = jest.fn().mockReturnValue(mockDeleteQuery);

      const result = await seedService.clearDatabase('test-user-id');

      expect(result.success).toBe(true);
      expect(result.counts.deals).toBe(10);
      expect(result.counts.documents).toBe(10);
      expect(result.counts.properties).toBe(10);
      expect(result.counts.leads).toBe(10);
      expect(result.errors).toBeUndefined();
    });

    it('handles errors gracefully and continues deleting', async () => {
      let callCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        callCount++;
        // Fail on deals (first call), succeed on others
        if (callCount === 1) {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue({
              error: { message: 'Deals deletion failed' },
              count: null,
            }),
          };
        }
        return {
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          select: jest.fn().mockResolvedValue({ error: null, count: 5 }),
        };
      });

      const result = await seedService.clearDatabase('test-user-id');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Deals');
      expect(result.counts.deals).toBe(0);
      // Other deletions should still succeed
      expect(result.counts.leads).toBeGreaterThan(0);
    });

    it('blocks clearing in non-dev environment', async () => {
      (global as any).__DEV__ = false;

      const result = await seedService.clearDatabase('test-user-id');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('development mode');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('handles database connection errors', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await seedService.clearDatabase('test-user-id');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('Connection failed');
    });

    it('scopes deletions to user_id', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 5 }),
      };

      mockSupabase.from = jest.fn().mockReturnValue(mockDeleteQuery);

      await seedService.clearDatabase('test-user-123');

      // Check that eq was called with user_id filter on first delete (deals)
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('user_id', 'test-user-123');
    });
  });

  describe('seedDatabase', () => {
    it('seeds database with test data successfully', async () => {
      // Mock clear
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 0 }),
      };

      // Mock insert for leads, properties, deals
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        callCount++;
        // First 13 calls are clear operations, rest are inserts
        // First 4 calls are clear operations (deals, documents, properties, leads)
        if (callCount <= 4) {
          return mockDeleteQuery;
        }
        return mockInsertQuery;
      });

      const result = await seedService.seedDatabase('test-user-id');

      expect(result.success).toBe(true);
      expect(result.counts.leads).toBe(50);
      expect(result.counts.properties).toBe(20);
      expect(result.counts.deals).toBe(15);
      expect(result.errors).toBeUndefined();
    });

    it('clears existing data before seeding', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 10 }),
      };

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        callCount++;
        // First 4 calls are clear operations (deals, documents, properties, leads)
        if (callCount <= 4) {
          return mockDeleteQuery;
        }
        return mockInsertQuery;
      });

      const result = await seedService.seedDatabase('test-user-id');

      // Verify clear was called (4 delete operations)
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('blocks seeding in non-dev environment', async () => {
      (global as any).__DEV__ = false;

      const result = await seedService.seedDatabase('test-user-id');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0]).toContain('development mode');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('handles partial failure and continues seeding', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 0 }),
      };

      let insertCount = 0;
      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          insertCount++;
          // Fail every 10th insert
          if (insertCount % 10 === 0) {
            return Promise.resolve({
              data: null,
              error: { message: 'Insert failed' },
            });
          }
          return Promise.resolve({
            data: { id: `test-id-${insertCount}` },
            error: null,
          });
        }),
      };

      let callCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        callCount++;
        // First 4 calls are clear operations (deals, documents, properties, leads)
        if (callCount <= 4) {
          return mockDeleteQuery;
        }
        return mockInsertQuery;
      });

      const result = await seedService.seedDatabase('test-user-id');

      // Some inserts should succeed, some should fail
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.counts.leads).toBeGreaterThan(0);
      expect(result.counts.leads).toBeLessThan(50); // Not all succeeded
    });

    it('creates deterministic data (same every time)', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 0 }),
      };

      const insertedLeads: any[] = [];
      const mockInsertQuery = {
        insert: jest.fn().mockImplementation((data) => {
          // Capture inserted lead data
          if (data.name) {
            insertedLeads.push(data);
          }
          return mockInsertQuery;
        }),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabase.from = jest.fn().mockImplementation((tableName) => {
        callCount++;
        // First 4 calls are clear operations (deals, documents, properties, leads)
        if (callCount <= 4) {
          return mockDeleteQuery;
        }
        return mockInsertQuery;
      });

      // Run seed twice
      await seedService.seedDatabase('test-user-id');
      const firstRunLeads = [...insertedLeads];

      insertedLeads.length = 0;
      callCount = 0;

      await seedService.seedDatabase('test-user-id');
      const secondRunLeads = [...insertedLeads];

      // Compare first leads from both runs
      expect(firstRunLeads[0].name).toBe(secondRunLeads[0].name);
      expect(firstRunLeads[0].email).toBe(secondRunLeads[0].email);
      expect(firstRunLeads[0].phone).toBe(secondRunLeads[0].phone);

      // Compare last leads (edge cases)
      const lastIndex = firstRunLeads.length - 1;
      expect(firstRunLeads[lastIndex].name).toBe(secondRunLeads[lastIndex].name);
    });

    it('associates all data with user_id', async () => {
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue({ error: null, count: 0 }),
      };

      const insertedData: any[] = [];
      const mockInsertQuery = {
        insert: jest.fn().mockImplementation((data) => {
          insertedData.push(data);
          return mockInsertQuery;
        }),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        }),
      };

      let callCount = 0;
      mockSupabase.from = jest.fn().mockImplementation(() => {
        callCount++;
        // First 4 calls are clear operations (deals, documents, properties, leads)
        if (callCount <= 4) {
          return mockDeleteQuery;
        }
        return mockInsertQuery;
      });

      await seedService.seedDatabase('user-123');

      // Check that all inserted data has correct user_id
      insertedData.forEach(data => {
        expect(data.user_id).toBe('user-123');
      });
    });
  });
});
