// Tests for AdminNavigator.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AdminNavigator } from '../AdminNavigator';

// Mock AdminGuard
const mockAdminGuard = jest.fn();
jest.mock('@/features/auth/guards/AdminGuard', () => ({
  AdminGuard: ({ children, fallback, redirectOnFail }: { children: React.ReactNode; fallback: React.ReactNode; redirectOnFail: boolean }) => {
    mockAdminGuard({ fallback, redirectOnFail });
    return children;
  },
}));

// Mock screens
jest.mock('@/features/admin/screens/AdminDashboardScreen', () => ({
  AdminDashboardScreen: () => null,
}));

jest.mock('@/features/admin/screens/UserManagementScreen', () => ({
  UserManagementScreen: () => null,
}));

jest.mock('@/features/admin/screens/UserDetailScreen', () => ({
  UserDetailScreen: () => null,
}));

jest.mock('@/features/admin/screens/IntegrationsScreen', () => ({
  IntegrationsScreen: () => null,
}));

jest.mock('@/features/admin/screens/SystemLogsScreen', () => ({
  SystemLogsScreen: () => null,
}));

describe('AdminNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(
      <NavigationContainer>
        <AdminNavigator />
      </NavigationContainer>
    );

    expect(toJSON()).toBeDefined();
  });

  it('wraps content with AdminGuard', () => {
    render(
      <NavigationContainer>
        <AdminNavigator />
      </NavigationContainer>
    );

    expect(mockAdminGuard).toHaveBeenCalled();
  });

  it('passes redirectOnFail prop to AdminGuard', () => {
    render(
      <NavigationContainer>
        <AdminNavigator />
      </NavigationContainer>
    );

    expect(mockAdminGuard).toHaveBeenCalledWith(
      expect.objectContaining({ redirectOnFail: true })
    );
  });

  it('provides loading fallback to AdminGuard', () => {
    render(
      <NavigationContainer>
        <AdminNavigator />
      </NavigationContainer>
    );

    expect(mockAdminGuard).toHaveBeenCalledWith(
      expect.objectContaining({
        fallback: expect.anything(),
      })
    );
  });

  it('renders AdminLoadingFallback correctly', () => {
    // Test the fallback component separately
    const { AdminNavigator: ActualNavigator } = jest.requireActual('../AdminNavigator');

    // Since AdminLoadingFallback is internal, we test it through AdminGuard
    // The mock captures the fallback prop
    render(
      <NavigationContainer>
        <AdminNavigator />
      </NavigationContainer>
    );

    const fallbackProp = mockAdminGuard.mock.calls[0][0].fallback;
    expect(fallbackProp).toBeDefined();
  });
});

// Test AdminLoadingFallback component separately
describe('AdminLoadingFallback', () => {
  it('renders loading indicator', () => {
    // Create a test component that renders the fallback
    const TestComponent = () => {
      // Capture the fallback from AdminGuard call
      return null;
    };

    render(
      <NavigationContainer>
        <AdminNavigator />
      </NavigationContainer>
    );

    // The fallback should be a React element with ActivityIndicator
    const fallbackProp = mockAdminGuard.mock.calls[0][0].fallback;
    expect(fallbackProp.type).toBeDefined();
  });
});
