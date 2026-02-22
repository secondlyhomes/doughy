// src/features/admin/services/logsService.ts
// System logs service for admin

import { supabase } from '@/lib/supabase';

export type LogLevel = 'info' | 'warning' | 'error' | 'debug';

/**
 * Sanitize search input to prevent injection
 */
function sanitizeSearchInput(input: string): string {
  // Remove special characters that could affect the query
  // Allow alphanumeric, spaces, @, ., -, _
  return input.replace(/[^a-zA-Z0-9\s@.\-_]/g, '').trim();
}

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

// Discriminated union ensures proper type narrowing
export type LogsResult =
  | { success: true; logs: LogEntry[]; total: number; error?: never }
  | { success: false; logs?: never; total?: never; error: string };

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

    // Apply search with sanitized input
    if (search) {
      const sanitized = sanitizeSearchInput(search);
      if (sanitized.length > 0) {
        query = query.ilike('message', `%${sanitized}%`);
      }
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
      // If table doesn't exist, return error - this is a configuration issue
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        return {
          success: false,
          error: 'System logs table not found. Database migration may be required.',
        };
      }
      throw error;
    }

    const logs: LogEntry[] = (data || []).map((log) => ({
      id: log.id,
      level: log.level as LogLevel,
      message: log.message,
      source: log.source || 'system',
      userId: (log as Record<string, unknown>).user_id as string | undefined,
      metadata: log.details ? (log.details as Record<string, unknown>) : undefined,
      timestamp: log.created_at || new Date().toISOString(),
    }));

    return {
      success: true,
      logs,
      total: count || 0,
    };
  } catch (error) {
    console.error('[admin] Error fetching logs:', error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message: unknown }).message)
          : 'Failed to fetch logs';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

const DEFAULT_LOG_SOURCES = ['api', 'auth', 'database', 'storage', 'cron'];

// Discriminated union for log sources - always returns sources (from DB or defaults)
export type LogSourcesResult =
  | { sources: string[]; isDefault: false; error?: never }
  | { sources: string[]; isDefault: true; error?: string };

/**
 * Get available log sources
 */
export async function getLogSources(): Promise<LogSourcesResult> {
  try {
    const { data, error } = await supabase
      .from('system_logs')
      .select('source')
      .limit(100);

    if (error) {
      console.error('[admin] Error fetching log sources:', error);
      return { sources: DEFAULT_LOG_SOURCES, isDefault: true, error: error.message };
    }

    const sources = [...new Set(data?.map((d) => d.source) || [])];
    return {
      sources: sources.length > 0 ? sources : DEFAULT_LOG_SOURCES,
      isDefault: sources.length === 0,
    };
  } catch (error) {
    console.error('[admin] Error fetching log sources:', error);
    return {
      sources: DEFAULT_LOG_SOURCES,
      isDefault: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
