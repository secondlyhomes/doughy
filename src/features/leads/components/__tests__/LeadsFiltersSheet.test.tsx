// Tests for LeadsFiltersSheet component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LeadsFiltersSheet } from '../LeadsFiltersSheet';

describe('LeadsFiltersSheet', () => {
  const defaultFilters = {
    status: 'all' as const,
    source: 'all',
    priority: 'all',
    starred: null,
    sortBy: 'created_at' as const,
    sortOrder: 'desc' as const,
  };

  const mockProps = {
    visible: true,
    filters: defaultFilters,
    onClose: jest.fn(),
    onApply: jest.fn(),
    onReset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with Filters title', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('Filters')).toBeTruthy();
  });

  it('should render Reset button', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('Reset')).toBeTruthy();
  });

  it('should render Apply Filters button', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('Apply Filters')).toBeTruthy();
  });

  it('should render all status options', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('All Statuses')).toBeTruthy();
    expect(getByText('New')).toBeTruthy();
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Follow-up')).toBeTruthy();
    expect(getByText('Prospect')).toBeTruthy();
    expect(getByText('Inactive')).toBeTruthy();
    expect(getByText('Do Not Contact')).toBeTruthy();
  });

  it('should render all source options', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('All Sources')).toBeTruthy();
    expect(getByText('Website')).toBeTruthy();
    expect(getByText('Referral')).toBeTruthy();
    expect(getByText('Social Media')).toBeTruthy();
    expect(getByText('Cold Call')).toBeTruthy();
    expect(getByText('Direct Mail')).toBeTruthy();
    expect(getByText('Paid Ad')).toBeTruthy();
    expect(getByText('Other')).toBeTruthy();
  });

  it('should render starred filter options', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('All Leads')).toBeTruthy();
    expect(getByText('Starred Only')).toBeTruthy();
    expect(getByText('Not Starred')).toBeTruthy();
  });

  it('should render sort options', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('Date Added')).toBeTruthy();
    expect(getByText('Name')).toBeTruthy();
    expect(getByText('Lead Score')).toBeTruthy();
  });

  it('should render sort order options', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('Newest First')).toBeTruthy();
    expect(getByText('Oldest First')).toBeTruthy();
  });

  it('should call onClose when X button is pressed', () => {
    const { getByTestId } = render(<LeadsFiltersSheet {...mockProps} />);

    const closeButton = getByTestId('icon-X').parent;
    fireEvent.press(closeButton!);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should call onApply with updated filters when Apply is pressed', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    // Select a specific status
    fireEvent.press(getByText('Active'));

    // Press Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
      })
    );
  });

  it('should call onReset and reset local filters when Reset is pressed', () => {
    const { getByText } = render(
      <LeadsFiltersSheet
        {...mockProps}
        filters={{ ...defaultFilters, status: 'active' }}
      />
    );

    fireEvent.press(getByText('Reset'));

    expect(mockProps.onReset).toHaveBeenCalled();
  });

  it('should update status filter when option is selected', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    // Select New status
    fireEvent.press(getByText('New'));

    // Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'new',
      })
    );
  });

  it('should update source filter when option is selected', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    // Select Referral source
    fireEvent.press(getByText('Referral'));

    // Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'referral',
      })
    );
  });

  it('should update starred filter when Starred Only is selected', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    // Select Starred Only
    fireEvent.press(getByText('Starred Only'));

    // Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        starred: true,
      })
    );
  });

  it('should update starred filter when Not Starred is selected', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    // Select Not Starred
    fireEvent.press(getByText('Not Starred'));

    // Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        starred: false,
      })
    );
  });

  it('should update sortBy filter when option is selected', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    // Select Name sort
    fireEvent.press(getByText('Name'));

    // Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        sortBy: 'name',
      })
    );
  });

  it('should update sortOrder when Oldest First is selected', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    // Select Oldest First
    fireEvent.press(getByText('Oldest First'));

    // Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        sortOrder: 'asc',
      })
    );
  });

  it('should update sortOrder when Newest First is selected', () => {
    const { getByText } = render(
      <LeadsFiltersSheet
        {...mockProps}
        filters={{ ...defaultFilters, sortOrder: 'asc' }}
      />
    );

    // Select Newest First
    fireEvent.press(getByText('Newest First'));

    // Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        sortOrder: 'desc',
      })
    );
  });

  it('should sync local filters with props when sheet opens', () => {
    const customFilters = {
      ...defaultFilters,
      status: 'active' as const,
      source: 'website',
    };

    const { getByText, rerender } = render(
      <LeadsFiltersSheet {...mockProps} visible={false} filters={customFilters} />
    );

    // Open the sheet
    rerender(<LeadsFiltersSheet {...mockProps} visible={true} filters={customFilters} />);

    // Apply without changes should return the synced filters
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        source: 'website',
      })
    );
  });

  it('should apply multiple filter changes at once', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    // Select multiple filters
    fireEvent.press(getByText('Active'));
    fireEvent.press(getByText('Referral'));
    fireEvent.press(getByText('Starred Only'));
    fireEvent.press(getByText('Name'));
    fireEvent.press(getByText('Oldest First'));

    // Apply
    fireEvent.press(getByText('Apply Filters'));

    expect(mockProps.onApply).toHaveBeenCalledWith({
      status: 'active',
      source: 'referral',
      priority: 'all',
      starred: true,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  });

  it('should render section titles', () => {
    const { getByText } = render(<LeadsFiltersSheet {...mockProps} />);

    expect(getByText('Status')).toBeTruthy();
    expect(getByText('Source')).toBeTruthy();
    expect(getByText('Starred')).toBeTruthy();
    expect(getByText('Sort By')).toBeTruthy();
    expect(getByText('Sort Order')).toBeTruthy();
  });
});
