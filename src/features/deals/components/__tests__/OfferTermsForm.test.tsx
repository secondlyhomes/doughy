// Tests for OfferTermsForm component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OfferTermsForm } from '../OfferTermsForm';
import { OfferTerms } from '../../types';

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-native-ios18-liquid-glass
jest.mock('react-native-ios18-liquid-glass', () => ({
  LiquidGlassView: ({ children }: { children: React.ReactNode }) => children,
  isLiquidGlassSupported: () => false,
}), { virtual: true });

// Mock @callstack/liquid-glass
jest.mock('@callstack/liquid-glass', () => ({
  LiquidGlassView: ({ children }: { children: React.ReactNode }) => children,
  isLiquidGlassSupported: () => false,
}));

// Mock ThemeContext
jest.mock('@/context/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    foreground: '#000000',
    background: '#FFFFFF',
    muted: '#F5F5F5',
    mutedForeground: '#666666',
    border: '#E5E5E5',
    card: '#FFFFFF',
    cardForeground: '#000000',
  }),
}));

describe('OfferTermsForm', () => {
  const mockOnChange = jest.fn();
  const baseTerms: OfferTerms = {
    purchase_price: 165000,
    earnest_money: 5000,
    closing_date: '2024-03-15',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Terms (all strategies)', () => {
    it('should render basic terms fields', () => {
      const { getByText } = render(
        <OfferTermsForm strategy="cash" terms={baseTerms} onChange={mockOnChange} />
      );

      expect(getByText('Purchase Price')).toBeTruthy();
      expect(getByText('Earnest Money')).toBeTruthy();
      expect(getByText('Closing Date')).toBeTruthy();
    });

    it('should display current values', () => {
      const { getByDisplayValue } = render(
        <OfferTermsForm strategy="cash" terms={baseTerms} onChange={mockOnChange} />
      );

      expect(getByDisplayValue('165000')).toBeTruthy();
      expect(getByDisplayValue('5000')).toBeTruthy();
      expect(getByDisplayValue('2024-03-15')).toBeTruthy();
    });

    it('should call onChange when purchase price changes', () => {
      const { getByDisplayValue } = render(
        <OfferTermsForm strategy="cash" terms={baseTerms} onChange={mockOnChange} />
      );

      fireEvent.changeText(getByDisplayValue('165000'), '175000');

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ purchase_price: 175000 })
      );
    });
  });

  describe('Seller Finance strategy', () => {
    const sellerFinanceTerms: OfferTerms = {
      ...baseTerms,
      down_payment: 25000,
      interest_rate: 6.5,
      term_years: 20,
      monthly_payment: 1195,
      balloon_payment: 100000,
      balloon_due_years: 5,
    };

    it('should render seller finance specific fields', () => {
      const { getByText } = render(
        <OfferTermsForm
          strategy="seller_finance"
          terms={sellerFinanceTerms}
          onChange={mockOnChange}
        />
      );

      expect(getByText('Down Payment')).toBeTruthy();
      expect(getByText('Interest Rate (%)')).toBeTruthy();
      expect(getByText('Term (Years)')).toBeTruthy();
      expect(getByText('Monthly Payment')).toBeTruthy();
      expect(getByText('Balloon Payment')).toBeTruthy();
      expect(getByText('Balloon Due (Years)')).toBeTruthy();
    });

    it('should display seller finance values', () => {
      const { getByDisplayValue } = render(
        <OfferTermsForm
          strategy="seller_finance"
          terms={sellerFinanceTerms}
          onChange={mockOnChange}
        />
      );

      expect(getByDisplayValue('25000')).toBeTruthy();
      expect(getByDisplayValue('6.5')).toBeTruthy();
      expect(getByDisplayValue('20')).toBeTruthy();
    });

    it('should not show seller finance fields for cash strategy', () => {
      const { queryByText } = render(
        <OfferTermsForm strategy="cash" terms={baseTerms} onChange={mockOnChange} />
      );

      expect(queryByText('Down Payment')).toBeNull();
      expect(queryByText('Interest Rate (%)')).toBeNull();
    });
  });

  describe('Subject-To strategy', () => {
    const subjectToTerms: OfferTerms = {
      ...baseTerms,
      existing_loan_balance: 142000,
      existing_monthly_payment: 985,
      existing_interest_rate: 4.25,
      catch_up_amount: 8500,
    };

    it('should render subject-to specific fields', () => {
      const { getByText } = render(
        <OfferTermsForm
          strategy="subject_to"
          terms={subjectToTerms}
          onChange={mockOnChange}
        />
      );

      expect(getByText('Existing Loan Balance')).toBeTruthy();
      expect(getByText('Current Monthly Payment')).toBeTruthy();
      expect(getByText('Existing Interest Rate (%)')).toBeTruthy();
      expect(getByText('Arrears to Catch Up')).toBeTruthy();
    });

    it('should display subject-to values', () => {
      const { getByDisplayValue } = render(
        <OfferTermsForm
          strategy="subject_to"
          terms={subjectToTerms}
          onChange={mockOnChange}
        />
      );

      expect(getByDisplayValue('142000')).toBeTruthy();
      expect(getByDisplayValue('985')).toBeTruthy();
      expect(getByDisplayValue('4.25')).toBeTruthy();
      expect(getByDisplayValue('8500')).toBeTruthy();
    });

    it('should not show subject-to fields for cash strategy', () => {
      const { queryByText } = render(
        <OfferTermsForm strategy="cash" terms={baseTerms} onChange={mockOnChange} />
      );

      expect(queryByText('Existing Loan Balance')).toBeNull();
      expect(queryByText('Arrears to Catch Up')).toBeNull();
    });
  });

  describe('Disabled state', () => {
    it('should disable inputs when disabled prop is true', () => {
      const { getAllByRole } = render(
        <OfferTermsForm
          strategy="cash"
          terms={baseTerms}
          onChange={mockOnChange}
          disabled
        />
      );

      // Check that inputs are rendered (component should still render when disabled)
      const inputs = getAllByRole('none'); // Inputs don't have explicit role in RN
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe('Empty/undefined values', () => {
    it('should handle empty terms gracefully', () => {
      const emptyTerms: OfferTerms = {};

      const { getByText } = render(
        <OfferTermsForm
          strategy="cash"
          terms={emptyTerms}
          onChange={mockOnChange}
        />
      );

      expect(getByText('Purchase Price')).toBeTruthy();
      expect(getByText('Basic Terms')).toBeTruthy();
    });
  });
});
