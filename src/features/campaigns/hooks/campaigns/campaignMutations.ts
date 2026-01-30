// src/features/campaigns/hooks/campaigns/campaignMutations.ts
// Mutation hooks for campaign CRUD operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { DripCampaign } from '../../types';
import type { CreateCampaignInput, UpdateCampaignInput } from './types';
import { campaignKeys } from './queryKeys';

/**
 * Create a new campaign
 */
export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('investor_campaigns')
        .insert({
          user_id: user.id,
          name: input.name,
          campaign_type: input.campaign_type || 'drip',
          status: 'draft',
          lead_type: input.lead_type,
          target_motivation: input.target_motivation,
          is_drip_campaign: input.is_drip_campaign ?? true,
          quiet_hours_start: input.quiet_hours_start,
          quiet_hours_end: input.quiet_hours_end,
          quiet_hours_timezone: input.quiet_hours_timezone || 'America/New_York',
          respect_weekends: input.respect_weekends ?? true,
          auto_pause_on_response: input.auto_pause_on_response ?? true,
          target_markets: input.target_markets,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DripCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}

/**
 * Update campaign
 */
export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateCampaignInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('investor_campaigns')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DripCampaign;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.id) });
    },
  });
}

/**
 * Delete campaign
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('investor_campaigns')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
    },
  });
}
