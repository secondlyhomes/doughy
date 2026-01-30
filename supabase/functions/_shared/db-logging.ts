/**
 * Database Logging Module
 *
 * Provides dual logging (console + database) for edge functions.
 * Logs are written to both console for immediate visibility and
 * the system_logs table for persistence and analysis.
 *
 * @module _shared/db-logging
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// Types
// =============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface LoggerConfig {
  source: string;
  enableDbLogging?: boolean;
}

// =============================================================================
// Logger Factory
// =============================================================================

/**
 * Creates a logger instance for an edge function
 *
 * @param config - Logger configuration
 * @returns Logger object with level-specific methods
 *
 * @example
 * const log = createLogger({ source: 'my-function' });
 * log.info('Processing request', { requestId: '123' });
 * log.error('Failed to process', { error: err.message });
 */
export function createLogger(config: LoggerConfig) {
  const { source, enableDbLogging = true } = config;

  const logToDb = async (entry: LogEntry): Promise<void> => {
    if (!enableDbLogging) return;

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseKey) return;

      const supabase = createClient(supabaseUrl, supabaseKey);
      const result = await supabase.from('system_logs').insert({
        level: entry.level,
        source: entry.source,
        message: entry.message,
        details: entry.details || {},
      });

      if (result.error) {
        console.error(`[${source}] Failed to log to database:`, result.error);
      }
    } catch (error) {
      console.error(`[${source}] Error logging to database:`, error);
    }
  };

  const formatMessage = (message: string): string => `[${source}] ${message}`;

  return {
    debug: (message: string, details?: Record<string, unknown>): void => {
      console.debug(formatMessage(`DEBUG: ${message}`), details || '');
      logToDb({ level: 'debug', source, message, details });
    },

    info: (message: string, details?: Record<string, unknown>): void => {
      console.info(formatMessage(`INFO: ${message}`), details || '');
      logToDb({ level: 'info', source, message, details });
    },

    warn: (message: string, details?: Record<string, unknown>): void => {
      console.warn(formatMessage(`WARN: ${message}`), details || '');
      logToDb({ level: 'warn', source, message, details });
    },

    error: (message: string, details?: Record<string, unknown>): void => {
      console.error(formatMessage(`ERROR: ${message}`), details || '');
      logToDb({ level: 'error', source, message, details });
    },
  };
}

// =============================================================================
// Standalone Logging Functions (Legacy Support)
// =============================================================================

/**
 * Log info message with optional database persistence
 * @deprecated Use createLogger() instead for better performance
 */
export function logInfo(
  source: string,
  message: string,
  details?: Record<string, unknown>
): void {
  const log = createLogger({ source });
  log.info(message, details);
}

/**
 * Log error message with optional database persistence
 * @deprecated Use createLogger() instead for better performance
 */
export function logError(
  source: string,
  message: string,
  details?: Record<string, unknown>
): void {
  const log = createLogger({ source });
  log.error(message, details);
}

/**
 * Log warning message with optional database persistence
 * @deprecated Use createLogger() instead for better performance
 */
export function logWarn(
  source: string,
  message: string,
  details?: Record<string, unknown>
): void {
  const log = createLogger({ source });
  log.warn(message, details);
}
