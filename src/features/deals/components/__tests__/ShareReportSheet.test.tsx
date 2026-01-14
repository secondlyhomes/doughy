// Tests for ShareReportSheet component
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ShareReportSheet } from '../ShareReportSheet';
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
    Link2: createMockIcon('Link2'),
    MessageSquare: createMockIcon('MessageSquare'),
    Mail: createMockIcon('Mail'),
    Download: createMockIcon('Download'),
    Copy: createMockIcon('Copy'),
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

// Mock BottomSheet
jest.mock('@/components/ui/BottomSheet', () => ({
  BottomSheet: ({ children, visible, title }: { children: React.ReactNode; visible: boolean; title: string }) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    if (!visible) return null;
    return React.createElement(View, { testID: 'bottom-sheet' }, [
      React.createElement(Text, { key: 'title' }, title),
      children
    ]);
  },
  BottomSheetSection: ({ children, title }: { children: React.ReactNode; title?: string }) => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(View, { testID: 'bottom-sheet-section' }, [
      title && React.createElement(Text, { key: 'section-title' }, title),
      children
    ]);
  },
}));

describe('ShareReportSheet', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    const { getByText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    expect(getByText('Share Report')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <ShareReportSheet
        visible={false}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
      />
    );

    expect(queryByText('Share Report')).toBeNull();
  });

  it('should display share link when token is provided', () => {
    const { getByText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    expect(getByText('https://app.dealos.com/report/abc123')).toBeTruthy();
  });

  it('should display placeholder when no token', () => {
    const { getByText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
      />
    );

    expect(getByText('Link will be generated after saving')).toBeTruthy();
  });

  it('should copy share link to clipboard', async () => {
    const { getByLabelText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    const copyLinkButton = getByLabelText('Copy Share Link');
    fireEvent.press(copyLinkButton);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledWith('https://app.dealos.com/report/abc123');
      expect(Alert.alert).toHaveBeenCalledWith('Copied', 'Share link copied to clipboard');
    });
  });

  it('should copy SMS message to clipboard', async () => {
    const { getByLabelText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    const copySMSButton = getByLabelText('Copy SMS Message');
    fireEvent.press(copySMSButton);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Copied', 'SMS message copied to clipboard');
    });
  });

  it('should copy email to clipboard', async () => {
    const { getByLabelText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    const copyEmailButton = getByLabelText('Copy Email');
    fireEvent.press(copyEmailButton);

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith('Copied', 'Email copied to clipboard');
    });
  });

  it('should show PDF coming soon alert', () => {
    const { getByLabelText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    const downloadButton = getByLabelText('Download PDF');
    fireEvent.press(downloadButton);

    expect(Alert.alert).toHaveBeenCalledWith('Coming Soon', 'PDF download will be available after Supabase integration');
  });

  it('should disable copy link button when no token', () => {
    const { getByLabelText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
      />
    );

    const copyLinkButton = getByLabelText('Copy Share Link');
    expect(copyLinkButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('should render share options section', () => {
    const { getByText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    expect(getByText('Share Options')).toBeTruthy();
  });

  it('should render share link preview section', () => {
    const { getByText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    expect(getByText('Share Link Preview')).toBeTruthy();
  });

  it('should have accessible share option buttons', () => {
    const { getByLabelText } = render(
      <ShareReportSheet
        visible={true}
        onClose={mockOnClose}
        sellerName="John Doe"
        propertyAddress="123 Main St"
        shareToken="abc123"
      />
    );

    expect(getByLabelText('Copy Share Link')).toBeTruthy();
    expect(getByLabelText('Copy SMS Message')).toBeTruthy();
    expect(getByLabelText('Copy Email')).toBeTruthy();
    expect(getByLabelText('Download PDF')).toBeTruthy();
  });
});
