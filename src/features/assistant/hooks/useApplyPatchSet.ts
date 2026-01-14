// src/features/assistant/hooks/useApplyPatchSet.ts
// Hook to apply PatchSets (AI-proposed changes)

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, USE_MOCK_DATA } from '@/lib/supabase';
import { logDealEvent } from '@/features/deals/hooks/useDealEvents';

import {
  PatchSet,
  PatchOperation,
  PatchSetApplyResult,
  PatchEntity,
} from '../types/patchset';

/**
 * Map entity types to Supabase table names
 */
const ENTITY_TABLE_MAP: Record<PatchEntity, string> = {
  Deal: 'deals',
  DealOffer: 'deal_offers',
  DealAssumption: 'deal_assumptions', // May need to be deal-level JSON field
  DealEvidence: 'deal_evidence',
  DealWalkthrough: 'deal_walkthroughs',
  Property: 're_properties',
  Lead: 'leads',
  Task: 'tasks',
};

/**
 * Apply a single operation
 */
async function applyOperation(op: PatchOperation): Promise<{
  success: boolean;
  error?: string;
  entityId?: string;
}> {
  const tableName = ENTITY_TABLE_MAP[op.entity];
  if (!tableName) {
    return { success: false, error: `Unknown entity type: ${op.entity}` };
  }

  // Mock mode
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[PatchSet] ${op.op}`, op.entity, op.id || '', op.after);
    return { success: true, entityId: op.id || `mock-${Date.now()}` };
  }

  try {
    switch (op.op) {
      case 'create': {
        const { data, error } = await (supabase as any)
          .from(tableName)
          .insert(op.after)
          .select()
          .single();
        if (error) throw error;
        return { success: true, entityId: (data as { id: string }).id };
      }

      case 'update': {
        if (!op.id) {
          return { success: false, error: 'Update operation requires entity ID' };
        }
        const { data, error } = await (supabase as any)
          .from(tableName)
          .update(op.after)
          .eq('id', op.id)
          .select()
          .single();
        if (error) throw error;
        return { success: true, entityId: op.id };
      }

      case 'delete': {
        if (!op.id) {
          return { success: false, error: 'Delete operation requires entity ID' };
        }
        const { error } = await (supabase as any)
          .from(tableName)
          .delete()
          .eq('id', op.id);
        if (error) throw error;
        return { success: true, entityId: op.id };
      }

      default:
        return { success: false, error: `Unknown operation: ${op.op}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Log timeline events for applied PatchSet using Zone B's logDealEvent
 */
async function logPatchSetEvent(
  dealId: string,
  patchSet: PatchSet
): Promise<string[]> {
  const eventIds: string[] = [];

  // Log each pending timeline event specified in the PatchSet
  for (const pendingEvent of patchSet.willCreateTimelineEvents) {
    try {
      const event = await logDealEvent({
        deal_id: dealId,
        event_type: pendingEvent.type,
        title: pendingEvent.title,
        description: pendingEvent.description,
        source: 'ai',
        metadata: {
          patch_set_id: patchSet.patchSetId,
          action_id: patchSet.actionId,
        },
      });
      eventIds.push(event.id);
    } catch (error) {
      console.error('[PatchSet] Failed to log event:', pendingEvent.type, error);
    }
  }

  // Log the overall ai_action_applied event for audit trail
  try {
    const actionEvent = await logDealEvent({
      deal_id: dealId,
      event_type: 'ai_action_applied',
      title: `AI applied: ${patchSet.summary}`,
      description: `Applied ${patchSet.ops.length} operation(s) with ${patchSet.confidence} confidence`,
      source: 'ai',
      metadata: {
        patch_set_id: patchSet.patchSetId,
        action_id: patchSet.actionId,
        ops_count: patchSet.ops.length,
        confidence: patchSet.confidence,
      },
    });
    eventIds.push(actionEvent.id);
  } catch (error) {
    console.error('[PatchSet] Failed to log ai_action_applied:', error);
  }

  return eventIds;
}

/**
 * Apply a complete PatchSet
 */
async function applyPatchSet(patchSet: PatchSet): Promise<PatchSetApplyResult> {
  const errors: PatchSetApplyResult['errors'] = [];
  const updatedEntities: PatchSetApplyResult['updatedEntities'] = [];
  let appliedOps = 0;
  let failedOps = 0;

  // Apply each operation
  for (let i = 0; i < patchSet.ops.length; i++) {
    const op = patchSet.ops[i];
    const result = await applyOperation(op);

    if (result.success) {
      appliedOps++;
      if (result.entityId) {
        updatedEntities.push({ entity: op.entity, id: result.entityId });
      }
    } else {
      failedOps++;
      errors.push({
        opIndex: i,
        entity: op.entity,
        error: result.error || 'Unknown error',
      });
    }
  }

  // If any operations succeeded, log timeline events
  let createdEventIds: string[] = [];
  if (appliedOps > 0 && patchSet.dealId) {
    createdEventIds = await logPatchSetEvent(patchSet.dealId, patchSet);
  }

  return {
    success: failedOps === 0,
    patchSetId: patchSet.patchSetId,
    appliedOps,
    failedOps,
    errors: errors.length > 0 ? errors : undefined,
    createdEventIds,
    updatedEntities,
  };
}

/**
 * Hook return type
 */
export interface UseApplyPatchSetReturn {
  /** Apply a PatchSet */
  apply: (patchSet: PatchSet) => Promise<PatchSetApplyResult>;
  /** Whether currently applying */
  isApplying: boolean;
  /** Last result */
  lastResult: PatchSetApplyResult | null;
  /** Error if failed */
  error: Error | null;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook to apply PatchSets
 */
export function useApplyPatchSet(): UseApplyPatchSetReturn {
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<PatchSetApplyResult | null>(null);

  const mutation = useMutation({
    mutationFn: applyPatchSet,
    onSuccess: (result, patchSet) => {
      setLastResult(result);

      // Invalidate relevant queries
      if (patchSet.dealId) {
        queryClient.invalidateQueries({ queryKey: ['deal', patchSet.dealId] });
        queryClient.invalidateQueries({ queryKey: ['deals'] });
        queryClient.invalidateQueries({ queryKey: ['deal-events', patchSet.dealId] });
      }

      // Invalidate based on entities modified
      result.updatedEntities?.forEach(({ entity }) => {
        switch (entity) {
          case 'Property':
            queryClient.invalidateQueries({ queryKey: ['properties'] });
            break;
          case 'Lead':
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            break;
          case 'Task':
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            break;
        }
      });
    },
  });

  const handleApply = useCallback(
    async (patchSet: PatchSet): Promise<PatchSetApplyResult> => {
      return mutation.mutateAsync(patchSet);
    },
    [mutation]
  );

  const handleReset = useCallback(() => {
    setLastResult(null);
    mutation.reset();
  }, [mutation]);

  return {
    apply: handleApply,
    isApplying: mutation.isPending,
    lastResult,
    error: mutation.error as Error | null,
    reset: handleReset,
  };
}

/**
 * Validate a PatchSet before applying
 */
export function validatePatchSet(patchSet: PatchSet): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!patchSet.patchSetId) {
    errors.push('PatchSet must have an ID');
  }

  if (!patchSet.ops || patchSet.ops.length === 0) {
    errors.push('PatchSet must have at least one operation');
  }

  for (let i = 0; i < patchSet.ops.length; i++) {
    const op = patchSet.ops[i];

    if (!op.op || !['create', 'update', 'delete'].includes(op.op)) {
      errors.push(`Operation ${i}: Invalid operation type`);
    }

    if (!op.entity) {
      errors.push(`Operation ${i}: Missing entity type`);
    }

    if (op.op === 'update' && !op.id) {
      errors.push(`Operation ${i}: Update requires entity ID`);
    }

    if (op.op === 'delete' && !op.id) {
      errors.push(`Operation ${i}: Delete requires entity ID`);
    }

    if ((op.op === 'create' || op.op === 'update') && !op.after) {
      errors.push(`Operation ${i}: Create/Update requires 'after' value`);
    }

    if (!op.rationale) {
      errors.push(`Operation ${i}: Missing rationale`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default useApplyPatchSet;
