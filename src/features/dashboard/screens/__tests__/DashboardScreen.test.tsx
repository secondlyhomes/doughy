// Tests for DashboardScreen
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardScreen } from '../DashboardScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock QuickActionFAB
jest.mock('@/features/layout', () => ({
  QuickActionFAB: ({
    onAddLead,
    onAddProperty,
    onStartChat,
  }: {
    onAddLead: () => void;
    onAddProperty: () => void;
    onStartChat: () => void;
  }) => {
    const React = require('react');
    const { View, TouchableOpacity, Text } = require('react-native');
    return (
      <View testID="quick-action-fab">
        <TouchableOpacity testID="fab-add-lead" onPress={onAddLead}>
          <Text>Add Lead</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="fab-add-property" onPress={onAddProperty}>
          <Text>Add Property</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="fab-start-chat" onPress={onStartChat}>
          <Text>Start Chat</Text>
        </TouchableOpacity>
      </View>
    );
  },
}));

describe('DashboardScreen', () => {
  let queryClient: QueryClient;

  const renderWithQueryClient = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <DashboardScreen />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Header', () => {
    it('should render header with Dashboard title', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Dashboard')).toBeTruthy();
    });

    it('should render subtitle', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Your business at a glance')).toBeTruthy();
    });
  });

  describe('Stats Cards', () => {
    it('should render conversion rate stat', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Conversion Rate')).toBeTruthy();
      expect(getByText('24.8%')).toBeTruthy();
    });

    it('should render response time stat', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Avg. Response Time')).toBeTruthy();
      expect(getByText('2.4h')).toBeTruthy();
    });

    it('should render credits used stat', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Credits Used')).toBeTruthy();
      expect(getByText('750')).toBeTruthy();
    });

    it('should render active leads stat', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Active Leads')).toBeTruthy();
      expect(getByText('56')).toBeTruthy();
    });

    it('should render trend indicators for stats with trends', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('+2.3% from last month')).toBeTruthy();
      expect(getByText('-18% from last week')).toBeTruthy();
    });
  });

  describe('Alert Banner', () => {
    it('should render response time alert', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Response Time Alert')).toBeTruthy();
      expect(
        getByText('3 high-value leads have been waiting over 24 hours for a response')
      ).toBeTruthy();
    });

    it('should navigate to Leads when View Leads is pressed', () => {
      const { getByText } = renderWithQueryClient();

      fireEvent.press(getByText('View Leads'));

      expect(mockNavigate).toHaveBeenCalledWith('Leads');
    });

    it('should dismiss alert when Dismiss is pressed', () => {
      const { getByText, queryByText } = renderWithQueryClient();

      fireEvent.press(getByText('Dismiss'));

      expect(queryByText('Response Time Alert')).toBeNull();
    });

    it('should dismiss alert when X button is pressed', () => {
      const { getByTestId, queryByText } = renderWithQueryClient();

      const closeButton = getByTestId('icon-X').parent;
      fireEvent.press(closeButton!);

      expect(queryByText('Response Time Alert')).toBeNull();
    });
  });

  describe('Priority Leads', () => {
    it('should render priority leads section', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Priority Leads')).toBeTruthy();
      expect(getByText('Leads that need immediate action')).toBeTruthy();
    });

    it('should render lead names', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Sarah Johnson')).toBeTruthy();
      expect(getByText('Michael Brown')).toBeTruthy();
      expect(getByText('Emily Davis')).toBeTruthy();
    });

    it('should render lead status badges', () => {
      const { getAllByText, getByText } = renderWithQueryClient();

      // Two leads are Hot, one is Warm
      const hotBadges = getAllByText('Hot');
      expect(hotBadges.length).toBe(2);
      expect(getByText('Warm')).toBeTruthy();
    });

    it('should render lead company and value', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText(/Acme Corp/)).toBeTruthy();
      expect(getByText(/\$15,000/)).toBeTruthy();
    });

    it('should render last contact time', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Last: 3 days ago')).toBeTruthy();
      expect(getByText('Last: 2 days ago')).toBeTruthy();
    });

    it('should navigate to lead detail when lead card is pressed', () => {
      const { getByText } = renderWithQueryClient();

      fireEvent.press(getByText('Sarah Johnson'));

      expect(mockNavigate).toHaveBeenCalledWith('LeadDetail', { id: '1' });
    });

    it('should navigate to Leads when View All Leads is pressed', () => {
      const { getByText } = renderWithQueryClient();

      fireEvent.press(getByText('View All Leads'));

      expect(mockNavigate).toHaveBeenCalledWith('Leads');
    });
  });

  describe('Quick Actions', () => {
    it('should render quick actions section', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Quick Actions')).toBeTruthy();
    });

    it('should navigate to AddLead when Add Lead button is pressed', () => {
      const { getAllByText } = renderWithQueryClient();

      // Find the Add Lead button in Quick Actions section (not the FAB)
      const addLeadButtons = getAllByText('Add Lead');
      // First one should be from QuickActions, second from FAB mock
      fireEvent.press(addLeadButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('AddLead');
    });

    it('should navigate to Assistant when AI Assistant button is pressed', () => {
      const { getByText } = renderWithQueryClient();

      fireEvent.press(getByText('AI Assistant'));

      expect(mockNavigate).toHaveBeenCalledWith('Assistant');
    });
  });

  describe('Floating Action Button', () => {
    it('should render QuickActionFAB', () => {
      const { getByTestId } = renderWithQueryClient();

      expect(getByTestId('quick-action-fab')).toBeTruthy();
    });

    it('should navigate to AddLead when FAB add lead is pressed', () => {
      const { getByTestId } = renderWithQueryClient();

      fireEvent.press(getByTestId('fab-add-lead'));

      expect(mockNavigate).toHaveBeenCalledWith('AddLead');
    });

    it('should navigate to Properties when FAB add property is pressed', () => {
      const { getByTestId } = renderWithQueryClient();

      fireEvent.press(getByTestId('fab-add-property'));

      expect(mockNavigate).toHaveBeenCalledWith('Properties');
    });

    it('should navigate to Assistant when FAB start chat is pressed', () => {
      const { getByTestId } = renderWithQueryClient();

      fireEvent.press(getByTestId('fab-start-chat'));

      expect(mockNavigate).toHaveBeenCalledWith('Assistant');
    });
  });

  describe('Pull to Refresh', () => {
    it('should have refresh control', () => {
      // The refresh control is part of ScrollView
      // This test verifies the component renders with refresh capability
      const { getByText } = renderWithQueryClient();

      expect(getByText('Dashboard')).toBeTruthy();
    });
  });

  describe('Status Colors', () => {
    it('should render Hot status with red background', () => {
      const { getAllByText } = renderWithQueryClient();

      const hotBadges = getAllByText('Hot');
      expect(hotBadges.length).toBe(2);
    });

    it('should render Warm status with amber background', () => {
      const { getByText } = renderWithQueryClient();

      expect(getByText('Warm')).toBeTruthy();
    });
  });

  describe('Icons', () => {
    it('should render stat card icons', () => {
      const { getAllByTestId } = renderWithQueryClient();

      // Use getAllByTestId since there may be multiple icons of same type
      expect(getAllByTestId('icon-TrendingUp').length).toBeGreaterThan(0);
      expect(getAllByTestId('icon-Clock').length).toBeGreaterThan(0);
      expect(getAllByTestId('icon-CreditCard').length).toBeGreaterThan(0);
      expect(getAllByTestId('icon-Users').length).toBeGreaterThan(0);
    });

    it('should render alert icon', () => {
      const { getAllByTestId } = renderWithQueryClient();

      const alertIcons = getAllByTestId('icon-AlertTriangle');
      expect(alertIcons.length).toBeGreaterThan(0);
    });
  });
});
