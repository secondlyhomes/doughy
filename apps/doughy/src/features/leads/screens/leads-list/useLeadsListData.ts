// src/features/leads/screens/leads-list/useLeadsListData.ts
// Data fetching, filtering, and sorting logic for the leads list screen

import { useMemo, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useDebounce } from '@/hooks';

import type { LeadWithProperties, LeadProperty } from '../../types';
import { useLeadsWithProperties, useOrphanProperties } from '../../hooks/useLeads';
import type { LeadFilters } from './types';
import { defaultFilters } from './constants';

export interface UseLeadsListDataParams {
  searchQuery: string;
  activeFilter: string;
  advancedFilters: LeadFilters;
}

export function useLeadsListData({
  searchQuery,
  activeFilter,
  advancedFilters,
}: UseLeadsListDataParams) {
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { leads, isLoading, refetch } = useLeadsWithProperties();
  const { properties: orphanProperties, isLoading: orphansLoading, refetch: refetchOrphans } = useOrphanProperties();

  const handleRefresh = useCallback(() => {
    refetch();
    refetchOrphans();
  }, [refetch, refetchOrphans]);

  // Filter leads and properties by search query
  const filteredData = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();

    // Filter leads
    let filteredLeads = leads.filter(lead => {
      const matchesSearch = !query ||
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query) ||
        lead.properties.some(p =>
          p.address_line_1?.toLowerCase().includes(query) ||
          p.city?.toLowerCase().includes(query)
        );

      const matchesQuickFilter = activeFilter === 'all' ||
        lead.status === activeFilter ||
        (activeFilter === 'starred' && lead.starred);

      const matchesAdvancedStatus = advancedFilters.status === 'all' ||
        lead.status === advancedFilters.status;
      const matchesSource = advancedFilters.source === 'all' ||
        lead.source === advancedFilters.source;
      const matchesStarred = advancedFilters.starred === null ||
        lead.starred === advancedFilters.starred;

      return matchesSearch && matchesQuickFilter && matchesAdvancedStatus && matchesSource && matchesStarred;
    });

    // Sort leads
    const { sortBy, sortOrder } = advancedFilters;
    const sortedLeads = [...filteredLeads].sort((a, b) => {
      if (sortBy === 'created_at') {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      } else if (sortBy === 'name') {
        const comparison = (a.name || '').localeCompare(b.name || '');
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    // Filter orphan properties
    const filteredOrphans = orphanProperties.filter(p => {
      if (!query) return true;
      return p.address_line_1?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query);
    });

    return { leads: sortedLeads, orphanProperties: filteredOrphans };
  }, [leads, orphanProperties, debouncedSearchQuery, activeFilter, advancedFilters]);

  const activeFiltersCount = [
    advancedFilters.status !== 'all',
    advancedFilters.source !== 'all',
    advancedFilters.starred !== null,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilter !== 'all' || activeFiltersCount > 0;

  return {
    filteredData,
    isLoading,
    orphansLoading,
    leads,
    hasActiveFilters,
    handleRefresh,
  };
}

export function useLeadsListNavigation() {
  const router = useRouter();

  const handleLeadPress = useCallback((lead: LeadWithProperties) => {
    router.push(`/(tabs)/leads/${lead.id}`);
  }, [router]);

  const handlePropertyPress = useCallback((property: LeadProperty) => {
    router.push(`/(tabs)/leads/property/${property.id}`);
  }, [router]);

  const handleStartDeal = useCallback((leadId: string | undefined, propertyId?: string) => {
    const params = new URLSearchParams();
    if (leadId) params.set('lead_id', leadId);
    if (propertyId) params.set('property_id', propertyId);
    router.push(`/(tabs)/deals/new?${params.toString()}`);
  }, [router]);

  return {
    handleLeadPress,
    handlePropertyPress,
    handleStartDeal,
  };
}
