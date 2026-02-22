// src/features/assistant/hooks/__tests__/useJobWatcher.test.ts
// Tests for useJobWatcher hook

import { renderHook, waitFor } from '@testing-library/react-native';
import { useJobWatcher } from '../useJobWatcher';

// Mock Supabase
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: mockSelect,
    })),
  },
}));

const mockJob = {
  id: 'job-123',
  deal_id: 'deal-123',
  job_type: 'generate_seller_report',
  status: 'running' as const,
  progress: 50,
  created_at: new Date().toISOString(),
};

describe('useJobWatcher', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock chain
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({ data: mockJob, error: null });

    const supabase = require('@/lib/supabase').supabase;
    supabase.from.mockImplementation(mockFrom);
  });

  it('should initialize with null job', () => {
    const { result } = renderHook(() => useJobWatcher(null));

    expect(result.current.job).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch job when jobId is provided', async () => {
    const { result } = renderHook(() => useJobWatcher('job-123'));

    await waitFor(() => {
      expect(result.current.job).toEqual(mockJob);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should cleanup interval on unmount', async () => {
    const { result, unmount } = renderHook(() => useJobWatcher('job-123'));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.job).not.toBeNull();
    });

    const callCountBeforeUnmount = mockSingle.mock.calls.length;

    // Unmount component (this is the key test - verifies no memory leak)
    unmount();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Verify no additional calls were made after unmount
    // This proves the interval was cleaned up properly
    expect(mockSingle.mock.calls.length).toBe(callCountBeforeUnmount);
  });

  it('should handle errors gracefully', async () => {
    mockSingle.mockRejectedValue(new Error('Database error'));

    const { result } = renderHook(() => useJobWatcher('job-123'));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('Database error');
      expect(result.current.job).toBeNull();
    });
  });

  it('should reset state when jobId becomes null', () => {
    const { result, rerender } = renderHook(
      ({ jobId }) => useJobWatcher(jobId),
      { initialProps: { jobId: 'job-123' } }
    );

    // Set jobId to null
    rerender({ jobId: null });

    // Should reset state immediately
    expect(result.current.job).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
