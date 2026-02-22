// Tests for action handlers
import {
  executeAction,
  hasHandler,
  handleUpdateStage,
  handleSetNextAction,
  handleCreateTask,
  handleAddNote,
  handleRunUnderwriteCheck,
  handleUpdateAssumption,
  handleExtractFacts,
  handleGenerateSellerReport,
  handleGenerateOfferPacket,
  handleDraftCounterText,
  handlePrepareEsignEnvelope,
  HandlerContext,
} from '../handlers';
import { ActionHandlerInput } from '../catalog';
import { Deal } from '@/features/deals/types';
import { Property } from '@/features/real-estate/types';

// Mock data helpers
const createMockDeal = (overrides: Partial<Deal> = {}): Deal =>
  ({
    id: 'deal-123',
    stage: 'analyzing',
    next_action: undefined,
    next_action_due: undefined,
    strategy: 'cash',
    ...overrides,
  } as Deal);

const createMockProperty = (overrides: Partial<Property> = {}): Property =>
  ({
    id: 'prop-123',
    address: '123 Main St',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    arv: 300000,
    repair_cost: 50000,
    purchase_price: 200000,
    ...overrides,
  } as Property);

const createMockContext = (overrides: Partial<HandlerContext> = {}): HandlerContext => ({
  deal: createMockDeal(),
  property: createMockProperty(),
  userId: 'user-123',
  ...overrides,
});

describe('Action Handlers', () => {
  describe('hasHandler', () => {
    it('should return true for all registered actions', () => {
      const actionIds = [
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
        expect(hasHandler(id as any)).toBe(true);
      });
    });

    it('should return false for unknown actions', () => {
      expect(hasHandler('unknown_action' as any)).toBe(false);
    });
  });

  describe('executeAction', () => {
    it('should return error for unknown action', async () => {
      const input: ActionHandlerInput = {
        actionId: 'unknown_action' as any,
        dealId: 'deal-123',
      };

      const result = await executeAction(input, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    it('should execute valid action and return result', async () => {
      const input: ActionHandlerInput = {
        actionId: 'add_note',
        dealId: 'deal-123',
        params: { content: 'Test note content' },
      };

      const result = await executeAction(input, createMockContext());

      expect(result.success).toBe(true);
      expect(result.patchSet).toBeDefined();
    });
  });

  describe('handleUpdateStage', () => {
    it('should create PatchSet for valid stage transition', async () => {
      const input: ActionHandlerInput = {
        actionId: 'update_stage',
        dealId: 'deal-123',
        params: { newStage: 'offer_sent', rationale: 'Offer was sent to seller' },
      };

      const context = createMockContext({
        deal: createMockDeal({ stage: 'analyzing' }),
      });

      const result = await handleUpdateStage(input, context);

      expect(result.success).toBe(true);
      expect(result.patchSet).toBeDefined();
      expect(result.patchSet?.ops[0].after).toEqual({ stage: 'offer_sent' });
    });

    it('should auto-suggest next stage when not provided', async () => {
      const input: ActionHandlerInput = {
        actionId: 'update_stage',
        dealId: 'deal-123',
      };

      const context = createMockContext({
        deal: createMockDeal({ stage: 'new' }),
      });

      const result = await handleUpdateStage(input, context);

      expect(result.success).toBe(true);
      expect(result.patchSet).toBeDefined();
    });

    it('should mark non-standard transitions in rationale', async () => {
      const input: ActionHandlerInput = {
        actionId: 'update_stage',
        dealId: 'deal-123',
        params: { newStage: 'closed_won' }, // Skip stages
      };

      const context = createMockContext({
        deal: createMockDeal({ stage: 'new' }),
      });

      const result = await handleUpdateStage(input, context);

      expect(result.success).toBe(true);
      expect(result.patchSet?.ops[0].rationale).toContain('non-standard');
    });
  });

  describe('handleSetNextAction', () => {
    it('should create PatchSet for next action', async () => {
      const input: ActionHandlerInput = {
        actionId: 'set_next_action',
        dealId: 'deal-123',
        params: {
          nextAction: 'Call seller about counter offer',
          dueDate: '2024-01-15',
        },
      };

      const result = await handleSetNextAction(input, createMockContext());

      expect(result.success).toBe(true);
      expect(result.patchSet).toBeDefined();
      expect(result.patchSet?.ops[0].after).toEqual({
        next_action: 'Call seller about counter offer',
        next_action_due: '2024-01-15',
      });
    });

    it('should fail when next action text is missing', async () => {
      const input: ActionHandlerInput = {
        actionId: 'set_next_action',
        dealId: 'deal-123',
        params: {},
      };

      const result = await handleSetNextAction(input, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('handleCreateTask', () => {
    it('should create PatchSet for task', async () => {
      const input: ActionHandlerInput = {
        actionId: 'create_task',
        dealId: 'deal-123',
        params: {
          title: 'Order title search',
          description: 'Request title search from First American',
          dueDate: '2024-01-20',
        },
      };

      const result = await handleCreateTask(input, createMockContext());

      expect(result.success).toBe(true);
      expect(result.patchSet?.ops[0].op).toBe('create');
      expect(result.patchSet?.ops[0].entity).toBe('Task');
      expect(result.patchSet?.ops[0].after).toMatchObject({
        title: 'Order title search',
        deal_id: 'deal-123',
        status: 'pending',
      });
    });

    it('should fail when title is missing', async () => {
      const input: ActionHandlerInput = {
        actionId: 'create_task',
        dealId: 'deal-123',
        params: { description: 'Task without title' },
      };

      const result = await handleCreateTask(input, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('handleAddNote', () => {
    it('should create PatchSet for note', async () => {
      const input: ActionHandlerInput = {
        actionId: 'add_note',
        dealId: 'deal-123',
        params: { content: 'Seller is motivated, needs to close quickly' },
      };

      const result = await handleAddNote(input, createMockContext());

      expect(result.success).toBe(true);
      expect(result.patchSet?.willCreateTimelineEvents.length).toBe(1);
      expect(result.patchSet?.willCreateTimelineEvents[0].type).toBe('note');
    });

    it('should fail when content is missing', async () => {
      const input: ActionHandlerInput = {
        actionId: 'add_note',
        dealId: 'deal-123',
        params: {},
      };

      const result = await handleAddNote(input, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('handleRunUnderwriteCheck', () => {
    it('should identify missing ARV', async () => {
      const input: ActionHandlerInput = {
        actionId: 'run_underwrite_check',
        dealId: 'deal-123',
      };

      const context = createMockContext({
        property: createMockProperty({ arv: undefined }),
      });

      const result = await handleRunUnderwriteCheck(input, context);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();

      const content = JSON.parse(result.content!);
      expect(content.issues).toContain('Missing ARV (After Repair Value)');
    });

    it('should identify missing repair cost', async () => {
      const input: ActionHandlerInput = {
        actionId: 'run_underwrite_check',
        dealId: 'deal-123',
      };

      const context = createMockContext({
        property: createMockProperty({ repair_cost: undefined }),
      });

      const result = await handleRunUnderwriteCheck(input, context);

      const content = JSON.parse(result.content!);
      expect(content.issues).toContain('Missing repair cost estimate');
    });

    it('should flag high purchase price to ARV ratio', async () => {
      const input: ActionHandlerInput = {
        actionId: 'run_underwrite_check',
        dealId: 'deal-123',
      };

      const context = createMockContext({
        property: createMockProperty({
          arv: 300000,
          purchase_price: 270000, // 90% of ARV
          repair_cost: 10000,
        }),
      });

      const result = await handleRunUnderwriteCheck(input, context);

      const content = JSON.parse(result.content!);
      expect(content.issues.some((i: string) => i.includes('% of ARV'))).toBe(true);
    });

    it('should return success when no issues', async () => {
      const input: ActionHandlerInput = {
        actionId: 'run_underwrite_check',
        dealId: 'deal-123',
      };

      const context = createMockContext({
        property: createMockProperty({
          arv: 300000,
          purchase_price: 180000, // 60% of ARV - good
          repair_cost: 30000, // 10% of ARV - good
        }),
      });

      const result = await handleRunUnderwriteCheck(input, context);

      const content = JSON.parse(result.content!);
      expect(content.issueCount).toBe(0);
      expect(content.recommendation).toContain('complete');
    });
  });

  describe('handleUpdateAssumption', () => {
    it('should create PatchSet for assumption update', async () => {
      const input: ActionHandlerInput = {
        actionId: 'update_assumption',
        dealId: 'deal-123',
        params: {
          field: 'repair_cost',
          oldValue: 50000,
          newValue: 65000,
          rationale: 'Contractor provided updated estimate',
        },
      };

      const result = await handleUpdateAssumption(input, createMockContext());

      expect(result.success).toBe(true);
      expect(result.patchSet?.ops[0].entity).toBe('DealAssumption');
      expect(result.patchSet?.ops[0].fieldPath).toBe('repair_cost');
    });

    it('should fail when field or value is missing', async () => {
      const input: ActionHandlerInput = {
        actionId: 'update_assumption',
        dealId: 'deal-123',
        params: { field: 'repair_cost' }, // Missing newValue
      };

      const result = await handleUpdateAssumption(input, createMockContext());

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Long-running job handlers', () => {
    describe('handleExtractFacts', () => {
      it('should return jobInput for extract_facts job', async () => {
        const input: ActionHandlerInput = {
          actionId: 'extract_facts',
          dealId: 'deal-123',
          params: { eventIds: ['event-1', 'event-2'] },
        };

        const result = await handleExtractFacts(input, createMockContext());

        expect(result.success).toBe(true);
        expect(result.jobInput).toBeDefined();
        expect(result.jobInput?.job_type).toBe('extract_facts');
        expect(result.jobInput?.deal_id).toBe('deal-123');
      });
    });

    describe('handleGenerateSellerReport', () => {
      it('should return jobInput for seller report generation', async () => {
        const input: ActionHandlerInput = {
          actionId: 'generate_seller_report',
          dealId: 'deal-123',
        };

        const context = createMockContext({
          property: createMockProperty({
            arv: 300000,
            purchase_price: 200000,
          }),
        });

        const result = await handleGenerateSellerReport(input, context);

        expect(result.success).toBe(true);
        expect(result.jobInput).toBeDefined();
        expect(result.jobInput?.job_type).toBe('generate_seller_report');
      });

      it('should fail when missing required property data', async () => {
        const input: ActionHandlerInput = {
          actionId: 'generate_seller_report',
          dealId: 'deal-123',
        };

        const context = createMockContext({
          property: createMockProperty({ arv: undefined }),
        });

        const result = await handleGenerateSellerReport(input, context);

        expect(result.success).toBe(false);
        expect(result.error).toContain('missing');
      });
    });

    describe('handleGenerateOfferPacket', () => {
      it('should return jobInput for offer packet generation', async () => {
        const input: ActionHandlerInput = {
          actionId: 'generate_offer_packet',
          dealId: 'deal-123',
          params: { offerType: 'cash', offerAmount: 200000 },
        };

        const result = await handleGenerateOfferPacket(input, createMockContext());

        expect(result.success).toBe(true);
        expect(result.jobInput).toBeDefined();
        expect(result.jobInput?.job_type).toBe('generate_offer_packet');
        expect(result.jobInput?.input_json?.offer_amount).toBe(200000);
      });

      it('should use property purchase price as default', async () => {
        const input: ActionHandlerInput = {
          actionId: 'generate_offer_packet',
          dealId: 'deal-123',
        };

        const context = createMockContext({
          property: createMockProperty({ purchase_price: 185000 }),
        });

        const result = await handleGenerateOfferPacket(input, context);

        expect(result.success).toBe(true);
        expect(result.jobInput?.input_json?.offer_amount).toBe(185000);
      });

      it('should fail when no offer amount available', async () => {
        const input: ActionHandlerInput = {
          actionId: 'generate_offer_packet',
          dealId: 'deal-123',
        };

        const context = createMockContext({
          property: createMockProperty({ purchase_price: undefined }),
        });

        const result = await handleGenerateOfferPacket(input, context);

        expect(result.success).toBe(false);
        expect(result.error).toContain('no offer amount');
      });
    });

    describe('handlePrepareEsignEnvelope', () => {
      it('should return jobInput for e-sign preparation', async () => {
        const input: ActionHandlerInput = {
          actionId: 'prepare_esign_envelope',
          dealId: 'deal-123',
          params: { documentType: 'purchase_agreement' },
        };

        const result = await handlePrepareEsignEnvelope(input, createMockContext());

        expect(result.success).toBe(true);
        expect(result.jobInput).toBeDefined();
        expect(result.jobInput?.job_type).toBe('prepare_esign_envelope');
        expect(result.jobInput?.input_json?.document_type).toBe('purchase_agreement');
      });
    });
  });

  describe('handleDraftCounterText', () => {
    it('should return template counter text', async () => {
      const input: ActionHandlerInput = {
        actionId: 'draft_counter_text',
        dealId: 'deal-123',
        params: { counterAmount: 195000, tone: 'professional' },
      };

      const result = await handleDraftCounterText(input, createMockContext());

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('195,000');
    });
  });
});
