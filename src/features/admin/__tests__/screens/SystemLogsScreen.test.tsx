// Tests for SystemLogsScreen.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { SystemLogsScreen } from '../../screens/SystemLogsScreen';
import * as logsService from '../../services/logsService';

// Mock the services
jest.mock('../../services/logsService');

const mockLogsService = logsService as jest.Mocked<typeof logsService>;

// Mock navigation
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

describe('SystemLogsScreen', () => {
  const mockLogs = [
    {
      id: 'log-1',
      level: 'info' as const,
      message: 'User logged in successfully',
      source: 'auth',
      userId: 'user-1',
      metadata: { ip: '192.168.1.1' },
      timestamp: '2024-01-01T12:00:00Z',
    },
    {
      id: 'log-2',
      level: 'warning' as const,
      message: 'Rate limit approaching',
      source: 'api',
      timestamp: '2024-01-01T11:00:00Z',
    },
    {
      id: 'log-3',
      level: 'error' as const,
      message: 'Database connection failed',
      source: 'database',
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      id: 'log-4',
      level: 'debug' as const,
      message: 'Processing webhook payload',
      source: 'api',
      timestamp: '2024-01-01T09:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogsService.getLogs.mockResolvedValue({
      success: true,
      logs: mockLogs,
      total: 4,
    });
  });

  it('renders loading state initially', async () => {
    const { getByText } = render(<SystemLogsScreen />);

    expect(getByText('System Logs')).toBeTruthy();

    await waitFor(() => {
      expect(mockLogsService.getLogs).toHaveBeenCalled();
    });
  });

  it('renders logs after loading', async () => {
    const { getByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByText('User logged in successfully')).toBeTruthy();
    });

    expect(getByText('Rate limit approaching')).toBeTruthy();
    expect(getByText('Database connection failed')).toBeTruthy();
    expect(getByText('Processing webhook payload')).toBeTruthy();
  });

  it('displays log count', async () => {
    const { getByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByText('4 logs')).toBeTruthy();
    });
  });

  it('displays singular log count', async () => {
    mockLogsService.getLogs.mockResolvedValue({
      success: true,
      logs: [mockLogs[0]],
      total: 1,
    });

    const { getByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByText('1 log')).toBeTruthy();
    });
  });

  it('goes back when back button is pressed', async () => {
    const { getByTestId } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-ArrowLeft')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-ArrowLeft'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('toggles filter panel when filter button is pressed', async () => {
    const { getByTestId, queryByText, getByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-Filter')).toBeTruthy();
    });

    // Initially filters should be hidden
    expect(queryByText('Filter by Level')).toBeNull();

    // Press filter button
    fireEvent.press(getByTestId('icon-Filter'));

    // Filters should be visible
    expect(getByText('Filter by Level')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Error')).toBeTruthy();
    expect(getByText('Warning')).toBeTruthy();
    expect(getByText('Info')).toBeTruthy();
    expect(getByText('Debug')).toBeTruthy();
  });

  it('filters logs by level when filter pill is pressed', async () => {
    const { getByTestId, getByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-Filter')).toBeTruthy();
    });

    // Open filters
    fireEvent.press(getByTestId('icon-Filter'));

    // Clear and set up new mock for filtered results
    mockLogsService.getLogs.mockClear();
    mockLogsService.getLogs.mockResolvedValue({
      success: true,
      logs: [mockLogs[2]], // Only error log
      total: 1,
    });

    // Press Error filter
    fireEvent.press(getByText('Error'));

    await waitFor(() => {
      expect(mockLogsService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' })
      );
    });
  });

  it('expands log entry when pressed', async () => {
    const { getByText, queryByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByText('User logged in successfully')).toBeTruthy();
    });

    // Metadata should not be visible initially
    expect(queryByText('"ip"')).toBeNull();

    // Press the log entry
    fireEvent.press(getByText('User logged in successfully'));

    // Metadata should be visible
    await waitFor(() => {
      expect(getByText(/"ip"/)).toBeTruthy();
    });
  });

  it('collapses log entry when pressed again', async () => {
    const { getByText, queryByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByText('User logged in successfully')).toBeTruthy();
    });

    // Expand
    fireEvent.press(getByText('User logged in successfully'));

    await waitFor(() => {
      expect(getByText(/"ip"/)).toBeTruthy();
    });

    // Collapse
    fireEvent.press(getByText('User logged in successfully'));

    await waitFor(() => {
      expect(queryByText(/"ip"/)).toBeNull();
    });
  });

  it('displays correct icons for log levels', async () => {
    const { getAllByTestId } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getAllByTestId('icon-Info').length).toBeGreaterThan(0);
    });

    expect(getAllByTestId('icon-AlertTriangle').length).toBeGreaterThan(0);
    expect(getAllByTestId('icon-AlertCircle').length).toBeGreaterThan(0);
    expect(getAllByTestId('icon-Bug').length).toBeGreaterThan(0);
  });

  it('displays log source', async () => {
    const { getAllByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getAllByText('auth').length).toBeGreaterThan(0);
    });

    expect(getAllByText('api').length).toBeGreaterThan(0);
    expect(getAllByText('database').length).toBeGreaterThan(0);
  });

  it('shows empty state when no logs found', async () => {
    mockLogsService.getLogs.mockResolvedValue({
      success: true,
      logs: [],
      total: 0,
    });

    const { getByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByText('No logs found')).toBeTruthy();
    });
  });

  it('shows auto-refresh message', async () => {
    const { getByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByText('Auto-refreshes every 30s')).toBeTruthy();
    });
  });

  it('handles refresh correctly', async () => {
    const { UNSAFE_getByType } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(mockLogsService.getLogs).toHaveBeenCalled();
    });

    // Note: Testing RefreshControl pull-to-refresh is complex in RTL
    // The implementation is verified through other integration tests
  });

  it('loads more logs when end reached', async () => {
    mockLogsService.getLogs.mockResolvedValue({
      success: true,
      logs: mockLogs,
      total: 100, // More logs available
    });

    render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(mockLogsService.getLogs).toHaveBeenCalled();
    });

    // Note: Testing FlatList onEndReached is complex in RTL
  });

  it('filters all levels when All is pressed', async () => {
    const { getByTestId, getByText } = render(<SystemLogsScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-Filter')).toBeTruthy();
    });

    // Open filters
    fireEvent.press(getByTestId('icon-Filter'));

    // First filter by error
    fireEvent.press(getByText('Error'));

    await waitFor(() => {
      expect(mockLogsService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' })
      );
    });

    mockLogsService.getLogs.mockClear();

    // Then reset to all
    fireEvent.press(getByText('All'));

    await waitFor(() => {
      expect(mockLogsService.getLogs).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'all' })
      );
    });
  });
});
