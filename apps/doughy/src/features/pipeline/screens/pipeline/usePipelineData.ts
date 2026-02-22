// src/features/pipeline/screens/pipeline/usePipelineData.ts
// Data fetching, filtering, counts, loading, and refresh logic for pipeline screen

import { useMemo, useCallback } from 'react';
import { useLeadsWithProperties, useCreateLead } from '@/features/leads/hooks/useLeads';
import { useDeals } from '@/features/deals/hooks/useDeals';
import { usePortfolio } from '@/features/portfolio/hooks/usePortfolio';
import { getDealAddress, getDealLeadName } from '@/features/deals/types';
import type { Deal } from '@/features/deals/types';
import type { PipelineSegment } from './types';

export function usePipelineData(activeSegment: PipelineSegment, debouncedSearch: string) {
  // Data hooks
  const { leads, isLoading: leadsLoading, refetch: refetchLeads } = useLeadsWithProperties();
  const createLead = useCreateLead();
  const { deals, isLoading: dealsLoading, refetch: refetchDeals } = useDeals({ activeOnly: true });
  const { properties: portfolioProperties, isLoading: portfolioLoading, refetch: refetchPortfolio, addManualEntry, isAddingManual } = usePortfolio();

  // Counts for segment badges
  const counts: Record<PipelineSegment, number> = useMemo(() => ({
    leads: leads?.length || 0,
    deals: deals?.length || 0,
    portfolio: portfolioProperties?.length || 0,
  }), [leads, deals, portfolioProperties]);

  // Filtered data based on search
  const filteredLeads = useMemo(() => {
    if (!debouncedSearch) return leads;
    const query = debouncedSearch.toLowerCase();
    return leads.filter(lead =>
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.includes(query) ||
      lead.properties.some(p =>
        p.address_line_1?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
      )
    );
  }, [leads, debouncedSearch]);

  const filteredDeals = useMemo(() => {
    if (!debouncedSearch) return deals;
    const query = debouncedSearch.toLowerCase();
    return deals?.filter((deal: Deal) =>
      getDealLeadName(deal).toLowerCase().includes(query) ||
      getDealAddress(deal).toLowerCase().includes(query)
    ) || [];
  }, [deals, debouncedSearch]);

  const filteredPortfolio = useMemo(() => {
    if (!debouncedSearch) return portfolioProperties;
    const query = debouncedSearch.toLowerCase();
    return portfolioProperties.filter(property =>
      property.address?.toLowerCase().includes(query) ||
      property.city?.toLowerCase().includes(query)
    );
  }, [portfolioProperties, debouncedSearch]);

  // Loading and refresh
  const isLoading = activeSegment === 'leads' ? leadsLoading :
                    activeSegment === 'deals' ? dealsLoading : portfolioLoading;

  const handleRefresh = useCallback(() => {
    if (activeSegment === 'leads') refetchLeads();
    else if (activeSegment === 'deals') refetchDeals();
    else refetchPortfolio();
  }, [activeSegment, refetchLeads, refetchDeals, refetchPortfolio]);

  // Get current data for active segment
  const currentData = activeSegment === 'leads' ? filteredLeads :
                      activeSegment === 'deals' ? filteredDeals : filteredPortfolio;

  return {
    counts,
    filteredLeads,
    filteredDeals,
    filteredPortfolio,
    currentData,
    isLoading,
    handleRefresh,
    createLead,
    addManualEntry,
    isAddingManual,
  };
}
