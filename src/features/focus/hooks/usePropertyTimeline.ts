// src/features/focus/hooks/usePropertyTimeline.ts
// Hook for fetching combined timeline events for a property

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface TimelineEvent {
  id: string;
  type: 'capture' | 'deal_event' | 'conversation' | 'stage_change';
  title: string;
  subtitle?: string;
  timestamp: string;
  icon: string;
  color: string;
  entityId?: string;
  entityType?: string;
}

async function fetchPropertyTimeline(propertyId: string): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  // Fetch capture items assigned to this property
  const { data: captures } = await supabase
    .from('capture_items')
    .select('id, type, title, created_at, transcript, content')
    .eq('assigned_property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (captures) {
    captures.forEach((item: any) => {
      const typeIcons: Record<string, { icon: string; color: string }> = {
        recording: { icon: 'mic', color: 'destructive' },
        photo: { icon: 'camera', color: 'warning' },
        document: { icon: 'file-text', color: 'primary' },
        note: { icon: 'sticky-note', color: 'info' },
        call: { icon: 'phone', color: 'success' },
        text: { icon: 'message-square', color: 'info' },
      };
      const config = typeIcons[item.type] || { icon: 'circle', color: 'muted' };

      events.push({
        id: `capture-${item.id}`,
        type: 'capture',
        title: item.title || `${item.type} capture`,
        subtitle: item.transcript?.slice(0, 100) || item.content?.slice(0, 100),
        timestamp: item.created_at,
        icon: config.icon,
        color: config.color,
        entityId: item.id,
        entityType: 'capture',
      });
    });
  }

  // Fetch deals for this property and their events
  const { data: deals } = await supabase
    .from('deals')
    .select(`
      id,
      stage,
      created_at,
      updated_at,
      next_action,
      events:deal_events(id, event_type, description, created_at)
    `)
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (deals) {
    deals.forEach((deal: any) => {
      // Add deal events
      if (deal.events) {
        deal.events.forEach((event: any) => {
          events.push({
            id: `deal-event-${event.id}`,
            type: 'deal_event',
            title: event.event_type?.replace(/_/g, ' ') || 'Deal update',
            subtitle: event.description,
            timestamp: event.created_at,
            icon: 'activity',
            color: 'primary',
            entityId: deal.id,
            entityType: 'deal',
          });
        });
      }

      // Add deal creation as an event
      events.push({
        id: `deal-created-${deal.id}`,
        type: 'stage_change',
        title: 'Deal created',
        subtitle: `Stage: ${deal.stage?.replace(/_/g, ' ')}`,
        timestamp: deal.created_at,
        icon: 'plus-circle',
        color: 'success',
        entityId: deal.id,
        entityType: 'deal',
      });
    });
  }

  // Sort by timestamp descending
  return events.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ).slice(0, 30);
}

export function usePropertyTimeline(propertyId: string | null | undefined) {
  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['property-timeline', propertyId],
    queryFn: () => fetchPropertyTimeline(propertyId!),
    enabled: !!propertyId,
    staleTime: 30000,
  });

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Map<string, TimelineEvent[]> = new Map();

    events.forEach(event => {
      const date = new Date(event.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        });
      }

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(event);
    });

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      events: items,
    }));
  }, [events]);

  return {
    events,
    groupedEvents,
    isLoading,
    error,
    refetch,
  };
}

export default usePropertyTimeline;
