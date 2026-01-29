// src/features/focus/hooks/useNudges.ts
// Hook for generating smart nudges from leads, deals, and capture items
// Uses actual contact_touches for staleness instead of updated_at

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useFocusMode, NudgeSettings, DEFAULT_NUDGE_SETTINGS } from '@/context/FocusModeContext';
import { Nudge, NudgePriority, NudgeSummary } from '../types';

// Storage key for snoozed nudges
const SNOOZED_NUDGES_KEY = 'doughy_snoozed_nudges';

interface SnoozeEntry {
  nudgeId: string;
  expiresAt: number;
}

// Fetch snoozed nudges from AsyncStorage
async function fetchSnoozedNudgeIds(): Promise<Set<string>> {
  try {
    const existing = await AsyncStorage.getItem(SNOOZED_NUDGES_KEY);
    if (!existing) return new Set();

    const snoozedNudges: SnoozeEntry[] = JSON.parse(existing);
    const now = Date.now();

    // Filter to only valid (not expired) snoozes and return their IDs
    const validSnoozedIds = snoozedNudges
      .filter(s => s.expiresAt > now)
      .map(s => s.nudgeId);

    return new Set(validSnoozedIds);
  } catch {
    return new Set();
  }
}

// Extended lead type with touch data
interface LeadWithTouchData {
  id: string;
  name: string;
  status: string;
  updated_at: string | null;
  last_touch_date: string | null;
  total_touches: number;
  responded_touches: number;
}

// Fetch leads with their touch data for proper staleness tracking
async function fetchLeadsWithTouchData(settings: NudgeSettings): Promise<LeadWithTouchData[]> {
  if (!settings.enabled) return [];

  // First, get active leads
  const { data: leads, error: leadsError } = await supabase
    .from('crm_leads')
    .select('id, name, status, updated_at')
    .in('status', ['active', 'new', 'follow-up'])
    .limit(50);

  if (leadsError) {
    console.error('Error fetching leads:', leadsError);
    throw new Error(`Failed to load leads: ${leadsError.message}`);
  }

  if (!leads || leads.length === 0) return [];

  // Get touch data for these leads
  const leadIds = leads.map(l => l.id);
  const { data: touches, error: touchesError } = await supabase
    .from('crm_contact_touches')
    .select('lead_id, created_at, responded')
    .in('lead_id', leadIds);

  if (touchesError) {
    console.error('Error fetching touch data:', touchesError);
    // Touch data is supplementary - continue with lead data without touches
    // This is acceptable degradation since the core lead data was fetched
    return leads.map(lead => ({
      ...lead,
      last_touch_date: null,
      total_touches: 0,
      responded_touches: 0,
    }));
  }

  // Group touches by lead
  const touchesByLead = new Map<string, { lastTouch: string | null; total: number; responded: number }>();
  (touches || []).forEach(touch => {
    const existing = touchesByLead.get(touch.lead_id) || { lastTouch: null, total: 0, responded: 0 };
    existing.total++;
    if (touch.responded) existing.responded++;
    if (!existing.lastTouch || touch.created_at > existing.lastTouch) {
      existing.lastTouch = touch.created_at;
    }
    touchesByLead.set(touch.lead_id, existing);
  });

  // Merge lead data with touch data
  return leads.map(lead => {
    const touchData = touchesByLead.get(lead.id) || { lastTouch: null, total: 0, responded: 0 };
    return {
      ...lead,
      last_touch_date: touchData.lastTouch,
      total_touches: touchData.total,
      responded_touches: touchData.responded,
    };
  });
}

// Fetch deals with stalled progress or overdue actions
async function fetchDealNudges(settings: NudgeSettings) {
  if (!settings.enabled) return [];

  const stalledDate = new Date();
  stalledDate.setDate(stalledDate.getDate() - settings.dealStalledDays);

  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('investor_deals_pipeline')
    .select(`
      id,
      stage,
      next_action,
      next_action_due,
      updated_at,
      lead:crm_leads(id, name),
      property:investor_properties(id, address_line_1, city, state)
    `)
    .not('stage', 'in', '(closed_won,closed_lost)')
    .limit(50);

  if (error) {
    console.error('Error fetching deal nudges:', error);
    throw new Error(`Failed to load deal nudges: ${error.message}`);
  }

  return data || [];
}

// Fetch pending capture items
async function fetchPendingCaptures() {
  const { data, error } = await supabase
    .from('ai_capture_items')
    .select('id, type, title, created_at, assigned_property_id')
    .in('status', ['pending', 'ready'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching pending captures:', error);
    throw new Error(`Failed to load pending captures: ${error.message}`);
  }

  return data || [];
}

export function useNudges() {
  const { nudgeSettings } = useFocusMode();
  const settings = nudgeSettings || DEFAULT_NUDGE_SETTINGS;

  // Fetch snoozed nudge IDs
  const { data: snoozedIds = new Set<string>() } = useQuery({
    queryKey: ['snoozed-nudge-ids'],
    queryFn: fetchSnoozedNudgeIds,
    refetchInterval: 10000, // Check for expired snoozes
    staleTime: 5000,
  });

  // Fetch all data sources - now using touch-aware lead fetching
  const { data: leadsWithTouches = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['nudges-leads-with-touches', settings.staleLeadWarningDays, settings.enabled],
    queryFn: () => fetchLeadsWithTouchData(settings),
    refetchInterval: 20000, // Refresh every 20 seconds for faster feedback
    staleTime: 10000,
  });

  const { data: dealData = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['nudges-deals', settings.dealStalledDays, settings.enabled],
    queryFn: () => fetchDealNudges(settings),
    refetchInterval: 20000, // Faster refresh
    staleTime: 10000,
  });

  const { data: pendingCaptures = [], isLoading: capturesLoading } = useQuery({
    queryKey: ['nudges-captures'],
    queryFn: fetchPendingCaptures,
    refetchInterval: 15000, // Faster refresh
    staleTime: 10000,
  });

  // Generate nudges from data
  const nudges = useMemo((): Nudge[] => {
    if (!settings.enabled) return [];

    const now = new Date();
    const allNudges: Nudge[] = [];

    // Process leads with touch tracking data
    leadsWithTouches.forEach((lead: LeadWithTouchData) => {
      // Use last_touch_date for staleness, fall back to updated_at
      const lastContact = lead.last_touch_date || lead.updated_at;
      const lastContactDate = lastContact ? new Date(lastContact) : null;
      const daysSinceContact = lastContactDate
        ? Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Skip if not stale enough
      if (daysSinceContact < settings.staleLeadWarningDays) return;

      const isCritical = daysSinceContact >= settings.staleLeadCriticalDays;

      // Build subtitle with touch info for better context
      let subtitle = lead.name;
      if (lead.total_touches > 0) {
        const responsiveness = lead.responded_touches / lead.total_touches;
        if (responsiveness === 0) {
          subtitle = `${lead.name} • ${lead.total_touches} touches, no response`;
        } else {
          subtitle = `${lead.name} • ${Math.round(responsiveness * 100)}% responsive`;
        }
      } else {
        subtitle = `${lead.name} • 0 touches`;
      }

      // Build title with actual touch info
      let title: string;
      if (lead.total_touches === 0) {
        title = 'No contact attempts recorded';
      } else if (lead.last_touch_date) {
        title = `No contact in ${daysSinceContact} days`;
      } else {
        title = `No activity in ${daysSinceContact} days`;
      }

      allNudges.push({
        id: `stale-lead-${lead.id}`,
        type: 'stale_lead',
        priority: isCritical ? 'high' : 'medium',
        title,
        subtitle,
        entityType: 'lead',
        entityId: lead.id,
        entityName: lead.name,
        daysOverdue: daysSinceContact,
        createdAt: lastContact || now.toISOString(),
        // Add touch metadata for potential future use
        touchCount: lead.total_touches,
        responsiveness: lead.total_touches > 0 ? lead.responded_touches / lead.total_touches : null,
      } as Nudge & { touchCount?: number; responsiveness?: number | null });
    });

    // Process deals - type the deal data properly
    interface DealWithRelations {
      id: string;
      stage: string;
      next_action: string | null;
      next_action_due: string | null;
      updated_at: string | null;
      lead: { id: string; name: string } | null;
      property: { id: string; address_line_1: string; city: string; state: string } | null;
    }
    (dealData as DealWithRelations[]).forEach((deal) => {
      // Check for overdue actions
      if (deal.next_action_due) {
        const dueDate = new Date(deal.next_action_due);
        dueDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const propertyAddress = deal.property
          ? `${deal.property.address_line_1}, ${deal.property.city}`
          : undefined;

        if (daysDiff < 0) {
          // Overdue
          allNudges.push({
            id: `action-overdue-${deal.id}`,
            type: 'action_overdue',
            priority: 'high',
            title: deal.next_action || 'Action overdue',
            subtitle: propertyAddress || deal.lead?.name,
            entityType: 'deal',
            entityId: deal.id,
            entityName: deal.lead?.name,
            propertyAddress,
            daysOverdue: Math.abs(daysDiff),
            dueDate: deal.next_action_due,
            createdAt: deal.next_action_due,
          });
        } else if (daysDiff <= 1) {
          // Due soon (today or tomorrow)
          allNudges.push({
            id: `action-due-${deal.id}`,
            type: 'action_due_soon',
            priority: daysDiff === 0 ? 'high' : 'medium',
            title: deal.next_action || 'Action due',
            subtitle: propertyAddress || deal.lead?.name,
            entityType: 'deal',
            entityId: deal.id,
            entityName: deal.lead?.name,
            propertyAddress,
            dueDate: deal.next_action_due,
            createdAt: deal.next_action_due,
          });
        }
      }

      // Check for stalled deals (no activity in X days)
      if (deal.updated_at) {
        const stalledDate = new Date();
        stalledDate.setDate(stalledDate.getDate() - settings.dealStalledDays);

        const lastUpdate = new Date(deal.updated_at);
        if (lastUpdate < stalledDate) {
          const daysSince = Math.floor(
            (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
          );

          const propertyAddress = deal.property
            ? `${deal.property.address_line_1}, ${deal.property.city}`
            : undefined;

          allNudges.push({
            id: `stalled-deal-${deal.id}`,
            type: 'deal_stalled',
            priority: 'medium',
            title: `No activity in ${daysSince} days`,
            subtitle: propertyAddress || deal.lead?.name,
            entityType: 'deal',
            entityId: deal.id,
            entityName: deal.lead?.name,
            propertyAddress,
            daysOverdue: daysSince,
            createdAt: deal.updated_at,
          });
        }
      }
    });

    // Process pending captures
    if (pendingCaptures.length > 0) {
      allNudges.push({
        id: 'capture-pending',
        type: 'capture_pending',
        priority: pendingCaptures.length > 5 ? 'medium' : 'low',
        title: `${pendingCaptures.length} item${pendingCaptures.length === 1 ? '' : 's'} pending triage`,
        subtitle: 'Tap to review',
        entityType: 'capture',
        entityId: 'queue',
        createdAt: pendingCaptures[0]?.created_at || now.toISOString(),
      });
    }

    // Filter out snoozed nudges
    const unsnoozedNudges = allNudges.filter(nudge => !snoozedIds.has(nudge.id));

    // Sort by priority (high first), then by daysOverdue
    return unsnoozedNudges.sort((a, b) => {
      const priorityOrder: Record<NudgePriority, number> = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (b.daysOverdue || 0) - (a.daysOverdue || 0);
    });
  }, [leadsWithTouches, dealData, pendingCaptures, settings, snoozedIds]);

  // Calculate summary with type-based breakdown
  const summary = useMemo((): NudgeSummary => {
    return nudges.reduce(
      (acc, nudge) => {
        acc.total++;
        acc[nudge.priority]++;

        // Type-based breakdown
        if (nudge.type === 'stale_lead' || nudge.type === 'deal_stalled') {
          acc.staleLeads++;
        } else if (nudge.type === 'action_overdue' || nudge.type === 'action_due_soon') {
          acc.overdueActions++;
        } else if (nudge.type === 'capture_pending') {
          acc.pendingCaptures++;
        }

        return acc;
      },
      { total: 0, high: 0, medium: 0, low: 0, staleLeads: 0, overdueActions: 0, pendingCaptures: 0 }
    );
  }, [nudges]);

  return {
    nudges,
    summary,
    isLoading: leadsLoading || dealsLoading || capturesLoading,
    enabled: settings.enabled,
  };
}

export default useNudges;
