// Tests for DealTimeline component
// Zone B: Task B4 - Deal timeline display

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// Mock the hooks and context
jest.mock('../../hooks/useDealEvents', () => ({
  useDealEvents: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => ({
  useThemeColors: () => ({
    primary: '#4d7c5f',
    info: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    destructive: '#ef4444',
    mutedForeground: '#64748b',
    border: '#e2e8f0',
    card: '#ffffff',
    foreground: '#0f172a',
  }),
}));

import { DealTimeline } from '../DealTimeline';
import { useDealEvents } from '../../hooks/useDealEvents';
import { DealEvent } from '../../types/events';

const mockUseDealEvents = useDealEvents as jest.Mock;

describe('DealTimeline', () => {
  const mockEvents: DealEvent[] = [
    {
      id: 'event-1',
      deal_id: 'deal-1',
      event_type: 'stage_change',
      title: 'Stage changed to Analyzing',
      description: 'Deal moved from Contacted to Analyzing',
      source: 'system',
      created_at: new Date().toISOString(),
    },
    {
      id: 'event-2',
      deal_id: 'deal-1',
      event_type: 'offer_created',
      title: 'Cash offer created',
      description: 'Draft offer for $185,000',
      source: 'user',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'event-3',
      deal_id: 'deal-1',
      event_type: 'note',
      title: 'Note added',
      description: 'Seller is motivated - needs to move by end of month',
      source: 'user',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const mockKeyEvents: DealEvent[] = mockEvents.filter((e) =>
    ['stage_change', 'offer_sent', 'walkthrough_completed'].includes(e.event_type)
  );

  const mockOnAddActivity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDealEvents.mockReturnValue({
      events: mockEvents,
      keyEvents: mockKeyEvents,
      recentEvents: mockEvents.slice(0, 5),
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      logEvent: { mutate: jest.fn() },
    });
  });

  it('should render Activity header', () => {
    const { getByText } = render(
      <DealTimeline dealId="deal-1" onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Activity')).toBeTruthy();
  });

  it('should render Add Note button when onAddActivity is provided', () => {
    const { getByText } = render(
      <DealTimeline dealId="deal-1" onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Add Note')).toBeTruthy();
  });

  it('should call onAddActivity when Add Note button is pressed', () => {
    const { getByText } = render(
      <DealTimeline dealId="deal-1" onAddActivity={mockOnAddActivity} />
    );

    fireEvent.press(getByText('Add Note'));

    expect(mockOnAddActivity).toHaveBeenCalled();
  });

  it('should render events when provided', () => {
    const { getByText } = render(
      <DealTimeline dealId="deal-1" onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Stage changed to Analyzing')).toBeTruthy();
    expect(getByText('Cash offer created')).toBeTruthy();
    expect(getByText('Note added')).toBeTruthy();
  });

  it('should render event descriptions', () => {
    const { getByText } = render(
      <DealTimeline dealId="deal-1" onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('Deal moved from Contacted to Analyzing')).toBeTruthy();
    expect(getByText('Draft offer for $185,000')).toBeTruthy();
  });

  it('should render empty state when no events', () => {
    mockUseDealEvents.mockReturnValue({
      events: [],
      keyEvents: [],
      recentEvents: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      logEvent: { mutate: jest.fn() },
    });

    const { getByText } = render(
      <DealTimeline dealId="deal-1" onAddActivity={mockOnAddActivity} />
    );

    expect(getByText('No activity recorded yet')).toBeTruthy();
  });

  it('should render Add First Note button in empty state', () => {
    mockUseDealEvents.mockReturnValue({
      events: [],
      keyEvents: [],
      recentEvents: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
      logEvent: { mutate: jest.fn() },
    });

    const { getByText } = render(
      <DealTimeline dealId="deal-1" onAddActivity={mockOnAddActivity} />
    );

    const button = getByText('Add First Note');
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(mockOnAddActivity).toHaveBeenCalled();
  });

  it('should show loading indicator when loading', () => {
    mockUseDealEvents.mockReturnValue({
      events: undefined,
      keyEvents: undefined,
      recentEvents: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
      logEvent: { mutate: jest.fn() },
    });

    const { UNSAFE_getByType } = render(
      <DealTimeline dealId="deal-1" />
    );

    // ActivityIndicator should be rendered
    const ActivityIndicator = require('react-native').ActivityIndicator;
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('should show error message when error occurs', () => {
    mockUseDealEvents.mockReturnValue({
      events: undefined,
      keyEvents: undefined,
      recentEvents: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: jest.fn(),
      logEvent: { mutate: jest.fn() },
    });

    const { getByText } = render(
      <DealTimeline dealId="deal-1" />
    );

    expect(getByText('Failed to load timeline')).toBeTruthy();
  });

  describe('Focus Mode', () => {
    it('should show Focus Mode badge when keyEventsOnly is true', () => {
      const { getByText } = render(
        <DealTimeline
          dealId="deal-1"
          keyEventsOnly={true}
          onAddActivity={mockOnAddActivity}
        />
      );

      expect(getByText('Focus Mode')).toBeTruthy();
    });

    it('should filter to key events only when keyEventsOnly is true', () => {
      const { queryByText } = render(
        <DealTimeline
          dealId="deal-1"
          keyEventsOnly={true}
          onAddActivity={mockOnAddActivity}
        />
      );

      // Stage change is a key event
      expect(queryByText('Stage changed to Analyzing')).toBeTruthy();
      // Note is NOT a key event (if our mock keyEvents doesn't include it)
    });

    it('should show "No key events yet" in empty Focus Mode', () => {
      mockUseDealEvents.mockReturnValue({
        events: mockEvents,
        keyEvents: [],
        recentEvents: mockEvents.slice(0, 5),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        logEvent: { mutate: jest.fn() },
      });

      const { getByText } = render(
        <DealTimeline
          dealId="deal-1"
          keyEventsOnly={true}
          onAddActivity={mockOnAddActivity}
        />
      );

      expect(getByText('No key events yet')).toBeTruthy();
    });
  });

  describe('maxEvents prop', () => {
    it('should limit displayed events when maxEvents is set', () => {
      const manyEvents: DealEvent[] = Array.from({ length: 10 }, (_, i) => ({
        id: `event-${i}`,
        deal_id: 'deal-1',
        event_type: 'note' as const,
        title: `Event ${i}`,
        source: 'user' as const,
        created_at: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      }));

      mockUseDealEvents.mockReturnValue({
        events: manyEvents,
        keyEvents: [],
        recentEvents: manyEvents.slice(0, 5),
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        logEvent: { mutate: jest.fn() },
      });

      const { getByText, queryByText } = render(
        <DealTimeline
          dealId="deal-1"
          maxEvents={3}
          onAddActivity={mockOnAddActivity}
        />
      );

      // First 3 events should be visible
      expect(getByText('Event 0')).toBeTruthy();
      expect(getByText('Event 1')).toBeTruthy();
      expect(getByText('Event 2')).toBeTruthy();

      // Event 3 should not be visible
      expect(queryByText('Event 3')).toBeNull();

      // Should show "View more" link
      expect(getByText('View 7 more events')).toBeTruthy();
    });
  });

  describe('Time formatting', () => {
    it('should display "Just now" for recent events', () => {
      mockUseDealEvents.mockReturnValue({
        events: [
          {
            id: 'event-recent',
            deal_id: 'deal-1',
            event_type: 'note',
            title: 'Recent event',
            source: 'user',
            created_at: new Date().toISOString(),
          },
        ],
        keyEvents: [],
        recentEvents: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        logEvent: { mutate: jest.fn() },
      });

      const { getByText } = render(<DealTimeline dealId="deal-1" />);

      expect(getByText('Just now')).toBeTruthy();
    });

    it('should display "Yesterday" for events from yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0); // Set to noon to ensure it's "yesterday"

      mockUseDealEvents.mockReturnValue({
        events: [
          {
            id: 'event-yesterday',
            deal_id: 'deal-1',
            event_type: 'note',
            title: 'Yesterday event',
            source: 'user',
            created_at: yesterday.toISOString(),
          },
        ],
        keyEvents: [],
        recentEvents: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
        logEvent: { mutate: jest.fn() },
      });

      const { getByText } = render(<DealTimeline dealId="deal-1" />);

      expect(getByText('Yesterday')).toBeTruthy();
    });
  });

  describe('Header visibility', () => {
    it('should hide header when showHeader is false', () => {
      const { queryByText } = render(
        <DealTimeline
          dealId="deal-1"
          showHeader={false}
          onAddActivity={mockOnAddActivity}
        />
      );

      expect(queryByText('Activity')).toBeNull();
      expect(queryByText('Add Note')).toBeNull();
    });
  });
});
