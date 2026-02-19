// Tests for useApplyPatchSet hook and validatePatchSet
import { renderHook, act, waitFor } from '@testing-library/react-native';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApplyPatchSet, validatePatchSet } from '../useApplyPatchSet';
import { createEmptyPatchSet, addOperation, addTimelineEvent, PatchSet } from '../../types/patchset';

// Mock USE_MOCK_DATA to true for testing
jest.mock('@/lib/supabase', () => ({
  supabase: {},
  USE_MOCK_DATA: true,
}));

// Mock logDealEvent
jest.mock('@/features/deals/hooks/useDealEvents', () => ({
  logDealEvent: jest.fn(() =>
    Promise.resolve({
      id: `event-${Date.now()}`,
      deal_id: 'deal-123',
      event_type: 'ai_action_applied',
      title: 'AI applied changes',
      created_at: new Date().toISOString(),
    })
  ),
}));

// Create a wrapper with QueryClient for testing hooks that use React Query
let testQueryClient: QueryClient;

const createWrapper = () => {
  testQueryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: testQueryClient }, children);
  return Wrapper;
};

afterEach(() => {
  testQueryClient?.clear();
});

// Helper to create a valid test PatchSet
const createTestPatchSet = (options?: { dealId?: string; addOps?: boolean }): PatchSet => {
  let patchSet = createEmptyPatchSet('Test patch set', {
    dealId: options?.dealId ?? 'deal-123',
    actionId: 'test_action',
    confidence: 'high',
  });

  if (options?.addOps !== false) {
    patchSet = addOperation(patchSet, {
      op: 'update',
      entity: 'Deal',
      id: 'deal-123',
      before: { stage: 'new' },
      after: { stage: 'contacted' },
      rationale: 'Test update',
    });

    patchSet = addTimelineEvent(patchSet, {
      type: 'stage_change',
      title: 'Stage changed',
    });
  }

  return patchSet;
};

describe('validatePatchSet', () => {
  it('should validate a valid PatchSet', () => {
    const patchSet = createTestPatchSet();
    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail when patchSetId is missing', () => {
    const patchSet = createTestPatchSet();
    (patchSet as any).patchSetId = '';

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('PatchSet must have an ID');
  });

  it('should fail when ops array is empty', () => {
    const patchSet = createTestPatchSet({ addOps: false });

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('PatchSet must have at least one operation');
  });

  it('should fail when operation type is invalid', () => {
    let patchSet = createTestPatchSet({ addOps: false });
    patchSet = addOperation(patchSet, {
      op: 'invalid' as any,
      entity: 'Deal',
      after: { stage: 'contacted' },
      rationale: 'Invalid op',
    });

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Invalid operation type'))).toBe(true);
  });

  it('should fail when entity is missing', () => {
    let patchSet = createTestPatchSet({ addOps: false });
    patchSet = addOperation(patchSet, {
      op: 'update',
      entity: '' as any,
      id: 'deal-123',
      after: { stage: 'contacted' },
      rationale: 'Missing entity',
    });

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Missing entity type'))).toBe(true);
  });

  it('should fail when update operation is missing ID', () => {
    let patchSet = createTestPatchSet({ addOps: false });
    patchSet = addOperation(patchSet, {
      op: 'update',
      entity: 'Deal',
      // Missing id
      after: { stage: 'contacted' },
      rationale: 'Update without ID',
    });

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Update requires entity ID'))).toBe(true);
  });

  it('should fail when delete operation is missing ID', () => {
    let patchSet = createTestPatchSet({ addOps: false });
    patchSet = addOperation(patchSet, {
      op: 'delete',
      entity: 'Task',
      // Missing id
      after: {},
      rationale: 'Delete without ID',
    });

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Delete requires entity ID'))).toBe(true);
  });

  it('should fail when create/update is missing after value', () => {
    let patchSet = createTestPatchSet({ addOps: false });
    patchSet = addOperation(patchSet, {
      op: 'create',
      entity: 'Task',
      rationale: 'Create without after',
    } as any);

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("requires 'after' value"))).toBe(true);
  });

  it('should fail when rationale is missing', () => {
    let patchSet = createTestPatchSet({ addOps: false });
    patchSet = addOperation(patchSet, {
      op: 'create',
      entity: 'Task',
      after: { title: 'New task' },
      rationale: '',
    });

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Missing rationale'))).toBe(true);
  });

  it('should collect all errors in multi-operation PatchSet', () => {
    let patchSet = createTestPatchSet({ addOps: false });

    patchSet = addOperation(patchSet, {
      op: 'update',
      entity: 'Deal',
      // Missing id
      after: { stage: 'contacted' },
      rationale: 'First op error',
    });

    patchSet = addOperation(patchSet, {
      op: 'delete',
      entity: 'Task',
      // Missing id
      after: {},
      rationale: '',
    });

    const result = validatePatchSet(patchSet);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('useApplyPatchSet', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useApplyPatchSet(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isApplying).toBe(false);
      expect(result.current.lastResult).toBeNull();
      expect(result.current.error).toBeNull();
      expect(typeof result.current.apply).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('apply', () => {
    it('should apply a valid PatchSet', async () => {
      const { result } = renderHook(() => useApplyPatchSet(), {
        wrapper: createWrapper(),
      });

      const patchSet = createTestPatchSet();

      let applyResult: any;
      await act(async () => {
        applyResult = await result.current.apply(patchSet);
      });

      expect(applyResult.success).toBe(true);
      expect(applyResult.patchSetId).toBe(patchSet.patchSetId);
      expect(applyResult.appliedOps).toBe(1);
      expect(applyResult.failedOps).toBe(0);
    });

    it('should update lastResult after apply', async () => {
      const { result } = renderHook(() => useApplyPatchSet(), {
        wrapper: createWrapper(),
      });

      const patchSet = createTestPatchSet();

      await act(async () => {
        await result.current.apply(patchSet);
      });

      expect(result.current.lastResult).not.toBeNull();
      expect(result.current.lastResult?.success).toBe(true);
    });

    it('should return created event IDs', async () => {
      const { result } = renderHook(() => useApplyPatchSet(), {
        wrapper: createWrapper(),
      });

      const patchSet = createTestPatchSet();

      let applyResult: any;
      await act(async () => {
        applyResult = await result.current.apply(patchSet);
      });

      // Should have event IDs from timeline events + ai_action_applied
      expect(applyResult.createdEventIds).toBeDefined();
      expect(applyResult.createdEventIds.length).toBeGreaterThan(0);
    });

    it('should return updated entities', async () => {
      const { result } = renderHook(() => useApplyPatchSet(), {
        wrapper: createWrapper(),
      });

      const patchSet = createTestPatchSet();

      let applyResult: any;
      await act(async () => {
        applyResult = await result.current.apply(patchSet);
      });

      expect(applyResult.updatedEntities).toBeDefined();
      expect(applyResult.updatedEntities.length).toBe(1);
      expect(applyResult.updatedEntities[0].entity).toBe('Deal');
    });
  });

  describe('reset', () => {
    it('should reset lastResult', async () => {
      const { result } = renderHook(() => useApplyPatchSet(), {
        wrapper: createWrapper(),
      });

      const patchSet = createTestPatchSet();

      await act(async () => {
        await result.current.apply(patchSet);
      });

      expect(result.current.lastResult).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.lastResult).toBeNull();
    });
  });

  describe('multiple operations', () => {
    it('should apply multiple operations in sequence', async () => {
      const { result } = renderHook(() => useApplyPatchSet(), {
        wrapper: createWrapper(),
      });

      let patchSet = createEmptyPatchSet('Multi-op test', {
        dealId: 'deal-123',
        confidence: 'high',
      });

      patchSet = addOperation(patchSet, {
        op: 'update',
        entity: 'Deal',
        id: 'deal-123',
        after: { stage: 'contacted' },
        rationale: 'First update',
      });

      patchSet = addOperation(patchSet, {
        op: 'update',
        entity: 'Deal',
        id: 'deal-123',
        after: { next_action: 'Follow up' },
        rationale: 'Second update',
      });

      patchSet = addOperation(patchSet, {
        op: 'create',
        entity: 'Task',
        after: { title: 'New task', deal_id: 'deal-123' },
        rationale: 'Create task',
      });

      let applyResult: any;
      await act(async () => {
        applyResult = await result.current.apply(patchSet);
      });

      expect(applyResult.success).toBe(true);
      expect(applyResult.appliedOps).toBe(3);
    });
  });
});
