// src/features/deals/components/DealTimeline.tsx
// Zone B: Task B4 - Deal timeline component
// Displays chronological events for a deal, supports Focus Mode filtering
// Now uses Timeline component for consistency

import React from 'react';
import { Timeline, TimelineEvent } from '@/components/ui';
import { useDealEvents } from '../hooks/useDealEvents';
import type { DealEvent } from '../types/events';
import { EVENT_TYPE_CONFIG } from '../types/events';

// ============================================
// Main Component
// ============================================

interface DealTimelineProps {
  dealId: string;
  keyEventsOnly?: boolean;
  maxEvents?: number;
  onAddActivity?: () => void;
  showHeader?: boolean;
}

export function DealTimeline({
  dealId,
  keyEventsOnly = false,
  maxEvents,
  onAddActivity,
  showHeader = true,
}: DealTimelineProps) {
  const { events, keyEvents, isLoading, error } = useDealEvents(dealId);

  // Choose which events to display
  const displayEvents = keyEventsOnly ? keyEvents : events;

  // Map DealEvent to TimelineEvent
  const timelineEvents: TimelineEvent[] = displayEvents?.map(event => ({
    id: event.id,
    type: event.event_type,
    title: event.title,
    description: event.description,
    timestamp: event.created_at,
    metadata: event.metadata,
    source: event.source,
  })) || [];

  return (
    <Timeline
      events={timelineEvents}
      eventConfig={EVENT_TYPE_CONFIG}
      onAddActivity={onAddActivity}
      showHeader={showHeader}
      headerTitle="Activity"
      headerBadge={keyEventsOnly ? 'Focus Mode' : undefined}
      addButtonText="Add Note"
      maxEvents={maxEvents}
      emptyStateMessage={keyEventsOnly ? 'No key events yet' : 'No activity recorded yet'}
      emptyCTAText="Add First Note"
      isLoading={isLoading}
      error={error}
      errorMessage="Failed to load timeline"
    />
  );
}

export default DealTimeline;
