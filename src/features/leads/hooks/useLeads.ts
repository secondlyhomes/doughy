// src/features/leads/hooks/useLeads.ts
// Lead hooks for fetching and managing leads
// Uses supabase.from() which auto-switches between mock/real based on EXPO_PUBLIC_USE_MOCK_DATA

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, LeadFormData } from '../types';
import { supabase } from '@/lib/supabase';

// ============================================
// Fetch functions
// ============================================

async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }

  // Map Supabase response to Lead type
  return (data || []).map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    workspace_id: row.workspace_id,
    name: row.name || '',
    phone: row.phone || undefined,
    email: row.email || undefined,
    company: row.company || undefined,
    status: row.status || 'new',
    score: row.score || undefined,
    tags: row.tags || [],
    opt_status: row.opt_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })) as Lead[];
}

async function fetchLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching lead:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    user_id: data.user_id,
    workspace_id: data.workspace_id,
    name: data.name || '',
    phone: data.phone || undefined,
    email: data.email || undefined,
    company: data.company || undefined,
    status: data.status || 'new',
    score: data.score || undefined,
    tags: data.tags || [],
    opt_status: data.opt_status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as Lead;
}

async function createLead(formData: LeadFormData): Promise<Lead> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User not authenticated');
  }

  const insertData = {
    user_id: userData.user.id,
    name: formData.name,
    email: formData.email || null,
    phone: formData.phone || null,
    company: formData.company || null,
    status: formData.status || 'new',
    tags: formData.tags || [],
  };

  const { data, error } = await supabase
    .from('crm_leads')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name || '',
    status: data.status || 'new',
    email: data.email || undefined,
    phone: data.phone || undefined,
    company: data.company || undefined,
    tags: data.tags || [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as Lead;
}

async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Only map fields that exist in the database
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.company !== undefined) updateData.company = updates.company;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.tags !== undefined) updateData.tags = updates.tags;
  if (updates.score !== undefined) updateData.score = updates.score;
  if (updates.opt_status !== undefined) updateData.opt_status = updates.opt_status;

  const { data, error } = await supabase
    .from('crm_leads')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name || '',
    status: data.status || 'new',
    email: data.email || undefined,
    phone: data.phone || undefined,
    company: data.company || undefined,
    tags: data.tags || [],
    score: data.score || undefined,
    opt_status: data.opt_status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  } as Lead;
}

async function deleteLead(id: string): Promise<void> {
  // Soft delete by setting is_deleted flag
  const { error } = await supabase
    .from('crm_leads')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}

// ============================================
// Hooks
// ============================================

export function useLeads() {
  const {
    data: leads = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads'],
    queryFn: fetchLeads,
  });

  return {
    leads,
    isLoading,
    error,
    refetch,
  };
}

export function useLead(id: string) {
  const {
    data: lead,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id),
    enabled: !!id && id !== '',
  });

  return {
    lead,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      updateLead(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export default useLeads;
