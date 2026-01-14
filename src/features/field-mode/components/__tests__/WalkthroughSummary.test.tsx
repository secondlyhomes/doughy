// Tests for WalkthroughSummary component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WalkthroughSummary, WalkthroughSummaryPlaceholder } from '../WalkthroughSummary';
import { mockAISummary } from '../../data/mockWalkthrough';

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
    AlertTriangle: createMockIcon('AlertTriangle'),
    HelpCircle: createMockIcon('HelpCircle'),
    ClipboardList: createMockIcon('ClipboardList'),
    ChevronDown: createMockIcon('ChevronDown'),
    ChevronUp: createMockIcon('ChevronUp'),
    Sparkles: createMockIcon('Sparkles'),
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
    warning: '#FF9500',
    info: '#5856D6',
    success: '#34C759',
    border: '#E5E5E5',
  }),
}));

describe('WalkthroughSummary', () => {
  it('should render AI summary header', () => {
    const { getByText } = render(<WalkthroughSummary summary={mockAISummary} />);

    expect(getByText('AI Summary')).toBeTruthy();
  });

  it('should render issues section with count', () => {
    const { getByText, getAllByText } = render(<WalkthroughSummary summary={mockAISummary} />);

    expect(getByText('Issues Found')).toBeTruthy();
    // Use getAllByText since count may appear in multiple sections
    expect(getAllByText(mockAISummary.issues.length.toString()).length).toBeGreaterThan(0);
  });

  it('should render questions section with count', () => {
    const { getByText, getAllByText } = render(<WalkthroughSummary summary={mockAISummary} />);

    expect(getByText('Questions to Verify')).toBeTruthy();
    expect(getAllByText(mockAISummary.questions.length.toString()).length).toBeGreaterThan(0);
  });

  it('should render scope of work section with count', () => {
    const { getByText } = render(<WalkthroughSummary summary={mockAISummary} />);

    expect(getByText('Scope of Work')).toBeTruthy();
    expect(getByText(mockAISummary.scope_bullets.length.toString())).toBeTruthy();
  });

  it('should display all issues', () => {
    const { getByText } = render(<WalkthroughSummary summary={mockAISummary} />);

    mockAISummary.issues.forEach((issue) => {
      expect(getByText(issue)).toBeTruthy();
    });
  });

  it('should display all questions', () => {
    const { getByText } = render(<WalkthroughSummary summary={mockAISummary} />);

    mockAISummary.questions.forEach((question) => {
      expect(getByText(question)).toBeTruthy();
    });
  });

  it('should display all scope bullets', () => {
    const { getByText } = render(<WalkthroughSummary summary={mockAISummary} />);

    mockAISummary.scope_bullets.forEach((bullet) => {
      expect(getByText(bullet)).toBeTruthy();
    });
  });

  it('should have accessible section headers', () => {
    const { getByLabelText } = render(<WalkthroughSummary summary={mockAISummary} />);

    expect(getByLabelText(`Issues section, ${mockAISummary.issues.length} items`)).toBeTruthy();
    expect(getByLabelText(`Questions section, ${mockAISummary.questions.length} items`)).toBeTruthy();
    expect(getByLabelText(`Scope of work section, ${mockAISummary.scope_bullets.length} items`)).toBeTruthy();
  });

  it('should handle empty summary arrays', () => {
    const emptySummary = {
      issues: [],
      questions: [],
      scope_bullets: [],
    };

    const { getByText, getAllByText } = render(<WalkthroughSummary summary={emptySummary} />);

    // All sections should show 0 count
    expect(getAllByText('0').length).toBe(3);
    expect(getByText('AI Summary')).toBeTruthy();
  });
});

describe('WalkthroughSummaryPlaceholder', () => {
  it('should render placeholder content', () => {
    const { getByText } = render(<WalkthroughSummaryPlaceholder />);

    expect(getByText('Ready to Organize')).toBeTruthy();
  });

  it('should display instruction text', () => {
    const { getByText } = render(<WalkthroughSummaryPlaceholder />);

    expect(
      getByText(/Add photos and voice memos, then tap "AI Organize"/)
    ).toBeTruthy();
  });
});
