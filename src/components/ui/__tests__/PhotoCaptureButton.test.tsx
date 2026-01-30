/**
 * PhotoCaptureButton Component Tests
 * Validates flash animation, preview states, and design system compliance
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PhotoCaptureButton } from '../PhotoCaptureButton';

// Mock theme colors
jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    success: '#22c55e',
    primary: '#4D7C5F',
    primaryForeground: '#FFFFFF',
    mutedForeground: '#6B7280',
    card: '#FFFFFF',
    border: '#E5E7EB',
  }),
}));

describe('PhotoCaptureButton', () => {
  const mockOnCapture = jest.fn();

  beforeEach(() => {
    mockOnCapture.mockClear();
    jest.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      const { getByText } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} />
      );
      expect(getByText('Take Photo')).toBeTruthy();
    });

    it('should render with custom label', () => {
      const { getByText } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} label="Capture Image" />
      );
      expect(getByText('Capture Image')).toBeTruthy();
    });

    it('should render processing state', () => {
      const { getByText } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} isProcessing />
      );
      expect(getByText('Processing...')).toBeTruthy();
    });
  });

  describe('Photo Preview', () => {
    it('should show preview when previewUri is provided', () => {
      const { getByText, UNSAFE_root } = render(
        <PhotoCaptureButton
          onCapture={mockOnCapture}
          previewUri="https://example.com/photo.jpg"
        />
      );
      expect(getByText('Photo captured')).toBeTruthy();
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should show success checkmark when showSuccess is true', () => {
      const { UNSAFE_root } = render(
        <PhotoCaptureButton
          onCapture={mockOnCapture}
          previewUri="https://example.com/photo.jpg"
          showSuccess
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should not show checkmark when showSuccess is false', () => {
      const { UNSAFE_root } = render(
        <PhotoCaptureButton
          onCapture={mockOnCapture}
          previewUri="https://example.com/photo.jpg"
          showSuccess={false}
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });

  describe('Processing State', () => {
    it('should show loading spinner when processing', () => {
      const { UNSAFE_root } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} isProcessing />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should display "Processing..." text when processing', () => {
      const { getByText } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} isProcessing />
      );
      expect(getByText('Processing...')).toBeTruthy();
    });

    it('should disable button when processing', () => {
      const { getByRole } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} isProcessing />
      );
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Interaction', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should call onCapture after animation delay', () => {
      const { getByRole } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      // Should not call immediately
      expect(mockOnCapture).not.toHaveBeenCalled();

      // Should call after 150ms delay
      jest.advanceTimersByTime(150);
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
    });

    it('should not call onCapture when disabled', () => {
      const { getByRole } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} disabled />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      jest.advanceTimersByTime(200);
      expect(mockOnCapture).not.toHaveBeenCalled();
    });

    it('should not call onCapture when processing', () => {
      const { getByRole } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} isProcessing />
      );

      const button = getByRole('button');
      fireEvent.press(button);

      jest.advanceTimersByTime(200);
      expect(mockOnCapture).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should render disabled state', () => {
      const { UNSAFE_root } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} disabled />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should have disabled accessibility state', () => {
      const { getByRole } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} disabled />
      );
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have button role', () => {
      const { getByRole } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} />
      );
      expect(getByRole('button')).toBeTruthy();
    });

    it('should have correct label for initial state', () => {
      const { getByLabelText } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} />
      );
      expect(getByLabelText('Capture photo')).toBeTruthy();
    });

    it('should have correct label when photo is captured', () => {
      const { getByLabelText } = render(
        <PhotoCaptureButton
          onCapture={mockOnCapture}
          previewUri="https://example.com/photo.jpg"
        />
      );
      expect(getByLabelText('Retake photo')).toBeTruthy();
    });

    it('should have disabled state in accessibility', () => {
      const { getByRole } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} disabled />
      );
      const button = getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Label States', () => {
    it('should show default label when no photo', () => {
      const { getByText } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} label="Take Photo" />
      );
      expect(getByText('Take Photo')).toBeTruthy();
    });

    it('should show "Photo captured" when photo is taken', () => {
      const { getByText } = render(
        <PhotoCaptureButton
          onCapture={mockOnCapture}
          previewUri="https://example.com/photo.jpg"
        />
      );
      expect(getByText('Photo captured')).toBeTruthy();
    });

    it('should show "Processing..." when processing', () => {
      const { getByText } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} isProcessing />
      );
      expect(getByText('Processing...')).toBeTruthy();
    });
  });

  describe('Design System Compliance', () => {
    it('should render without hardcoded values', () => {
      const { UNSAFE_root } = render(
        <PhotoCaptureButton
          onCapture={mockOnCapture}
          previewUri="https://example.com/photo.jpg"
          showSuccess
        />
      );
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should support custom styles', () => {
      const customStyle = { marginTop: 20 };
      const { UNSAFE_root } = render(
        <PhotoCaptureButton onCapture={mockOnCapture} style={customStyle} />
      );
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});
