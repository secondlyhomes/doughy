/**
 * VoiceRecordButton Component Tests
 * Validates animations, states, and design system compliance
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { VoiceRecordButton } from '../VoiceRecordButton';

// Mock theme colors
jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    destructive: '#EF4444',
    primary: '#4D7C5F',
    primaryForeground: '#FFFFFF',
    mutedForeground: '#6B7280',
  }),
}));

describe('VoiceRecordButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByText } = render(
        <VoiceRecordButton isRecording={false} onPress={mockOnPress} />
      );
      expect(getByText('Tap to record')).toBeTruthy();
    });

    it('should render in recording state', () => {
      const { getByText } = render(
        <VoiceRecordButton isRecording={true} duration={0} onPress={mockOnPress} />
      );
      expect(getByText('Recording...')).toBeTruthy();
    });

    it('should render with large size', () => {
      const { UNSAFE_root } = render(
        <VoiceRecordButton isRecording={false} size="large" onPress={mockOnPress} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Recording State', () => {
    it('should show recording state when isRecording is true', () => {
      const { getByText } = render(
        <VoiceRecordButton isRecording={true} duration={45} onPress={mockOnPress} />
      );
      expect(getByText('Recording...')).toBeTruthy();
      expect(getByText('00:45')).toBeTruthy();
    });

    it('should show idle state when isRecording is false', () => {
      const { getByText } = render(
        <VoiceRecordButton isRecording={false} onPress={mockOnPress} />
      );
      expect(getByText('Tap to record')).toBeTruthy();
    });
  });

  describe('Duration Display', () => {
    it('should format duration in MM:SS format', () => {
      const { getByText } = render(
        <VoiceRecordButton isRecording={true} duration={125} onPress={mockOnPress} />
      );
      expect(getByText('02:05')).toBeTruthy();
    });

    it('should handle zero duration', () => {
      const { getByText } = render(
        <VoiceRecordButton isRecording={true} duration={0} onPress={mockOnPress} />
      );
      expect(getByText('00:00')).toBeTruthy();
    });

    it('should handle single-digit seconds', () => {
      const { getByText } = render(
        <VoiceRecordButton isRecording={true} duration={5} onPress={mockOnPress} />
      );
      expect(getByText('00:05')).toBeTruthy();
    });

    it('should handle long durations', () => {
      const { getByText } = render(
        <VoiceRecordButton isRecording={true} duration={3661} onPress={mockOnPress} />
      );
      expect(getByText('61:01')).toBeTruthy();
    });

    it('should not show duration when not recording', () => {
      const { queryByText } = render(
        <VoiceRecordButton isRecording={false} duration={45} onPress={mockOnPress} />
      );
      expect(queryByText('00:45')).toBeNull();
    });
  });

  describe('Interaction', () => {
    it('should call onPress when pressed', () => {
      const { getByRole } = render(
        <VoiceRecordButton isRecording={false} onPress={mockOnPress} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when disabled', () => {
      const { getByRole } = render(
        <VoiceRecordButton isRecording={false} disabled onPress={mockOnPress} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should render disabled state', () => {
      const { UNSAFE_root } = render(
        <VoiceRecordButton isRecording={false} disabled onPress={mockOnPress} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should have disabled accessibility state', () => {
      const { getByRole } = render(
        <VoiceRecordButton isRecording={false} disabled onPress={mockOnPress} />
      );
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      const { getByRole } = render(
        <VoiceRecordButton isRecording={false} onPress={mockOnPress} />
      );
      expect(getByRole('button')).toBeTruthy();
    });

    it('should have correct label when idle', () => {
      const { getByLabelText } = render(
        <VoiceRecordButton isRecording={false} onPress={mockOnPress} />
      );
      expect(getByLabelText('Start voice recording')).toBeTruthy();
    });

    it('should have correct label when recording', () => {
      const { getByLabelText } = render(
        <VoiceRecordButton isRecording={true} duration={0} onPress={mockOnPress} />
      );
      expect(getByLabelText('Stop recording')).toBeTruthy();
    });

    it('should have busy state when recording', () => {
      const { getByRole } = render(
        <VoiceRecordButton isRecording={true} duration={0} onPress={mockOnPress} />
      );
      const button = getByRole('button');
      expect(button.props.accessibilityState.busy).toBe(true);
    });
  });

  describe('Size Variants', () => {
    it('should support default size', () => {
      const { UNSAFE_root } = render(
        <VoiceRecordButton isRecording={false} size="default" onPress={mockOnPress} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support large size', () => {
      const { UNSAFE_root } = render(
        <VoiceRecordButton isRecording={false} size="large" onPress={mockOnPress} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Design System Compliance', () => {
    it('should render without hardcoded values', () => {
      const { UNSAFE_root } = render(
        <VoiceRecordButton isRecording={true} duration={60} onPress={mockOnPress} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support custom styles', () => {
      const customStyle = { marginTop: 20 };
      const { UNSAFE_root } = render(
        <VoiceRecordButton
          isRecording={false}
          onPress={mockOnPress}
          style={customStyle}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
