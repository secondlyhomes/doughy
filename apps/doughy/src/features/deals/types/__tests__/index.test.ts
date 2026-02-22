// Tests for deal types and helper functions
import {
  getDealAddress,
  getDealLeadName,
  getDealRiskScore,
  getRiskScoreColor,
  isDealClosed,
  getNextStages,
  DEAL_STAGE_CONFIG,
  DEAL_STRATEGY_CONFIG,
  Deal,
  DealStage,
} from '../index';

// Mock data helpers
const createMockDeal = (overrides: Partial<Deal> = {}): Deal => ({
  id: 'deal-123',
  stage: 'analyzing',
  ...overrides,
});

const createMockProperty = () => ({
  id: 'prop-123',
  address: '123 Main St',
  address_line_1: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
});

const createMockLead = () => ({
  id: 'lead-123',
  name: 'John Doe',
  phone: '555-1234',
  email: 'john@example.com',
});

describe('Deal Types Helper Functions', () => {
  describe('getDealAddress', () => {
    it('should return formatted address when property is linked', () => {
      const deal = createMockDeal({
        property: createMockProperty() as any,
      });

      expect(getDealAddress(deal)).toBe('123 Main St, Austin, TX, 78701');
    });

    it('should return "No property linked" when property is not linked', () => {
      const deal = createMockDeal({ property: undefined });

      expect(getDealAddress(deal)).toBe('No property linked');
    });

    it('should return "No address" when property has no address fields', () => {
      const deal = createMockDeal({
        property: { id: 'prop-123' } as any,
      });

      expect(getDealAddress(deal)).toBe('No address');
    });

    it('should handle partial address data', () => {
      const deal = createMockDeal({
        property: { id: 'prop-123', city: 'Austin', state: 'TX' } as any,
      });

      expect(getDealAddress(deal)).toBe('Austin, TX');
    });
  });

  describe('getDealLeadName', () => {
    it('should return lead name when lead is linked', () => {
      const deal = createMockDeal({
        lead: createMockLead() as any,
      });

      expect(getDealLeadName(deal)).toBe('John Doe');
    });

    it('should return "No lead linked" when lead is not linked', () => {
      const deal = createMockDeal({ lead: undefined });

      expect(getDealLeadName(deal)).toBe('No lead linked');
    });
  });

  describe('getDealRiskScore', () => {
    it('should prefer manual risk_score over auto', () => {
      const deal = createMockDeal({
        risk_score: 3,
        risk_score_auto: 5,
      });

      expect(getDealRiskScore(deal)).toBe(3);
    });

    it('should fall back to risk_score_auto when manual is not set', () => {
      const deal = createMockDeal({
        risk_score: undefined,
        risk_score_auto: 4,
      });

      expect(getDealRiskScore(deal)).toBe(4);
    });

    it('should return undefined when neither score is set', () => {
      const deal = createMockDeal({
        risk_score: undefined,
        risk_score_auto: undefined,
      });

      expect(getDealRiskScore(deal)).toBeUndefined();
    });
  });

  describe('getRiskScoreColor', () => {
    it('should return green for low risk (1-2)', () => {
      expect(getRiskScoreColor(1)).toBe('text-green-500');
      expect(getRiskScoreColor(2)).toBe('text-green-500');
    });

    it('should return amber for medium risk (3)', () => {
      expect(getRiskScoreColor(3)).toBe('text-amber-500');
    });

    it('should return red for high risk (4-5)', () => {
      expect(getRiskScoreColor(4)).toBe('text-red-500');
      expect(getRiskScoreColor(5)).toBe('text-red-500');
    });

    it('should return gray for undefined', () => {
      expect(getRiskScoreColor(undefined)).toBe('text-gray-400');
    });
  });

  describe('isDealClosed', () => {
    it('should return true for closed_won', () => {
      const deal = createMockDeal({ stage: 'closed_won' });
      expect(isDealClosed(deal)).toBe(true);
    });

    it('should return true for closed_lost', () => {
      const deal = createMockDeal({ stage: 'closed_lost' });
      expect(isDealClosed(deal)).toBe(true);
    });

    it('should return false for active stages', () => {
      const activeStages: DealStage[] = [
        'new',
        'contacted',
        'appointment_set',
        'analyzing',
        'offer_sent',
        'negotiating',
        'under_contract',
      ];

      activeStages.forEach((stage) => {
        const deal = createMockDeal({ stage });
        expect(isDealClosed(deal)).toBe(false);
      });
    });
  });

  describe('getNextStages', () => {
    it('should return next stage for new', () => {
      expect(getNextStages('new')).toEqual(['contacted']);
    });

    it('should return next stage for analyzing', () => {
      expect(getNextStages('analyzing')).toEqual(['offer_sent']);
    });

    it('should return closed_lost as next stage for closed_won (by order)', () => {
      // Note: This is based on order - closed_won (8) -> closed_lost (9)
      expect(getNextStages('closed_won')).toEqual(['closed_lost']);
    });

    it('should return empty array for closed_lost (final stage)', () => {
      expect(getNextStages('closed_lost')).toEqual([]);
    });
  });

  describe('DEAL_STAGE_CONFIG', () => {
    it('should have config for all stages', () => {
      const stages: DealStage[] = [
        'new',
        'contacted',
        'appointment_set',
        'analyzing',
        'offer_sent',
        'negotiating',
        'under_contract',
        'closed_won',
        'closed_lost',
      ];

      stages.forEach((stage) => {
        expect(DEAL_STAGE_CONFIG[stage]).toBeDefined();
        expect(DEAL_STAGE_CONFIG[stage].label).toBeDefined();
        expect(DEAL_STAGE_CONFIG[stage].color).toBeDefined();
        expect(DEAL_STAGE_CONFIG[stage].order).toBeDefined();
      });
    });

    it('should have ascending order values', () => {
      expect(DEAL_STAGE_CONFIG['new'].order).toBeLessThan(DEAL_STAGE_CONFIG['contacted'].order);
      expect(DEAL_STAGE_CONFIG['analyzing'].order).toBeLessThan(DEAL_STAGE_CONFIG['offer_sent'].order);
    });
  });

  describe('DEAL_STRATEGY_CONFIG', () => {
    it('should have config for all strategies', () => {
      expect(DEAL_STRATEGY_CONFIG['cash']).toBeDefined();
      expect(DEAL_STRATEGY_CONFIG['seller_finance']).toBeDefined();
      expect(DEAL_STRATEGY_CONFIG['subject_to']).toBeDefined();
    });

    it('should have label and description for each strategy', () => {
      Object.values(DEAL_STRATEGY_CONFIG).forEach((config) => {
        expect(config.label).toBeDefined();
        expect(config.description).toBeDefined();
      });
    });
  });
});
