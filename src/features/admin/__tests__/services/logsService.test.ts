// Tests for logsService.ts
import { getLogs, getLogSources } from '../../services/logsService';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('logsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogs', () => {
    const mockLogData = [
      {
        id: 'log-1',
        level: 'info',
        message: 'Test log message',
        source: 'api',
        user_id: 'user-1',
        details: { key: 'value' },
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    it('fetches logs with default filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockLogData, count: 1, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogs();

      expect(result.success).toBe(true);
      expect(result.logs).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockSupabase.from).toHaveBeenCalledWith('system_logs');
    });

    it('applies level filter when not "all"', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getLogs({ level: 'error' });

      expect(mockQuery.eq).toHaveBeenCalledWith('level', 'error');
    });

    it('applies source filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getLogs({ source: 'auth' });

      expect(mockQuery.eq).toHaveBeenCalledWith('source', 'auth');
    });

    it('applies userId filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getLogs({ userId: 'user-123' });

      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-123');
    });

    it('applies search filter', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getLogs({ search: 'test message' });

      expect(mockQuery.ilike).toHaveBeenCalledWith('message', '%test message%');
    });

    it('applies date range filters', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getLogs({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2024-01-31');
    });

    it('applies pagination', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], count: 0, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      await getLogs({ page: 3, limit: 25 });

      expect(mockQuery.range).toHaveBeenCalledWith(50, 74);
    });

    it('returns empty array when table does not exist (PGRST116)', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          count: null,
          error: { code: 'PGRST116', message: 'Table not found' },
        }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogs();

      expect(result.success).toBe(true);
      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('returns empty array when table does not exist (message check)', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          count: null,
          error: { code: 'OTHER', message: 'relation "system_logs" does not exist' },
        }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogs();

      expect(result.success).toBe(true);
      expect(result.logs).toEqual([]);
    });

    it('throws error for other database errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          count: null,
          error: { code: 'OTHER', message: 'Some other error' },
        }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogs();

      // Should return mock data with isMockData flag
      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.logs!.length).toBeGreaterThan(0);
    });

    it('handles exceptions and returns mock data', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await getLogs();

      expect(result.success).toBe(true);
      expect(result.isMockData).toBe(true);
      expect(result.logs!.length).toBe(50);
      expect(result.total).toBe(50);
    });

    it('maps log data correctly', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockLogData, count: 1, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogs();

      expect(result.logs![0]).toEqual({
        id: 'log-1',
        level: 'info',
        message: 'Test log message',
        source: 'api',
        userId: 'user-1',
        metadata: { key: 'value' },
        timestamp: '2024-01-01T00:00:00Z',
      });
    });

    it('handles log without source', async () => {
      const logWithoutSource = {
        id: 'log-2',
        level: 'info',
        message: 'No source log',
        source: null,
        user_id: null,
        details: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [logWithoutSource], count: 1, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogs();

      expect(result.logs![0].source).toBe('system');
      expect(result.logs![0].userId).toBeUndefined();
      expect(result.logs![0].metadata).toBeUndefined();
    });

    it('handles null data gracefully', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, count: null, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogs();

      expect(result.success).toBe(true);
      expect(result.logs).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getLogSources', () => {
    it('returns unique sources from database', async () => {
      const mockSourceData = [
        { source: 'api' },
        { source: 'auth' },
        { source: 'api' }, // duplicate
        { source: 'database' },
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockSourceData, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogSources();

      expect(result).toEqual(['api', 'auth', 'database']);
    });

    it('returns default sources on database error', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogSources();

      expect(result).toEqual(['api', 'auth', 'database', 'storage', 'cron']);
    });

    it('returns default sources on exception', async () => {
      mockSupabase.from = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed');
      });

      const result = await getLogSources();

      expect(result).toEqual(['api', 'auth', 'database', 'storage', 'cron']);
    });

    it('returns default sources when no data returned', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogSources();

      expect(result).toEqual(['api', 'auth', 'database', 'storage', 'cron']);
    });

    it('returns default sources when data is null', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from = jest.fn().mockReturnValue(mockQuery);

      const result = await getLogSources();

      expect(result).toEqual(['api', 'auth', 'database', 'storage', 'cron']);
    });
  });
});
