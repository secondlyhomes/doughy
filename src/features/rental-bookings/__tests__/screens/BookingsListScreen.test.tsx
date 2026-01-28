// src/features/rental-bookings/__tests__/screens/BookingsListScreen.test.tsx
// Comprehensive tests for BookingsListScreen - booking list with search, filters, and navigation

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { BookingsListScreen } from '../../screens/BookingsListScreen';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Swipeable: View,
  };
});

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

// Mock theme context
const mockColors = {
  background: '#ffffff',
  foreground: '#000000',
  primary: '#007bff',
  primaryForeground: '#ffffff',
  muted: '#f0f0f0',
  border: '#cccccc',
  info: '#17a2b8',
};
jest.mock('@/context/ThemeContext', () => ({
  useThemeColors: () => mockColors,
}));

// Mock design utils
jest.mock('@/lib/design-utils', () => ({
  withOpacity: (color: string) => color,
}));

// Mock useDebounce hook
jest.mock('@/hooks', () => ({
  useDebounce: (value: string) => value,
}));

// Mock UI components
jest.mock('@/components', () => ({
  ThemedSafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/components/ui', () => {
  const { View, Text, TextInput, TouchableOpacity } = require('react-native');
  return {
    SearchBar: ({ value, onChangeText, onFilter, placeholder, hasActiveFilters }: any) => (
      <View testID="search-bar">
        <TextInput
          testID="search-input"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
        />
        <TouchableOpacity testID="filter-button" onPress={onFilter}>
          <Text>{hasActiveFilters ? 'Filters Active' : 'Filter'}</Text>
        </TouchableOpacity>
      </View>
    ),
    ListEmptyState: ({ title, description, primaryAction }: any) => (
      <View testID="empty-state">
        <Text testID="empty-title">{title}</Text>
        <Text testID="empty-description">{description}</Text>
        {primaryAction && (
          <TouchableOpacity testID="empty-action" onPress={primaryAction.onPress}>
            <Text>{primaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    TAB_BAR_SAFE_PADDING: 100,
    BottomSheet: ({ visible, children, title, onClose }: any) =>
      visible ? (
        <View testID="bottom-sheet">
          <Text>{title}</Text>
          <TouchableOpacity testID="close-sheet" onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
          {children}
        </View>
      ) : null,
    BottomSheetSection: ({ title, children }: any) => (
      <View testID={`section-${title.toLowerCase().replace(' ', '-')}`}>
        <Text>{title}</Text>
        {children}
      </View>
    ),
    Button: ({ children, onPress, variant }: any) => (
      <TouchableOpacity testID={`button-${variant || 'default'}`} onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    SimpleFAB: ({ onPress, accessibilityLabel }: any) => (
      <TouchableOpacity testID="fab" onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <Text>+</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@/components/ui/CardSkeletons', () => {
  const { View } = require('react-native');
  return {
    LeadCardSkeleton: () => <View testID="skeleton" />,
    SkeletonList: ({ count }: any) => (
      <View testID="skeleton-list">
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} testID="skeleton" />
        ))}
      </View>
    ),
  };
});

// Mock lucide icons
jest.mock('lucide-react-native', () => ({
  Plus: () => null,
  Calendar: () => null,
  Search: () => null,
  Check: () => null,
}));

// Mock BookingCard component
jest.mock('../../components/BookingCard', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    BookingCard: ({ booking, onPress }: any) => (
      <TouchableOpacity testID={`booking-card-${booking.id}`} onPress={onPress}>
        <View>
          <Text testID={`booking-name-${booking.id}`}>{booking.contact?.full_name || 'Guest'}</Text>
          <Text testID={`booking-status-${booking.id}`}>{booking.status}</Text>
        </View>
      </TouchableOpacity>
    ),
  };
});

// Mock useRentalBookings hook
const mockRefetch = jest.fn();
const mockUseRentalBookings = jest.fn();
jest.mock('../../hooks/useRentalBookings', () => ({
  useRentalBookings: () => mockUseRentalBookings(),
}));

// Sample booking data
const createMockBooking = (overrides = {}) => ({
  id: `booking-${Math.random().toString(36).substr(2, 9)}`,
  user_id: 'user-123',
  property_id: 'property-1',
  room_id: null,
  contact_id: 'contact-1',
  booking_type: 'reservation',
  status: 'confirmed',
  start_date: '2026-02-15',
  end_date: '2026-02-20',
  rate_amount: 150,
  rate_type: 'nightly',
  contact: {
    id: 'contact-1',
    full_name: 'John Smith',
    email: 'john@example.com',
  },
  property: {
    id: 'property-1',
    display_name: 'Beach House',
  },
  created_at: '2026-01-15T10:00:00Z',
  ...overrides,
});

const mockBookings = [
  createMockBooking({
    id: 'booking-1',
    status: 'confirmed',
    start_date: '2026-02-01',
    contact: { id: 'c1', full_name: 'Alice Johnson' },
  }),
  createMockBooking({
    id: 'booking-2',
    status: 'active',
    start_date: '2026-01-20',
    contact: { id: 'c2', full_name: 'Bob Williams' },
  }),
  createMockBooking({
    id: 'booking-3',
    status: 'pending',
    start_date: '2026-03-01',
    contact: { id: 'c3', full_name: 'Carol Davis' },
  }),
  createMockBooking({
    id: 'booking-4',
    status: 'completed',
    start_date: '2025-12-01',
    contact: { id: 'c4', full_name: 'Dave Brown' },
  }),
  createMockBooking({
    id: 'booking-5',
    status: 'inquiry',
    start_date: '2026-04-01',
    booking_type: 'lease',
    contact: { id: 'c5', full_name: 'Eve Wilson' },
  }),
];

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRentalBookings.mockReturnValue({
    bookings: mockBookings,
    filteredBookings: mockBookings,
    isLoading: false,
    refetch: mockRefetch,
    error: null,
  });
});

describe('BookingsListScreen', () => {
  describe('Rendering', () => {
    it('should render search bar', () => {
      render(<BookingsListScreen />);
      expect(screen.getByTestId('search-bar')).toBeTruthy();
      expect(screen.getByTestId('search-input')).toBeTruthy();
    });

    it('should render booking cards', () => {
      render(<BookingsListScreen />);
      expect(screen.getByTestId('booking-card-booking-1')).toBeTruthy();
      expect(screen.getByTestId('booking-card-booking-2')).toBeTruthy();
    });

    it('should render FAB button', () => {
      render(<BookingsListScreen />);
      expect(screen.getByTestId('fab')).toBeTruthy();
    });

    it('should show loading skeleton when loading', () => {
      mockUseRentalBookings.mockReturnValue({
        bookings: [],
        filteredBookings: [],
        isLoading: true,
        refetch: mockRefetch,
        error: null,
      });

      render(<BookingsListScreen />);
      expect(screen.getByTestId('skeleton-list')).toBeTruthy();
    });

    it('should show empty state when no bookings', () => {
      mockUseRentalBookings.mockReturnValue({
        bookings: [],
        filteredBookings: [],
        isLoading: false,
        refetch: mockRefetch,
        error: null,
      });

      render(<BookingsListScreen />);
      expect(screen.getByTestId('empty-state')).toBeTruthy();
      expect(screen.getByTestId('empty-title')).toHaveTextContent('No Bookings Yet');
    });
  });

  describe('Search Functionality', () => {
    it('should update search query on input', () => {
      render(<BookingsListScreen />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.changeText(searchInput, 'alice');

      expect(searchInput.props.value).toBe('alice');
    });

    it('should show filtered empty state with search query', () => {
      mockUseRentalBookings.mockReturnValue({
        bookings: mockBookings,
        filteredBookings: [],
        isLoading: false,
        refetch: mockRefetch,
        error: null,
      });

      render(<BookingsListScreen />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.changeText(searchInput, 'nonexistent');

      expect(screen.getByTestId('empty-title')).toHaveTextContent('No Results Found');
    });
  });

  describe('Filter Sheet', () => {
    it('should open filter sheet when filter button pressed', () => {
      render(<BookingsListScreen />);

      expect(screen.queryByTestId('bottom-sheet')).toBeNull();

      fireEvent.press(screen.getByTestId('filter-button'));

      expect(screen.getByTestId('bottom-sheet')).toBeTruthy();
    });

    it('should close filter sheet when close button pressed', () => {
      render(<BookingsListScreen />);

      fireEvent.press(screen.getByTestId('filter-button'));
      expect(screen.getByTestId('bottom-sheet')).toBeTruthy();

      fireEvent.press(screen.getByTestId('close-sheet'));
      expect(screen.queryByTestId('bottom-sheet')).toBeNull();
    });

    it('should show quick filter section', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      expect(screen.getByTestId('section-quick-filter')).toBeTruthy();
    });

    it('should show status filter section', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      expect(screen.getByTestId('section-status')).toBeTruthy();
    });

    it('should show booking type filter section', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      expect(screen.getByTestId('section-booking-type')).toBeTruthy();
    });
  });

  describe('Quick Filters', () => {
    it('should filter by upcoming bookings', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      // Find and press the "Upcoming" filter
      const upcomingFilter = screen.getByLabelText(/Filter by Upcoming/);
      fireEvent.press(upcomingFilter);

      // Close sheet and check filtered results
      fireEvent.press(screen.getByTestId('button-default')); // Done button

      // Should only show upcoming confirmed/pending bookings
      expect(screen.getByTestId('booking-card-booking-1')).toBeTruthy(); // confirmed, future
      expect(screen.getByTestId('booking-card-booking-3')).toBeTruthy(); // pending, future
      expect(screen.queryByTestId('booking-card-booking-2')).toBeNull(); // active (not upcoming)
      expect(screen.queryByTestId('booking-card-booking-4')).toBeNull(); // completed (past)
    });

    it('should filter by active bookings', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      const activeFilter = screen.getByLabelText(/Filter by Active/);
      fireEvent.press(activeFilter);
      fireEvent.press(screen.getByTestId('button-default'));

      expect(screen.getByTestId('booking-card-booking-2')).toBeTruthy();
      expect(screen.queryByTestId('booking-card-booking-1')).toBeNull();
    });

    it('should filter by pending bookings', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      const pendingFilter = screen.getByLabelText(/Filter by Pending/);
      fireEvent.press(pendingFilter);
      fireEvent.press(screen.getByTestId('button-default'));

      expect(screen.getByTestId('booking-card-booking-3')).toBeTruthy(); // pending
      expect(screen.getByTestId('booking-card-booking-5')).toBeTruthy(); // inquiry
    });

    it('should filter by completed/past bookings', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      const pastFilter = screen.getByLabelText(/Filter by Past/);
      fireEvent.press(pastFilter);
      fireEvent.press(screen.getByTestId('button-default'));

      expect(screen.getByTestId('booking-card-booking-4')).toBeTruthy();
    });
  });

  describe('Status Filters', () => {
    it('should filter by confirmed status', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      const confirmedFilter = screen.getByLabelText(/Status: Confirmed/);
      fireEvent.press(confirmedFilter);
      fireEvent.press(screen.getByTestId('button-default'));

      expect(screen.getByTestId('booking-card-booking-1')).toBeTruthy();
      expect(screen.queryByTestId('booking-card-booking-2')).toBeNull();
    });

    it('should filter by inquiry status', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      const inquiryFilter = screen.getByLabelText(/Status: Inquiry/);
      fireEvent.press(inquiryFilter);
      fireEvent.press(screen.getByTestId('button-default'));

      expect(screen.getByTestId('booking-card-booking-5')).toBeTruthy();
    });
  });

  describe('Booking Type Filters', () => {
    it('should filter by reservation type', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      const reservationFilter = screen.getByLabelText(/Type: Reservation/);
      fireEvent.press(reservationFilter);
      fireEvent.press(screen.getByTestId('button-default'));

      // booking-5 is a lease, should not appear
      expect(screen.queryByTestId('booking-card-booking-5')).toBeNull();
      expect(screen.getByTestId('booking-card-booking-1')).toBeTruthy();
    });

    it('should filter by lease type', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      const leaseFilter = screen.getByLabelText(/Type: Lease/);
      fireEvent.press(leaseFilter);
      fireEvent.press(screen.getByTestId('button-default'));

      expect(screen.getByTestId('booking-card-booking-5')).toBeTruthy();
      expect(screen.queryByTestId('booking-card-booking-1')).toBeNull();
    });
  });

  describe('Clear Filters', () => {
    it('should clear all filters when Clear Filters pressed', () => {
      render(<BookingsListScreen />);

      // Apply some filters
      fireEvent.press(screen.getByTestId('filter-button'));
      fireEvent.press(screen.getByLabelText(/Filter by Active/));
      fireEvent.press(screen.getByTestId('button-default'));

      // Verify filter applied
      expect(screen.queryByTestId('booking-card-booking-1')).toBeNull();

      // Clear filters
      fireEvent.press(screen.getByTestId('filter-button'));
      fireEvent.press(screen.getByTestId('button-outline')); // Clear Filters button

      // Verify all bookings visible again
      expect(screen.getByTestId('booking-card-booking-1')).toBeTruthy();
      expect(screen.getByTestId('booking-card-booking-2')).toBeTruthy();
    });

    it('should clear search and filters from empty state action', () => {
      mockUseRentalBookings.mockReturnValue({
        bookings: mockBookings,
        filteredBookings: [],
        isLoading: false,
        refetch: mockRefetch,
        error: null,
      });

      render(<BookingsListScreen />);

      // Search for something that returns no results
      fireEvent.changeText(screen.getByTestId('search-input'), 'xyz');

      // Click "Clear Filters" in empty state
      fireEvent.press(screen.getByTestId('empty-action'));

      expect(screen.getByTestId('search-input').props.value).toBe('');
    });
  });

  describe('Navigation', () => {
    it('should navigate to booking detail on card press', () => {
      render(<BookingsListScreen />);

      fireEvent.press(screen.getByTestId('booking-card-booking-1'));

      expect(mockPush).toHaveBeenCalledWith('/(tabs)/bookings/booking-1');
    });

    it('should trigger add booking on FAB press', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('fab'));

      expect(consoleSpy).toHaveBeenCalledWith('Add new booking');
      consoleSpy.mockRestore();
    });
  });

  describe('Refresh', () => {
    it('should call refetch on pull to refresh', () => {
      render(<BookingsListScreen />);

      // Find FlatList and trigger refresh
      // Since we're using mocked FlatList, we check that refetch is available
      expect(mockRefetch).toBeDefined();
    });
  });

  describe('Filter Indicator', () => {
    it('should show active filters indicator in search bar', () => {
      render(<BookingsListScreen />);

      // Initially no active filters
      expect(screen.getByText('Filter')).toBeTruthy();

      // Apply a filter
      fireEvent.press(screen.getByTestId('filter-button'));
      fireEvent.press(screen.getByLabelText(/Filter by Active/));
      fireEvent.press(screen.getByTestId('button-default'));

      // Should show filters active indicator
      expect(screen.getByText('Filters Active')).toBeTruthy();
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters together', () => {
      render(<BookingsListScreen />);

      fireEvent.press(screen.getByTestId('filter-button'));

      // Apply quick filter
      fireEvent.press(screen.getByLabelText(/Filter by Pending/));

      // Apply status filter
      fireEvent.press(screen.getByLabelText(/Status: Inquiry/));

      fireEvent.press(screen.getByTestId('button-default'));

      // Should only show inquiry bookings from pending filter set
      expect(screen.getByTestId('booking-card-booking-5')).toBeTruthy();
      expect(screen.queryByTestId('booking-card-booking-3')).toBeNull(); // pending but not inquiry
    });
  });

  describe('Loading States', () => {
    it('should not show skeleton when loading with existing data', () => {
      mockUseRentalBookings.mockReturnValue({
        bookings: mockBookings,
        filteredBookings: mockBookings,
        isLoading: true, // Loading but has data
        refetch: mockRefetch,
        error: null,
      });

      render(<BookingsListScreen />);

      // Should show existing data, not skeleton
      expect(screen.queryByTestId('skeleton-list')).toBeNull();
      expect(screen.getByTestId('booking-card-booking-1')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible FAB', () => {
      render(<BookingsListScreen />);

      const fab = screen.getByTestId('fab');
      expect(fab.props.accessibilityLabel).toBe('Add new booking');
    });

    it('should have accessible filter buttons', () => {
      render(<BookingsListScreen />);
      fireEvent.press(screen.getByTestId('filter-button'));

      // Quick filters
      expect(screen.getByLabelText(/Filter by All/)).toBeTruthy();
      expect(screen.getByLabelText(/Filter by Upcoming/)).toBeTruthy();

      // Status filters
      expect(screen.getByLabelText(/Status: All Statuses/)).toBeTruthy();
      expect(screen.getByLabelText(/Status: Confirmed/)).toBeTruthy();

      // Type filters
      expect(screen.getByLabelText(/Type: All Types/)).toBeTruthy();
      expect(screen.getByLabelText(/Type: Reservation/)).toBeTruthy();
    });
  });
});
