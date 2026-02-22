// Tests for mockSellerReport data utilities
import {
  mockSellerReport,
  mockSellerReportOptions,
  mockReportAssumptions,
  defaultWeHandleOptions,
  WE_HANDLE_CONFIG,
  generateShareMessage,
  generateShareEmail,
  formatCurrency,
  formatPriceRange,
  formatCloseRange,
} from '../mockSellerReport';

describe('mockSellerReport data', () => {
  describe('mockSellerReport', () => {
    it('should have valid structure', () => {
      expect(mockSellerReport.id).toBeDefined();
      expect(mockSellerReport.deal_id).toBeDefined();
      expect(mockSellerReport.options_json).toBeDefined();
      expect(mockSellerReport.we_handle_json).toBeDefined();
      expect(mockSellerReport.assumptions_json).toBeDefined();
    });
  });

  describe('mockSellerReportOptions', () => {
    it('should have cash option with price range', () => {
      expect(mockSellerReportOptions.cash).toBeDefined();
      expect(mockSellerReportOptions.cash!.price_low).toBeDefined();
      expect(mockSellerReportOptions.cash!.price_high).toBeDefined();
      expect(mockSellerReportOptions.cash!.price_low).toBeLessThan(
        mockSellerReportOptions.cash!.price_high
      );
    });

    it('should have cash option with close days', () => {
      expect(mockSellerReportOptions.cash!.close_days_low).toBeDefined();
      expect(mockSellerReportOptions.cash!.close_days_high).toBeDefined();
    });

    it('should have seller finance option', () => {
      expect(mockSellerReportOptions.seller_finance).toBeDefined();
      expect(mockSellerReportOptions.seller_finance!.monthly_payment).toBeDefined();
      expect(mockSellerReportOptions.seller_finance!.term_years).toBeDefined();
    });

    it('should have subject-to option', () => {
      expect(mockSellerReportOptions.subject_to).toBeDefined();
      expect(mockSellerReportOptions.subject_to!.price_low).toBeDefined();
    });
  });

  describe('mockReportAssumptions', () => {
    it('should have ARV estimate and source', () => {
      expect(mockReportAssumptions.arv_estimate).toBeDefined();
      expect(mockReportAssumptions.arv_source).toBeDefined();
      expect(typeof mockReportAssumptions.arv_estimate).toBe('number');
    });

    it('should have repair estimate and source', () => {
      expect(mockReportAssumptions.repair_estimate).toBeDefined();
      expect(mockReportAssumptions.repair_source).toBeDefined();
    });

    it('should have comps count', () => {
      expect(mockReportAssumptions.comps_count).toBeDefined();
      expect(typeof mockReportAssumptions.comps_count).toBe('number');
    });
  });

  describe('defaultWeHandleOptions', () => {
    it('should have all expected options', () => {
      expect(defaultWeHandleOptions.cleanout).toBeDefined();
      expect(defaultWeHandleOptions.closing_costs).toBeDefined();
      expect(defaultWeHandleOptions.title_search).toBeDefined();
      expect(defaultWeHandleOptions.outstanding_liens).toBeDefined();
      expect(defaultWeHandleOptions.repairs).toBeDefined();
    });

    it('should have default values', () => {
      expect(defaultWeHandleOptions.cleanout).toBe(true);
      expect(defaultWeHandleOptions.closing_costs).toBe(true);
      expect(defaultWeHandleOptions.title_search).toBe(true);
    });
  });

  describe('WE_HANDLE_CONFIG', () => {
    it('should have config for all options', () => {
      const options = Object.keys(defaultWeHandleOptions);

      options.forEach((option) => {
        expect(WE_HANDLE_CONFIG[option as keyof typeof WE_HANDLE_CONFIG]).toBeDefined();
        expect(WE_HANDLE_CONFIG[option as keyof typeof WE_HANDLE_CONFIG].label).toBeDefined();
        expect(WE_HANDLE_CONFIG[option as keyof typeof WE_HANDLE_CONFIG].description).toBeDefined();
      });
    });
  });

  describe('generateShareMessage', () => {
    it('should include seller name', () => {
      const message = generateShareMessage('John Doe', '123 Main St', 'https://example.com/report');
      expect(message).toContain('John Doe');
    });

    it('should include property address', () => {
      const message = generateShareMessage('John Doe', '123 Main St', 'https://example.com/report');
      expect(message).toContain('123 Main St');
    });

    it('should include share link', () => {
      const link = 'https://example.com/report/abc123';
      const message = generateShareMessage('John Doe', '123 Main St', link);
      expect(message).toContain(link);
    });
  });

  describe('generateShareEmail', () => {
    it('should have subject line', () => {
      const email = generateShareEmail('John Doe', '123 Main St', 'https://example.com');
      expect(email).toContain('Subject:');
    });

    it('should include seller name', () => {
      const email = generateShareEmail('John Doe', '123 Main St', 'https://example.com');
      expect(email).toContain('John Doe');
    });

    it('should include property address', () => {
      const email = generateShareEmail('John Doe', '123 Main St', 'https://example.com');
      expect(email).toContain('123 Main St');
    });

    it('should mention report link', () => {
      const link = 'https://example.com/report';
      const email = generateShareEmail('John Doe', '123 Main St', link);
      expect(email).toContain(link);
    });
  });

  describe('formatCurrency', () => {
    it('should format numbers as USD', () => {
      expect(formatCurrency(155000)).toBe('$155,000');
      expect(formatCurrency(1000)).toBe('$1,000');
    });

    it('should handle undefined', () => {
      expect(formatCurrency(undefined)).toBe('$0');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0');
    });
  });

  describe('formatPriceRange', () => {
    it('should format price range', () => {
      expect(formatPriceRange(155000, 170000)).toBe('$155,000 - $170,000');
    });

    it('should handle same low and high', () => {
      expect(formatPriceRange(165000, 165000)).toBe('$165,000');
    });

    it('should handle undefined values', () => {
      expect(formatPriceRange(undefined, undefined)).toBe('TBD');
    });
  });

  describe('formatCloseRange', () => {
    it('should format day range', () => {
      expect(formatCloseRange(14, 30)).toBe('14-30 days');
    });

    it('should handle same low and high', () => {
      expect(formatCloseRange(14, 14)).toBe('14 days');
    });

    it('should handle undefined values', () => {
      expect(formatCloseRange(undefined, undefined)).toBe('TBD');
    });
  });
});
