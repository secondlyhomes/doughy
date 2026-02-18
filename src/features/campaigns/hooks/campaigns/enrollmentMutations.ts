// src/features/campaigns/hooks/campaigns/enrollmentMutations.ts
// Mutation hooks for campaign enrollment operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { DripEnrollment } from '../../types';
import type { EnrollContactsInput, PauseEnrollmentInput } from './types';
import { campaignKeys } from './queryKeys';

/**
 * Enroll contacts in campaign via edge function
 */
export function useEnrollContacts() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (input: EnrollContactsInput) => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/drip-campaign-enroll`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(input),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to enroll contacts');
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.enrollments(variables.campaign_id),
      });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(variables.campaign_id),
      });
    },
  });
}

/**
 * Pause enrollment
 */
export function usePauseEnrollment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, reason }: PauseEnrollmentInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .schema('investor').from('drip_enrollments')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString(),
          paused_reason: reason,
        } as Record<string, unknown>)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DripEnrollment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.enrollments(data.campaign_id),
      });
    },
  });
}

/**
 * Resume enrollment
 */
export function useResumeEnrollment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .schema('investor').from('drip_enrollments')
        .update({
          status: 'active',
          resumed_at: new Date().toISOString(),
          // Reset next touch to now + some buffer
          next_touch_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        } as Record<string, unknown>)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as DripEnrollment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.enrollments(data.campaign_id),
      });
    },
  });
}

/**
 * Remove from campaign
 */
export function useRemoveFromCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get campaign_id before delete
      const { data: enrollment } = (await supabase
        .schema('investor').from('drip_enrollments')
        .select('campaign_id')
        .eq('id', id)
        .single()) as { data: { campaign_id: string } | null };

      const { error } = await supabase
        .schema('investor').from('drip_enrollments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { campaignId: enrollment?.campaign_id };
    },
    onSuccess: (data) => {
      if (data.campaignId) {
        queryClient.invalidateQueries({
          queryKey: campaignKeys.enrollments(data.campaignId),
        });
        queryClient.invalidateQueries({
          queryKey: campaignKeys.detail(data.campaignId),
        });
      }
    },
  });
}
