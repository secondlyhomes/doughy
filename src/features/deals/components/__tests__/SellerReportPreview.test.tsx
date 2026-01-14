// Tests for SellerReportPreview component
import React from 'react';
import { render } from '@testing-library/react-native';
import { SellerReportPreview } from '../SellerReportPreview';
import {
  SellerReportOptions,
  WeHandleOptions,
  ReportAssumptions,
} from '../../types';

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
    DollarSign: createMockIcon('DollarSign'),
    FileText: createMockIcon('FileText'),
    Home: createMockIcon('Home'),
    Clock: createMockIcon('Clock'),
    TrendingUp: createMockIcon('TrendingUp'),
    CheckCircle2: createMockIcon('CheckCircle2'),
    Info: createMockIcon('Info'),
  };
});

// Mock ThemeContext
jest.mock('@/context/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    foreground: '#000000',
    background: '#FFFFFF',
    muted: '#F5F5F5',
    mutedForeground: '#666666',
    success: '#34C759',
    info: '#5856D6',
    border: '#E5E5E5',
  }),
}));

describe('SellerReportPreview', () => {
  const mockOptions: SellerReportOptions = {
    cash: {
      price_low: 140000,
      price_high: 160000,
      close_days_low: 14,
      close_days_high: 30,
    },
    seller_finance: {
      price_low: 170000,
      price_high: 190000,
      monthly_payment: 1200,
      term_years: 20,
      down_payment: 20000,
    },
    subject_to: {
      price_low: 165000,
      price_high: 175000,
      catch_up_amount: 5000,
    },
  };

  const mockWeHandle: WeHandleOptions = {
    cleanout: true,
    closing_costs: true,
    title_search: false,
    outstanding_liens: true,
    repairs: false,
  };

  const mockAssumptions: ReportAssumptions = {
    arv_estimate: 200000,
    arv_source: 'Zillow',
    repair_estimate: 25000,
    repair_source: 'Contractor estimate',
    comps_count: 5,
  };

  it('should render property address', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St, Anytown, USA"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('123 Main St, Anytown, USA')).toBeTruthy();
  });

  it('should render seller name', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="Jane Smith"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('Prepared for Jane Smith')).toBeTruthy();
  });

  it('should render cash option when provided', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('Cash Offer')).toBeTruthy();
  });

  it('should render seller finance option when provided', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('Seller Finance')).toBeTruthy();
  });

  it('should render subject-to option when provided', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('Subject-To')).toBeTruthy();
  });

  it('should render "What We Handle" section', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('What We Handle')).toBeTruthy();
  });

  it('should display active "we handle" items', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    // These should be shown (based on mockWeHandle)
    expect(getByText('Property Cleanout')).toBeTruthy();
    expect(getByText('Closing Costs')).toBeTruthy();
    expect(getByText('Outstanding Liens')).toBeTruthy();
  });

  it('should render report assumptions section', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('Report Assumptions')).toBeTruthy();
  });

  it('should handle empty options gracefully', () => {
    const emptyOptions: SellerReportOptions = {};

    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={emptyOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    // Should still render header
    expect(getByText('123 Main St')).toBeTruthy();
  });

  it('should handle all "we handle" items disabled', () => {
    const allDisabled: WeHandleOptions = {
      cleanout: false,
      closing_costs: false,
      title_search: false,
      outstanding_liens: false,
      repairs: false,
    };

    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={allDisabled}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('What We Handle')).toBeTruthy();
  });

  it('should render report header', () => {
    const { getByText } = render(
      <SellerReportPreview
        propertyAddress="123 Main St"
        sellerName="John Doe"
        options={mockOptions}
        weHandle={mockWeHandle}
        assumptions={mockAssumptions}
      />
    );

    expect(getByText('Property Options Report')).toBeTruthy();
  });
});
