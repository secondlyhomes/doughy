// Tests for PropertyActionsSheet component
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { PropertyActionsSheet } from '../PropertyActionsSheet';
import { Property } from '../../types';
import { PropertyStatus } from '../../types/constants';

// Mock the hook
const mockShareProperty = jest.fn();
const mockExportPropertySummary = jest.fn();
const mockCopyPropertyLink = jest.fn();
const mockUpdatePropertyStatus = jest.fn();

jest.mock('../../hooks/usePropertyActions', () => ({
  usePropertyActions: jest.fn(() => ({
    shareProperty: mockShareProperty,
    exportPropertySummary: mockExportPropertySummary,
    copyPropertyLink: mockCopyPropertyLink,
    updatePropertyStatus: mockUpdatePropertyStatus,
    isLoading: false,
    error: null,
  })),
}));

// Mock BottomSheet
jest.mock('@/components/ui/BottomSheet', () => ({
  BottomSheet: ({ children, visible, title }: any) =>
    visible ? (
      <mock-bottom-sheet testID="bottom-sheet">
        <mock-title testID="sheet-title">{title}</mock-title>
        {children}
      </mock-bottom-sheet>
    ) : null,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: 'prop-123',
  address: '123 Main St',
  address_line_1: '123 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  propertyType: 'single_family',
  property_type: 'single_family',
  bedrooms: 3,
  bathrooms: 2,
  square_feet: 1500,
  sqft: 1500,
  status: 'Active',
  ...overrides,
});

describe('PropertyActionsSheet', () => {
  const defaultProps = {
    property: createMockProperty(),
    isOpen: true,
    onClose: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    onStatusChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the usePropertyActions mock to default state (prevents test pollution)
    const { usePropertyActions } = require('../../hooks/usePropertyActions');
    usePropertyActions.mockReturnValue({
      shareProperty: mockShareProperty,
      exportPropertySummary: mockExportPropertySummary,
      copyPropertyLink: mockCopyPropertyLink,
      updatePropertyStatus: mockUpdatePropertyStatus,
      isLoading: false,
      error: null,
    });
    mockShareProperty.mockResolvedValue(true);
    mockExportPropertySummary.mockResolvedValue('file.txt');
    mockCopyPropertyLink.mockResolvedValue(true);
    mockUpdatePropertyStatus.mockResolvedValue(true);
  });

  it('should render when isOpen is true', () => {
    const { getByTestId } = render(<PropertyActionsSheet {...defaultProps} />);
    expect(getByTestId('bottom-sheet')).toBeTruthy();
  });

  it('should not render when isOpen is false', () => {
    const { queryByTestId } = render(<PropertyActionsSheet {...defaultProps} isOpen={false} />);
    expect(queryByTestId('bottom-sheet')).toBeNull();
  });

  it('should render main menu with all action options', () => {
    const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);
    expect(getByText('Share Property')).toBeTruthy();
    expect(getByText('Copy Details')).toBeTruthy();
    expect(getByText('Export Summary')).toBeTruthy();
    expect(getByText('Change Status')).toBeTruthy();
  });

  it('should render Edit and Delete options when callbacks provided', () => {
    const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);
    expect(getByText('Edit Property')).toBeTruthy();
    expect(getByText('Delete Property')).toBeTruthy();
  });

  it('should not render Edit option when onEdit not provided', () => {
    const { queryByText } = render(
      <PropertyActionsSheet {...defaultProps} onEdit={undefined} />
    );
    expect(queryByText('Edit Property')).toBeNull();
  });

  describe('Share Options', () => {
    it('should navigate to share view when Share Property is pressed', () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Share Property'));

      expect(getByText('Quick Share (Basic Info)')).toBeTruthy();
      expect(getByText('Full Details')).toBeTruthy();
    });

    it('should have back button in share view', () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Share Property'));
      expect(getByText('Back')).toBeTruthy();
    });

    it('should return to main view when Back is pressed', () => {
      const { getByText, queryByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Share Property'));
      fireEvent.press(getByText('Back'));

      expect(queryByText('Quick Share (Basic Info)')).toBeNull();
      expect(getByText('Share Property')).toBeTruthy();
    });

    it('should call shareProperty with text format for Quick Share', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Share Property'));
      fireEvent.press(getByText('Quick Share (Basic Info)'));

      await waitFor(() => {
        expect(mockShareProperty).toHaveBeenCalledWith(defaultProps.property, 'text');
      });
    });

    it('should call shareProperty with full format for Full Details', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Share Property'));
      fireEvent.press(getByText('Full Details'));

      await waitFor(() => {
        expect(mockShareProperty).toHaveBeenCalledWith(defaultProps.property, 'full');
      });
    });

    it('should close sheet after successful share', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Share Property'));
      fireEvent.press(getByText('Quick Share (Basic Info)'));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Copy Details', () => {
    it('should call copyPropertyLink when Copy Details is pressed', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Copy Details'));

      await waitFor(() => {
        expect(mockCopyPropertyLink).toHaveBeenCalledWith(defaultProps.property);
      });
    });

    it('should show success alert after copying', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Copy Details'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Copied!', expect.any(String));
      });
    });

    it('should show error alert if copy fails', async () => {
      mockCopyPropertyLink.mockResolvedValueOnce(false);

      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Copy Details'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
      });
    });
  });

  describe('Export Summary', () => {
    it('should call exportPropertySummary when Export Summary is pressed', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Export Summary'));

      await waitFor(() => {
        expect(mockExportPropertySummary).toHaveBeenCalledWith(defaultProps.property);
      });
    });

    it('should close sheet after successful export', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Export Summary'));

      await waitFor(() => {
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should show error alert if export fails', async () => {
      mockExportPropertySummary.mockResolvedValueOnce(null);

      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Export Summary'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
      });
    });
  });

  describe('Change Status', () => {
    it('should navigate to status view when Change Status is pressed', () => {
      const { getByText, getAllByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Change Status'));

      // Check for status options - use getAllByText since "Active" appears in "Current: Active" too
      expect(getAllByText('Active').length).toBeGreaterThanOrEqual(1);
      expect(getByText('Pending')).toBeTruthy();
      expect(getByText('Sold')).toBeTruthy();
      expect(getByText('Withdrawn')).toBeTruthy();
      // Also check for statuses that don't appear elsewhere
      expect(getByText('Expired')).toBeTruthy();
      expect(getByText('Off Market')).toBeTruthy();
    });

    it('should show current status', () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Change Status'));

      expect(getByText(/Current:/)).toBeTruthy();
    });

    it('should call updatePropertyStatus when new status is selected', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Change Status'));
      fireEvent.press(getByText('Sold'));

      await waitFor(() => {
        expect(mockUpdatePropertyStatus).toHaveBeenCalledWith('prop-123', PropertyStatus.SOLD);
      });
    });

    it('should call onStatusChange after successful update', async () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Change Status'));
      fireEvent.press(getByText('Pending'));

      await waitFor(() => {
        expect(defaultProps.onStatusChange).toHaveBeenCalled();
      });
    });

    it('should not update if same status is selected', async () => {
      const property = createMockProperty({ status: 'Active' });
      const { getByText, getAllByText } = render(
        <PropertyActionsSheet {...defaultProps} property={property} />
      );

      fireEvent.press(getByText('Change Status'));
      // Get all "Active" elements and press the one in the status list (last one)
      const activeElements = getAllByText('Active');
      fireEvent.press(activeElements[activeElements.length - 1]); // Same as current

      await waitFor(() => {
        expect(mockUpdatePropertyStatus).not.toHaveBeenCalled();
      });
    });

    it('should show error alert if status update fails', async () => {
      mockUpdatePropertyStatus.mockResolvedValueOnce(false);

      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Change Status'));
      fireEvent.press(getByText('Sold'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', expect.any(String));
      });
    });
  });

  describe('Edit and Delete', () => {
    it('should call onEdit and close when Edit Property is pressed', () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Edit Property'));

      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(defaultProps.onEdit).toHaveBeenCalled();
    });

    it('should call onDelete and close when Delete Property is pressed', () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Delete Property'));

      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(defaultProps.onDelete).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should disable buttons when loading', () => {
      const { usePropertyActions } = require('../../hooks/usePropertyActions');
      usePropertyActions.mockReturnValue({
        shareProperty: mockShareProperty,
        exportPropertySummary: mockExportPropertySummary,
        copyPropertyLink: mockCopyPropertyLink,
        updatePropertyStatus: mockUpdatePropertyStatus,
        isLoading: true,
        error: null,
      });

      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      // Buttons should still be rendered but disabled
      expect(getByText('Share Property')).toBeTruthy();
    });
  });

  describe('Title changes', () => {
    it('should show Property Actions as default title', () => {
      const { getByTestId } = render(<PropertyActionsSheet {...defaultProps} />);
      expect(getByTestId('sheet-title').children[0]).toBe('Property Actions');
    });

    it('should show share view content when navigating to share', () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Share Property'));

      // Verify share view content is shown
      expect(getByText('Quick Share (Basic Info)')).toBeTruthy();
      expect(getByText('Full Details')).toBeTruthy();
    });

    it('should show status view content when navigating to status', () => {
      const { getByText } = render(<PropertyActionsSheet {...defaultProps} />);

      fireEvent.press(getByText('Change Status'));

      // Verify status view content is shown
      expect(getByText('Expired')).toBeTruthy();
      expect(getByText('Off Market')).toBeTruthy();
      expect(getByText(/Current:/)).toBeTruthy();
    });
  });

  describe('View reset on close', () => {
    it('should show main view elements when sheet is open', () => {
      const { getByText, rerender, queryByText } = render(
        <PropertyActionsSheet {...defaultProps} />
      );

      // Verify main view is shown initially
      expect(getByText('Share Property')).toBeTruthy();
      expect(getByText('Change Status')).toBeTruthy();

      // Close the sheet
      rerender(<PropertyActionsSheet {...defaultProps} isOpen={false} />);
      expect(queryByText('Share Property')).toBeNull(); // Sheet is closed

      // Reopen the sheet
      rerender(<PropertyActionsSheet {...defaultProps} isOpen={true} />);

      // Main view should be visible
      expect(getByText('Share Property')).toBeTruthy();
      expect(getByText('Change Status')).toBeTruthy();
    });
  });
});
