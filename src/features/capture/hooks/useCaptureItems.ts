// src/features/capture/hooks/useCaptureItems.ts
// Hook for fetching and managing capture items (triage queue)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CaptureItem, CaptureItemInsert, CaptureItemUpdate, CaptureItemStatus } from '../types';

// ============================================
// Fetch functions
// ============================================

async function fetchCaptureItems(status?: CaptureItemStatus): Promise<CaptureItem[]> {
  let query = supabase
    .from('ai_capture_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching capture items:', error);
    throw error;
  }

  return data || [];
}

async function fetchPendingCount(): Promise<number> {
  const { count, error } = await supabase
    .from('ai_capture_items')
    .select('*', { count: 'exact', head: true })
    .in('status', ['pending', 'ready']);

  if (error) {
    console.error('Error fetching pending count:', error);
    throw error;
  }

  return count || 0;
}

async function fetchCaptureItem(id: string): Promise<CaptureItem | null> {
  const { data, error } = await supabase
    .from('ai_capture_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching capture item:', error);
    throw error;
  }

  return data;
}

async function createCaptureItem(item: CaptureItemInsert): Promise<CaptureItem> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User not authenticated');
  }

  // If assigned_property_id is provided, mark as assigned immediately
  const status = item.assigned_property_id ? 'assigned' : 'pending';

  const { data, error } = await supabase
    .from('ai_capture_items')
    .insert({
      ...item,
      user_id: userData.user.id,
      status,
      // If auto-assigned, set triage info
      ...(item.assigned_property_id ? {
        triaged_at: new Date().toISOString(),
        triaged_by: userData.user.id,
      } : {}),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating capture item:', error);
    throw error;
  }

  return data;
}

async function updateCaptureItem(id: string, updates: CaptureItemUpdate): Promise<CaptureItem> {
  const { data, error } = await supabase
    .from('ai_capture_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating capture item:', error);
    throw error;
  }

  return data;
}

async function assignCaptureItem(
  id: string,
  assignment: {
    lead_id?: string;
    property_id?: string;
    deal_id?: string;
  }
): Promise<CaptureItem> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('ai_capture_items')
    .update({
      assigned_lead_id: assignment.lead_id || null,
      assigned_property_id: assignment.property_id || null,
      assigned_deal_id: assignment.deal_id || null,
      status: 'assigned',
      triaged_at: new Date().toISOString(),
      triaged_by: userData.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error assigning capture item:', error);
    throw error;
  }

  return data;
}

async function dismissCaptureItem(id: string): Promise<CaptureItem> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('ai_capture_items')
    .update({
      status: 'dismissed',
      triaged_at: new Date().toISOString(),
      triaged_by: userData.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error dismissing capture item:', error);
    throw error;
  }

  return data;
}

async function deleteCaptureItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('ai_capture_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting capture item:', error);
    throw error;
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all capture items (optionally filtered by status)
 */
export function useCaptureItems(status?: CaptureItemStatus) {
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['capture-items', status],
    queryFn: () => fetchCaptureItems(status),
  });

  return {
    items,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch count of pending capture items (for badge)
 */
export function usePendingCaptureCount() {
  const {
    data: count = 0,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['capture-items-pending-count'],
    queryFn: fetchPendingCount,
    // Refetch periodically to keep badge up to date
    refetchInterval: 30000,
  });

  return {
    count,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch a single capture item
 */
export function useCaptureItem(id: string) {
  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['capture-item', id],
    queryFn: () => fetchCaptureItem(id),
    enabled: !!id,
  });

  return {
    item,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to create a new capture item
 */
export function useCreateCaptureItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCaptureItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capture-items'] });
      queryClient.invalidateQueries({ queryKey: ['capture-items-pending-count'] });
    },
  });
}

/**
 * Hook to update a capture item
 */
export function useUpdateCaptureItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CaptureItemUpdate }) =>
      updateCaptureItem(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['capture-items'] });
      queryClient.invalidateQueries({ queryKey: ['capture-item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['capture-items-pending-count'] });
    },
  });
}

/**
 * Hook to assign a capture item to a lead/property/deal
 */
export function useAssignCaptureItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignment }: {
      id: string;
      assignment: { lead_id?: string; property_id?: string; deal_id?: string };
    }) => assignCaptureItem(id, assignment),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['capture-items'] });
      queryClient.invalidateQueries({ queryKey: ['capture-item', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['capture-items-pending-count'] });
      // Also invalidate leads query to show new items
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

/**
 * Hook to dismiss a capture item
 */
export function useDismissCaptureItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissCaptureItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capture-items'] });
      queryClient.invalidateQueries({ queryKey: ['capture-items-pending-count'] });
    },
  });
}

/**
 * Hook to delete a capture item
 */
export function useDeleteCaptureItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCaptureItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capture-items'] });
      queryClient.invalidateQueries({ queryKey: ['capture-items-pending-count'] });
    },
  });
}

export default useCaptureItems;
