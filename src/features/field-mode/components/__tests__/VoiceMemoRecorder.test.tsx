// Tests for VoiceMemoRecorder component
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VoiceMemoRecorder } from '../VoiceMemoRecorder';
import { PhotoBucket } from '../../../deals/types';

// Mock useVoiceRecording hook
const mockStartRecording = jest.fn();
const mockStopRecording = jest.fn(() => Promise.resolve('mock-recording-uri.m4a'));
const mockPauseRecording = jest.fn();
const mockResumeRecording = jest.fn();
const mockCancelRecording = jest.fn();

jest.mock('../hooks/useVoiceRecording', () => ({
  useVoiceRecording: () => ({
    state: {
      isRecording: false,
      isPaused: false,
      isPlaying: false,
      duration: 0,
      uri: null,
    },
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
    pauseRecording: mockPauseRecording,
    resumeRecording: mockResumeRecording,
    cancelRecording: mockCancelRecording,
    error: null,
  }),
  formatDuration: (seconds: number) => `${seconds}s`,
}));

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
    Mic: createMockIcon('Mic'),
    Square: createMockIcon('Square'),
    Pause: createMockIcon('Pause'),
    Play: createMockIcon('Play'),
    X: createMockIcon('X'),
    Check: createMockIcon('Check'),
  };
});

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#007AFF',
    primaryForeground: '#FFFFFF',
    foreground: '#000000',
    background: '#FFFFFF',
    muted: '#F5F5F5',
    mutedForeground: '#666666',
    destructive: '#FF3B30',
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
}));

describe('VoiceMemoRecorder', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible', () => {
    const { getByTestID } = render(
      <VoiceMemoRecorder
        visible={true}
        bucket="kitchen"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(getByTestID('bottom-sheet')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByTestID } = render(
      <VoiceMemoRecorder
        visible={false}
        bucket="kitchen"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(queryByTestID('bottom-sheet')).toBeNull();
  });

  it('should display bucket name in title', () => {
    const { getByText } = render(
      <VoiceMemoRecorder
        visible={true}
        bucket="kitchen"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(getByText('Voice Memo: Kitchen')).toBeTruthy();
  });

  it('should handle save action', async () => {
    const { getByLabelText } = render(
      <VoiceMemoRecorder
        visible={true}
        bucket="kitchen"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const saveButton = getByLabelText('Save recording');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockStopRecording).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalledWith('kitchen', 'mock-recording-uri.m4a');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle cancel action', async () => {
    const { getByLabelText } = render(
      <VoiceMemoRecorder
        visible={true}
        bucket="kitchen"
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    const cancelButton = getByLabelText('Cancel recording');
    fireEvent.press(cancelButton);

    await waitFor(() => {
      expect(mockCancelRecording).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should render different bucket types', () => {
    const buckets: PhotoBucket[] = [
      'exterior_roof',
      'baths',
      'basement_mechanical',
      'electrical_plumbing',
      'notes_other',
    ];

    buckets.forEach((bucket) => {
      const { getByText } = render(
        <VoiceMemoRecorder
          visible={true}
          bucket={bucket}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      // Should render without errors
      expect(getByText).toBeTruthy();
    });
  });

  it('should handle null bucket gracefully', () => {
    const { getByText } = render(
      <VoiceMemoRecorder
        visible={true}
        bucket={null}
        onClose={mockOnClose}
        onSave={mockOnSave}
      />
    );

    expect(getByText('Voice Memo:')).toBeTruthy();
  });
});
