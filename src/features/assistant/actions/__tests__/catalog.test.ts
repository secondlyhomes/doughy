// Tests for action catalog functions
import {
  ACTION_CATALOG,
  ActionId,
  getAllActions,
  getActionsByCategory,
  getActionsForStage,
  getActionsForNBACategory,
  canUserExecuteAction,
  getRecommendedActions,
  buildStageUpdatePatchSet,
  buildAssumptionUpdatePatchSet,
  buildAddNotePatchSet,
} from '../catalog';

describe('Action Catalog', () => {
  describe('ACTION_CATALOG', () => {
    it('should have all 12 defined actions', () => {
      const actionIds: ActionId[] = [
        'update_stage',
        'set_next_action',
        'create_task',
        'add_note',
        'summarize_event',
        'extract_facts',
        'run_underwrite_check',
        'update_assumption',
        'generate_seller_report',
        'generate_offer_packet',
        'draft_counter_text',
        'prepare_esign_envelope',
      ];

      actionIds.forEach((id) => {
        expect(ACTION_CATALOG[id]).toBeDefined();
        expect(ACTION_CATALOG[id].id).toBe(id);
      });
    });

    it('should have required fields for each action', () => {
      Object.values(ACTION_CATALOG).forEach((action) => {
        expect(action.id).toBeDefined();
        expect(action.label).toBeDefined();
        expect(action.description).toBeDefined();
        expect(action.icon).toBeDefined();
        expect(action.category).toBeDefined();
        expect(typeof action.requiresConfirmation).toBe('boolean');
        expect(typeof action.isLongRunning).toBe('boolean');
      });
    });

    it('should have jobType for long-running actions', () => {
      const longRunningActions = Object.values(ACTION_CATALOG).filter(
        (a) => a.isLongRunning
      );

      longRunningActions.forEach((action) => {
        expect(action.jobType).toBeDefined();
      });
    });
  });

  describe('getAllActions', () => {
    it('should return all actions as array', () => {
      const actions = getAllActions();
      expect(Array.isArray(actions)).toBe(true);
      expect(actions.length).toBe(12);
    });
  });

  describe('getActionsByCategory', () => {
    it('should filter actions by deal category', () => {
      const dealActions = getActionsByCategory('deal');
      expect(dealActions.every((a) => a.category === 'deal')).toBe(true);
      expect(dealActions.length).toBeGreaterThan(0);
    });

    it('should filter actions by underwrite category', () => {
      const underwriteActions = getActionsByCategory('underwrite');
      expect(underwriteActions.every((a) => a.category === 'underwrite')).toBe(true);
    });

    it('should filter actions by offer category', () => {
      const offerActions = getActionsByCategory('offer');
      expect(offerActions.every((a) => a.category === 'offer')).toBe(true);
    });

    it('should filter actions by docs category', () => {
      const docsActions = getActionsByCategory('docs');
      expect(docsActions.every((a) => a.category === 'docs')).toBe(true);
    });
  });

  describe('getActionsForStage', () => {
    it('should return all actions when no relevantStages defined', () => {
      const actions = getActionsForStage('new');
      // Actions without relevantStages should be included
      const addNote = actions.find((a) => a.id === 'add_note');
      expect(addNote).toBeDefined();
    });

    it('should return relevant actions for analyzing stage', () => {
      const actions = getActionsForStage('analyzing');
      const runUnderwriteCheck = actions.find((a) => a.id === 'run_underwrite_check');
      expect(runUnderwriteCheck).toBeDefined();
    });

    it('should return relevant actions for negotiating stage', () => {
      const actions = getActionsForStage('negotiating');
      const draftCounter = actions.find((a) => a.id === 'draft_counter_text');
      expect(draftCounter).toBeDefined();
    });

    it('should return relevant actions for under_contract stage', () => {
      const actions = getActionsForStage('under_contract');
      const prepareEsign = actions.find((a) => a.id === 'prepare_esign_envelope');
      expect(prepareEsign).toBeDefined();
    });
  });

  describe('getActionsForNBACategory', () => {
    it('should return actions that address offer category', () => {
      const actions = getActionsForNBACategory('offer');
      expect(actions.length).toBeGreaterThan(0);
      actions.forEach((action) => {
        expect(action.addressesCategories).toContain('offer');
      });
    });

    it('should return actions that address underwrite category', () => {
      const actions = getActionsForNBACategory('underwrite');
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should return actions that address negotiate category', () => {
      const actions = getActionsForNBACategory('negotiate');
      const draftCounter = actions.find((a) => a.id === 'draft_counter_text');
      expect(draftCounter).toBeDefined();
    });
  });

  describe('canUserExecuteAction', () => {
    it('should allow starter plan to execute basic actions', () => {
      expect(canUserExecuteAction('add_note', 'starter')).toBe(true);
      expect(canUserExecuteAction('update_stage', 'starter')).toBe(true);
      expect(canUserExecuteAction('create_task', 'starter')).toBe(true);
    });

    it('should restrict pro actions from starter plan', () => {
      expect(canUserExecuteAction('summarize_event', 'starter')).toBe(false);
      expect(canUserExecuteAction('extract_facts', 'starter')).toBe(false);
      expect(canUserExecuteAction('draft_counter_text', 'starter')).toBe(false);
    });

    it('should allow pro plan to execute pro actions', () => {
      expect(canUserExecuteAction('summarize_event', 'pro')).toBe(true);
      expect(canUserExecuteAction('extract_facts', 'pro')).toBe(true);
      expect(canUserExecuteAction('draft_counter_text', 'pro')).toBe(true);
    });

    it('should restrict elite actions from pro plan', () => {
      expect(canUserExecuteAction('prepare_esign_envelope', 'pro')).toBe(false);
    });

    it('should allow elite plan to execute all actions', () => {
      expect(canUserExecuteAction('prepare_esign_envelope', 'elite')).toBe(true);
      expect(canUserExecuteAction('summarize_event', 'elite')).toBe(true);
      expect(canUserExecuteAction('add_note', 'elite')).toBe(true);
    });
  });

  describe('getRecommendedActions', () => {
    it('should return max 6 actions', () => {
      const actions = getRecommendedActions({
        stage: 'analyzing',
        userPlan: 'elite',
      });
      expect(actions.length).toBeLessThanOrEqual(6);
    });

    it('should filter by user plan', () => {
      const starterActions = getRecommendedActions({
        stage: 'negotiating',
        userPlan: 'starter',
      });

      // draft_counter_text requires pro plan
      const draftCounter = starterActions.find((a) => a.id === 'draft_counter_text');
      expect(draftCounter).toBeUndefined();
    });

    it('should prioritize NBA category actions', () => {
      const actions = getRecommendedActions({
        stage: 'analyzing',
        nbaCategory: 'offer',
        userPlan: 'elite',
      });

      // First actions should address offer category
      const firstAction = actions[0];
      expect(firstAction.addressesCategories).toContain('offer');
    });

    it('should prioritize underwrite check when missing info', () => {
      const actions = getRecommendedActions({
        stage: 'analyzing',
        userPlan: 'elite',
        missingInfo: ['arv', 'repair_cost'],
      });

      // run_underwrite_check should be first
      expect(actions[0].id).toBe('run_underwrite_check');
    });
  });

  describe('PatchSet Builders', () => {
    describe('buildStageUpdatePatchSet', () => {
      it('should create valid PatchSet for stage update', () => {
        const patchSet = buildStageUpdatePatchSet(
          'deal-123',
          'new',
          'contacted',
          'Lead responded to initial outreach'
        );

        expect(patchSet.patchSetId).toBeDefined();
        expect(patchSet.summary).toContain('new');
        expect(patchSet.summary).toContain('contacted');
        expect(patchSet.ops.length).toBe(1);
        expect(patchSet.ops[0].op).toBe('update');
        expect(patchSet.ops[0].entity).toBe('Deal');
        expect(patchSet.ops[0].before).toEqual({ stage: 'new' });
        expect(patchSet.ops[0].after).toEqual({ stage: 'contacted' });
        expect(patchSet.willCreateTimelineEvents.length).toBe(1);
        expect(patchSet.willCreateTimelineEvents[0].type).toBe('stage_change');
      });
    });

    describe('buildAssumptionUpdatePatchSet', () => {
      it('should create valid PatchSet for assumption update', () => {
        const patchSet = buildAssumptionUpdatePatchSet(
          'deal-123',
          'repair_cost',
          50000,
          60000,
          'Updated based on contractor estimate'
        );

        expect(patchSet.ops.length).toBe(1);
        expect(patchSet.ops[0].op).toBe('update');
        expect(patchSet.ops[0].entity).toBe('DealAssumption');
        expect(patchSet.ops[0].fieldPath).toBe('repair_cost');
        expect(patchSet.ops[0].before).toEqual({ value: 50000 });
        expect(patchSet.ops[0].after).toEqual({ value: 60000 });
        expect(patchSet.willCreateTimelineEvents[0].type).toBe('assumption_updated');
      });

      it('should include source event ID if provided', () => {
        const patchSet = buildAssumptionUpdatePatchSet(
          'deal-123',
          'arv',
          300000,
          320000,
          'Updated from comps analysis',
          'event-456'
        );

        expect(patchSet.ops[0].source).toBe('event-456');
      });
    });

    describe('buildAddNotePatchSet', () => {
      it('should create valid PatchSet for note', () => {
        const patchSet = buildAddNotePatchSet(
          'deal-123',
          'Seller mentioned they need to close by end of month'
        );

        expect(patchSet.ops.length).toBe(0); // Notes only create timeline events
        expect(patchSet.willCreateTimelineEvents.length).toBe(1);
        expect(patchSet.willCreateTimelineEvents[0].type).toBe('note');
        expect(patchSet.willCreateTimelineEvents[0].description).toContain('Seller mentioned');
      });

      it('should truncate long note titles', () => {
        const longNote = 'A'.repeat(100);
        const patchSet = buildAddNotePatchSet('deal-123', longNote);

        expect(patchSet.willCreateTimelineEvents[0].title.length).toBeLessThanOrEqual(53); // 50 + '...'
        expect(patchSet.willCreateTimelineEvents[0].title).toContain('...');
      });

      it('should not truncate short note titles', () => {
        const shortNote = 'Quick note';
        const patchSet = buildAddNotePatchSet('deal-123', shortNote);

        expect(patchSet.willCreateTimelineEvents[0].title).toBe(shortNote);
      });
    });
  });
});
