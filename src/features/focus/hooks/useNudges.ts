// src/features/focus/hooks/useNudges.ts
// Hook for generating smart nudges from leads, deals, and capture items

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useFocusMode, NudgeSettings, DEFAULT_NUDGE_SETTINGS } from '@/context/FocusModeContext';
import { Nudge, NudgePriority, NudgeSummary } from '../types';

// Fetch leads with last_contacted_at
async function fetchStaleLeads(settings: NudgeSettings) {
  if (!settings.enabled) return [];

  const warningDate = new Date();
  warningDate.setDate(warningDate.getDate() - settings.staleLeadWarningDays);

  const { data, error } = await supabase
    .from('crm_leads')
    .select('id, name, last_contacted_at, status')
    .in('status', ['active', 'new', 'follow-up'])
    .or(`last_contacted_at.lt.${warningDate.toISOString()},last_contacted_at.is.null`)
    .limit(50);

  if (error) {
    console.error('Error fetching stale leads:', error);
    return [];
  }

  return data || [];
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
    .from('deals')
    .select(`
      id,
      stage,
      next_action,
      next_action_due,
      updated_at,
      lead:crm_leads(id, name),
      property:re_properties(id, address_line_1, city, state)
    `)
    .not('stage', 'in', '(closed_won,closed_lost)')
    .limit(50);

  if (error) {
    console.error('Error fetching deal nudges:', error);
    return [];
  }

  return data || [];
}

// Fetch pending capture items
async function fetchPendingCaptures() {
  const { data, error } = await supabase
    .from('capture_items')
    .select('id, type, title, created_at, assigned_property_id')
    .in('status', ['pending', 'ready'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching pending captures:', error);
    return [];
  }

  return data || [];
}

export function useNudges() {
  const { nudgeSettings } = useFocusMode();
  const settings = nudgeSettings || DEFAULT_NUDGE_SETTINGS;

  // Fetch all data sources
  const { data: staleLeads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['nudges-stale-leads', settings.staleLeadWarningDays, settings.enabled],
    queryFn: () => fetchStaleLeads(settings),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  const { data: dealData = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['nudges-deals', settings.dealStalledDays, settings.enabled],
    queryFn: () => fetchDealNudges(settings),
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const { data: pendingCaptures = [], isLoading: capturesLoading } = useQuery({
    queryKey: ['nudges-captures'],
    queryFn: fetchPendingCaptures,
    refetchInterval: 30000,
    staleTime: 15000,
  });

  // Generate nudges from data
  const nudges = useMemo((): Nudge[] => {
    if (!settings.enabled) return [];

    const now = new Date();
    const allNudges: Nudge[] = [];

    // Process stale leads
    staleLeads.forEach((lead: any) => {
      const lastContact = lead.last_contacted_at ? new Date(lead.last_contacted_at) : null;
      const daysSince = lastContact
        ? Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Skip if not stale enough
      if (daysSince < settings.staleLeadWarningDays) return;

      const isCritical = daysSince >= settings.staleLeadCriticalDays;

      allNudges.push({
        id: `stale-lead-${lead.id}`,
        type: 'stale_lead',
        priority: isCritical ? 'high' : 'medium',
        title: lastContact
          ? `No contact in ${daysSince} days`
          : 'Never contacted',
        subtitle: lead.name,
        entityType: 'lead',
        entityId: lead.id,
        entityName: lead.name,
        daysOverdue: daysSince,
        createdAt: lead.last_contacted_at || now.toISOString(),
      });
    });

    // Process deals
    dealData.forEach((deal: any) => {
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

    // Sort by priority (high first), then by daysOverdue
    return allNudges.sort((a, b) => {
      const priorityOrder: Record<NudgePriority, number> = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (b.daysOverdue || 0) - (a.daysOverdue || 0);
    });
  }, [staleLeads, dealData, pendingCaptures, settings]);

  // Calculate summary
  const summary = useMemo((): NudgeSummary => {
    return nudges.reduce(
      (acc, nudge) => {
        acc.total++;
        acc[nudge.priority]++;
        return acc;
      },
      { total: 0, high: 0, medium: 0, low: 0 }
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
