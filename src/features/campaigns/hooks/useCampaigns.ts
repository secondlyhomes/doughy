// src/features/campaigns/hooks/useCampaigns.ts
// React Query hooks for drip campaigns

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
  DripCampaign,
  CampaignStep,
  DripEnrollment,
  DripLeadType,
  DripChannel,
} from '../types';

// =============================================================================
// Query Keys
// =============================================================================

export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (filters: CampaignFilters) => [...campaignKeys.lists(), filters] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  steps: (campaignId: string) => [...campaignKeys.all, 'steps', campaignId] as const,
  enrollments: (campaignId: string) => [...campaignKeys.all, 'enrollments', campaignId] as const,
};

// =============================================================================
// Types
// =============================================================================

export interface CampaignFilters {
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'all';
  lead_type?: DripLeadType;
  is_drip_campaign?: boolean;
  search?: string;
}

export interface CreateCampaignInput {
  name: string;
  campaign_type?: string;
  lead_type?: DripLeadType;
  target_motivation?: 'hot' | 'warm' | 'cold' | 'not_motivated';
  is_drip_campaign?: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;
  respect_weekends?: boolean;
  auto_pause_on_response?: boolean;
  target_markets?: string[];
  notes?: string;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  id: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export interface CreateStepInput {
  campaign_id: string;
  step_number: number;
  delay_days: number;
  delay_from_enrollment?: boolean;
  channel: DripChannel;
  subject?: string;
  message_body?: string;
  template_id?: string;
  use_ai_generation?: boolean;
  ai_tone?: string;
  mail_piece_type?: string;
  mail_template_id?: string;
  talking_points?: string[];
  call_script?: string;
  skip_if_responded?: boolean;
  skip_if_converted?: boolean;
}

export interface EnrollContactsInput {
  campaign_id: string;
  contact_ids: string[];
  deal_id?: string;
  context?: {
    property_address?: string;
    pain_points?: string[];
    motivation_score?: number;
  };
  start_immediately?: boolean;
  allow_re_enrollment?: boolean;
}

// =============================================================================
// Campaigns Queries
// =============================================================================

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
        .from('drip_campaign_steps')
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
        .from('drip_enrollments')
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

// =============================================================================
// Campaigns Mutations
// =============================================================================

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

// =============================================================================
// Steps Mutations
// =============================================================================

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
        .from('drip_campaign_steps')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CampaignStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.steps(data.campaign_id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.campaign_id) });
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
    mutationFn: async ({ id, ...updates }: Partial<CampaignStep> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Verify ownership by checking the campaign belongs to user
      const { data: step, error: fetchError } = await supabase
        .from('drip_campaign_steps')
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
        .from('drip_campaign_steps')
        .update(updates as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CampaignStep;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.steps(data.campaign_id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.campaign_id) });
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
    mutationFn: async ({ id, campaignId }: { id: string; campaignId: string }) => {
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
        .from('drip_campaign_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { campaignId };
    },
    onSuccess: ({ campaignId }) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.steps(campaignId) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
    },
  });
}

// =============================================================================
// Enrollment Mutations
// =============================================================================

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
            'Authorization': `Bearer ${session.access_token}`,
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
      queryClient.invalidateQueries({ queryKey: campaignKeys.enrollments(variables.campaign_id) });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.campaign_id) });
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
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('drip_enrollments')
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
      queryClient.invalidateQueries({ queryKey: campaignKeys.enrollments(data.campaign_id) });
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
        .from('drip_enrollments')
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
      queryClient.invalidateQueries({ queryKey: campaignKeys.enrollments(data.campaign_id) });
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
      const { data: enrollment } = await supabase
        .from('drip_enrollments')
        .select('campaign_id')
        .eq('id', id)
        .single() as { data: { campaign_id: string } | null };

      const { error } = await supabase
        .from('drip_enrollments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { campaignId: enrollment?.campaign_id };
    },
    onSuccess: (data) => {
      if (data.campaignId) {
        queryClient.invalidateQueries({ queryKey: campaignKeys.enrollments(data.campaignId) });
        queryClient.invalidateQueries({ queryKey: campaignKeys.detail(data.campaignId) });
      }
    },
  });
}
