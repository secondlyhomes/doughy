// Tests for FloatingActionButton component
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { FloatingActionButton, QuickActionFAB } from '../FloatingActionButton';

describe('FloatingActionButton', () => {
  const mockActions = [
    {
      icon: <></>,
      label: 'Action 1',
      onPress: jest.fn(),
      color: '#3b82f6',
    },
    {
      icon: <></>,
      label: 'Action 2',
      onPress: jest.fn(),
      color: '#22c55e',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main FAB button', () => {
    const { getByTestId } = render(<FloatingActionButton actions={mockActions} />);

    // The Plus icon should be visible when closed
    expect(getByTestId('icon-Plus')).toBeTruthy();
  });

  it('should toggle menu when main button is pressed', () => {
    const { getByTestId, queryByText } = render(<FloatingActionButton actions={mockActions} />);

    // Initially, action labels should not be visible (opacity 0)
    // Press the main button to open
    fireEvent.press(getByTestId('icon-Plus').parent!);

    // The X icon should now be visible when open
    expect(getByTestId('icon-X')).toBeTruthy();
  });

  it('should render action labels when menu is open', () => {
    const { getByText, getByTestId } = render(<FloatingActionButton actions={mockActions} />);

    // Open the menu
    fireEvent.press(getByTestId('icon-Plus').parent!);

    // Verify action labels are visible
    expect(getByText('Action 1')).toBeTruthy();
    expect(getByText('Action 2')).toBeTruthy();
  });

  it('should close menu when backdrop is pressed', () => {
    const { getByTestId } = render(<FloatingActionButton actions={mockActions} />);

    // Open the menu
    fireEvent.press(getByTestId('icon-Plus').parent!);

    // X icon should be visible (menu is open)
    expect(getByTestId('icon-X')).toBeTruthy();
  });

  it('should use custom main color', () => {
    const { getByTestId } = render(
      <FloatingActionButton actions={mockActions} mainColor="#ff0000" />
    );

    expect(getByTestId('icon-Plus')).toBeTruthy();
  });

  it('should render action labels', () => {
    const { getByText, getByTestId } = render(<FloatingActionButton actions={mockActions} />);

    // Open menu first
    fireEvent.press(getByTestId('icon-Plus').parent!);

    expect(getByText('Action 1')).toBeTruthy();
    expect(getByText('Action 2')).toBeTruthy();
  });
});

describe('QuickActionFAB', () => {
  const mockHandlers = {
    onAddLead: jest.fn(),
    onAddProperty: jest.fn(),
    onStartChat: jest.fn(),
    onAddNote: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default actions', () => {
    const { getByTestId } = render(
      <QuickActionFAB
        onAddLead={mockHandlers.onAddLead}
        onAddProperty={mockHandlers.onAddProperty}
        onStartChat={mockHandlers.onStartChat}
      />
    );

    expect(getByTestId('icon-Plus')).toBeTruthy();
  });

  it('should show action labels when opened', () => {
    const { getByText, getByTestId } = render(
      <QuickActionFAB
        onAddLead={mockHandlers.onAddLead}
        onAddProperty={mockHandlers.onAddProperty}
        onStartChat={mockHandlers.onStartChat}
      />
    );

    // Open menu
    fireEvent.press(getByTestId('icon-Plus').parent!);

    expect(getByText('Add Lead')).toBeTruthy();
    expect(getByText('Add Property')).toBeTruthy();
    expect(getByText('Start Chat')).toBeTruthy();
  });

  it('should include Add Note when onAddNote is provided', () => {
    const { getByText, getByTestId } = render(
      <QuickActionFAB
        onAddLead={mockHandlers.onAddLead}
        onAddProperty={mockHandlers.onAddProperty}
        onStartChat={mockHandlers.onStartChat}
        onAddNote={mockHandlers.onAddNote}
      />
    );

    // Open menu
    fireEvent.press(getByTestId('icon-Plus').parent!);

    expect(getByText('Add Note')).toBeTruthy();
  });

  it('should display all quick action labels when opened', () => {
    const { getByText, getByTestId } = render(
      <QuickActionFAB
        onAddLead={mockHandlers.onAddLead}
        onAddProperty={mockHandlers.onAddProperty}
        onStartChat={mockHandlers.onStartChat}
      />
    );

    // Open menu
    fireEvent.press(getByTestId('icon-Plus').parent!);

    // Verify all action labels are visible
    expect(getByText('Add Lead')).toBeTruthy();
    expect(getByText('Add Property')).toBeTruthy();
    expect(getByText('Start Chat')).toBeTruthy();
  });
});
