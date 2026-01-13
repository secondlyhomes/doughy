// src/features/admin/services/logsService.ts
// System logs service for admin

import { supabase } from '@/lib/supabase';

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  source: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface LogFilters {
  level?: LogLevel | 'all';
  source?: string;
  userId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LogsResult {
  success: boolean;
  logs?: LogEntry[];
  total?: number;
  error?: string;
  isMockData?: boolean;
}

/**
 * Fetch system logs with filtering
 */
export async function getLogs(filters: LogFilters = {}): Promise<LogsResult> {
  try {
    const {
      level = 'all',
      source,
      userId,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    let query = supabase
      .from('system_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply level filter
    if (level !== 'all') {
      query = query.eq('level', level);
    }

    // Apply source filter
    if (source) {
      query = query.eq('source', source);
    }

    // Apply user filter
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Apply search
    if (search) {
      query = query.ilike('message', `%${search}%`);
    }

    // Apply date range
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return { success: true, logs: [], total: 0 };
      }
      throw error;
    }

    const logs: LogEntry[] = (data || []).map((log) => ({
      id: log.id,
      level: log.level as LogLevel,
      message: log.message,
      source: log.source || 'system',
      userId: log.user_id ?? undefined,
      metadata: log.details ? (log.details as Record<string, unknown>) : undefined,
      timestamp: log.created_at,
    }));

    return {
      success: true,
      logs,
      total: count || 0,
    };
  } catch (error) {
    console.error('[admin] Error fetching logs:', error);
    // Return mock data with flag indicating it's not real data
    return {
      success: true,
      logs: generateMockLogs(),
      total: 50,
      isMockData: true,
    };
  }
}

/**
 * Get available log sources
 */
export async function getLogSources(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('source')
      .limit(100);

    if (error) {
      return ['api', 'auth', 'database', 'storage', 'cron'];
    }

    const sources = [...new Set(data?.map((d) => d.source) || [])];
    return sources.length > 0 ? sources : ['api', 'auth', 'database', 'storage', 'cron'];
  } catch {
    return ['api', 'auth', 'database', 'storage', 'cron'];
  }
}

/**
 * Generate mock logs for demo/development
 */
function generateMockLogs(): LogEntry[] {
  const levels: LogLevel[] = ['info', 'warning', 'error', 'debug'];
  const sources = ['api', 'auth', 'database', 'storage', 'cron'];
  const messages = {
    info: [
      'User logged in successfully',
      'API request completed',
      'Background job started',
      'Cache refreshed',
      'Email sent successfully',
    ],
    warning: [
      'Rate limit approaching for user',
      'Slow query detected (>1s)',
      'Retry attempt for failed request',
      'Session about to expire',
    ],
    error: [
      'Failed to connect to external service',
      'Invalid authentication token',
      'Database query timeout',
      'Payment processing failed',
    ],
    debug: [
      'Processing webhook payload',
      'Cache miss for key',
      'Executing scheduled task',
      'Validating request parameters',
    ],
  };

  const logs: LogEntry[] = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const level = levels[Math.floor(Math.random() * (i < 10 ? 4 : 2))]; // More info/warning than error
    const source = sources[Math.floor(Math.random() * sources.length)];
    const messageList = messages[level];
    const message = messageList[Math.floor(Math.random() * messageList.length)];

    const timestamp = new Date(now.getTime() - i * 60000 * Math.random() * 10);

    logs.push({
      id: `log-${i}`,
      level,
      message,
      source,
      timestamp: timestamp.toISOString(),
    });
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
