// src/features/campaigns/hooks/campaigns/campaignQueries.ts
// Query hooks for fetching campaigns

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
  DripCampaign,
  CampaignStep,
  DripEnrollment,
} from '../../types';
import type { CampaignFilters } from './types';
import { campaignKeys } from './queryKeys';

/**
 * Fetch all campaigns with optional filters
 */
export function useCampaigns(filters: CampaignFilters = {}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('investor_campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.lead_type) {
        query = query.eq('lead_type', filters.lead_type);
      }

      if (filters.is_drip_campaign !== undefined) {
        query = query.eq('is_drip_campaign', filters.is_drip_campaign);
      }

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as DripCampaign[];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch single campaign with steps
 */
export function useCampaign(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: campaignKeys.detail(id || ''),
    queryFn: async () => {
      if (!user?.id || !id) return null;

      const { data, error } = await supabase
        .from('investor_campaigns')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as unknown as DripCampaign;
    },
    enabled: !!user?.id && !!id,
  });
}

/**
 * Fetch campaign steps
 */
export function useCampaignSteps(campaignId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: campaignKeys.steps(campaignId || ''),
    queryFn: async () => {
      if (!user?.id || !campaignId) return [];

      const { data, error } = await supabase
        .from('investor_drip_campaign_steps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('step_number', { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as CampaignStep[];
    },
    enabled: !!user?.id && !!campaignId,
  });
}

/**
 * Fetch campaign enrollments
 */
export function useCampaignEnrollments(campaignId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: campaignKeys.enrollments(campaignId || ''),
    queryFn: async () => {
      if (!user?.id || !campaignId) return [];

      const { data, error } = await supabase
        .from('investor_drip_enrollments')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as DripEnrollment[];
    },
    enabled: !!user?.id && !!campaignId,
  });
}
