// Tests for PatchSet types and utilities
import {
  generatePatchSetId,
  createEmptyPatchSet,
  addOperation,
  addTimelineEvent,
  ENTITY_LABELS,
  OP_LABELS,
  CONFIDENCE_COLORS,
  DEFAULT_PREVIEW_CONFIG,
  PatchSet,
  PatchOperation,
  PendingTimelineEvent,
} from '../patchset';

describe('PatchSet Utilities', () => {
  describe('generatePatchSetId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generatePatchSetId());
      }
      expect(ids.size).toBe(100);
    });

    it('should start with ps_ prefix', () => {
      const id = generatePatchSetId();
      expect(id.startsWith('ps_')).toBe(true);
    });

    it('should contain timestamp component', () => {
      const before = Date.now();
      const id = generatePatchSetId();
      const after = Date.now();

      // Extract timestamp from ID (format: ps_timestamp_random)
      const parts = id.split('_');
      const timestamp = parseInt(parts[1], 10);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('createEmptyPatchSet', () => {
    it('should create PatchSet with required fields', () => {
      const patchSet = createEmptyPatchSet('Test summary');

      expect(patchSet.patchSetId).toBeDefined();
      expect(patchSet.summary).toBe('Test summary');
      expect(patchSet.confidence).toBe('med'); // default
      expect(patchSet.ops).toEqual([]);
      expect(patchSet.willCreateTimelineEvents).toEqual([]);
      expect(patchSet.createdAt).toBeDefined();
    });

    it('should accept custom confidence level', () => {
      const patchSet = createEmptyPatchSet('High confidence action', {
        confidence: 'high',
      });

      expect(patchSet.confidence).toBe('high');
    });

    it('should accept actionId and dealId', () => {
      const patchSet = createEmptyPatchSet('Action-specific patch', {
        actionId: 'update_stage',
        dealId: 'deal-123',
      });

      expect(patchSet.actionId).toBe('update_stage');
      expect(patchSet.dealId).toBe('deal-123');
    });

    it('should set createdAt to current timestamp', () => {
      const before = new Date().toISOString();
      const patchSet = createEmptyPatchSet('Time test');
      const after = new Date().toISOString();

      expect(patchSet.createdAt >= before).toBe(true);
      expect(patchSet.createdAt <= after).toBe(true);
    });
  });

  describe('addOperation', () => {
    it('should add operation to empty PatchSet', () => {
      const patchSet = createEmptyPatchSet('Test');
      const operation: PatchOperation = {
        op: 'update',
        entity: 'Deal',
        id: 'deal-123',
        before: { stage: 'new' },
        after: { stage: 'contacted' },
        rationale: 'Lead responded',
      };

      const updated = addOperation(patchSet, operation);

      expect(updated.ops.length).toBe(1);
      expect(updated.ops[0]).toEqual(operation);
    });

    it('should preserve existing operations', () => {
      let patchSet = createEmptyPatchSet('Test');

      const op1: PatchOperation = {
        op: 'update',
        entity: 'Deal',
        id: 'deal-123',
        after: { stage: 'contacted' },
        rationale: 'First update',
      };

      const op2: PatchOperation = {
        op: 'update',
        entity: 'Deal',
        id: 'deal-123',
        after: { next_action: 'Follow up' },
        rationale: 'Second update',
      };

      patchSet = addOperation(patchSet, op1);
      patchSet = addOperation(patchSet, op2);

      expect(patchSet.ops.length).toBe(2);
      expect(patchSet.ops[0].rationale).toBe('First update');
      expect(patchSet.ops[1].rationale).toBe('Second update');
    });

    it('should not mutate original PatchSet', () => {
      const original = createEmptyPatchSet('Test');
      const operation: PatchOperation = {
        op: 'create',
        entity: 'Task',
        after: { title: 'New task' },
        rationale: 'Creating task',
      };

      const updated = addOperation(original, operation);

      expect(original.ops.length).toBe(0);
      expect(updated.ops.length).toBe(1);
      expect(original).not.toBe(updated);
    });
  });

  describe('addTimelineEvent', () => {
    it('should add timeline event to PatchSet', () => {
      const patchSet = createEmptyPatchSet('Test');
      const event: PendingTimelineEvent = {
        type: 'stage_change',
        title: 'Stage changed to Contacted',
      };

      const updated = addTimelineEvent(patchSet, event);

      expect(updated.willCreateTimelineEvents.length).toBe(1);
      expect(updated.willCreateTimelineEvents[0]).toEqual(event);
    });

    it('should preserve existing timeline events', () => {
      let patchSet = createEmptyPatchSet('Test');

      const event1: PendingTimelineEvent = {
        type: 'stage_change',
        title: 'First event',
      };

      const event2: PendingTimelineEvent = {
        type: 'note',
        title: 'Second event',
        description: 'With description',
      };

      patchSet = addTimelineEvent(patchSet, event1);
      patchSet = addTimelineEvent(patchSet, event2);

      expect(patchSet.willCreateTimelineEvents.length).toBe(2);
    });

    it('should not mutate original PatchSet', () => {
      const original = createEmptyPatchSet('Test');
      const event: PendingTimelineEvent = {
        type: 'note',
        title: 'Test note',
      };

      const updated = addTimelineEvent(original, event);

      expect(original.willCreateTimelineEvents.length).toBe(0);
      expect(updated.willCreateTimelineEvents.length).toBe(1);
    });
  });

  describe('Constants', () => {
    describe('ENTITY_LABELS', () => {
      it('should have labels for all entity types', () => {
        const entities = [
          'Deal',
          'DealOffer',
          'DealAssumption',
          'DealEvidence',
          'DealWalkthrough',
          'Property',
          'Lead',
          'Task',
        ];

        entities.forEach((entity) => {
          expect(ENTITY_LABELS[entity as keyof typeof ENTITY_LABELS]).toBeDefined();
        });
      });

      it('should have human-readable labels', () => {
        expect(ENTITY_LABELS.DealOffer).toBe('Offer');
        expect(ENTITY_LABELS.DealAssumption).toBe('Assumption');
        expect(ENTITY_LABELS.DealWalkthrough).toBe('Walkthrough');
      });
    });

    describe('OP_LABELS', () => {
      it('should have labels for all operation types', () => {
        expect(OP_LABELS.create).toBe('Create');
        expect(OP_LABELS.update).toBe('Update');
        expect(OP_LABELS.delete).toBe('Delete');
      });
    });

    describe('CONFIDENCE_COLORS', () => {
      it('should have colors for all confidence levels', () => {
        expect(CONFIDENCE_COLORS.high).toBe('green');
        expect(CONFIDENCE_COLORS.med).toBe('amber');
        expect(CONFIDENCE_COLORS.low).toBe('red');
      });
    });

    describe('DEFAULT_PREVIEW_CONFIG', () => {
      it('should have sensible defaults', () => {
        expect(DEFAULT_PREVIEW_CONFIG.mode).toBe('detailed');
        expect(DEFAULT_PREVIEW_CONFIG.showRationale).toBe(true);
        expect(DEFAULT_PREVIEW_CONFIG.showSource).toBe(true);
        expect(DEFAULT_PREVIEW_CONFIG.showBeforeValues).toBe(true);
        expect(DEFAULT_PREVIEW_CONFIG.highlightChanges).toBe(true);
      });
    });
  });

  describe('PatchSet building workflow', () => {
    it('should support fluent building pattern', () => {
      let patchSet = createEmptyPatchSet('Update deal stage and set next action', {
        dealId: 'deal-123',
        actionId: 'update_stage',
        confidence: 'high',
      });

      patchSet = addOperation(patchSet, {
        op: 'update',
        entity: 'Deal',
        id: 'deal-123',
        before: { stage: 'new' },
        after: { stage: 'contacted' },
        rationale: 'Lead responded to initial contact',
      });

      patchSet = addOperation(patchSet, {
        op: 'update',
        entity: 'Deal',
        id: 'deal-123',
        before: { next_action: undefined },
        after: { next_action: 'Schedule walkthrough' },
        rationale: 'Setting next action after contact',
      });

      patchSet = addTimelineEvent(patchSet, {
        type: 'stage_change',
        title: 'Stage changed to Contacted',
      });

      patchSet = addTimelineEvent(patchSet, {
        type: 'next_action_set',
        title: 'Schedule walkthrough',
      });

      expect(patchSet.ops.length).toBe(2);
      expect(patchSet.willCreateTimelineEvents.length).toBe(2);
      expect(patchSet.confidence).toBe('high');
      expect(patchSet.dealId).toBe('deal-123');
    });

    it('should maintain immutability throughout building', () => {
      const original = createEmptyPatchSet('Original');

      const withOp = addOperation(original, {
        op: 'create',
        entity: 'Task',
        after: { title: 'Test' },
        rationale: 'Testing',
      });

      const withEvent = addTimelineEvent(withOp, {
        type: 'note',
        title: 'Event',
      });

      // All three should be different objects
      expect(original.ops.length).toBe(0);
      expect(withOp.ops.length).toBe(1);
      expect(withOp.willCreateTimelineEvents.length).toBe(0);
      expect(withEvent.ops.length).toBe(1);
      expect(withEvent.willCreateTimelineEvents.length).toBe(1);
    });
  });
});
