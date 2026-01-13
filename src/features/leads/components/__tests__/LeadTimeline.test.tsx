// Tests for LeadTimeline component
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LeadTimeline, LeadActivity } from '../LeadTimeline';

describe('LeadTimeline', () => {
  const mockActivities: LeadActivity[] = [
    {
      id: '1',
      lead_id: 'lead-1',
      type: 'call',
      description: 'Test call description',
      created_at: new Date().toISOString(),
      metadata: { duration: '15 min' },
    },
    {
      id: '2',
      lead_id: 'lead-1',
      type: 'email',
      description: 'Test email description',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      lead_id: 'lead-1',
      type: 'meeting',
      description: 'Test meeting description',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockOnAddActivity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render header with Activity title', () => {
    const { getByText } = render(
      <LeadTimeline activities={[]} onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Activity')).toBeTruthy();
  });

  it('should render Log Activity button when onAddActivity is provided', () => {
    const { getByText } = render(
      <LeadTimeline activities={[]} onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Log Activity')).toBeTruthy();
  });

  it('should not render Log Activity button when onAddActivity is not provided', () => {
    const { queryByText } = render(<LeadTimeline activities={[]} />);

    expect(queryByText('Log Activity')).toBeNull();
  });

  it('should call onAddActivity when Log Activity button is pressed', () => {
    const { getByText } = render(
      <LeadTimeline activities={[]} onAddActivity={mockOnAddActivity} />
    );

    fireEvent.press(getByText('Log Activity'));

    expect(mockOnAddActivity).toHaveBeenCalled();
  });

  it('should render empty state when no activities', () => {
    const { getByText } = render(
      <LeadTimeline activities={[]} onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('No activity recorded yet')).toBeTruthy();
  });

  it('should render Log First Activity button in empty state', () => {
    const { getByText } = render(
      <LeadTimeline activities={[]} onAddActivity={mockOnAddActivity} />
    );

    const button = getByText('Log First Activity');
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(mockOnAddActivity).toHaveBeenCalled();
  });

  it('should render activities when provided', () => {
    const { getByText } = render(
      <LeadTimeline activities={mockActivities} onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Test call description')).toBeTruthy();
    expect(getByText('Test email description')).toBeTruthy();
    expect(getByText('Test meeting description')).toBeTruthy();
  });

  it('should render activity type labels', () => {
    const { getByText } = render(
      <LeadTimeline activities={mockActivities} onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Phone Call')).toBeTruthy();
    expect(getByText('Email')).toBeTruthy();
    expect(getByText('Meeting')).toBeTruthy();
  });

  it('should render duration metadata when present', () => {
    const { getByText } = render(
      <LeadTimeline activities={mockActivities} onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Duration: 15 min')).toBeTruthy();
  });

  it('should render all activity types correctly', () => {
    const allTypeActivities: LeadActivity[] = [
      { id: '1', lead_id: '1', type: 'call', description: 'Call activity', created_at: new Date().toISOString() },
      { id: '2', lead_id: '1', type: 'email', description: 'Email activity', created_at: new Date().toISOString() },
      { id: '3', lead_id: '1', type: 'text', description: 'Text activity', created_at: new Date().toISOString() },
      { id: '4', lead_id: '1', type: 'meeting', description: 'Meeting activity', created_at: new Date().toISOString() },
      { id: '5', lead_id: '1', type: 'note', description: 'Note activity', created_at: new Date().toISOString() },
      { id: '6', lead_id: '1', type: 'status_change', description: 'Status activity', created_at: new Date().toISOString() },
      { id: '7', lead_id: '1', type: 'property_shown', description: 'Property activity', created_at: new Date().toISOString() },
    ];

    const { getAllByText } = render(
      <LeadTimeline activities={allTypeActivities} />
    );

    // Use getAllByText since there may be multiple elements with same text (label + description)
    expect(getAllByText('Phone Call').length).toBeGreaterThan(0);
    expect(getAllByText(/Email/).length).toBeGreaterThan(0);
    expect(getAllByText('Text Message').length).toBeGreaterThan(0);
    expect(getAllByText(/Meeting/).length).toBeGreaterThan(0);
    expect(getAllByText('Note Added').length).toBeGreaterThan(0);
    expect(getAllByText('Status Changed').length).toBeGreaterThan(0);
    expect(getAllByText('Property Shown').length).toBeGreaterThan(0);
  });

  it('should format time correctly for recent activities', () => {
    const recentActivity: LeadActivity[] = [
      {
        id: '1',
        lead_id: '1',
        type: 'call',
        description: 'Recent call',
        created_at: new Date().toISOString(), // Just now
      },
    ];

    const { getByText } = render(<LeadTimeline activities={recentActivity} />);

    expect(getByText('Just now')).toBeTruthy();
  });
});
