// src/features/conversations/hooks/useDealConversations.ts
// Hook for fetching deal conversation items - Zone G Week 8

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { isValidUuid } from '@/lib/validation';
import { ConversationItem } from '../components/ConversationsView';

/**
 * Raw database row type for conversation_items
 * NOTE: This will be auto-generated once migration runs and types are regenerated
 * Defined here temporarily until `supabase gen types typescript` is run
 */
interface ConversationItemRow {
  id: string;
  type: string;
  direction: string | null;
  content: string | null;
  transcript: string | null;
  subject: string | null;
  duration_seconds: number | null;
  sentiment: string | null;
  key_phrases: string[] | null;
  action_items: string[] | null;
  ai_summary: string | null;
  occurred_at: string | null;
  created_at: string | null;
}

interface UseDealConversationsOptions {
  dealId?: string;
  leadId?: string;
  limit?: number;
}

interface UseDealConversationsResult {
  conversations: ConversationItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useDealConversations({
  dealId,
  leadId,
  limit = 50,
}: UseDealConversationsOptions): UseDealConversationsResult {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    // Skip fetch if neither ID is a valid UUID (prevents "new" or invalid strings from hitting DB)
    const hasValidDealId = isValidUuid(dealId);
    const hasValidLeadId = isValidUuid(leadId);

    if (!hasValidDealId && !hasValidLeadId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build filter based on validated IDs
      const filters: string[] = [];
      if (hasValidDealId) {
        filters.push(`deal_id.eq.${dealId}`);
      }
      if (hasValidLeadId) {
        filters.push(`lead_id.eq.${leadId}`);
      }

      // Type assertion needed until Supabase types are regenerated after migration
      // Using 'profiles' as a stand-in for type resolution, actual query goes to 'conversation_items'
      let query = supabase
        .from('conversation_items' as 'profiles')
        .select('*')
        .eq('is_archived' as 'id', false as unknown as string)
        .order('occurred_at' as 'id', { ascending: false })
        .limit(limit);

      if (filters.length > 0) {
        query = query.or(filters.join(','));
      }

      const { data, error: queryError } = await (query as unknown as Promise<{
        data: ConversationItemRow[] | null;
        error: Error | null;
      }>);

      if (queryError) {
        throw queryError;
      }

      // Transform to ConversationItem format, handling nullable fields
      const items: ConversationItem[] = (data || [])
        .filter((row: ConversationItemRow) => row.type && row.occurred_at && row.created_at)
        .map((row: ConversationItemRow) => ({
          id: row.id,
          type: row.type as ConversationItem['type'],
          direction: (row.direction || 'internal') as ConversationItem['direction'],
          content: row.content ?? undefined,
          transcript: row.transcript ?? undefined,
          subject: row.subject ?? undefined,
          duration_seconds: row.duration_seconds ?? undefined,
          sentiment: (row.sentiment ?? undefined) as ConversationItem['sentiment'],
          key_phrases: row.key_phrases ?? undefined,
          action_items: row.action_items ?? undefined,
          ai_summary: row.ai_summary ?? undefined,
          occurred_at: row.occurred_at!,
          created_at: row.created_at!,
        }));

      setConversations(items);
    } catch (err) {
      console.error('[useDealConversations] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch conversations'));
    } finally {
      setIsLoading(false);
    }
  }, [dealId, leadId, limit]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    refetch: fetchConversations,
  };
}

export default useDealConversations;
