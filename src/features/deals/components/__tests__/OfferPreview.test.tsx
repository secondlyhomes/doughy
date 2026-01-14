// Tests for OfferPreview component
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { OfferPreview } from '../OfferPreview';
import { DealStrategy, OfferTerms } from '../../types';
import * as Clipboard from 'expo-clipboard';

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock expo-blur
jest.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-native-ios18-liquid-glass
jest.mock('react-native-ios18-liquid-glass', () => ({
  LiquidGlassView: ({ children }: { children: React.ReactNode }) => children,
  isLiquidGlassSupported: () => false,
}), { virtual: true });

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: object) => React.createElement(View, { testID: `icon-${name}`, ...props });
    return MockIcon;
  };
  return {
    Copy: createMockIcon('Copy'),
    Mail: createMockIcon('Mail'),
    Phone: createMockIcon('Phone'),
    FileText: createMockIcon('FileText'),
  };
});

// Mock ThemeContext
jest.mock('@/context/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    primaryForeground: '#FFFFFF',
    foreground: '#000000',
    background: '#FFFFFF',
    muted: '#F5F5F5',
    mutedForeground: '#666666',
    border: '#E5E5E5',
  }),
}));

describe('OfferPreview', () => {
  const mockCashTerms: OfferTerms = {
    purchase_price: 150000,
    earnest_money: 5000,
    closing_date: '2024-03-15',
    contingencies: ['Inspection', 'Clear title'],
    proof_of_funds: true,
  };

  const mockSellerFinanceTerms: OfferTerms = {
    purchase_price: 180000,
    earnest_money: 10000,
    closing_date: '2024-03-30',
    down_payment: 25000,
    interest_rate: 6.5,
    term_years: 20,
    monthly_payment: 1195,
    balloon_payment: 100000,
    balloon_due_years: 5,
  };

  const mockSubjectToTerms: OfferTerms = {
    purchase_price: 175000,
    earnest_money: 3000,
    closing_date: '2024-03-20',
    existing_loan_balance: 142000,
    existing_monthly_payment: 985,
    existing_interest_rate: 4.25,
    catch_up_amount: 8500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render call script section', () => {
    const { getByText } = render(
      <OfferPreview
        strategy="cash"
        terms={mockCashTerms}
        sellerName="John Doe"
        yourName="Jane Investor"
        yourPhone="(555) 123-4567"
      />
    );

    expect(getByText('Call Script')).toBeTruthy();
  });

  it('should render email section', () => {
    const { getByText } = render(
      <OfferPreview
        strategy="cash"
        terms={mockCashTerms}
        sellerName="John Doe"
        yourName="Jane Investor"
        yourPhone="(555) 123-4567"
      />
    );

    expect(getByText('Follow-up Email')).toBeTruthy();
  });

  it('should render PDF placeholder', () => {
    const { getByText } = render(
      <OfferPreview
        strategy="cash"
        terms={mockCashTerms}
      />
    );

    expect(getByText('PDF Generation')).toBeTruthy();
    expect(getByText(/Professional PDF offer letters will be available/)).toBeTruthy();
  });

  it('should copy call script to clipboard', async () => {
    const { getByLabelText } = render(
      <OfferPreview
        strategy="cash"
        terms={mockCashTerms}
        sellerName="John Doe"
      />
    );

    const copyButton = getByLabelText('Copy call script');
    fireEvent.press(copyButton);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Copied', 'Call script copied to clipboard');
    });
  });

  it('should copy email to clipboard', async () => {
    const { getByLabelText } = render(
      <OfferPreview
        strategy="cash"
        terms={mockCashTerms}
        sellerName="John Doe"
      />
    );

    const copyButton = getByLabelText('Copy email');
    fireEvent.press(copyButton);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Copied', 'Email copied to clipboard');
    });
  });

  it('should render with cash strategy', () => {
    const { getByText } = render(
      <OfferPreview
        strategy="cash"
        terms={mockCashTerms}
      />
    );

    expect(getByText('Call Script')).toBeTruthy();
  });

  it('should render with seller finance strategy', () => {
    const { getByText } = render(
      <OfferPreview
        strategy="seller_finance"
        terms={mockSellerFinanceTerms}
      />
    );

    expect(getByText('Call Script')).toBeTruthy();
  });

  it('should render with subject-to strategy', () => {
    const { getByText } = render(
      <OfferPreview
        strategy="subject_to"
        terms={mockSubjectToTerms}
      />
    );

    expect(getByText('Call Script')).toBeTruthy();
  });

  it('should use default placeholder values when props not provided', () => {
    const { getByText } = render(
      <OfferPreview
        strategy="cash"
        terms={mockCashTerms}
      />
    );

    // Should render without errors even without seller name, etc.
    expect(getByText('Call Script')).toBeTruthy();
    expect(getByText('Follow-up Email')).toBeTruthy();
  });

  it('should have accessible copy buttons', () => {
    const { getByLabelText } = render(
      <OfferPreview
        strategy="cash"
        terms={mockCashTerms}
      />
    );

    expect(getByLabelText('Copy call script')).toBeTruthy();
    expect(getByLabelText('Copy email')).toBeTruthy();
  });
});
