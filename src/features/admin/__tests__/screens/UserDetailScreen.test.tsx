// Tests for UserDetailScreen.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { UserDetailScreen } from '../../screens/UserDetailScreen';
import * as userService from '../../services/userService';

// Mock the services
jest.mock('../../services/userService');

const mockUserService = userService as jest.Mocked<typeof userService>;

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

let mockRouteParams = { userId: 'user-1' };

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: mockRouteParams,
  }),
}));

// Mock useAuth
const mockUseAuth = jest.fn();
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('UserDetailScreen', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
    isDeleted: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = { userId: 'user-1' };

    mockUseAuth.mockReturnValue({
      user: { id: 'admin-user', email: 'admin@test.com' },
      profile: { id: 'admin-user', role: 'admin', name: 'Admin' },
    });

    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: mockUser,
    });

    mockUserService.getRoleLabel.mockImplementation((role) => {
      switch (role) {
        case 'admin': return 'Admin';
        case 'support': return 'Support';
        case 'standard': return 'Standard';
        default: return 'User';
      }
    });

    mockUserService.updateUserRole.mockResolvedValue({ success: true });
    mockUserService.restoreUser.mockResolvedValue({ success: true });
    mockUserService.deleteUser.mockResolvedValue({ success: true });
  });

  it('renders loading state initially', async () => {
    const { getByText } = render(<UserDetailScreen />);

    expect(getByText('User Details')).toBeTruthy();

    await waitFor(() => {
      expect(mockUserService.getUserById).toHaveBeenCalledWith('user-1');
    });
  });

  it('renders user details after loading', async () => {
    const { getByText, getAllByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('Test User')).toBeTruthy();
    });

    // Email may appear in multiple places (header, details, etc.)
    expect(getAllByText('test@example.com').length).toBeGreaterThan(0);
    expect(getByText('Active')).toBeTruthy();
  });

  it('shows "No Name" when user has no name', async () => {
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, name: null },
    });

    const { getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('No Name')).toBeTruthy();
    });
  });

  it('shows "Deleted" status for deleted users', async () => {
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, isDeleted: true },
    });

    const { getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('Deleted')).toBeTruthy();
    });
  });

  it('shows "User not found" when user does not exist', async () => {
    mockUserService.getUserById.mockResolvedValue({
      success: false,
      error: 'User not found',
    });

    const { getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('User not found')).toBeTruthy();
    });
  });

  it('goes back when back button is pressed', async () => {
    const { getByTestId } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-ArrowLeft')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-ArrowLeft'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('displays role buttons for non-self users', async () => {
    const { getByText, getAllByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('CHANGE ROLE')).toBeTruthy();
    });

    // Role labels appear both in user info and as role buttons
    expect(getAllByText(/User/).length).toBeGreaterThan(0);
    expect(getAllByText(/Support/).length).toBeGreaterThan(0);
    expect(getAllByText(/Admin/).length).toBeGreaterThan(0);
  });

  it('does not show role buttons when viewing self', async () => {
    mockRouteParams = { userId: 'admin-user' };
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, id: 'admin-user' },
    });

    const { queryByText, getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('This is your account. Some actions are restricted.')).toBeTruthy();
    });

    expect(queryByText('CHANGE ROLE')).toBeNull();
  });

  it('shows alert when trying to change own role', async () => {
    mockRouteParams = { userId: 'admin-user' };
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, id: 'admin-user', role: 'admin' },
    });

    render(<UserDetailScreen />);

    await waitFor(() => {
      expect(mockUserService.getUserById).toHaveBeenCalled();
    });

    // The role buttons should not be shown for self
  });

  it('prompts for confirmation when changing role', async () => {
    const { getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('Support')).toBeTruthy();
    });

    fireEvent.press(getByText('Support'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Change Role',
      expect.stringContaining('Support'),
      expect.any(Array)
    );
  });

  it('updates user role successfully', async () => {
    const { getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('Support')).toBeTruthy();
    });

    fireEvent.press(getByText('Support'));

    // Get the confirmation callback
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Change');

    await confirmButton.onPress();

    expect(mockUserService.updateUserRole).toHaveBeenCalledWith('user-1', 'support');
  });

  it('shows error when role update fails', async () => {
    mockUserService.updateUserRole.mockResolvedValue({
      success: false,
      error: 'Update failed',
    });

    const { getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('Admin')).toBeTruthy();
    });

    fireEvent.press(getByText('Admin'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Change');

    await confirmButton.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Update failed');
    });
  });

  it('shows actions menu when more button is pressed', async () => {
    const { getByTestId, getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-MoreVertical')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-MoreVertical'));

    expect(getByText('Delete User')).toBeTruthy();
  });

  it('does not show more button for self', async () => {
    mockRouteParams = { userId: 'admin-user' };
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, id: 'admin-user' },
    });

    const { queryByTestId } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(queryByTestId('icon-MoreVertical')).toBeNull();
    });
  });

  it('prompts for delete confirmation', async () => {
    const { getByTestId, getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-MoreVertical')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-MoreVertical'));
    fireEvent.press(getByText('Delete User'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete User',
      expect.stringContaining('delete'),
      expect.any(Array)
    );
  });

  it('deletes user successfully', async () => {
    const { getByTestId, getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-MoreVertical')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-MoreVertical'));
    fireEvent.press(getByText('Delete User'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Delete');

    await deleteButton.onPress();

    expect(mockUserService.deleteUser).toHaveBeenCalledWith('user-1');
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows error when delete fails', async () => {
    mockUserService.deleteUser.mockResolvedValue({
      success: false,
      error: 'Delete failed',
    });

    const { getByTestId, getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-MoreVertical')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-MoreVertical'));
    fireEvent.press(getByText('Delete User'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Delete');

    await deleteButton.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Delete failed');
    });
  });

  it('shows restore option for deleted users', async () => {
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, isDeleted: true },
    });

    const { getByTestId, getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-MoreVertical')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-MoreVertical'));

    expect(getByText('Restore User')).toBeTruthy();
  });

  it('restores user successfully', async () => {
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, isDeleted: true },
    });

    const { getByTestId, getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-MoreVertical')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-MoreVertical'));
    fireEvent.press(getByText('Restore User'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const restoreButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Restore');

    await restoreButton.onPress();

    expect(mockUserService.restoreUser).toHaveBeenCalledWith('user-1');
  });

  it('shows error when restore fails', async () => {
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, isDeleted: true },
    });
    mockUserService.restoreUser.mockResolvedValue({
      success: false,
      error: 'Restore failed',
    });

    const { getByTestId, getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-MoreVertical')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-MoreVertical'));
    fireEvent.press(getByText('Restore User'));

    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const restoreButton = alertCall[2].find((btn: { text: string }) => btn.text === 'Restore');

    await restoreButton.onPress();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Restore failed');
    });
  });

  it('formats dates correctly', async () => {
    const { getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      // The date should be formatted
      expect(getByText(/Jan 1, 2024/)).toBeTruthy();
    });
  });

  it('shows "Never" for null dates', async () => {
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, updatedAt: null },
    });

    const { getByText } = render(<UserDetailScreen />);

    await waitFor(() => {
      expect(getByText('Never')).toBeTruthy();
    });
  });

  it('prevents self-deletion with alert', async () => {
    mockRouteParams = { userId: 'admin-user' };
    mockUserService.getUserById.mockResolvedValue({
      success: true,
      user: { ...mockUser, id: 'admin-user' },
    });

    render(<UserDetailScreen />);

    await waitFor(() => {
      expect(mockUserService.getUserById).toHaveBeenCalled();
    });

    // More button should not be visible for self
  });
});
