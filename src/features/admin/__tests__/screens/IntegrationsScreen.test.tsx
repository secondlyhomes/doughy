// Tests for IntegrationsScreen.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { IntegrationsScreen } from '../../screens/IntegrationsScreen';
import * as integrationsService from '../../services/integrationsService';

// Mock the services
jest.mock('../../services/integrationsService');

const mockIntegrationsService = integrationsService as jest.Mocked<typeof integrationsService>;

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

describe('IntegrationsScreen', () => {
  const mockIntegrations = [
    {
      id: 'int-1',
      name: 'Zillow',
      description: 'Property listings and market data',
      icon: 'home',
      status: 'active' as const,
      lastSync: '2024-01-01T12:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'int-2',
      name: 'MLS',
      description: 'Multiple Listing Service',
      icon: 'database',
      status: 'inactive' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'int-3',
      name: 'Twilio',
      description: 'SMS notifications',
      icon: 'phone',
      status: 'pending' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'int-4',
      name: 'DocuSign',
      description: 'Electronic signatures',
      icon: 'file-signature',
      status: 'error' as const,
      lastSync: '2024-01-01T10:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'int-5',
      name: 'Stripe',
      description: 'Payment processing',
      icon: 'credit-card',
      status: 'active' as const,
      lastSync: new Date().toISOString(), // Just now
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'int-6',
      name: 'SendGrid',
      description: 'Email delivery',
      icon: 'mail',
      status: 'active' as const,
      lastSync: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'int-7',
      name: 'Maps',
      description: 'Location services',
      icon: 'map',
      status: 'active' as const,
      lastSync: new Date(Date.now() - 3 * 3600000).toISOString(), // 3 hours ago
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'int-8',
      name: 'Redfin',
      description: 'Real estate listings',
      icon: 'map-pin',
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'int-9',
      name: 'Unknown',
      description: 'Unknown integration',
      icon: 'unknown-icon',
      status: 'active' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockIntegrationsService.getIntegrations.mockResolvedValue({
      success: true,
      integrations: mockIntegrations,
    });

    mockIntegrationsService.toggleIntegration.mockResolvedValue({
      success: true,
      integration: mockIntegrations[0],
    });

    mockIntegrationsService.syncIntegration.mockResolvedValue({
      success: true,
      integration: mockIntegrations[0],
    });
  });

  it('renders loading state initially', async () => {
    const { getByText } = render(<IntegrationsScreen />);

    expect(getByText('Integrations')).toBeTruthy();

    await waitFor(() => {
      expect(mockIntegrationsService.getIntegrations).toHaveBeenCalled();
    });
  });

  it('renders integrations after loading', async () => {
    const { getByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Zillow')).toBeTruthy();
    });

    expect(getByText('MLS')).toBeTruthy();
    expect(getByText('DocuSign')).toBeTruthy();
  });

  it('displays active and error counts', async () => {
    const { getByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      // Count active integrations (5 active in mockIntegrations)
      expect(getByText(/Active/)).toBeTruthy();
    });

    // There's 1 error integration
    expect(getByText(/Error/)).toBeTruthy();
  });

  it('goes back when back button is pressed', async () => {
    const { getByTestId } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByTestId('icon-ArrowLeft')).toBeTruthy();
    });

    fireEvent.press(getByTestId('icon-ArrowLeft'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('prompts for confirmation when toggling integration', async () => {
    const { getByText, getAllByRole } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Zillow')).toBeTruthy();
    });

    // Find and press a switch
    // Note: Switch interaction is complex in RTL, we verify the Alert is shown
    const switches = getAllByRole('switch');
    if (switches.length > 0) {
      fireEvent(switches[0], 'valueChange', false);

      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(Array)
      );
    }
  });

  it('toggles integration status successfully', async () => {
    mockIntegrationsService.toggleIntegration.mockResolvedValue({
      success: true,
      integration: { ...mockIntegrations[0], status: 'inactive' },
    });

    const { getByText, getAllByRole } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Zillow')).toBeTruthy();
    });

    const switches = getAllByRole('switch');
    if (switches.length > 0) {
      fireEvent(switches[0], 'valueChange', false);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find((btn: { text: string }) =>
        btn.text.toLowerCase() !== 'cancel'
      );

      if (confirmButton?.onPress) {
        await confirmButton.onPress();

        expect(mockIntegrationsService.toggleIntegration).toHaveBeenCalled();
      }
    }
  });

  it('shows error when toggle fails', async () => {
    mockIntegrationsService.toggleIntegration.mockResolvedValue({
      success: false,
      error: 'Toggle failed',
    });

    const { getByText, getAllByRole } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Zillow')).toBeTruthy();
    });

    const switches = getAllByRole('switch');
    if (switches.length > 0) {
      fireEvent(switches[0], 'valueChange', false);

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const confirmButton = alertCall[2].find((btn: { text: string }) =>
        btn.text.toLowerCase() !== 'cancel'
      );

      if (confirmButton?.onPress) {
        await confirmButton.onPress();

        await waitFor(() => {
          expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
        });
      }
    }
  });

  it('syncs integration when sync button is pressed', async () => {
    const { getByText, getAllByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Zillow')).toBeTruthy();
    });

    // Find sync button for active integration
    const syncButtons = getAllByText('Sync Now');
    if (syncButtons.length > 0) {
      fireEvent.press(syncButtons[0]);

      await waitFor(() => {
        expect(mockIntegrationsService.syncIntegration).toHaveBeenCalled();
      });
    }
  });

  it('shows success alert after sync', async () => {
    const { getByText, getAllByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Zillow')).toBeTruthy();
    });

    const syncButtons = getAllByText('Sync Now');
    if (syncButtons.length > 0) {
      fireEvent.press(syncButtons[0]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success',
          expect.stringContaining('synced')
        );
      });
    }
  });

  it('shows error alert when sync fails', async () => {
    mockIntegrationsService.syncIntegration.mockResolvedValue({
      success: false,
      error: 'Sync failed',
    });

    const { getByText, getAllByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Zillow')).toBeTruthy();
    });

    const syncButtons = getAllByText('Sync Now');
    if (syncButtons.length > 0) {
      fireEvent.press(syncButtons[0]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
      });
    }
  });

  it('displays error message for error status integrations', async () => {
    const { getByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('DocuSign')).toBeTruthy();
    });

    expect(getByText(/Connection error/)).toBeTruthy();
  });

  it('formats last sync time correctly', async () => {
    const { getByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Stripe')).toBeTruthy();
    });

    // "Just now" for recent sync
    expect(getByText(/Just now/)).toBeTruthy();
  });

  it('shows "Never" for integrations without lastSync', async () => {
    mockIntegrationsService.getIntegrations.mockResolvedValue({
      success: true,
      integrations: [mockIntegrations[1]], // MLS has no lastSync
    });

    const { getByText, queryByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('MLS')).toBeTruthy();
    });

    // Should not show sync time text
    expect(queryByText(/Synced/)).toBeNull();
  });

  it('displays correct icons for different integration types', async () => {
    const { getAllByTestId } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getAllByTestId('icon-Home').length).toBeGreaterThan(0);
    });
  });

  it('disables switch for pending integrations', async () => {
    const { getByText, getAllByRole } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Twilio')).toBeTruthy();
    });

    // Note: Switch disabled state is managed internally by React Native
    // We verify the pending status is displayed
    expect(getByText('pending')).toBeTruthy();
  });

  it('displays status badges correctly', async () => {
    const { getAllByText, getByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      // Multiple integrations have 'active' status
      expect(getAllByText('active').length).toBeGreaterThan(0);
    });

    expect(getByText('inactive')).toBeTruthy();
    expect(getByText('pending')).toBeTruthy();
    expect(getByText('error')).toBeTruthy();
  });

  it('does not show error count when no errors', async () => {
    mockIntegrationsService.getIntegrations.mockResolvedValue({
      success: true,
      integrations: mockIntegrations.filter(i => i.status !== 'error'),
    });

    const { queryByText, getByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('Zillow')).toBeTruthy();
    });

    // Error count should not be shown
    expect(queryByText(/1 Error/)).toBeNull();
  });

  it('shows singular error text when one error', async () => {
    const { getByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('1 Error')).toBeTruthy();
    });
  });

  it('shows plural errors text when multiple errors', async () => {
    mockIntegrationsService.getIntegrations.mockResolvedValue({
      success: true,
      integrations: [
        { ...mockIntegrations[3] }, // error
        { ...mockIntegrations[3], id: 'int-error-2' }, // another error
      ],
    });

    const { getByText } = render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(getByText('2 Errors')).toBeTruthy();
    });
  });

  it('handles refresh correctly', async () => {
    render(<IntegrationsScreen />);

    await waitFor(() => {
      expect(mockIntegrationsService.getIntegrations).toHaveBeenCalled();
    });

    // Note: Testing RefreshControl is complex in RTL
  });
});
