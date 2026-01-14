// Tests for mockOffers data utilities
import {
  mockOffers,
  mockCashOfferTerms,
  mockSellerFinanceOfferTerms,
  mockSubjectToOfferTerms,
  defaultOfferTerms,
  offerScriptTemplates,
  offerEmailTemplates,
  getEmptyOfferTerms,
  formatCurrency,
  formatPercent,
} from '../mockOffers';

describe('mockOffers data', () => {
  describe('mockOffers array', () => {
    it('should have valid offer structures', () => {
      mockOffers.forEach((offer) => {
        expect(offer.id).toBeDefined();
        expect(offer.deal_id).toBeDefined();
        expect(offer.offer_type).toMatch(/^(cash|seller_finance|subject_to)$/);
        expect(offer.status).toMatch(/^(draft|sent|countered|accepted|rejected)$/);
      });
    });

    it('should have offers with different strategies', () => {
      const types = new Set(mockOffers.map((o) => o.offer_type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('should have offers with terms_json', () => {
      const offersWithTerms = mockOffers.filter((o) => o.terms_json);
      expect(offersWithTerms.length).toBeGreaterThan(0);
    });
  });

  describe('mockCashOfferTerms', () => {
    it('should have required cash offer fields', () => {
      expect(mockCashOfferTerms.purchase_price).toBeDefined();
      expect(typeof mockCashOfferTerms.purchase_price).toBe('number');
      expect(mockCashOfferTerms.earnest_money).toBeDefined();
      expect(mockCashOfferTerms.closing_date).toBeDefined();
      expect(mockCashOfferTerms.proof_of_funds).toBe(true);
    });

    it('should have contingencies array', () => {
      expect(Array.isArray(mockCashOfferTerms.contingencies)).toBe(true);
    });
  });

  describe('mockSellerFinanceOfferTerms', () => {
    it('should have seller finance specific fields', () => {
      expect(mockSellerFinanceOfferTerms.down_payment).toBeDefined();
      expect(mockSellerFinanceOfferTerms.interest_rate).toBeDefined();
      expect(mockSellerFinanceOfferTerms.term_years).toBeDefined();
      expect(mockSellerFinanceOfferTerms.monthly_payment).toBeDefined();
    });

    it('should have balloon payment fields', () => {
      expect(mockSellerFinanceOfferTerms.balloon_payment).toBeDefined();
      expect(mockSellerFinanceOfferTerms.balloon_due_years).toBeDefined();
    });
  });

  describe('mockSubjectToOfferTerms', () => {
    it('should have subject-to specific fields', () => {
      expect(mockSubjectToOfferTerms.existing_loan_balance).toBeDefined();
      expect(mockSubjectToOfferTerms.existing_monthly_payment).toBeDefined();
      expect(mockSubjectToOfferTerms.existing_interest_rate).toBeDefined();
    });

    it('should have catch_up_amount field', () => {
      expect(mockSubjectToOfferTerms.catch_up_amount).toBeDefined();
    });
  });

  describe('defaultOfferTerms', () => {
    it('should have defaults for all strategy types', () => {
      expect(defaultOfferTerms.cash).toBeDefined();
      expect(defaultOfferTerms.seller_finance).toBeDefined();
      expect(defaultOfferTerms.subject_to).toBeDefined();
    });

    it('should have earnest money defaults', () => {
      expect(defaultOfferTerms.cash.earnest_money).toBeDefined();
      expect(defaultOfferTerms.seller_finance.earnest_money).toBeDefined();
      expect(defaultOfferTerms.subject_to.earnest_money).toBeDefined();
    });
  });

  describe('offerScriptTemplates', () => {
    it('should have templates for all strategy types', () => {
      expect(offerScriptTemplates.cash).toBeDefined();
      expect(offerScriptTemplates.seller_finance).toBeDefined();
      expect(offerScriptTemplates.subject_to).toBeDefined();
    });

    it('should have placeholder variables', () => {
      expect(offerScriptTemplates.cash).toContain('[SELLER_NAME]');
      expect(offerScriptTemplates.cash).toContain('[PROPERTY_ADDRESS]');
      expect(offerScriptTemplates.cash).toContain('[PURCHASE_PRICE]');
    });

    it('should have strategy-specific placeholders', () => {
      expect(offerScriptTemplates.seller_finance).toContain('[INTEREST_RATE]');
      expect(offerScriptTemplates.seller_finance).toContain('[MONTHLY_PAYMENT]');
      expect(offerScriptTemplates.subject_to).toContain('[LOAN_BALANCE]');
    });
  });

  describe('offerEmailTemplates', () => {
    it('should have templates for all strategy types', () => {
      expect(offerEmailTemplates.cash).toBeDefined();
      expect(offerEmailTemplates.seller_finance).toBeDefined();
      expect(offerEmailTemplates.subject_to).toBeDefined();
    });

    it('should have subject line', () => {
      expect(offerEmailTemplates.cash).toContain('Subject:');
      expect(offerEmailTemplates.seller_finance).toContain('Subject:');
    });

    it('should have signature placeholders', () => {
      expect(offerEmailTemplates.cash).toContain('[YOUR_NAME]');
      expect(offerEmailTemplates.cash).toContain('[YOUR_PHONE]');
    });
  });

  describe('getEmptyOfferTerms', () => {
    it('should return terms with closing date 30 days out', () => {
      const terms = getEmptyOfferTerms('cash');
      const closingDate = new Date(terms.closing_date!);
      const now = new Date();
      const diffDays = Math.ceil(
        (closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it('should include default terms for strategy', () => {
      const cashTerms = getEmptyOfferTerms('cash');
      expect(cashTerms.earnest_money).toBe(defaultOfferTerms.cash.earnest_money);
      expect(cashTerms.proof_of_funds).toBe(true);

      const sfTerms = getEmptyOfferTerms('seller_finance');
      expect(sfTerms.interest_rate).toBe(defaultOfferTerms.seller_finance.interest_rate);
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers as USD currency', () => {
      expect(formatCurrency(165000)).toBe('$165,000');
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(500)).toBe('$500');
    });

    it('should handle undefined', () => {
      expect(formatCurrency(undefined)).toBe('$0');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });

    it('should round to whole numbers', () => {
      expect(formatCurrency(165000.75)).toBe('$165,001');
    });
  });

  describe('formatPercent', () => {
    it('should format numbers as percentages', () => {
      expect(formatPercent(6.5)).toBe('6.50%');
      expect(formatPercent(10)).toBe('10.00%');
    });

    it('should handle undefined', () => {
      expect(formatPercent(undefined)).toBe('0%');
    });

    it('should handle zero', () => {
      expect(formatPercent(0)).toBe('0.00%');
    });
  });
});
