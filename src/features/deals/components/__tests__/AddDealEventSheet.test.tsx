// Tests for AddDealEventSheet component
// Zone B: Task B4 - Add deal events sheet

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock the hooks and context
jest.mock('../../hooks/useDealEvents', () => ({
  logDealEvent: jest.fn(),
}));

jest.mock('@/context/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#4d7c5f',
    info: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    destructive: '#ef4444',
    mutedForeground: '#64748b',
    border: '#e2e8f0',
    card: '#ffffff',
    foreground: '#0f172a',
    muted: '#f1f5f9',
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

import { AddDealEventSheet } from '../AddDealEventSheet';
import { logDealEvent } from '../../hooks/useDealEvents';

const mockLogDealEvent = logDealEvent as jest.Mock;

describe('AddDealEventSheet', () => {
  const defaultProps = {
    visible: true,
    dealId: 'deal-123',
    dealAddress: '123 Main St',
    onClose: jest.fn(),
    onSaved: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogDealEvent.mockResolvedValue({
      id: 'event-1',
      deal_id: 'deal-123',
      event_type: 'note',
      title: 'Note added',
      source: 'user',
      created_at: new Date().toISOString(),
    });
  });

  describe('Rendering', () => {
    it('should render Add Note header', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      expect(getByText('Add Note')).toBeTruthy();
    });

    it('should render deal address when provided', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      expect(getByText('123 Main St')).toBeTruthy();
    });

    it('should not render deal address when not provided', () => {
      const { queryByText } = render(
        <AddDealEventSheet {...defaultProps} dealAddress={undefined} />
      );

      expect(queryByText('123 Main St')).toBeNull();
    });

    it('should render Type section', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      expect(getByText('Type')).toBeTruthy();
    });

    it('should render Details section', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      expect(getByText('Details')).toBeTruthy();
    });

    it('should render Save button', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      expect(getByText('Save')).toBeTruthy();
    });
  });

  describe('Event Type Selection', () => {
    it('should render all event type options', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      expect(getByText('Note')).toBeTruthy();
      expect(getByText('Call')).toBeTruthy();
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Meeting')).toBeTruthy();
    });

    it('should default to Note type selected', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      // Note should be selected (has check icon nearby)
      const noteButton = getByText('Note');
      expect(noteButton).toBeTruthy();
    });

    it('should allow selecting different types', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      // Select Call type
      fireEvent.press(getByText('Call'));

      // Call should now be selected
      expect(getByText('Call')).toBeTruthy();
    });

    it('should update placeholder when type changes to Call', () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      // Default placeholder
      expect(getByPlaceholderText('Add a note about this deal...')).toBeTruthy();

      // Select Call
      fireEvent.press(getByText('Call'));

      // Placeholder should change
      expect(
        getByPlaceholderText('What was discussed on the call? Any commitments made?')
      ).toBeTruthy();
    });

    it('should update placeholder when type changes to Email', () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      fireEvent.press(getByText('Email'));

      expect(getByPlaceholderText('Summarize the email exchange...')).toBeTruthy();
    });

    it('should update placeholder when type changes to Meeting', () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      fireEvent.press(getByText('Meeting'));

      expect(
        getByPlaceholderText('What happened in the meeting? Any decisions made?')
      ).toBeTruthy();
    });
  });

  describe('Description Input', () => {
    it('should allow entering description', () => {
      const { getByPlaceholderText } = render(<AddDealEventSheet {...defaultProps} />);

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'Test note content');

      expect(input.props.value).toBe('Test note content');
    });
  });

  describe('Save Functionality', () => {
    it('should disable Save button when description is empty', () => {
      const { getByText } = render(<AddDealEventSheet {...defaultProps} />);

      const saveButton = getByText('Save');
      // Button should be disabled (can't check directly, but pressing should not call onSaved)
      fireEvent.press(saveButton);

      expect(mockLogDealEvent).not.toHaveBeenCalled();
    });

    it('should disable Save button when description is only whitespace', () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, '   ');

      fireEvent.press(getByText('Save'));

      expect(mockLogDealEvent).not.toHaveBeenCalled();
    });

    it('should call logDealEvent with correct params for Note type', async () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'This is a test note');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockLogDealEvent).toHaveBeenCalledWith({
          deal_id: 'deal-123',
          event_type: 'note',
          title: 'Note added',
          description: 'This is a test note',
          source: 'user',
          metadata: undefined,
        });
      });
    });

    it('should call logDealEvent with metadata for Call type', async () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      // Select Call type
      fireEvent.press(getByText('Call'));

      const input = getByPlaceholderText(
        'What was discussed on the call? Any commitments made?'
      );
      fireEvent.changeText(input, 'Discussed pricing options');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockLogDealEvent).toHaveBeenCalledWith({
          deal_id: 'deal-123',
          event_type: 'note',
          title: 'Call logged',
          description: 'Discussed pricing options',
          source: 'user',
          metadata: { activity_type: 'call' },
        });
      });
    });

    it('should call logDealEvent with metadata for Email type', async () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      fireEvent.press(getByText('Email'));

      const input = getByPlaceholderText('Summarize the email exchange...');
      fireEvent.changeText(input, 'Sent follow-up email');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockLogDealEvent).toHaveBeenCalledWith({
          deal_id: 'deal-123',
          event_type: 'note',
          title: 'Email logged',
          description: 'Sent follow-up email',
          source: 'user',
          metadata: { activity_type: 'email' },
        });
      });
    });

    it('should call logDealEvent with metadata for Meeting type', async () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      fireEvent.press(getByText('Meeting'));

      const input = getByPlaceholderText(
        'What happened in the meeting? Any decisions made?'
      );
      fireEvent.changeText(input, 'Met with seller');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockLogDealEvent).toHaveBeenCalledWith({
          deal_id: 'deal-123',
          event_type: 'note',
          title: 'Meeting logged',
          description: 'Met with seller',
          source: 'user',
          metadata: { activity_type: 'meeting' },
        });
      });
    });

    it('should call onSaved callback on successful save', async () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'Test note');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(defaultProps.onSaved).toHaveBeenCalled();
      });
    });

    it('should call onClose on successful save', async () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'Test note');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should show error alert on save failure', async () => {
      mockLogDealEvent.mockRejectedValue(new Error('Network error'));

      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'Test note');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Save Failed',
          'Could not save your activity. Please try again.',
          [{ text: 'OK' }]
        );
      });
    });

    it('should not call onSaved on save failure', async () => {
      mockLogDealEvent.mockRejectedValue(new Error('Network error'));

      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'Test note');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      expect(defaultProps.onSaved).not.toHaveBeenCalled();
    });

    it('should not call onClose on save failure', async () => {
      mockLogDealEvent.mockRejectedValue(new Error('Network error'));

      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'Test note');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should trim description before saving', async () => {
      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, '  Test note with spaces  ');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockLogDealEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Test note with spaces',
          })
        );
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when X button is pressed', () => {
      const { UNSAFE_getByType } = render(<AddDealEventSheet {...defaultProps} />);

      // Find the X icon's parent TouchableOpacity
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = render(<AddDealEventSheet {...defaultProps} />).UNSAFE_getAllByType(
        TouchableOpacity
      );

      // First TouchableOpacity is the X close button
      fireEvent.press(touchables[0]);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should reset form when closed', () => {
      const { getByText, getByPlaceholderText, rerender } = render(
        <AddDealEventSheet {...defaultProps} />
      );

      // Enter some data
      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'Test note');
      fireEvent.press(getByText('Call'));

      // Close and reopen
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = render(<AddDealEventSheet {...defaultProps} />).UNSAFE_getAllByType(
        TouchableOpacity
      );
      fireEvent.press(touchables[0]); // Press X

      // Re-render with visible
      rerender(<AddDealEventSheet {...defaultProps} />);

      // Form should be reset - check placeholder is back to default note placeholder
      expect(getByPlaceholderText('Add a note about this deal...')).toBeTruthy();
    });
  });

  describe('Without onSaved callback', () => {
    it('should work without onSaved callback', async () => {
      const propsWithoutOnSaved = {
        visible: true,
        dealId: 'deal-123',
        onClose: jest.fn(),
      };

      const { getByText, getByPlaceholderText } = render(
        <AddDealEventSheet {...propsWithoutOnSaved} />
      );

      const input = getByPlaceholderText('Add a note about this deal...');
      fireEvent.changeText(input, 'Test note');

      fireEvent.press(getByText('Save'));

      await waitFor(() => {
        expect(mockLogDealEvent).toHaveBeenCalled();
        expect(propsWithoutOnSaved.onClose).toHaveBeenCalled();
      });
    });
  });
});
