// Tests for StrategySelector component
import React from 'react';
import { View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { StrategySelector } from '../StrategySelector';
import { DEAL_STRATEGY_CONFIG } from '../../types';

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
  };
});

// Mock ThemeContext
jest.mock('@/context/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    primaryForeground: '#FFFFFF',
    foreground: '#000000',
    muted: '#F5F5F5',
    mutedForeground: '#666666',
  }),
}));

describe('StrategySelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all strategy options', () => {
    const { getByText } = render(
      <StrategySelector value="cash" onChange={mockOnChange} />
    );

    expect(getByText('Cash Offer')).toBeTruthy();
    expect(getByText('Seller Finance')).toBeTruthy();
    expect(getByText('Subject-To')).toBeTruthy();
  });

  it('should highlight selected strategy', () => {
    const { getByLabelText } = render(
      <StrategySelector value="seller_finance" onChange={mockOnChange} />
    );

    const selectedButton = getByLabelText('Seller Finance, selected');
    expect(selectedButton).toBeTruthy();
  });

  it('should call onChange when strategy is selected', () => {
    const { getByText } = render(
      <StrategySelector value="cash" onChange={mockOnChange} />
    );

    fireEvent.press(getByText('Subject-To'));

    expect(mockOnChange).toHaveBeenCalledWith('subject_to');
  });

  it('should not call onChange when disabled', () => {
    const { getByText } = render(
      <StrategySelector value="cash" onChange={mockOnChange} disabled />
    );

    fireEvent.press(getByText('Seller Finance'));

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should have accessible buttons', () => {
    const { getByLabelText } = render(
      <StrategySelector value="cash" onChange={mockOnChange} />
    );

    expect(getByLabelText('Cash Offer, selected')).toBeTruthy();
    expect(getByLabelText('Seller Finance')).toBeTruthy();
    expect(getByLabelText('Subject-To')).toBeTruthy();
  });

  it('should render with cash strategy selected', () => {
    const { getByLabelText } = render(
      <StrategySelector value="cash" onChange={mockOnChange} />
    );
    expect(getByLabelText('Cash Offer, selected')).toBeTruthy();
  });

  it('should render with seller_finance strategy selected', () => {
    const { getByLabelText } = render(
      <StrategySelector value="seller_finance" onChange={mockOnChange} />
    );
    expect(getByLabelText('Seller Finance, selected')).toBeTruthy();
  });

  it('should render with subject_to strategy selected', () => {
    const { getByLabelText } = render(
      <StrategySelector value="subject_to" onChange={mockOnChange} />
    );
    expect(getByLabelText('Subject-To, selected')).toBeTruthy();
  });
});
