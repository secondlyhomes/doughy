// src/features/portfolio/__tests__/screens/PortfolioScreen.test.tsx
// Comprehensive tests for PortfolioScreen - portfolio list with groups, search, and property management

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { PortfolioScreen } from '../../screens/PortfolioScreen';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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
  mutedForeground: '#666666',
  border: '#cccccc',
  success: '#28a745',
  destructive: '#dc3545',
};
jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => mockColors,
}));

// Mock useDebounce hook
jest.mock('@/hooks', () => ({
  useDebounce: (value: string) => value,
}));

// Mock haptics
jest.mock('@/lib/haptics', () => ({
  haptic: {
    light: jest.fn(),
    selection: jest.fn(),
  },
}));

// Mock components
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
    SimpleFAB: ({ onPress, accessibilityLabel }: any) => (
      <TouchableOpacity testID="fab" onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <Text>+</Text>
      </TouchableOpacity>
    ),
    TAB_BAR_SAFE_PADDING: 100,
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
  };
});

jest.mock('@/components/ui/CardSkeletons', () => {
  const { View } = require('react-native');
  return {
    PropertyCardSkeleton: () => <View testID="skeleton" />,
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
  Briefcase: () => null,
  Search: () => null,
  FolderPlus: () => null,
  ChevronDown: () => null,
  ChevronRight: () => null,
}));

// Mock portfolio components
jest.mock('../../components', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    AddToPortfolioSheet: ({ visible, onClose, onSubmit, isLoading }: any) =>
      visible ? (
        <View testID="add-property-sheet">
          <TouchableOpacity testID="close-add-sheet" onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="submit-property"
            onPress={() => onSubmit({ property_id: 'new-prop', acquisition_price: 100000 })}
          >
            <Text>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : null,
    CreateGroupSheet: ({ visible, onClose, onSubmit, onDelete, existingGroup }: any) =>
      visible ? (
        <View testID="create-group-sheet">
          <Text>{existingGroup ? 'Edit Group' : 'Create Group'}</Text>
          <TouchableOpacity testID="close-group-sheet" onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="submit-group" onPress={() => onSubmit({ name: 'Test Group' })}>
            <Text>Submit</Text>
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity testID="delete-group" onPress={onDelete}>
              <Text>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null,
    PortfolioSummaryCard: ({ summary }: any) => (
      <View testID="summary-card">
        <Text testID="total-properties">{summary.totalProperties} Properties</Text>
        <Text testID="total-value">${summary.totalValue}</Text>
        <Text testID="monthly-cash-flow">${summary.monthlyCashFlow}/mo</Text>
      </View>
    ),
  };
});

// Mock PropertyCard from real-estate feature
jest.mock('@/features/real-estate/components/PropertyCard', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return {
    PropertyCard: ({ property, onPress }: any) => (
      <TouchableOpacity testID={`property-card-${property.id}`} onPress={() => onPress(property)}>
        <View>
          <Text testID={`property-address-${property.id}`}>{property.address}</Text>
          <Text testID={`property-city-${property.id}`}>{property.city}</Text>
        </View>
      </TouchableOpacity>
    ),
  };
});

// Mock hooks
const mockRefetch = jest.fn();
const mockAddManualEntry = jest.fn();
const mockCreateGroup = jest.fn();
const mockUpdateGroup = jest.fn();
const mockDeleteGroup = jest.fn();

const mockUsePortfolio = jest.fn();
const mockUsePortfolioGroups = jest.fn();

jest.mock('../../hooks/usePortfolio', () => ({
  usePortfolio: () => mockUsePortfolio(),
}));

jest.mock('../../hooks/usePortfolioGroups', () => ({
  usePortfolioGroups: () => mockUsePortfolioGroups(),
}));

// Sample portfolio property data
const createMockProperty = (overrides = {}) => ({
  id: `prop-${Math.random().toString(36).substr(2, 9)}`,
  address: '123 Main St',
  address_line_1: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  square_feet: 2000,
  bedrooms: 3,
  bathrooms: 2,
  purchase_price: 350000,
  current_value: 400000,
  equity: 50000,
  monthly_rent: 2500,
  monthly_expenses: 800,
  monthly_cash_flow: 1700,
  group_id: null,
  ...overrides,
});

const mockProperties = [
  createMockProperty({ id: 'prop-1', address: '123 Main St', group_id: null }),
  createMockProperty({ id: 'prop-2', address: '456 Oak Ave', city: 'Dallas', group_id: 'group-1' }),
  createMockProperty({ id: 'prop-3', address: '789 Pine Rd', city: 'Houston', group_id: 'group-1' }),
];

const mockSummary = {
  totalProperties: 3,
  totalValue: 1200000,
  totalEquity: 300000,
  monthlyCashFlow: 5100,
};

const mockGroups = [
  {
    id: 'group-1',
    name: 'Texas Properties',
    color: '#ff6b6b',
    propertyCount: 2,
    totalValue: 800000,
    monthlyCashFlow: 3400,
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockUsePortfolio.mockReturnValue({
    properties: mockProperties,
    summary: mockSummary,
    isLoading: false,
    error: null,
    refetch: mockRefetch,
    addManualEntry: mockAddManualEntry,
    isAddingManual: false,
  });
  mockUsePortfolioGroups.mockReturnValue({
    groups: mockGroups,
    isLoading: false,
    createGroup: mockCreateGroup,
    updateGroup: mockUpdateGroup,
    deleteGroup: mockDeleteGroup,
    isCreating: false,
  });
});

describe('PortfolioScreen', () => {
  describe('Rendering', () => {
    it('should render search bar', () => {
      render(<PortfolioScreen />);
      expect(screen.getByTestId('search-bar')).toBeTruthy();
      expect(screen.getByTestId('search-input')).toBeTruthy();
    });

    it('should render FAB button', () => {
      render(<PortfolioScreen />);
      expect(screen.getByTestId('fab')).toBeTruthy();
      expect(screen.getByLabelText('Add property to portfolio')).toBeTruthy();
    });

    it('should render summary card when properties exist', () => {
      render(<PortfolioScreen />);
      expect(screen.getByTestId('summary-card')).toBeTruthy();
      expect(screen.getByTestId('total-properties')).toHaveTextContent('3 Properties');
      expect(screen.getByTestId('total-value')).toHaveTextContent('$1200000');
    });

    it('should render property cards', () => {
      render(<PortfolioScreen />);
      expect(screen.getByTestId('property-card-prop-1')).toBeTruthy();
      expect(screen.getByTestId('property-card-prop-2')).toBeTruthy();
      expect(screen.getByTestId('property-card-prop-3')).toBeTruthy();
    });

    it('should show loading skeleton when loading', () => {
      mockUsePortfolio.mockReturnValue({
        properties: [],
        summary: { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 },
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        addManualEntry: mockAddManualEntry,
        isAddingManual: false,
      });

      render(<PortfolioScreen />);
      expect(screen.getByTestId('skeleton-list')).toBeTruthy();
    });

    it('should show empty state when no properties', () => {
      mockUsePortfolio.mockReturnValue({
        properties: [],
        summary: { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        addManualEntry: mockAddManualEntry,
        isAddingManual: false,
      });
      mockUsePortfolioGroups.mockReturnValue({
        groups: [],
        isLoading: false,
        createGroup: mockCreateGroup,
        updateGroup: mockUpdateGroup,
        deleteGroup: mockDeleteGroup,
        isCreating: false,
      });

      render(<PortfolioScreen />);
      expect(screen.getByTestId('empty-state')).toBeTruthy();
      expect(screen.getByTestId('empty-title')).toHaveTextContent('No Properties Yet');
    });
  });

  describe('Search Functionality', () => {
    it('should update search query on input', () => {
      render(<PortfolioScreen />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.changeText(searchInput, 'austin');

      expect(searchInput.props.value).toBe('austin');
    });

    it('should filter properties by search query', () => {
      render(<PortfolioScreen />);

      fireEvent.changeText(screen.getByTestId('search-input'), 'Dallas');

      // Only Dallas property should be visible (prop-2)
      expect(screen.getByTestId('property-card-prop-2')).toBeTruthy();
      expect(screen.queryByTestId('property-card-prop-1')).toBeNull();
    });

    it('should show filtered empty state with search', () => {
      render(<PortfolioScreen />);

      fireEvent.changeText(screen.getByTestId('search-input'), 'nonexistent');

      expect(screen.getByTestId('empty-title')).toHaveTextContent('No Results Found');
    });

    it('should clear search from empty state action', () => {
      render(<PortfolioScreen />);

      fireEvent.changeText(screen.getByTestId('search-input'), 'nonexistent');
      fireEvent.press(screen.getByTestId('empty-action'));

      expect(screen.getByTestId('search-input').props.value).toBe('');
    });
  });

  describe('Grouping', () => {
    it('should show Create Group button when properties exist', () => {
      render(<PortfolioScreen />);
      expect(screen.getByText('Create Group')).toBeTruthy();
    });

    it('should not show Create Group button when no properties', () => {
      mockUsePortfolio.mockReturnValue({
        properties: [],
        summary: { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        addManualEntry: mockAddManualEntry,
        isAddingManual: false,
      });

      render(<PortfolioScreen />);
      expect(screen.queryByText('Create Group')).toBeNull();
    });

    it('should open create group sheet when Create Group pressed', () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByText('Create Group'));

      expect(screen.getByTestId('create-group-sheet')).toBeTruthy();
      // Sheet title and button have same text, so just check sheet is visible
      expect(screen.getAllByText('Create Group').length).toBeGreaterThanOrEqual(1);
    });

    it('should close create group sheet', () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByText('Create Group'));
      expect(screen.getByTestId('create-group-sheet')).toBeTruthy();

      fireEvent.press(screen.getByTestId('close-group-sheet'));
      expect(screen.queryByTestId('create-group-sheet')).toBeNull();
    });

    it('should call createGroup on submit', async () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByText('Create Group'));
      fireEvent.press(screen.getByTestId('submit-group'));

      await waitFor(() => {
        expect(mockCreateGroup).toHaveBeenCalledWith({ name: 'Test Group' });
      });
    });
  });

  describe('Add Property Sheet', () => {
    it('should open add property sheet when FAB pressed', () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByTestId('fab'));

      expect(screen.getByTestId('add-property-sheet')).toBeTruthy();
    });

    it('should close add property sheet', () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByTestId('fab'));
      expect(screen.getByTestId('add-property-sheet')).toBeTruthy();

      fireEvent.press(screen.getByTestId('close-add-sheet'));
      expect(screen.queryByTestId('add-property-sheet')).toBeNull();
    });

    it('should call addManualEntry on submit', async () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByTestId('fab'));
      fireEvent.press(screen.getByTestId('submit-property'));

      await waitFor(() => {
        expect(mockAddManualEntry).toHaveBeenCalledWith({
          property_id: 'new-prop',
          acquisition_price: 100000,
        });
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to property detail on card press', () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByTestId('property-card-prop-1'));

      expect(mockPush).toHaveBeenCalledWith('/(tabs)/portfolio/prop-1');
    });
  });

  describe('Filter Sheet', () => {
    it('should open filter sheet when filter button pressed', () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByTestId('filter-button'));

      expect(screen.getByTestId('bottom-sheet')).toBeTruthy();
    });

    it('should close filter sheet when done pressed', () => {
      render(<PortfolioScreen />);

      fireEvent.press(screen.getByTestId('filter-button'));
      fireEvent.press(screen.getByTestId('button-default')); // Done button

      expect(screen.queryByTestId('bottom-sheet')).toBeNull();
    });

    it('should clear search when Clear Search pressed', () => {
      render(<PortfolioScreen />);

      // Set search query
      fireEvent.changeText(screen.getByTestId('search-input'), 'test');
      expect(screen.getByTestId('search-input').props.value).toBe('test');

      // Open filter sheet and clear
      fireEvent.press(screen.getByTestId('filter-button'));
      fireEvent.press(screen.getByTestId('button-outline')); // Clear Search button

      expect(screen.getByTestId('search-input').props.value).toBe('');
    });
  });

  describe('Loading States', () => {
    it('should not show skeleton when loading with existing data', () => {
      mockUsePortfolio.mockReturnValue({
        properties: mockProperties,
        summary: mockSummary,
        isLoading: true, // Loading but has data (refreshing)
        error: null,
        refetch: mockRefetch,
        addManualEntry: mockAddManualEntry,
        isAddingManual: false,
      });

      render(<PortfolioScreen />);

      // Should show existing data, not skeleton
      expect(screen.queryByTestId('skeleton-list')).toBeNull();
      expect(screen.getByTestId('property-card-prop-1')).toBeTruthy();
    });
  });

  describe('Section Headers', () => {
    it('should render group section headers', () => {
      render(<PortfolioScreen />);

      // Should have "Texas Properties" group header
      expect(screen.getByText('Texas Properties')).toBeTruthy();
    });

    it('should render ungrouped section when groups exist', () => {
      render(<PortfolioScreen />);

      // Should have "Ungrouped" section for prop-1
      expect(screen.getByText('Ungrouped')).toBeTruthy();
    });

    it('should not render section headers when no groups', () => {
      mockUsePortfolioGroups.mockReturnValue({
        groups: [],
        isLoading: false,
        createGroup: mockCreateGroup,
        updateGroup: mockUpdateGroup,
        deleteGroup: mockDeleteGroup,
        isCreating: false,
      });

      render(<PortfolioScreen />);

      // Should not show "Ungrouped" when there are no groups
      expect(screen.queryByText('Ungrouped')).toBeNull();
    });
  });

  describe('Empty State Actions', () => {
    it('should open add property sheet from empty state', () => {
      mockUsePortfolio.mockReturnValue({
        properties: [],
        summary: { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        addManualEntry: mockAddManualEntry,
        isAddingManual: false,
      });
      mockUsePortfolioGroups.mockReturnValue({
        groups: [],
        isLoading: false,
        createGroup: mockCreateGroup,
        updateGroup: mockUpdateGroup,
        deleteGroup: mockDeleteGroup,
        isCreating: false,
      });

      render(<PortfolioScreen />);

      fireEvent.press(screen.getByTestId('empty-action')); // "Add Property" button

      expect(screen.getByTestId('add-property-sheet')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible FAB', () => {
      render(<PortfolioScreen />);

      const fab = screen.getByTestId('fab');
      expect(fab.props.accessibilityLabel).toBe('Add property to portfolio');
    });
  });

  describe('Summary Display', () => {
    it('should not show summary when no properties', () => {
      mockUsePortfolio.mockReturnValue({
        properties: [],
        summary: { totalProperties: 0, totalValue: 0, totalEquity: 0, monthlyCashFlow: 0 },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        addManualEntry: mockAddManualEntry,
        isAddingManual: false,
      });

      render(<PortfolioScreen />);

      expect(screen.queryByTestId('summary-card')).toBeNull();
    });

    it('should show monthly cash flow in summary', () => {
      render(<PortfolioScreen />);

      expect(screen.getByTestId('monthly-cash-flow')).toHaveTextContent('$5100/mo');
    });
  });
});
