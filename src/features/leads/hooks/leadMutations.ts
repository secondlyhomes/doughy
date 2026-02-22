// src/features/leads/hooks/leadMutations.ts
// Mutation functions for creating, updating, and deleting leads

import { Lead, LeadFormData } from '../types';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';
import { mapRowToLead } from './leadMappers';

export async function createLead(formData: LeadFormData): Promise<Lead> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User not authenticated');
  }

  const insertData = {
    user_id: userData.user.id,
    module: 'investor' as const,
    name: formData.name,
    email: formData.email || null,
    phone: formData.phone || null,
    company: formData.company || null,
    // Cast to database enum type - app may have additional statuses not in DB
    status: (formData.status || 'new') as Database['public']['Enums']['lead_status'],
    tags: formData.tags || [],
  };

  const { data, error } = await supabase
    .schema('crm').from('leads')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw error;
  }

  return mapRowToLead(data);
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
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
    .schema('crm').from('leads')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }

  return mapRowToLead(data);
}

export async function deleteLead(id: string): Promise<void> {
  // Soft delete by setting is_deleted flag
  const { error } = await supabase
    .schema('crm').from('leads')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}
