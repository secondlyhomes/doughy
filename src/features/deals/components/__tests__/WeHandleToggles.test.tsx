// Tests for WeHandleToggles component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WeHandleToggles } from '../WeHandleToggles';
import { WeHandleOptions } from '../../types';
import { WE_HANDLE_CONFIG } from '../../data/mockSellerReport';

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

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const createMockIcon = (name: string) => {
    const MockIcon = (props: object) => React.createElement(View, { testID: `icon-${name}`, ...props });
    return MockIcon;
  };
  return {
    Check: createMockIcon('Check'),
    Square: createMockIcon('Square'),
    Package: createMockIcon('Package'),
    DollarSign: createMockIcon('DollarSign'),
    Search: createMockIcon('Search'),
    Link2: createMockIcon('Link2'),
    Wrench: createMockIcon('Wrench'),
  };
});

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    primaryForeground: '#FFFFFF',
    foreground: '#000000',
    muted: '#F5F5F5',
    mutedForeground: '#666666',
    border: '#E5E5E5',
    card: '#FFFFFF',
    cardForeground: '#000000',
    success: '#34C759',
    successForeground: '#FFFFFF',
  }),
}));

describe('WeHandleToggles', () => {
  const mockOnChange = jest.fn();
  const defaultOptions: WeHandleOptions = {
    cleanout: true,
    closing_costs: true,
    title_search: true,
    outstanding_liens: false,
    repairs: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all toggle options', () => {
    const { getByText } = render(
      <WeHandleToggles value={defaultOptions} onChange={mockOnChange} />
    );

    Object.values(WE_HANDLE_CONFIG).forEach((config) => {
      expect(getByText(config.label)).toBeTruthy();
    });
  });

  it('should render option descriptions', () => {
    const { getByText } = render(
      <WeHandleToggles value={defaultOptions} onChange={mockOnChange} />
    );

    Object.values(WE_HANDLE_CONFIG).forEach((config) => {
      expect(getByText(config.description)).toBeTruthy();
    });
  });

  it('should render header and subtitle', () => {
    const { getByText } = render(
      <WeHandleToggles value={defaultOptions} onChange={mockOnChange} />
    );

    expect(getByText('What We Handle')).toBeTruthy();
    expect(getByText("Select what you'll cover as the buyer")).toBeTruthy();
  });

  it('should call onChange when option is toggled', () => {
    const { getByLabelText } = render(
      <WeHandleToggles value={defaultOptions} onChange={mockOnChange} />
    );

    // Toggle an unchecked option (repairs)
    fireEvent.press(getByLabelText('Minor Repairs, unchecked'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultOptions,
      repairs: true,
    });
  });

  it('should toggle checked option to unchecked', () => {
    const { getByLabelText } = render(
      <WeHandleToggles value={defaultOptions} onChange={mockOnChange} />
    );

    // Toggle a checked option (cleanout)
    fireEvent.press(getByLabelText('Property Cleanout, checked'));

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultOptions,
      cleanout: false,
    });
  });

  it('should not call onChange when disabled', () => {
    const { getByLabelText } = render(
      <WeHandleToggles value={defaultOptions} onChange={mockOnChange} disabled />
    );

    fireEvent.press(getByLabelText('Minor Repairs, unchecked'));

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should have proper accessibility labels', () => {
    const { getByLabelText } = render(
      <WeHandleToggles value={defaultOptions} onChange={mockOnChange} />
    );

    // Checked options
    expect(getByLabelText('Property Cleanout, checked')).toBeTruthy();
    expect(getByLabelText('Closing Costs, checked')).toBeTruthy();
    expect(getByLabelText('Title Search, checked')).toBeTruthy();

    // Unchecked options
    expect(getByLabelText('Outstanding Liens, unchecked')).toBeTruthy();
    expect(getByLabelText('Minor Repairs, unchecked')).toBeTruthy();
  });

  it('should render with all options checked', () => {
    const allChecked: WeHandleOptions = {
      cleanout: true,
      closing_costs: true,
      title_search: true,
      outstanding_liens: true,
      repairs: true,
    };

    const { getByLabelText } = render(
      <WeHandleToggles value={allChecked} onChange={mockOnChange} />
    );

    expect(getByLabelText('Property Cleanout, checked')).toBeTruthy();
    expect(getByLabelText('Outstanding Liens, checked')).toBeTruthy();
    expect(getByLabelText('Minor Repairs, checked')).toBeTruthy();
  });

  it('should render with all options unchecked', () => {
    const allUnchecked: WeHandleOptions = {
      cleanout: false,
      closing_costs: false,
      title_search: false,
      outstanding_liens: false,
      repairs: false,
    };

    const { getByLabelText } = render(
      <WeHandleToggles value={allUnchecked} onChange={mockOnChange} />
    );

    expect(getByLabelText('Property Cleanout, unchecked')).toBeTruthy();
    expect(getByLabelText('Closing Costs, unchecked')).toBeTruthy();
  });
});
