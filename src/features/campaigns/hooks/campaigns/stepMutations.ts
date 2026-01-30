// src/features/campaigns/hooks/campaigns/stepMutations.ts
// Mutation hooks for campaign step operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { CampaignStep } from '../../types';
import type { CreateStepInput, UpdateStepInput, DeleteStepInput } from './types';
import { campaignKeys } from './queryKeys';

/**
 * Create campaign step
 */
export function useCreateCampaignStep() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateStepInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const insertData = {
        ...input,
        delay_from_enrollment: input.delay_from_enrollment ?? true,
        use_ai_generation: input.use_ai_generation ?? false,
        skip_if_responded: input.skip_if_responded ?? true,
        skip_if_converted: input.skip_if_converted ?? true,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('investor_drip_campaign_steps')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CampaignStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.steps(data.campaign_id),
      });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(data.campaign_id),
      });
    },
  });
}

/**
 * Update campaign step
 */
export function useUpdateCampaignStep() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateStepInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Verify ownership by checking the campaign belongs to user
      const { data: step, error: fetchError } = await supabase
        .from('investor_drip_campaign_steps')
        .select('campaign_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { data: campaign, error: campaignError } = await supabase
        .from('investor_campaigns')
        .select('id')
        .eq('id', step.campaign_id)
        .eq('user_id', user.id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Step not found or access denied');
      }

      const { data, error } = await supabase
        .from('investor_drip_campaign_steps')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CampaignStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.steps(data.campaign_id),
      });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(data.campaign_id),
      });
    },
  });
}

/**
 * Delete campaign step
 */
export function useDeleteCampaignStep() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, campaignId }: DeleteStepInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Verify ownership by checking the campaign belongs to user
      const { data: campaign, error: campaignError } = await supabase
        .from('investor_campaigns')
        .select('id')
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found or access denied');
      }

      const { error } = await supabase
        .from('investor_drip_campaign_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { campaignId };
    },
    onSuccess: ({ campaignId }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.steps(campaignId) });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(campaignId),
      });
    },
  });
}
