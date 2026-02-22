// src/lib/__tests__/integrations.test.ts
// Integration tests for Zone D: API client wrappers and utilities

import {
  retryWithBackoff,
  withRetry,
  isNetworkError,
  isRetryableHttpError,
  defaultIsRetryable,
  RetryPresets,
} from '../retry';

import {
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  calculateTotalInterest,
  getLoanSummary,
  calculateRemainingBalance,
  analyzeDeal,
  calculate70PercentRule,
  calculateRentalCashFlow,
  calculateCapRate,
  calculateDSCR,
} from '../financial-calculations';

import {
  formatPhoneNumber,
  isValidPhoneNumber,
  generateSMSFromTemplate,
} from '../twilio';

import { calculateARV } from '../zillow';

// =============================================================================
// Retry Utility Tests
// =============================================================================

describe('Retry Utility', () => {
  describe('retryWithBackoff', () => {
    it('should succeed on first attempt if no error', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, {
        maxRetries: 3,
        baseDelay: 10, // Fast for testing
      });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after exhausting retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('persistent failure'));

      await expect(
        retryWithBackoff(fn, { maxRetries: 2, baseDelay: 10 })
      ).rejects.toThrow('persistent failure');

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should not retry non-retryable errors', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('not retryable'));

      await expect(
        retryWithBackoff(fn, {
          maxRetries: 3,
          isRetryable: () => false,
        })
      ).rejects.toThrow('not retryable');

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback before each retry', async () => {
      const onRetry = jest.fn();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      await retryWithBackoff(fn, {
        maxRetries: 3,
        baseDelay: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1, expect.any(Number));
    });
  });

  describe('withRetry wrapper', () => {
    it('should wrap a function with retry logic', async () => {
      const original = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const wrapped = withRetry(original, { maxRetries: 2, baseDelay: 10 });
      const result = await wrapped();

      expect(result).toBe('success');
      expect(original).toHaveBeenCalledTimes(2);
    });
  });

  describe('error detection helpers', () => {
    it('isNetworkError should detect network errors', () => {
      expect(isNetworkError(new Error('network request failed'))).toBe(true);
      expect(isNetworkError(new Error('timeout'))).toBe(true);
      expect(isNetworkError(new Error('connection refused'))).toBe(true);
      expect(isNetworkError(new Error('regular error'))).toBe(false);
    });

    it('isRetryableHttpError should detect retryable HTTP errors', () => {
      expect(isRetryableHttpError({ status: 429 })).toBe(true);
      expect(isRetryableHttpError({ status: 500 })).toBe(true);
      expect(isRetryableHttpError({ status: 503 })).toBe(true);
      expect(isRetryableHttpError({ status: 400 })).toBe(false);
      expect(isRetryableHttpError({ status: 404 })).toBe(false);
    });

    it('defaultIsRetryable should combine network and HTTP checks', () => {
      expect(defaultIsRetryable(new Error('network'))).toBe(true);
      expect(defaultIsRetryable({ status: 500 })).toBe(true);
      expect(defaultIsRetryable(new Error('bad request'))).toBe(false);
    });
  });

  describe('RetryPresets', () => {
    it('should have valid preset configurations', () => {
      expect(RetryPresets.rateLimited.maxRetries).toBe(5);
      expect(RetryPresets.critical.baseDelay).toBe(500);
      expect(RetryPresets.light.maxRetries).toBe(2);
    });
  });
});

// =============================================================================
// Financial Calculations Tests
// =============================================================================

describe('Financial Calculations', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate correct monthly payment', () => {
      // $300,000 loan at 7.5% for 30 years
      const payment = calculateMonthlyPayment(300000, 7.5, 30);
      expect(payment).toBeCloseTo(2097.64, 0);
    });

    it('should handle 0% interest rate', () => {
      const payment = calculateMonthlyPayment(120000, 0, 10);
      expect(payment).toBe(1000); // Simple division
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateMonthlyPayment(0, 7.5, 30)).toBe(0);
      expect(calculateMonthlyPayment(300000, 7.5, 0)).toBe(0);
      expect(calculateMonthlyPayment(-100000, 7.5, 30)).toBe(0);
    });

    it('should calculate different loan scenarios', () => {
      // 15 year loan
      const payment15 = calculateMonthlyPayment(300000, 6.0, 15);
      expect(payment15).toBeGreaterThan(2500); // Higher payment for shorter term

      // Lower rate
      const paymentLow = calculateMonthlyPayment(300000, 4.0, 30);
      expect(paymentLow).toBeLessThan(1500);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate correct number of entries', () => {
      const schedule = generateAmortizationSchedule(300000, 7.5, 30);
      expect(schedule).toHaveLength(360); // 30 years * 12 months
    });

    it('should have decreasing balance', () => {
      const schedule = generateAmortizationSchedule(100000, 6, 15);
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].balance).toBeLessThan(schedule[i - 1].balance);
      }
    });

    it('should end with zero balance', () => {
      const schedule = generateAmortizationSchedule(100000, 6, 15);
      expect(schedule[schedule.length - 1].balance).toBe(0);
    });

    it('should have increasing principal portion over time', () => {
      const schedule = generateAmortizationSchedule(100000, 6, 15);
      const firstMonth = schedule[0];
      const lastMonth = schedule[schedule.length - 1];
      expect(lastMonth.principal).toBeGreaterThan(firstMonth.principal);
    });

    it('should return empty array for invalid inputs', () => {
      expect(generateAmortizationSchedule(0, 6, 15)).toHaveLength(0);
      expect(generateAmortizationSchedule(100000, 6, 0)).toHaveLength(0);
    });
  });

  describe('calculateTotalInterest', () => {
    it('should calculate total interest correctly', () => {
      const interest = calculateTotalInterest(300000, 7.5, 30);
      // Total interest should be substantial for long-term loan
      expect(interest).toBeGreaterThan(400000);
    });

    it('should be 0 for 0% interest', () => {
      const interest = calculateTotalInterest(100000, 0, 10);
      expect(interest).toBe(0);
    });
  });

  describe('getLoanSummary', () => {
    it('should return comprehensive loan summary', () => {
      const summary = getLoanSummary(300000, 7.5, 30);

      expect(summary.monthlyPayment).toBeCloseTo(2097.64, 0);
      expect(summary.totalPayments).toBeGreaterThan(750000);
      expect(summary.totalInterest).toBeGreaterThan(450000);
      expect(summary.totalCost).toBe(summary.totalPayments);
      expect(summary.effectiveRate).toBeGreaterThan(100); // More than 100% interest over 30 years
    });
  });

  describe('calculateRemainingBalance', () => {
    it('should return original principal at month 0', () => {
      const balance = calculateRemainingBalance(300000, 7.5, 30, 0);
      expect(balance).toBe(300000);
    });

    it('should return 0 after full term', () => {
      const balance = calculateRemainingBalance(300000, 7.5, 30, 360);
      expect(balance).toBe(0);
    });

    it('should return correct mid-loan balance', () => {
      const balance = calculateRemainingBalance(300000, 7.5, 30, 180); // 15 years in
      expect(balance).toBeGreaterThan(200000);
      expect(balance).toBeLessThan(250000);
    });
  });

  describe('analyzeDeal', () => {
    it('should analyze a flip deal correctly', () => {
      const analysis = analyzeDeal({
        purchasePrice: 200000,
        afterRepairValue: 300000,
        repairCosts: 30000,
        holdingCosts: 5000,
        closingCosts: 8000,
        sellingCosts: 18000,
      });

      expect(analysis.totalInvestment).toBe(243000);
      expect(analysis.projectedProfit).toBe(39000);
      expect(analysis.returnOnInvestment).toBeGreaterThan(10);
      expect(analysis.maxAllowableOffer).toBe(180000); // 300k * 0.7 - 30k
    });

    it('should calculate MAO using 70% rule', () => {
      const analysis = analyzeDeal({
        purchasePrice: 150000,
        afterRepairValue: 250000,
        repairCosts: 25000,
      });

      expect(analysis.maxAllowableOffer).toBe(150000); // 250k * 0.7 - 25k
    });
  });

  describe('calculate70PercentRule', () => {
    it('should calculate MAO correctly', () => {
      expect(calculate70PercentRule(300000, 30000)).toBe(180000);
      expect(calculate70PercentRule(200000, 20000)).toBe(120000);
      expect(calculate70PercentRule(500000, 0)).toBe(350000);
    });
  });

  describe('calculateRentalCashFlow', () => {
    it('should calculate rental cash flow correctly', () => {
      const cashFlow = calculateRentalCashFlow({
        monthlyRent: 2000,
        monthlyExpenses: 500,
        monthlyMortgage: 1200,
        vacancyRate: 0.08,
      });

      expect(cashFlow.grossMonthlyIncome).toBe(2000);
      expect(cashFlow.effectiveGrossIncome).toBe(1840); // 2000 - 8% vacancy
      expect(cashFlow.monthlyCashFlow).toBeGreaterThan(0);
      expect(cashFlow.annualCashFlow).toBe(cashFlow.monthlyCashFlow * 12);
    });
  });

  describe('calculateCapRate', () => {
    it('should calculate cap rate correctly', () => {
      // $20,000 annual NOI / $250,000 property value = 8% cap
      expect(calculateCapRate(20000, 250000)).toBe(8);
    });

    it('should return 0 for zero property value', () => {
      expect(calculateCapRate(20000, 0)).toBe(0);
    });
  });

  describe('calculateDSCR', () => {
    it('should calculate DSCR correctly', () => {
      // $30,000 NOI / $24,000 debt service = 1.25
      expect(calculateDSCR(30000, 24000)).toBe(1.25);
    });

    it('should return 0 for zero debt service', () => {
      expect(calculateDSCR(30000, 0)).toBe(0);
    });
  });
});

// =============================================================================
// Twilio Client Tests
// =============================================================================

describe('Twilio Client', () => {
  describe('formatPhoneNumber', () => {
    it('should format US phone numbers correctly', () => {
      expect(formatPhoneNumber('555-123-4567')).toBe('+15551234567');
      expect(formatPhoneNumber('(555) 123-4567')).toBe('+15551234567');
      expect(formatPhoneNumber('5551234567')).toBe('+15551234567');
      expect(formatPhoneNumber('1-555-123-4567')).toBe('+15551234567');
    });

    it('should preserve international numbers', () => {
      expect(formatPhoneNumber('+1 555 123 4567')).toBe('+15551234567');
      expect(formatPhoneNumber('+44 20 7946 0958')).toBe('+442079460958');
    });
  });

  describe('isValidPhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhoneNumber('+15551234567')).toBe(true);
      expect(isValidPhoneNumber('555-123-4567')).toBe(true);
      expect(isValidPhoneNumber('(555) 123-4567')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abcdefghij')).toBe(false);
    });
  });

  describe('generateSMSFromTemplate', () => {
    it('should generate follow_up template', () => {
      const message = generateSMSFromTemplate('follow_up', {
        sellerName: 'John',
        userName: 'Jane',
        propertyAddress: '123 Main St',
      });

      expect(message).toContain('John');
      expect(message).toContain('Jane');
      expect(message).toContain('123 Main St');
    });

    it('should generate appointment_reminder template', () => {
      const message = generateSMSFromTemplate('appointment_reminder', {
        date: '2024-03-15',
        time: '2:00 PM',
        propertyAddress: '456 Oak Ave',
      });

      expect(message).toContain('2024-03-15');
      expect(message).toContain('2:00 PM');
      expect(message).toContain('456 Oak Ave');
    });

    it('should handle custom template', () => {
      const message = generateSMSFromTemplate('custom', {
        message: 'Custom message text',
      });

      expect(message).toBe('Custom message text');
    });
  });
});

// =============================================================================
// Zillow Client Tests
// =============================================================================

describe('Zillow Client', () => {
  describe('calculateARV', () => {
    const mockComps = [
      {
        address: '123 Test St',
        price: 250000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1500,
        pricePerSqft: 167,
        similarity: 0.9,
      },
      {
        address: '456 Test Ave',
        price: 270000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1600,
        pricePerSqft: 169,
        similarity: 0.85,
      },
      {
        address: '789 Test Blvd',
        price: 240000,
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1450,
        pricePerSqft: 166,
        similarity: 0.8,
      },
    ];

    it('should calculate ARV from comps', () => {
      const result = calculateARV(mockComps, 1500);

      expect(result.estimatedValue).toBeGreaterThan(0);
      expect(result.source).toBe('calculated');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return zero values for empty comps', () => {
      const result = calculateARV([], 1500);

      expect(result.estimatedValue).toBe(0);
      expect(result.confidence).toBe(0);
    });

    it('should provide reasonable confidence scores', () => {
      // Consistent comps should have higher confidence
      const consistentComps = [
        { address: '', price: 250000, bedrooms: 3, bathrooms: 2, sqft: 1500, pricePerSqft: 167, similarity: 0.9 },
        { address: '', price: 251000, bedrooms: 3, bathrooms: 2, sqft: 1505, pricePerSqft: 167, similarity: 0.9 },
        { address: '', price: 249000, bedrooms: 3, bathrooms: 2, sqft: 1495, pricePerSqft: 167, similarity: 0.9 },
      ];

      const result = calculateARV(consistentComps, 1500);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should calculate low and high estimates', () => {
      const result = calculateARV(mockComps, 1500);

      expect(result.lowEstimate).toBeLessThan(result.estimatedValue);
      expect(result.highEstimate).toBeGreaterThan(result.estimatedValue);
      expect(result.lowEstimate).toBeGreaterThanOrEqual(0);
    });
  });
});
