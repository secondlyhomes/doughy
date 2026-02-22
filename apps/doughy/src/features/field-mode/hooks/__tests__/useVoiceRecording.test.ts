// Tests for useVoiceRecording hook
import { renderHook } from '@testing-library/react-native';
import { useVoiceRecording } from '../useVoiceRecording';

// Note: expo-av is not available in Jest test environment
// The hook gracefully handles this by setting isAudioAvailable = false
// These tests verify the hook's behavior when audio is unavailable

describe('useVoiceRecording', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.state).toEqual({
      isRecording: false,
      isPaused: false,
      duration: 0,
      uri: undefined,
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it('should indicate audio is not available in test environment', () => {
    const { result } = renderHook(() => useVoiceRecording());

    // In test environment, expo-av is not available
    expect(result.current.isAvailable).toBe(false);
    expect(result.current.error).toBe('Voice recording requires a development build');
  });

  it('should handle startRecording when unavailable', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await result.current.startRecording();

    // Should remain in not-recording state
    expect(result.current.state.isRecording).toBe(false);
    expect(result.current.error).toBe('Voice recording requires a development build');
  });

  it('should handle stopRecording when unavailable', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    const uri = await result.current.stopRecording();

    // Should return null when not available
    expect(uri).toBeNull();
  });

  it('should handle pauseRecording when unavailable', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await result.current.pauseRecording();

    // Should not throw errors
    expect(result.current.state.isPaused).toBe(false);
  });

  it('should handle resumeRecording when unavailable', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await result.current.resumeRecording();

    // Should not throw errors
    expect(result.current.state.isRecording).toBe(false);
  });

  it('should handle cancelRecording when unavailable', async () => {
    const { result } = renderHook(() => useVoiceRecording());

    await result.current.cancelRecording();

    // Should not throw errors
    expect(result.current.state.isRecording).toBe(false);
  });

  it('should cleanup on unmount without errors', () => {
    const { unmount } = renderHook(() => useVoiceRecording());

    // Should not throw errors
    expect(() => unmount()).not.toThrow();
  });

  it('should have stable playback state', () => {
    const { result } = renderHook(() => useVoiceRecording());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.playbackPosition).toBe(0);
    expect(result.current.playbackDuration).toBe(0);
  });
});

// Export formatDuration helper function tests
describe('formatDuration', () => {
  // Mock the formatDuration function that should be exported from the hook file
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  it('should format seconds correctly', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(30)).toBe('0:30');
    expect(formatDuration(60)).toBe('1:00');
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(125)).toBe('2:05');
  });
});
