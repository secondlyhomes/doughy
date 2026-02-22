// src/features/deals/hooks/useNextAction.ts
// Next Best Action (NBA) hook for deals
// Re-exports from next-action/ module for backward compatibility

import { useMemo } from 'react';
import type { Deal } from '../types';
import { isDealClosed } from '../types';
import type { NextAction } from './next-action/types';
import { calculateNextAction } from './next-action/rules';

// Re-export all types and utilities from the module
export * from './next-action/index';

/**
 * Hook to get the next best action for a deal
 */
export function useNextAction(deal: Deal | null | undefined): NextAction | null {
  return useMemo(() => {
    if (!deal) return null;
    if (isDealClosed(deal)) {
      return {
        action:
          deal.stage === 'closed_won'
            ? 'Deal closed successfully!'
            : 'Deal closed - no action needed',
        priority: 'low',
        category: 'close',
      };
    }
    return calculateNextAction(deal);
  }, [deal]);
}

export default useNextAction;
