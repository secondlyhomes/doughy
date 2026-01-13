// useLeads Hook - React Native
// Converted from web app src/features/leads/hooks/

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lead, LeadFormData } from '../types';

// Zone A Supabase client
import { supabase } from '@/lib/supabase';

// Mock data for development
const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@acmecorp.com',
    phone: '(555) 123-4567',
    company: 'Acme Corporation',
    status: 'active',
    score: 85,
    starred: true,
    tags: ['VIP', 'Enterprise'],
    city: 'San Francisco',
    state: 'CA',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Michael Brown',
    email: 'michael.b@techsolutions.io',
    phone: '(555) 234-5678',
    company: 'Tech Solutions',
    status: 'new',
    score: 72,
    starred: false,
    tags: ['Referral'],
    city: 'Austin',
    state: 'TX',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.davis@globalind.com',
    phone: '(555) 345-6789',
    company: 'Global Industries',
    status: 'won',
    score: 68,
    starred: false,
    tags: ['Hot Lead', 'Q1 Target'],
    city: 'New York',
    state: 'NY',
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'James Wilson',
    email: 'jwilson@startup.co',
    phone: '(555) 456-7890',
    company: 'Startup Co',
    status: 'closed',
    score: 45,
    starred: false,
    tags: [],
    city: 'Seattle',
    state: 'WA',
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.a@enterprise.net',
    phone: '(555) 567-8901',
    company: 'Enterprise Networks',
    status: 'active',
    score: 91,
    starred: true,
    tags: ['Enterprise', 'Priority'],
    city: 'Chicago',
    state: 'IL',
    created_at: new Date().toISOString(),
  },
];

async function fetchLeads(): Promise<Lead[]> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      // Fall back to mock data in development
      return mockLeads;
    }

    // Map Supabase response to Lead type
    return (data || []).map(row => {
      const anyRow = row as Record<string, unknown>;
      return {
        id: row.id,
        name: row.name || '',
        status: row.status || 'new',
        phone: row.phone || undefined,
        email: row.email || undefined,
        company: row.company || undefined,
        address_line_1: row.address_line_1 || undefined,
        address_line_2: row.address_line_2 || undefined,
        city: row.city || undefined,
        state: row.state || undefined,
        zip: row.zip || undefined,
        tags: row.tags || [],
        score: row.score || undefined,
        workspace_id: row.workspace_id || undefined,
        created_at: row.created_at || undefined,
        updated_at: row.updated_at || undefined,
        starred: (anyRow.starred as boolean) || false,
        source: (anyRow.source as string) || undefined,
        user_id: row.user_id || undefined,
      } as Lead;
    });
  } catch (err) {
    console.error('Failed to fetch leads:', err);
    return mockLeads;
  }
}

async function fetchLeadById(id: string): Promise<Lead | null> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching lead:', error);
      return mockLeads.find(lead => lead.id === id) || null;
    }

    if (!data) return null;

    // Map Supabase response to Lead type
    const anyData = data as Record<string, unknown>;
    return {
      id: data.id,
      name: data.name || '',
      status: data.status || 'new',
      phone: data.phone || undefined,
      email: data.email || undefined,
      company: data.company || undefined,
      address_line_1: data.address_line_1 || undefined,
      address_line_2: data.address_line_2 || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zip: data.zip || undefined,
      tags: data.tags || [],
      score: data.score || undefined,
      workspace_id: data.workspace_id || undefined,
      created_at: data.created_at || undefined,
      updated_at: data.updated_at || undefined,
      starred: (anyData.starred as boolean) || false,
      source: (anyData.source as string) || undefined,
      user_id: data.user_id || undefined,
    } as Lead;
  } catch (err) {
    console.error('Failed to fetch lead:', err);
    return mockLeads.find(lead => lead.id === id) || null;
  }
}

async function createLead(formData: LeadFormData): Promise<Lead> {
  const { data: userData } = await supabase.auth.getUser();

  const insertData: Record<string, unknown> = {
    name: formData.name,
    email: formData.email || null,
    phone: formData.phone || null,
    company: formData.company || null,
    status: formData.status || 'new',
    tags: formData.tags || [],
    user_id: userData?.user?.id,
  };

  const { data: newLead, error } = await supabase
    .from('leads')
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  return {
    id: newLead.id,
    name: newLead.name || '',
    status: newLead.status || 'new',
    email: newLead.email || undefined,
    phone: newLead.phone || undefined,
    company: newLead.company || undefined,
    tags: newLead.tags || [],
    created_at: newLead.created_at || undefined,
  } as Lead;
}

async function updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
  // Only include fields that are valid for the database
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (leadData.name !== undefined) updatePayload.name = leadData.name;
  if (leadData.email !== undefined) updatePayload.email = leadData.email;
  if (leadData.phone !== undefined) updatePayload.phone = leadData.phone;
  if (leadData.company !== undefined) updatePayload.company = leadData.company;
  if (leadData.status !== undefined) updatePayload.status = leadData.status;
  if (leadData.tags !== undefined) updatePayload.tags = leadData.tags;
  if (leadData.starred !== undefined) updatePayload.starred = leadData.starred;
  if (leadData.score !== undefined) updatePayload.score = leadData.score;

  const { data: updatedLead, error } = await supabase
    .from('leads')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }

  const anyLead = updatedLead as Record<string, unknown>;
  return {
    id: updatedLead.id,
    name: updatedLead.name || '',
    status: updatedLead.status || 'new',
    email: updatedLead.email || undefined,
    phone: updatedLead.phone || undefined,
    company: updatedLead.company || undefined,
    tags: updatedLead.tags || [],
    starred: (anyLead.starred as boolean) || false,
    updated_at: updatedLead.updated_at || undefined,
  } as Lead;
}

async function deleteLead(id: string): Promise<void> {
  // Soft delete by setting is_deleted flag
  const { error } = await supabase
    .from('leads')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}

export function useLeads() {
  const queryClient = useQueryClient();

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
  } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadById(id),
    enabled: !!id,
  });

  return {
    lead,
    isLoading,
    error,
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
