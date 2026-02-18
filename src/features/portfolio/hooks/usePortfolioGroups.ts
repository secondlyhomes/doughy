// src/features/portfolio/hooks/usePortfolioGroups.ts
// Hook for managing portfolio property groups

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type {
  PortfolioGroup,
  PortfolioGroupWithStats,
  CreateGroupInput,
  UpdateGroupInput,
} from '../types';

/**
 * Hook for CRUD operations on portfolio groups
 */
export function usePortfolioGroups() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all groups with property stats
  const {
    data: groups = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['portfolio-groups', user?.id],
    queryFn: async (): Promise<PortfolioGroupWithStats[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .schema('investor').from('portfolio_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching portfolio groups:', error);
        throw error;
      }

      // Get property counts and stats for each group
      const groupsWithStats: PortfolioGroupWithStats[] = await Promise.all(
        (data || []).map(async (group) => {
          const { data: entries, error: entriesError } = await supabase
            .schema('investor').from('portfolio_entries')
            .select('acquisition_price, monthly_rent, monthly_expenses')
            .eq('user_id', user.id)
            .eq('group_id', group.id)
            .eq('is_active', true);

          if (entriesError) {
            // Only ignore if table doesn't exist during schema migration
            if (entriesError.code !== '42P01' && !entriesError.message?.includes('does not exist')) {
              console.error(`[usePortfolioGroups] Error fetching entries for group ${group.id}:`, entriesError);
              // Return group with zero stats but log the error so it can be debugged
            }
          }

          const propertyCount = entries?.length || 0;
          const totalValue = entries?.reduce((sum, e) => sum + (e.acquisition_price || 0), 0) || 0;
          const monthlyCashFlow = entries?.reduce(
            (sum, e) => sum + ((e.monthly_rent || 0) - (e.monthly_expenses || 0)),
            0
          ) || 0;

          return {
            ...group,
            propertyCount,
            totalValue,
            monthlyCashFlow,
          };
        })
      );

      return groupsWithStats;
    },
    enabled: !!user?.id,
  });

  // Create a new group
  const createGroup = useMutation({
    mutationFn: async (input: CreateGroupInput): Promise<PortfolioGroup> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get max sort_order
      const { data: existing } = await supabase
        .schema('investor').from('portfolio_groups')
        .select('sort_order')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .schema('investor').from('portfolio_groups')
        .insert({
          user_id: user.id,
          name: input.name,
          color: input.color,
          sort_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-groups'] });
    },
  });

  // Update a group
  const updateGroup = useMutation({
    mutationFn: async (input: UpdateGroupInput): Promise<PortfolioGroup> => {
      const updates: Partial<PortfolioGroup> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.color !== undefined) updates.color = input.color;
      if (input.sort_order !== undefined) updates.sort_order = input.sort_order;

      const { data, error } = await supabase
        .schema('investor').from('portfolio_groups')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-groups'] });
    },
  });

  // Delete a group (properties become ungrouped)
  const deleteGroup = useMutation({
    mutationFn: async (groupId: string): Promise<void> => {
      const { error } = await supabase
        .schema('investor').from('portfolio_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-groups'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  // Assign a property to a group
  const assignPropertyToGroup = useMutation({
    mutationFn: async ({
      portfolioEntryId,
      groupId,
    }: {
      portfolioEntryId: string;
      groupId: string | null;
    }): Promise<void> => {
      const { error } = await supabase
        .schema('investor').from('portfolio_entries')
        .update({ group_id: groupId })
        .eq('id', portfolioEntryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-groups'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });

  // Reorder groups
  const reorderGroups = useMutation({
    mutationFn: async (orderedIds: string[]): Promise<void> => {
      // Update sort_order for each group
      const updates = orderedIds.map((id, index) =>
        supabase
          .schema('investor').from('portfolio_groups')
          .update({ sort_order: index })
          .eq('id', id)
      );

      // Use allSettled to check for partial failures
      const results = await Promise.allSettled(updates);
      const failures = results.filter((r) => r.status === 'rejected');

      if (failures.length > 0) {
        console.error('[usePortfolioGroups] Partial reorder failure:', failures);
        throw new Error(`Failed to reorder ${failures.length} group(s). Please refresh and try again.`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-groups'] });
    },
  });

  return {
    groups,
    isLoading,
    error,
    refetch,
    createGroup: createGroup.mutateAsync,
    updateGroup: updateGroup.mutateAsync,
    deleteGroup: deleteGroup.mutateAsync,
    assignPropertyToGroup: assignPropertyToGroup.mutateAsync,
    reorderGroups: reorderGroups.mutateAsync,
    isCreating: createGroup.isPending,
    isUpdating: updateGroup.isPending,
    isDeleting: deleteGroup.isPending,
  };
}
