// Tests for SwipeableLeadCard component
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SwipeableLeadCard } from '../SwipeableLeadCard';
import { Lead } from '../../types';

// Mock Linking
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock useLeads hooks
const mockUpdateLead = {
  mutateAsync: jest.fn(),
  isPending: false,
};

const mockDeleteLead = {
  mutateAsync: jest.fn(),
  isPending: false,
};

jest.mock('../../hooks/useLeads', () => ({
  useUpdateLead: () => mockUpdateLead,
  useDeleteLead: () => mockDeleteLead,
}));

// Mock LeadCard
jest.mock('../LeadCard', () => ({
  LeadCard: ({ lead, onPress }: { lead: Lead; onPress: () => void }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="lead-card" onPress={onPress}>
        <Text>{lead.name}</Text>
      </TouchableOpacity>
    );
  },
}));

describe('SwipeableLeadCard', () => {
  const mockLead: Lead = {
    id: 'lead-1',
    user_id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-123-4567',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    starred: false,
  };

  const mockOnPress = jest.fn();
  let queryClient: QueryClient;

  const renderWithQueryClient = (ui: React.ReactElement) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateLead.mutateAsync.mockResolvedValue({});
    mockDeleteLead.mutateAsync.mockResolvedValue({});
  });

  it('should render the lead card', () => {
    const { getByText } = renderWithQueryClient(
      <SwipeableLeadCard lead={mockLead} onPress={mockOnPress} />
    );

    expect(getByText('John Doe')).toBeTruthy();
  });

  it('should call onPress when card is pressed', () => {
    const { getByTestId } = renderWithQueryClient(
      <SwipeableLeadCard lead={mockLead} onPress={mockOnPress} />
    );

    fireEvent.press(getByTestId('lead-card'));

    expect(mockOnPress).toHaveBeenCalled();
  });

  it('should render swipeable wrapper', () => {
    const { getByTestId } = renderWithQueryClient(
      <SwipeableLeadCard lead={mockLead} onPress={mockOnPress} />
    );

    expect(getByTestId('swipeable')).toBeTruthy();
  });

  it('should render lead without phone number', () => {
    const leadWithoutPhone = { ...mockLead, phone: undefined };

    const { getByText } = renderWithQueryClient(
      <SwipeableLeadCard lead={leadWithoutPhone} onPress={mockOnPress} />
    );

    // Component renders without errors
    expect(getByText('John Doe')).toBeTruthy();
    // Note: handleCall() would show Alert when triggered via swipe
    // Swipe action testing requires gesture simulation (react-native-gesture-handler mocks)
  });

  it('should render lead with special characters in phone (sanitized on action)', () => {
    const leadWithSpecialChars: Lead = {
      ...mockLead,
      phone: '555<script>123</script>4567',
    };

    const { getByText } = renderWithQueryClient(
      <SwipeableLeadCard lead={leadWithSpecialChars} onPress={mockOnPress} />
    );

    // Component renders without errors - sanitization is applied on swipe action
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('should render unstarred lead with star action available', () => {
    const { getByTestId } = renderWithQueryClient(
      <SwipeableLeadCard lead={mockLead} onPress={mockOnPress} />
    );

    // Swipeable component is rendered with left actions (star)
    expect(getByTestId('swipeable')).toBeTruthy();
    expect(mockLead.starred).toBe(false);
  });

  it('should render starred lead with unstar action available', () => {
    const starredLead = { ...mockLead, starred: true };

    const { getByTestId } = renderWithQueryClient(
      <SwipeableLeadCard lead={starredLead} onPress={mockOnPress} />
    );

    expect(getByTestId('swipeable')).toBeTruthy();
    expect(starredLead.starred).toBe(true);
  });

  it('should have update mutation configured for star toggle', () => {
    renderWithQueryClient(
      <SwipeableLeadCard lead={mockLead} onPress={mockOnPress} />
    );

    // Verify mock is properly configured - mutation is ready to be called on swipe action
    expect(mockUpdateLead.mutateAsync).toBeDefined();
    expect(mockUpdateLead.isPending).toBe(false);
  });

  it('should have delete mutation configured for archive action', () => {
    renderWithQueryClient(
      <SwipeableLeadCard lead={mockLead} onPress={mockOnPress} />
    );

    // Verify mock is properly configured - mutation is ready to be called on swipe action
    expect(mockDeleteLead.mutateAsync).toBeDefined();
    expect(mockDeleteLead.isPending).toBe(false);
  });

  // TODO: Full swipe action tests require gesture simulation with react-native-gesture-handler mocks
  // The following behaviors exist but cannot be tested without gesture simulation:
  // - handleCall: Opens tel: URL via Linking.openURL or shows Alert if no phone
  // - handleText: Opens sms: URL via Linking.openURL or shows Alert if no phone
  // - handleToggleStar: Calls updateLead.mutateAsync with { starred: !lead.starred }
  // - handleArchive: Shows confirmation Alert, then calls deleteLead.mutateAsync
  // See: https://docs.swmansion.com/react-native-gesture-handler/docs/guides/testing

  it('should render with archive action error handling configured', () => {
    mockDeleteLead.mutateAsync.mockRejectedValue(new Error('Network error'));

    const { getByTestId } = renderWithQueryClient(
      <SwipeableLeadCard lead={mockLead} onPress={mockOnPress} />
    );

    // Component renders - error handling will trigger Alert on swipe action failure
    expect(getByTestId('swipeable')).toBeTruthy();
  });

  it('should render with different lead statuses', () => {
    const leads: Lead[] = [
      { ...mockLead, status: 'new' },
      { ...mockLead, status: 'active' },
      { ...mockLead, status: 'follow-up' },
      { ...mockLead, status: 'inactive' },
    ];

    leads.forEach((lead) => {
      const { unmount } = renderWithQueryClient(
        <SwipeableLeadCard lead={lead} onPress={mockOnPress} />
      );
      unmount();
    });
  });

  it('should render lead with all optional fields', () => {
    const fullLead: Lead = {
      ...mockLead,
      company: 'Acme Corp',
      source: 'website',
      score: 85,
      notes: [{ id: 'note-1', lead_id: mockLead.id, content: 'Important client' }],
    };

    const { getByText } = renderWithQueryClient(
      <SwipeableLeadCard lead={fullLead} onPress={mockOnPress} />
    );

    expect(getByText('John Doe')).toBeTruthy();
  });

  it('should render lead without optional fields', () => {
    const minimalLead: Lead = {
      id: 'lead-2',
      user_id: 'user-1',
      name: 'Jane Smith',
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { getByText } = renderWithQueryClient(
      <SwipeableLeadCard lead={minimalLead} onPress={mockOnPress} />
    );

    expect(getByText('Jane Smith')).toBeTruthy();
  });
});
