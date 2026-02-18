// src/features/pipeline/hooks/useInvestorAttention.ts
// Hook to fetch urgent items that need investor attention
// Checks: overdue deal actions, stale deals, overdue follow-ups

import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  useDealsWithActions,
  calculateNextAction,
  getDealAddress,
  getDealLeadName,
} from '@/features/deals';
import type { InvestorAttentionItem } from '../components/InvestorNeedsAttention';

export function useInvestorAttention() {
  const router = useRouter();
  const { deals, isLoading } = useDealsWithActions(10);

  const items = useMemo<InvestorAttentionItem[]>(() => {
    const result: InvestorAttentionItem[] = [];

    if (!deals) return result;

    for (const deal of deals) {
      const nextAction = calculateNextAction(deal);
      const address = getDealAddress(deal);
      const sellerName = getDealLeadName(deal);
      const label = address || sellerName || 'Unknown deal';

      if (nextAction.isOverdue) {
        result.push({
          id: `overdue-${deal.id}`,
          type: 'overdue_action',
          title: nextAction.action,
          subtitle: `${label} - Overdue`,
          urgency: 'high',
          onPress: () => router.push(`/(tabs)/pipeline/deal/${deal.id}` as never),
        });
      } else if (nextAction.priority === 'high') {
        result.push({
          id: `action-${deal.id}`,
          type: 'overdue_action',
          title: nextAction.action,
          subtitle: label,
          urgency: 'medium',
          onPress: () => router.push(`/(tabs)/pipeline/deal/${deal.id}` as never),
        });
      }
    }

    // Sort by urgency: high first, then medium, then low
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return result;
  }, [deals]);

  return { items, isLoading };
}
