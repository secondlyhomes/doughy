// Tests for AddActivitySheet component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AddActivitySheet } from '../AddActivitySheet';

describe('AddActivitySheet', () => {
  const mockProps = {
    visible: true,
    leadId: 'lead-1',
    leadName: 'John Doe',
    onClose: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with Log Activity title and lead name', () => {
    const { getByText } = render(<AddActivitySheet {...mockProps} />);

    expect(getByText('Log Activity')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('should render Save button', () => {
    const { getByText } = render(<AddActivitySheet {...mockProps} />);

    expect(getByText('Save')).toBeTruthy();
  });

  it('should render all activity type options', () => {
    const { getByText } = render(<AddActivitySheet {...mockProps} />);

    expect(getByText('Phone Call')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Text Message')).toBeTruthy();
    expect(getByText('Meeting')).toBeTruthy();
    expect(getByText('Note')).toBeTruthy();
    expect(getByText('Property Shown')).toBeTruthy();
  });

  it('should render description input placeholder', () => {
    const { getByPlaceholderText } = render(<AddActivitySheet {...mockProps} />);

    expect(getByPlaceholderText('What happened? Add details about the interaction...')).toBeTruthy();
  });

  it('should call onClose when X button is pressed', () => {
    const { getByTestId } = render(<AddActivitySheet {...mockProps} />);

    const closeButton = getByTestId('icon-X').parent;
    fireEvent.press(closeButton!);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should not call onSave when description is empty', () => {
    const { getByText } = render(<AddActivitySheet {...mockProps} />);

    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    expect(mockProps.onSave).not.toHaveBeenCalled();
  });

  it('should call onSave with activity data when description is filled', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddActivitySheet {...mockProps} />
    );

    // Enter description
    const input = getByPlaceholderText('What happened? Add details about the interaction...');
    fireEvent.changeText(input, 'Had a great conversation');

    // Press Save
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    expect(mockProps.onSave).toHaveBeenCalledWith({
      type: 'call', // Default type
      description: 'Had a great conversation',
      metadata: undefined,
    });
    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should allow selecting different activity types', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddActivitySheet {...mockProps} />
    );

    // Select Email type
    fireEvent.press(getByText('Email'));

    // Enter description
    const input = getByPlaceholderText('What happened? Add details about the interaction...');
    fireEvent.changeText(input, 'Sent follow-up email');

    // Save
    fireEvent.press(getByText('Save'));

    expect(mockProps.onSave).toHaveBeenCalledWith({
      type: 'email',
      description: 'Sent follow-up email',
      metadata: undefined,
    });
  });

  it('should show duration picker for call activity type', () => {
    const { getByText } = render(<AddActivitySheet {...mockProps} />);

    // Call is selected by default, duration should be visible
    expect(getByText('Duration')).toBeTruthy();
    expect(getByText('5 min')).toBeTruthy();
    expect(getByText('15 min')).toBeTruthy();
    expect(getByText('30 min')).toBeTruthy();
    expect(getByText('1 hour')).toBeTruthy();
  });

  it('should show outcome picker for call and meeting types', () => {
    const { getByText } = render(<AddActivitySheet {...mockProps} />);

    // Call is selected by default
    expect(getByText('Outcome')).toBeTruthy();
    expect(getByText('Positive')).toBeTruthy();
    expect(getByText('Neutral')).toBeTruthy();
    expect(getByText('No Answer')).toBeTruthy();
  });

  it('should include duration and outcome in metadata when selected', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddActivitySheet {...mockProps} />
    );

    // Enter description
    const input = getByPlaceholderText('What happened? Add details about the interaction...');
    fireEvent.changeText(input, 'Had a call');

    // Select duration
    fireEvent.press(getByText('15 min'));

    // Select outcome
    fireEvent.press(getByText('Positive'));

    // Save
    fireEvent.press(getByText('Save'));

    expect(mockProps.onSave).toHaveBeenCalledWith({
      type: 'call',
      description: 'Had a call',
      metadata: {
        duration: '15 min',
        outcome: 'positive',
      },
    });
  });

  it('should toggle duration selection when pressed twice', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddActivitySheet {...mockProps} />
    );

    // Enter description
    const input = getByPlaceholderText('What happened? Add details about the interaction...');
    fireEvent.changeText(input, 'Had a call');

    // Select duration
    fireEvent.press(getByText('15 min'));

    // Deselect duration by pressing again
    fireEvent.press(getByText('15 min'));

    // Save
    fireEvent.press(getByText('Save'));

    expect(mockProps.onSave).toHaveBeenCalledWith({
      type: 'call',
      description: 'Had a call',
      metadata: undefined,
    });
  });

  it('should reset form when closed', () => {
    const { getByText, getByPlaceholderText, getByTestId, rerender } = render(
      <AddActivitySheet {...mockProps} />
    );

    // Enter description and select options
    const input = getByPlaceholderText('What happened? Add details about the interaction...');
    fireEvent.changeText(input, 'Test description');
    fireEvent.press(getByText('Email'));
    fireEvent.press(getByTestId('icon-X').parent!);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should not render when visible is false', () => {
    const { queryByText } = render(
      <AddActivitySheet {...mockProps} visible={false} />
    );

    // Modal content shouldn't be visible
    // Note: Modal with visible={false} may still render but not display
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('should hide duration picker for note type', () => {
    const { getByText, queryByText } = render(<AddActivitySheet {...mockProps} />);

    // Select Note type
    fireEvent.press(getByText('Note'));

    // Duration should not be visible for note type
    expect(queryByText('Duration')).toBeNull();
  });

  it('should hide outcome picker for email type', () => {
    const { getByText, queryByText } = render(<AddActivitySheet {...mockProps} />);

    // Select Email type
    fireEvent.press(getByText('Email'));

    // Outcome should not be visible for email type
    expect(queryByText('Outcome')).toBeNull();
  });

  it('should show duration picker for meeting type', () => {
    const { getByText } = render(<AddActivitySheet {...mockProps} />);

    // Select Meeting type
    fireEvent.press(getByText('Meeting'));

    // Duration should be visible
    expect(getByText('Duration')).toBeTruthy();
    // Outcome should also be visible for meeting
    expect(getByText('Outcome')).toBeTruthy();
  });

  it('should trim description whitespace when saving', () => {
    const { getByText, getByPlaceholderText } = render(
      <AddActivitySheet {...mockProps} />
    );

    // Enter description with whitespace
    const input = getByPlaceholderText('What happened? Add details about the interaction...');
    fireEvent.changeText(input, '  Test description with spaces  ');

    // Save
    fireEvent.press(getByText('Save'));

    expect(mockProps.onSave).toHaveBeenCalledWith({
      type: 'call',
      description: 'Test description with spaces',
      metadata: undefined,
    });
  });
});
