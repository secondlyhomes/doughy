// src/features/rental-inbox/__tests__/components/AIReviewCard.test.tsx
// Comprehensive tests for the AI Review Card component

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AIReviewCard, calculateEditSeverity } from '../../components/AIReviewCard';
import type { AIResponseQueueItem, ApprovalMetadata } from '@/stores/rental-conversations-store';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Mock @/lib/haptics
jest.mock('@/lib/haptics', () => ({
  successHaptic: jest.fn(),
  errorHaptic: jest.fn(),
  warningHaptic: jest.fn(),
  lightHaptic: jest.fn(),
  mediumHaptic: jest.fn(),
  heavyHaptic: jest.fn(),
}));

// Mock ThemeContext
jest.mock('@/context/ThemeContext', () => ({
  useThemeColors: () => ({
    card: '#ffffff',
    info: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    destructive: '#ef4444',
    foreground: '#171717',
    mutedForeground: '#737373',
    primary: '#2563eb',
    primaryForeground: '#ffffff',
  }),
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Bot: (props: any) => React.createElement(View, { testID: 'icon-bot', ...props }),
    Check: (props: any) => React.createElement(View, { testID: 'icon-check', ...props }),
    X: (props: any) => React.createElement(View, { testID: 'icon-x', ...props }),
    Pencil: (props: any) => React.createElement(View, { testID: 'icon-pencil', ...props }),
    Sparkles: (props: any) => React.createElement(View, { testID: 'icon-sparkles', ...props }),
  };
});

// Mock Button component
jest.mock('@/components/ui/Button', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    Button: ({ children, onPress, disabled, variant, loading }: any) => {
      // Extract text content from children
      const getTextContent = (childElements: any): string => {
        if (!childElements) return '';
        if (typeof childElements === 'string') return childElements;
        if (Array.isArray(childElements)) {
          return childElements.map(getTextContent).join('');
        }
        if (childElements.props?.children) {
          return getTextContent(childElements.props.children);
        }
        return '';
      };
      const textContent = getTextContent(children);
      return React.createElement(
        TouchableOpacity,
        {
          onPress: disabled ? undefined : onPress,
          disabled,
          accessibilityRole: 'button',
          accessibilityState: { disabled: !!disabled, busy: !!loading },
          testID: `button-${textContent.toLowerCase().replace(/\s+/g, '-') || variant || 'default'}`,
        },
        React.createElement(Text, null, textContent)
      );
    },
  };
});

describe('AIReviewCard', () => {
  // ============================================
  // Mock Data
  // ============================================

  const createMockResponse = (overrides?: Partial<AIResponseQueueItem>): AIResponseQueueItem => ({
    id: 'queue-1',
    user_id: 'user-1',
    conversation_id: 'conv-1',
    trigger_message_id: 'msg-1',
    sent_message_id: null,
    suggested_response: 'Thank you for your interest! The property is available for your dates.',
    confidence: 0.85,
    reasoning: 'FAQ response - availability inquiry',
    intent: 'inquiry',
    detected_topics: ['availability'],
    alternatives: [],
    status: 'pending',
    final_response: null,
    reviewed_at: null,
    reviewed_by: null,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    message_type: 'inquiry',
    topic: 'availability',
    contact_type: 'lead',
    ...overrides,
  });

  const defaultProps = {
    pendingResponse: createMockResponse(),
    onApprove: jest.fn(),
    onReject: jest.fn(),
    isProcessing: false,
  };

  let dateNowSpy: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now() to control time for response time tests
    currentTime = 1000000;
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  // Helper to advance time
  const advanceTime = (ms: number) => {
    currentTime += ms;
  };

  // ============================================
  // calculateEditSeverity Function Tests
  // ============================================

  describe('calculateEditSeverity', () => {
    it('returns "none" when no edit is provided', () => {
      expect(calculateEditSeverity('original', '')).toBe('none');
    });

    it('returns "none" when edit matches original', () => {
      expect(calculateEditSeverity('Hello world', 'Hello world')).toBe('none');
    });

    it('returns "none" for case/whitespace normalization only', () => {
      expect(calculateEditSeverity('Hello World', 'hello world')).toBe('none');
      expect(calculateEditSeverity(' Hello World ', 'Hello World')).toBe('none');
    });

    it('returns "minor" for small changes', () => {
      const original = 'Thank you for your inquiry about the property.';
      const edited = 'Thank you for your interest in the property.';
      expect(calculateEditSeverity(original, edited)).toBe('minor');
    });

    it('returns "minor" for typo fixes', () => {
      const original = 'The propery is available.';
      const edited = 'The property is available.';
      expect(calculateEditSeverity(original, edited)).toBe('minor');
    });

    it('returns "major" for significant content changes', () => {
      const original = 'Thank you for your interest!';
      const edited = 'I apologize, but we are fully booked for those dates. Would you like me to suggest alternative dates?';
      expect(calculateEditSeverity(original, edited)).toBe('major');
    });

    it('returns "major" for complete rewrites', () => {
      const original = 'Yes, the property is available.';
      const edited = 'Unfortunately, we have a maintenance issue and cannot accept bookings at this time.';
      expect(calculateEditSeverity(original, edited)).toBe('major');
    });

    it('returns "major" for very different length responses', () => {
      const original = 'Yes';
      const edited = 'Yes, the property is available for your requested dates. I would be happy to provide more details about the amenities and check-in process.';
      expect(calculateEditSeverity(original, edited)).toBe('major');
    });
  });

  // ============================================
  // Rendering Tests
  // ============================================

  describe('Rendering', () => {
    it('renders suggested response text', () => {
      const { getByText } = render(<AIReviewCard {...defaultProps} />);

      expect(getByText('Thank you for your interest! The property is available for your dates.')).toBeTruthy();
    });

    it('renders AI Suggested Response header', () => {
      const { getByText } = render(<AIReviewCard {...defaultProps} />);

      expect(getByText('AI Suggested Response')).toBeTruthy();
    });

    it('renders confidence percentage', () => {
      const { getByText } = render(<AIReviewCard {...defaultProps} />);

      expect(getByText('85%')).toBeTruthy();
    });

    it('renders reason when provided', () => {
      const { getByText } = render(<AIReviewCard {...defaultProps} />);

      expect(getByText(/FAQ response - availability inquiry/)).toBeTruthy();
    });

    it('renders action buttons (Approve, Edit, Reject)', () => {
      const { getByText } = render(<AIReviewCard {...defaultProps} />);

      expect(getByText('Approve')).toBeTruthy();
      expect(getByText('Edit')).toBeTruthy();
      expect(getByText('Reject')).toBeTruthy();
    });
  });

  // ============================================
  // Confidence Badge Tests
  // ============================================

  describe('Confidence Badge', () => {
    it('shows "High confidence" for confidence >= 0.8', () => {
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ confidence: 0.85 }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      // Text is combined with reason, so use regex to find partial match
      expect(getByText(/High confidence/)).toBeTruthy();
    });

    it('shows "Medium confidence" for confidence 0.5-0.79', () => {
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ confidence: 0.65 }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      expect(getByText(/Medium confidence/)).toBeTruthy();
    });

    it('shows "Low confidence" for confidence < 0.5', () => {
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ confidence: 0.35 }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      expect(getByText(/Low confidence/)).toBeTruthy();
    });

    it('displays confidence as percentage', () => {
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ confidence: 0.92 }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      expect(getByText('92%')).toBeTruthy();
    });

    it('rounds confidence percentage correctly', () => {
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ confidence: 0.876 }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      expect(getByText('88%')).toBeTruthy();
    });
  });

  // ============================================
  // Approve Action Tests
  // ============================================

  describe('Approve Action', () => {
    it('calls onApprove with correct metadata when approved', () => {
      const onApprove = jest.fn();
      const { getByText } = render(
        <AIReviewCard {...defaultProps} onApprove={onApprove} />
      );

      // Advance time to simulate user reading
      advanceTime(5000); // 5 seconds

      fireEvent.press(getByText('Approve'));

      expect(onApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          editedResponse: undefined,
          editSeverity: 'none',
          responseTimeSeconds: expect.any(Number),
        })
      );
    });

    it('tracks response time from display to action', () => {
      const onApprove = jest.fn();
      const { getByText } = render(
        <AIReviewCard {...defaultProps} onApprove={onApprove} />
      );

      // Simulate 10 seconds of review time
      advanceTime(10000);

      fireEvent.press(getByText('Approve'));

      const callArg = onApprove.mock.calls[0][0] as ApprovalMetadata;
      expect(callArg.responseTimeSeconds).toBe(10);
    });

    it('disables approve button when isProcessing is true', () => {
      const onApprove = jest.fn();
      const { getByText } = render(
        <AIReviewCard {...defaultProps} isProcessing={true} onApprove={onApprove} />
      );

      fireEvent.press(getByText('Approve'));

      // Since button is disabled, onApprove should not be called
      expect(onApprove).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Reject Action Tests
  // ============================================

  describe('Reject Action', () => {
    it('calls onReject with response time', () => {
      const onReject = jest.fn();
      const { getByText } = render(
        <AIReviewCard {...defaultProps} onReject={onReject} />
      );

      advanceTime(8000); // 8 seconds

      fireEvent.press(getByText('Reject'));

      expect(onReject).toHaveBeenCalledWith(8);
    });
  });

  // ============================================
  // Edit Mode Tests
  // ============================================

  describe('Edit Mode', () => {
    it('enters edit mode when Edit button is pressed', () => {
      const { getByText, getByDisplayValue } = render(
        <AIReviewCard {...defaultProps} />
      );

      fireEvent.press(getByText('Edit'));

      // Should show TextInput with current response
      expect(getByDisplayValue('Thank you for your interest! The property is available for your dates.')).toBeTruthy();
    });

    it('shows Cancel and Send Edited buttons in edit mode', () => {
      const { getByText } = render(<AIReviewCard {...defaultProps} />);

      fireEvent.press(getByText('Edit'));

      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Send Edited')).toBeTruthy();
    });

    it('hides Approve, Edit, Reject buttons in edit mode', () => {
      const { getByText, queryByText } = render(<AIReviewCard {...defaultProps} />);

      fireEvent.press(getByText('Edit'));

      expect(queryByText('Approve')).toBeNull();
      expect(queryByText('Reject')).toBeNull();
    });

    it('cancels edit and reverts to original text', () => {
      const { getByText, getByDisplayValue, queryByDisplayValue } = render(
        <AIReviewCard {...defaultProps} />
      );

      fireEvent.press(getByText('Edit'));

      // Change the text
      const input = getByDisplayValue('Thank you for your interest! The property is available for your dates.');
      fireEvent.changeText(input, 'Modified response');

      // Cancel
      fireEvent.press(getByText('Cancel'));

      // Should exit edit mode and show original text
      expect(getByText('Thank you for your interest! The property is available for your dates.')).toBeTruthy();
      expect(queryByDisplayValue('Modified response')).toBeNull();
    });

    it('sends edited response with correct metadata', () => {
      const onApprove = jest.fn();
      const { getByText, getByDisplayValue } = render(
        <AIReviewCard {...defaultProps} onApprove={onApprove} />
      );

      fireEvent.press(getByText('Edit'));

      // Change the text to something significantly different
      const input = getByDisplayValue('Thank you for your interest! The property is available for your dates.');
      fireEvent.changeText(input, 'Sorry, we are fully booked for those dates.');

      advanceTime(15000); // 15 seconds

      fireEvent.press(getByText('Send Edited'));

      expect(onApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          editedResponse: 'Sorry, we are fully booked for those dates.',
          editSeverity: 'major', // Significant change
          responseTimeSeconds: 15,
        })
      );
    });

    it('calculates minor edit severity for small changes', () => {
      const onApprove = jest.fn();
      const { getByText, getByDisplayValue } = render(
        <AIReviewCard {...defaultProps} onApprove={onApprove} />
      );

      fireEvent.press(getByText('Edit'));

      // Make a small change
      const input = getByDisplayValue('Thank you for your interest! The property is available for your dates.');
      fireEvent.changeText(input, 'Thank you for your inquiry! The property is available for your dates.');

      fireEvent.press(getByText('Send Edited'));

      const callArg = onApprove.mock.calls[0][0] as ApprovalMetadata;
      expect(callArg.editSeverity).toBe('minor');
    });

    it('sends without edit if text unchanged', () => {
      const onApprove = jest.fn();
      const { getByText } = render(
        <AIReviewCard {...defaultProps} onApprove={onApprove} />
      );

      fireEvent.press(getByText('Edit'));
      // Don't change the text
      fireEvent.press(getByText('Send Edited'));

      expect(onApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          editedResponse: undefined, // No edit since text is the same
          editSeverity: 'none',
        })
      );
    });
  });

  // ============================================
  // Response Change Tests
  // ============================================

  describe('Response Change', () => {
    it('resets display time when pendingResponse changes', () => {
      const onApprove = jest.fn();
      const { rerender, getByText } = render(
        <AIReviewCard {...defaultProps} onApprove={onApprove} />
      );

      // Wait 10 seconds
      advanceTime(10000);

      // Change to a new response
      rerender(
        <AIReviewCard
          {...defaultProps}
          pendingResponse={createMockResponse({ id: 'queue-2' })}
          onApprove={onApprove}
        />
      );

      // Wait only 2 more seconds
      advanceTime(2000);

      fireEvent.press(getByText('Approve'));

      // Response time should be ~2 seconds, not 12
      const callArg = onApprove.mock.calls[0][0] as ApprovalMetadata;
      expect(callArg.responseTimeSeconds).toBe(2);
    });

    it('resets edit text when pendingResponse changes', () => {
      const { rerender, getByText, getByDisplayValue } = render(
        <AIReviewCard {...defaultProps} />
      );

      fireEvent.press(getByText('Edit'));
      const input = getByDisplayValue('Thank you for your interest! The property is available for your dates.');
      fireEvent.changeText(input, 'Modified text');

      // Change to a new response
      const newResponse = createMockResponse({
        id: 'queue-2',
        suggested_response: 'This is a different response',
      });

      rerender(
        <AIReviewCard
          {...defaultProps}
          pendingResponse={newResponse}
        />
      );

      // Should show new response text (and exit edit mode)
      expect(getByText('This is a different response')).toBeTruthy();
    });
  });

  // ============================================
  // Edge Cases
  // ============================================

  describe('Edge Cases', () => {
    it('handles empty reason gracefully', () => {
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ reason: null }),
      };
      const { queryByText } = render(<AIReviewCard {...props} />);

      // Should not show reason text
      expect(queryByText(/FAQ response/)).toBeNull();
    });

    it('handles zero confidence', () => {
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ confidence: 0 }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      expect(getByText(/0%/)).toBeTruthy();
      expect(getByText(/Low confidence/)).toBeTruthy();
    });

    it('handles confidence of 1 (100%)', () => {
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ confidence: 1 }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      expect(getByText(/100%/)).toBeTruthy();
      expect(getByText(/High confidence/)).toBeTruthy();
    });

    it('handles very long response text', () => {
      const longText = 'This is a very long response. '.repeat(50);
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ suggested_response: longText }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      expect(getByText(longText)).toBeTruthy();
    });

    it('handles special characters in response', () => {
      const specialText = 'Price: $500/night. Check-in: 3PM. WiFi: "FastNet_5G" (password: p@ss!123)';
      const props = {
        ...defaultProps,
        pendingResponse: createMockResponse({ suggested_response: specialText }),
      };
      const { getByText } = render(<AIReviewCard {...props} />);

      expect(getByText(specialText)).toBeTruthy();
    });
  });

  // ============================================
  // Accessibility Tests
  // ============================================

  describe('Accessibility', () => {
    it('renders Bot icon for AI indicator', () => {
      const { getByTestId } = render(<AIReviewCard {...defaultProps} />);

      expect(getByTestId('icon-bot')).toBeTruthy();
    });

    it('renders Sparkles icon for confidence', () => {
      const { getByTestId } = render(<AIReviewCard {...defaultProps} />);

      expect(getByTestId('icon-sparkles')).toBeTruthy();
    });
  });
});
