// src/features/campaigns/hooks/useMailHistory.ts
// React Query hook for fetching mail history from investor_drip_touch_logs

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { TouchLogEntry } from '../types';

// =============================================================================
// Query Keys
// =============================================================================

export const mailHistoryKeys = {
  all: ['mail-history'] as const,
  list: (userId: string, filters?: MailHistoryFilters) =>
    [...mailHistoryKeys.all, 'list', userId, filters] as const,
  stats: (userId: string) => [...mailHistoryKeys.all, 'stats', userId] as const,
};

// =============================================================================
// Types
// =============================================================================

export interface MailHistoryFilters {
  status?: TouchLogEntry['status'];
  mailPieceType?: TouchLogEntry['mail_piece_type'];
  limit?: number;
  offset?: number;
}

export interface MailHistoryStats {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_pending: number;
  total_cost: number;
}

export interface MailHistoryEntry extends TouchLogEntry {
  // Joined data
  enrollment?: {
    contact?: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch mail history logs (direct_mail channel only)
 * Uses RPC function for cross-schema join
 */
export function useMailHistory(filters?: MailHistoryFilters) {
  const { user } = useAuth();
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  return useQuery({
    queryKey: mailHistoryKeys.list(user?.id || '', filters),
    queryFn: async () => {
      if (!user?.id) return [];

      const { getMailHistory, mapMailHistoryRPC } = await import('@/lib/rpc');

      const data = await getMailHistory({
        status: filters?.status,
        mailPieceType: filters?.mailPieceType,
        limit,
        offset,
      });

      return data.map(mapMailHistoryRPC) as unknown as MailHistoryEntry[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch mail history statistics
 * Uses RPC function for efficient aggregation
 */
export function useMailHistoryStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: mailHistoryKeys.stats(user?.id || ''),
    queryFn: async (): Promise<MailHistoryStats> => {
      if (!user?.id) {
        return {
          total_sent: 0,
          total_delivered: 0,
          total_failed: 0,
          total_pending: 0,
          total_cost: 0,
        };
      }

      const { getMailHistoryStats } = await import('@/lib/rpc');
      return await getMailHistoryStats();
    },
    enabled: !!user?.id,
  });
}
