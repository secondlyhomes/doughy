// Tests for useDealAnalysis hook with buyingCriteria support
import { renderHook } from '@testing-library/react-native';
import {
  useDealAnalysis,
  DEFAULT_FLIP_CONSTANTS,
  DEFAULT_RENTAL_ASSUMPTIONS,
} from '../useDealAnalysis';
import { Property } from '../../types';
import { IBuyingCriteria } from '../../types/store';

// Mock property helpers
const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 'prop-123',
  address: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  purchase_price: 200000,
  repair_cost: 50000,
  arv: 350000,
  ...overrides,
} as Property);

describe('useDealAnalysis', () => {
  describe('Default calculations (without buyingCriteria)', () => {
    it('should calculate MAO using 70% rule', () => {
      const property = createMockProperty({
        arv: 300000,
        repair_cost: 40000,
      });

      const { result } = renderHook(() => useDealAnalysis(property));

      // MAO = (ARV * 0.70) - Repairs = (300000 * 0.70) - 40000 = 210000 - 40000 = 170000
      expect(result.current.mao).toBe(170000);
    });

    it('should calculate closing costs at 3%', () => {
      const property = createMockProperty({
        purchase_price: 200000,
      });

      const { result } = renderHook(() => useDealAnalysis(property));

      // Closing costs = 200000 * 0.03 = 6000
      expect(result.current.closingCosts).toBe(6000);
    });

    it('should calculate holding costs at 2%', () => {
      const property = createMockProperty({
        purchase_price: 200000,
      });

      const { result } = renderHook(() => useDealAnalysis(property));

      // Holding costs = 200000 * 0.02 = 4000
      expect(result.current.holdingCosts).toBe(4000);
    });

    it('should calculate total investment correctly', () => {
      const property = createMockProperty({
        purchase_price: 200000,
        repair_cost: 50000,
      });

      const { result } = renderHook(() => useDealAnalysis(property));

      // Total = purchase + repairs + closing (3%) + holding (2%)
      // = 200000 + 50000 + 6000 + 4000 = 260000
      expect(result.current.totalInvestment).toBe(260000);
    });

    it('should calculate net profit with 8% selling costs', () => {
      const property = createMockProperty({
        purchase_price: 200000,
        repair_cost: 50000,
        arv: 350000,
      });

      const { result } = renderHook(() => useDealAnalysis(property));

      // Selling costs = 350000 * 0.08 = 28000
      // Total investment = 200000 + 50000 + 6000 + 4000 = 260000
      // Net profit = ARV - Total - Selling = 350000 - 260000 - 28000 = 62000
      expect(result.current.netProfit).toBe(62000);
    });

    it('should calculate ROI correctly', () => {
      const property = createMockProperty({
        purchase_price: 200000,
        repair_cost: 50000,
        arv: 350000,
      });

      const { result } = renderHook(() => useDealAnalysis(property));

      // ROI = (netProfit / totalInvestment) * 100
      // = (62000 / 260000) * 100 = 23.85%
      expect(result.current.roi).toBeCloseTo(23.85, 1);
    });
  });

  describe('Calculations with buyingCriteria', () => {
    it('should use custom closing costs percentage', () => {
      const property = createMockProperty({
        purchase_price: 200000,
      });

      const buyingCriteria: Partial<IBuyingCriteria> = {
        closingExpensesPct: 5, // 5% instead of default 3%
      };

      const { result } = renderHook(() =>
        useDealAnalysis(property, undefined, buyingCriteria)
      );

      // Closing costs = 200000 * 0.05 = 10000
      expect(result.current.closingCosts).toBe(10000);
    });

    it('should use custom selling commission percentage', () => {
      const property = createMockProperty({
        purchase_price: 200000,
        repair_cost: 50000,
        arv: 350000,
      });

      const buyingCriteria: Partial<IBuyingCriteria> = {
        sellingCommissionPct: 6, // 6% instead of default 8%
      };

      const { result } = renderHook(() =>
        useDealAnalysis(property, undefined, buyingCriteria)
      );

      // Selling costs = 350000 * 0.06 = 21000
      // Net profit = 350000 - 260000 - 21000 = 69000
      expect(result.current.netProfit).toBe(69000);
    });

    it('should calculate holding costs from months and monthly cost', () => {
      const property = createMockProperty({
        purchase_price: 200000,
      });

      const buyingCriteria: Partial<IBuyingCriteria> = {
        holdingMonths: 6,
        monthlyHoldingCost: 1500,
      };

      const { result } = renderHook(() =>
        useDealAnalysis(property, undefined, buyingCriteria)
      );

      // Holding costs = 6 * 1500 = 9000
      expect(result.current.holdingCosts).toBe(9000);
    });

    it('should calculate MAO based on profit percentage', () => {
      const property = createMockProperty({
        arv: 300000,
        repair_cost: 40000,
      });

      const buyingCriteria: Partial<IBuyingCriteria> = {
        yourProfitPct: 25, // 25% profit target
        sellingCommissionPct: 5, // 5% commission
      };

      const { result } = renderHook(() =>
        useDealAnalysis(property, undefined, buyingCriteria)
      );

      // MAO rule = 1 - 0.25 - 0.05 = 0.70 (70%)
      // MAO = (300000 * 0.70) - 40000 = 170000
      expect(result.current.mao).toBe(170000);
    });

    it('should calculate more aggressive MAO with higher profit target', () => {
      const property = createMockProperty({
        arv: 300000,
        repair_cost: 40000,
      });

      const buyingCriteria: Partial<IBuyingCriteria> = {
        yourProfitPct: 30, // 30% profit target
        sellingCommissionPct: 8, // 8% commission
      };

      const { result } = renderHook(() =>
        useDealAnalysis(property, undefined, buyingCriteria)
      );

      // MAO rule = 1 - 0.30 - 0.08 = 0.62 (62%)
      // MAO = (300000 * 0.62) - 40000 = 186000 - 40000 = 146000
      expect(result.current.mao).toBe(146000);
    });
  });

  describe('Rental analysis', () => {
    it('should calculate monthly cash flow', () => {
      const property = createMockProperty({
        purchase_price: 200000,
      });

      const rentalAssumptions = {
        monthlyRent: 2000,
        vacancyRate: 8,
        managementFee: 10,
        maintenanceRate: 5,
        insuranceAnnual: 1200,
        propertyTaxAnnual: 3000,
        hoaMonthly: 0,
        loanAmount: 160000, // 80% LTV
        interestRate: 7,
        loanTermYears: 30,
      };

      const { result } = renderHook(() =>
        useDealAnalysis(property, rentalAssumptions)
      );

      // Monthly rent: 2000
      // Vacancy (8%): 160
      // Management (10%): 200
      // Maintenance (5%): 100
      // Insurance: 100
      // Taxes: 250
      // HOA: 0
      // Total expenses: 810
      // Mortgage (160k @ 7% for 30yr): ~1064
      // Cash flow = 2000 - 810 - 1064 = 126
      expect(result.current.monthlyCashFlow).toBeGreaterThan(0);
      expect(result.current.hasRentalData).toBe(true);
    });

    it('should calculate cap rate', () => {
      const property = createMockProperty({
        purchase_price: 200000,
        arv: 250000,
      });

      const rentalAssumptions = {
        monthlyRent: 2000,
        vacancyRate: 5,
        managementFee: 8,
        maintenanceRate: 5,
        insuranceAnnual: 1200,
        propertyTaxAnnual: 2400,
        hoaMonthly: 0,
      };

      const { result } = renderHook(() =>
        useDealAnalysis(property, rentalAssumptions)
      );

      // Cap rate should be positive with these numbers
      expect(result.current.capRate).toBeGreaterThan(0);
    });

    it('should use default rental assumptions when not provided', () => {
      const property = createMockProperty();

      const { result } = renderHook(() => useDealAnalysis(property));

      // hasRentalData is false because monthly rent is not set
      expect(result.current.hasRentalData).toBe(false);
      // Cash flow is negative because mortgage is calculated (80% LTV default)
      // but no rental income is set
      expect(result.current.monthlyCashFlow).toBeLessThan(0);
    });
  });

  describe('Data availability flags', () => {
    it('should set hasFlipData when purchase price is set', () => {
      const property = createMockProperty({ purchase_price: 200000, arv: 0 });

      const { result } = renderHook(() => useDealAnalysis(property));

      expect(result.current.hasFlipData).toBe(true);
    });

    it('should set hasFlipData when ARV is set', () => {
      const property = createMockProperty({ purchase_price: 0, arv: 300000 });

      const { result } = renderHook(() => useDealAnalysis(property));

      expect(result.current.hasFlipData).toBe(true);
    });

    it('should not set hasFlipData when no price data', () => {
      const property = createMockProperty({ purchase_price: 0, arv: 0 });

      const { result } = renderHook(() => useDealAnalysis(property));

      expect(result.current.hasFlipData).toBe(false);
    });

    it('should set hasRentalData when monthly rent is provided', () => {
      const property = createMockProperty();
      const rentalAssumptions = { monthlyRent: 1500 };

      const { result } = renderHook(() =>
        useDealAnalysis(property, rentalAssumptions)
      );

      expect(result.current.hasRentalData).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero ARV gracefully', () => {
      const property = createMockProperty({ arv: 0 });

      const { result } = renderHook(() => useDealAnalysis(property));

      expect(result.current.mao).toBe(0);
      expect(result.current.grossProfit).toBeLessThan(0);
    });

    it('should handle missing property values', () => {
      const property = createMockProperty({
        purchase_price: undefined,
        repair_cost: undefined,
        arv: undefined,
      });

      const { result } = renderHook(() => useDealAnalysis(property));

      expect(result.current.purchasePrice).toBe(0);
      expect(result.current.repairCost).toBe(0);
      expect(result.current.arv).toBe(0);
      expect(result.current.mao).toBe(0);
    });

    it('should handle buyingCriteria with zero values', () => {
      const property = createMockProperty();

      const buyingCriteria: Partial<IBuyingCriteria> = {
        closingExpensesPct: 0,
        sellingCommissionPct: 0,
      };

      const { result } = renderHook(() =>
        useDealAnalysis(property, undefined, buyingCriteria)
      );

      expect(result.current.closingCosts).toBe(0);
    });
  });

  describe('DEFAULT_FLIP_CONSTANTS', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_FLIP_CONSTANTS.closingCostsPct).toBe(0.03);
      expect(DEFAULT_FLIP_CONSTANTS.holdingCostsPct).toBe(0.02);
      expect(DEFAULT_FLIP_CONSTANTS.sellingCostsPct).toBe(0.08);
      expect(DEFAULT_FLIP_CONSTANTS.maoRulePct).toBe(0.70);
    });
  });
});
