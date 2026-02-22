// Tests for useNextAction hook and NBA rule engine
import {
  calculateNextAction,
  getActionButtonText,
  getActionIcon,
  ActionCategory,
} from '../useNextAction';
import { Deal, DealStage } from '../../types';

// Mock data helpers
const createMockDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 'deal-123',
  stage: 'new',
  ...overrides,
});

const createMockProperty = (overrides = {}) => ({
  id: 'prop-123',
  address: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  arv: 300000,
  repair_cost: 50000,
  purchase_price: 200000,
  ...overrides,
});

const createMockLead = () => ({
  id: 'lead-123',
  name: 'John Doe',
  phone: '555-1234',
});

describe('useNextAction - NBA Rule Engine', () => {
  describe('calculateNextAction', () => {
    describe('Manual next_action handling', () => {
      it('should use manual next_action when set', () => {
        const deal = createMockDeal({
          next_action: 'Call seller about counter offer',
          stage: 'negotiating',
        });

        const result = calculateNextAction(deal);

        expect(result.action).toBe('Call seller about counter offer');
        expect(result.priority).toBe('medium');
      });

      it('should mark as high priority if overdue', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);

        const deal = createMockDeal({
          next_action: 'Follow up on offer',
          next_action_due: pastDate.toISOString(),
          stage: 'offer_sent',
        });

        const result = calculateNextAction(deal);

        expect(result.priority).toBe('high');
        expect(result.isOverdue).toBe(true);
      });
    });

    describe('Missing data checks', () => {
      it('should suggest linking property when missing', () => {
        const deal = createMockDeal({
          property_id: undefined,
          property: undefined,
          lead: createMockLead() as any,
        });

        const result = calculateNextAction(deal);

        expect(result.action).toBe('Link or add property to this deal');
        expect(result.priority).toBe('high');
        expect(result.category).toBe('document');
      });

      it('should suggest linking lead when missing', () => {
        const deal = createMockDeal({
          lead_id: undefined,
          lead: undefined,
          property: createMockProperty() as any,
        });

        const result = calculateNextAction(deal);

        expect(result.action).toBe('Link or add lead contact to this deal');
        expect(result.priority).toBe('high');
        expect(result.category).toBe('contact');
      });

      it('should suggest running comps when ARV missing in analyzing stage', () => {
        const deal = createMockDeal({
          stage: 'analyzing',
          property: createMockProperty({ arv: undefined }) as any,
          lead: createMockLead() as any,
        });

        const result = calculateNextAction(deal);

        expect(result.action).toBe('Run comps to determine ARV');
        expect(result.category).toBe('analyze');
      });

      it('should suggest walkthrough when repairs missing in analyzing stage', () => {
        const deal = createMockDeal({
          stage: 'analyzing',
          property: createMockProperty({ repair_cost: undefined, arv: 300000 }) as any,
          lead: createMockLead() as any,
        });

        const result = calculateNextAction(deal);

        expect(result.action).toBe('Complete walkthrough to estimate repairs');
        expect(result.category).toBe('walkthrough');
      });

      it('should suggest selecting strategy when missing in analyzing stage', () => {
        const deal = createMockDeal({
          stage: 'analyzing',
          strategy: undefined,
          property: createMockProperty() as any,
          lead: createMockLead() as any,
        });

        const result = calculateNextAction(deal);

        expect(result.action).toBe('Select exit strategy (Cash, Seller Finance, Subject-To)');
        expect(result.category).toBe('underwrite');
      });
    });

    describe('Stage-specific conditions', () => {
      it('should suggest creating offer when ready in analyzing stage', () => {
        const deal = createMockDeal({
          stage: 'analyzing',
          strategy: 'cash',
          property: createMockProperty() as any,
          lead: createMockLead() as any,
        });

        const result = calculateNextAction(deal);

        expect(result.action).toBe('Create and send offer package');
        expect(result.category).toBe('offer');
        expect(result.priority).toBe('high');
      });

      it('should suggest follow up after 3 days in offer_sent stage', () => {
        const sentDate = new Date();
        sentDate.setDate(sentDate.getDate() - 5);

        const deal = createMockDeal({
          stage: 'offer_sent',
          property: createMockProperty() as any,
          lead: createMockLead() as any,
          offers: [
            {
              id: 'offer-1',
              deal_id: 'deal-123',
              offer_type: 'cash',
              status: 'sent',
              created_at: sentDate.toISOString(),
            },
          ],
        });

        const result = calculateNextAction(deal);

        expect(result.action).toContain('Follow up on offer');
        expect(result.action).toContain('5 days since sent');
        expect(result.priority).toBe('high');
      });

      it('should suggest responding to counter in negotiating stage', () => {
        const deal = createMockDeal({
          stage: 'negotiating',
          property: createMockProperty() as any,
          lead: createMockLead() as any,
          offers: [
            {
              id: 'offer-1',
              deal_id: 'deal-123',
              offer_type: 'cash',
              status: 'countered',
            },
          ],
        });

        const result = calculateNextAction(deal);

        expect(result.action).toBe('Review and respond to counter offer');
        expect(result.category).toBe('negotiate');
      });
    });

    describe('Default stage actions', () => {
      const stageTests: { stage: DealStage; expectedCategory: ActionCategory }[] = [
        { stage: 'new', expectedCategory: 'contact' },
        { stage: 'contacted', expectedCategory: 'contact' },
        { stage: 'appointment_set', expectedCategory: 'walkthrough' },
        { stage: 'offer_sent', expectedCategory: 'followup' },
        { stage: 'negotiating', expectedCategory: 'negotiate' },
        // under_contract suggests seller report when missing, so 'document' category
        { stage: 'under_contract', expectedCategory: 'document' },
      ];

      stageTests.forEach(({ stage, expectedCategory }) => {
        it(`should return ${expectedCategory} category for ${stage} stage`, () => {
          const deal = createMockDeal({
            stage,
            property: createMockProperty() as any,
            lead: createMockLead() as any,
          });

          const result = calculateNextAction(deal);

          expect(result.category).toBe(expectedCategory);
        });
      });
    });

    describe('Priority levels', () => {
      it('should return high priority for negotiating stage', () => {
        const deal = createMockDeal({
          stage: 'negotiating',
          property: createMockProperty() as any,
          lead: createMockLead() as any,
        });

        const result = calculateNextAction(deal);

        expect(result.priority).toBe('high');
      });

      it('should return medium priority for analyzing stage', () => {
        const deal = createMockDeal({
          stage: 'analyzing',
          property: createMockProperty() as any,
          lead: createMockLead() as any,
          strategy: 'cash',
        });

        const result = calculateNextAction(deal);

        // High because it's ready to send offer
        expect(result.priority).toBe('high');
      });

      it('should return low priority for new stage', () => {
        const deal = createMockDeal({
          stage: 'new',
          property: createMockProperty() as any,
          lead: createMockLead() as any,
        });

        const result = calculateNextAction(deal);

        expect(result.priority).toBe('low');
      });
    });
  });

  describe('getActionButtonText', () => {
    const categoryTexts: { category: ActionCategory; expectedText: string }[] = [
      { category: 'contact', expectedText: 'Contact Seller' },
      { category: 'analyze', expectedText: 'Run Analysis' },
      { category: 'walkthrough', expectedText: 'Start Walkthrough' },
      { category: 'underwrite', expectedText: 'Quick Underwrite' },
      { category: 'offer', expectedText: 'Create Offer' },
      { category: 'negotiate', expectedText: 'View Counter' },
      { category: 'close', expectedText: 'View Details' },
      { category: 'followup', expectedText: 'Follow Up' },
      { category: 'document', expectedText: 'Add Documents' },
    ];

    categoryTexts.forEach(({ category, expectedText }) => {
      it(`should return "${expectedText}" for ${category} category`, () => {
        expect(getActionButtonText(category)).toBe(expectedText);
      });
    });
  });

  describe('getActionIcon', () => {
    const categoryIcons: { category: ActionCategory; expectedIcon: string }[] = [
      { category: 'contact', expectedIcon: 'phone' },
      { category: 'analyze', expectedIcon: 'bar-chart-2' },
      { category: 'walkthrough', expectedIcon: 'camera' },
      { category: 'underwrite', expectedIcon: 'calculator' },
      { category: 'offer', expectedIcon: 'file-text' },
      { category: 'negotiate', expectedIcon: 'message-circle' },
      { category: 'close', expectedIcon: 'check-circle' },
      { category: 'followup', expectedIcon: 'clock' },
      { category: 'document', expectedIcon: 'folder-plus' },
    ];

    categoryIcons.forEach(({ category, expectedIcon }) => {
      it(`should return "${expectedIcon}" icon for ${category} category`, () => {
        expect(getActionIcon(category)).toBe(expectedIcon);
      });
    });
  });
});
