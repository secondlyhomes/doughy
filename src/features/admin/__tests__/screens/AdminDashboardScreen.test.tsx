// Tests for AdminDashboardScreen.tsx
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { AdminDashboardScreen } from '../../screens/AdminDashboardScreen';
import * as adminService from '../../services/adminService';

// Mock the services
jest.mock('../../services/adminService');

const mockAdminService = adminService as jest.Mocked<typeof adminService>;

// Mock expo-router navigation
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: mockBack,
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
}));

// Mock useAuth
const mockUseAuth = jest.fn();
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock usePermissions
const mockUsePermissions = jest.fn();
jest.mock('@/features/auth/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

describe('AdminDashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockBack.mockClear();
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'admin@test.com' },
      profile: { id: 'test-user', role: 'admin', name: 'Test Admin' },
      isLoading: false,
    });
    mockUsePermissions.mockReturnValue({
      canViewAdminPanel: true,
      isAdmin: true,
      isSupport: false,
    });

    mockAdminService.getAdminStats.mockResolvedValue({
      success: true,
      stats: {
        totalUsers: 100,
        activeUsers: 85,
        totalLeads: 500,
        totalProperties: 250,
        newUsersThisWeek: 12,
        newLeadsThisWeek: 45,
      },
    });

    mockAdminService.getSystemHealth.mockResolvedValue({
      success: true,
      systems: [
        { name: 'API Server', status: 'operational', lastChecked: new Date().toISOString() },
        { name: 'Database', status: 'operational', latency: 50, lastChecked: new Date().toISOString() },
        { name: 'Authentication', status: 'operational', latency: 30, lastChecked: new Date().toISOString() },
        { name: 'Storage', status: 'operational', latency: 45, lastChecked: new Date().toISOString() },
      ],
    });
  });

  it('renders loading state initially', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    expect(getByText('Loading dashboard...')).toBeTruthy();

    await waitFor(() => {
      expect(mockAdminService.getAdminStats).toHaveBeenCalled();
    });
  });

  it('renders dashboard after loading', async () => {
    const { getByText, queryByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(queryByText('Loading dashboard...')).toBeNull();
    });

    expect(getByText('Admin Dashboard')).toBeTruthy();
    expect(getByText('OVERVIEW')).toBeTruthy();
    expect(getByText('SYSTEM STATUS')).toBeTruthy();
    expect(getByText('QUICK ACTIONS')).toBeTruthy();
  });

  it('displays stats correctly', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('100')).toBeTruthy();
    });

    expect(getByText('500')).toBeTruthy();
    expect(getByText('250')).toBeTruthy();
    expect(getByText('12')).toBeTruthy();
  });

  it('displays system health status', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('API Server')).toBeTruthy();
    });

    expect(getByText('Database')).toBeTruthy();
    expect(getByText('Authentication')).toBeTruthy();
    expect(getByText('Storage')).toBeTruthy();
  });

  it('shows latency for systems that have it', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Response: 50ms')).toBeTruthy();
    });
  });

  it('navigates to user management when stat card is pressed', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Total Users')).toBeTruthy();
    });

    fireEvent.press(getByText('Total Users'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/users');
  });

  it('navigates to user management from quick actions', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Manage Users')).toBeTruthy();
    });

    fireEvent.press(getByText('Manage Users'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/users');
  });

  it('navigates to integrations from quick actions', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Integrations')).toBeTruthy();
    });

    fireEvent.press(getByText('Integrations'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/integrations');
  });

  it('navigates to system logs from quick actions', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('System Logs')).toBeTruthy();
    });

    fireEvent.press(getByText('System Logs'));
    expect(mockPush).toHaveBeenCalledWith('/(admin)/logs');
  });

  it('goes back when back button is pressed', async () => {
    const { getByTestId } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-ArrowLeft')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-ArrowLeft'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('refreshes data when refresh button is pressed', async () => {
    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Refresh Data')).toBeTruthy();
    });

    mockAdminService.getAdminStats.mockClear();
    mockAdminService.getSystemHealth.mockClear();

    fireEvent.press(getByText('Refresh Data'));

    await waitFor(() => {
      expect(mockAdminService.getAdminStats).toHaveBeenCalled();
      expect(mockAdminService.getSystemHealth).toHaveBeenCalled();
    });
  });

  it('shows access denied for non-admin users', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'user@test.com' },
      profile: { id: 'test-user', role: 'user', name: 'Test User' },
      isLoading: false,
    });
    mockUsePermissions.mockReturnValue({
      canViewAdminPanel: false,
      isAdmin: false,
      isSupport: false,
    });

    const { getByText } = render(<AdminDashboardScreen />);

    expect(getByText('Access Denied')).toBeTruthy();
    expect(getByText("You don't have permission to access the admin dashboard.")).toBeTruthy();
  });

  it('navigates back from access denied screen', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'user@test.com' },
      profile: { id: 'test-user', role: 'user', name: 'Test User' },
      isLoading: false,
    });
    mockUsePermissions.mockReturnValue({
      canViewAdminPanel: false,
      isAdmin: false,
      isSupport: false,
    });

    const { getByText } = render(<AdminDashboardScreen />);

    fireEvent.press(getByText('Go Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('allows support role to access', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user', email: 'support@test.com' },
      profile: { id: 'test-user', role: 'support', name: 'Support User' },
      isLoading: false,
    });
    mockUsePermissions.mockReturnValue({
      canViewAdminPanel: true,
      isAdmin: false,
      isSupport: true,
    });

    const { getByText, queryByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(queryByText('Access Denied')).toBeNull();
    });

    expect(getByText('Admin Dashboard')).toBeTruthy();
  });

  it('displays degraded system status correctly', async () => {
    mockAdminService.getSystemHealth.mockResolvedValue({
      success: true,
      systems: [
        { name: 'Database', status: 'degraded', latency: 1500, lastChecked: new Date().toISOString() },
      ],
    });

    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('degraded')).toBeTruthy();
    });
  });

  it('displays outage system status correctly', async () => {
    mockAdminService.getSystemHealth.mockResolvedValue({
      success: true,
      systems: [
        { name: 'Database', status: 'outage', lastChecked: new Date().toISOString() },
      ],
    });

    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('outage')).toBeTruthy();
    });
  });

  it('handles failed stats fetch gracefully', async () => {
    mockAdminService.getAdminStats.mockResolvedValue({
      success: false,
      error: 'Failed to fetch stats',
    });

    const { getByText, getAllByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Admin Dashboard')).toBeTruthy();
    });

    // Should show 0 for stats when fetch fails (multiple stat cards show 0)
    expect(getAllByText('0').length).toBeGreaterThan(0);
  });

  it('handles failed health fetch gracefully', async () => {
    mockAdminService.getSystemHealth.mockResolvedValue({
      success: false,
      error: 'Failed to fetch health',
    });

    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Admin Dashboard')).toBeTruthy();
    });

    // Should still render the dashboard
    expect(getByText('SYSTEM STATUS')).toBeTruthy();
  });

  it('handles exceptions during data loading', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockAdminService.getAdminStats.mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<AdminDashboardScreen />);

    await waitFor(() => {
      expect(getByText('Admin Dashboard')).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });
});
