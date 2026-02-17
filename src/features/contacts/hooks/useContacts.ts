// src/features/contacts/hooks/useContacts.ts
// Hooks for fetching and managing CRM contacts
// Filters for landlord-relevant contact types: lead, guest, tenant, vendor

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';
import { Contact, ContactFormData, LANDLORD_CONTACT_TYPES } from '../types';
import { isValidUuid } from '@/lib/validation';

// Type alias for the crm_contacts table row
type CrmContactRow = Database['public']['Tables']['crm_contacts']['Row'];

// Pagination constants
const PAGE_SIZE = 20;

// ============================================
// Fetch functions
// ============================================

// Map a database row to a Contact object
function mapRowToContact(row: CrmContactRow): Contact {
  // module exists in DB (NOT NULL, CHECK) but not in generated types yet — safe runtime access
  const rawModule = (row as Record<string, unknown>).module;
  return {
    id: row.id,
    module: rawModule === 'investor' || rawModule === 'landlord' ? rawModule : 'landlord',
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone,
    contact_types: row.contact_types,
    score: row.score,
    status: row.status,
    source: row.source,
    company: row.company,
    job_title: row.job_title,
    city: row.city,
    state: row.state,
    zip: row.zip,
    tags: row.tags,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user_id: row.user_id,
    is_deleted: row.is_deleted,
  };
}

// Fetch all contacts with landlord-relevant contact types
async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .schema('crm').from('contacts')
    .select('*')
    .eq('is_deleted', false)
    .eq('module', 'landlord')
    .overlaps('contact_types', LANDLORD_CONTACT_TYPES)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }

  return (data || []).map(mapRowToContact);
}

// Paginated fetch function for useInfiniteQuery
interface PaginatedContactsResult {
  contacts: Contact[];
  nextCursor: number | null;
  hasMore: boolean;
}

async function fetchContactsPaginated(pageParam: number = 0): Promise<PaginatedContactsResult> {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .schema('crm').from('contacts')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .eq('module', 'landlord')
    .overlaps('contact_types', LANDLORD_CONTACT_TYPES)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching paginated contacts:', error);
    throw error;
  }

  const contacts = (data || []).map(mapRowToContact);
  const totalCount = count || 0;
  const hasMore = (pageParam + 1) * PAGE_SIZE < totalCount;

  return {
    contacts,
    nextCursor: hasMore ? pageParam + 1 : null,
    hasMore,
  };
}

// Fetch a single contact by ID
async function fetchContactById(id: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .schema('crm').from('contacts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error('Error fetching contact:', error);
    throw error;
  }

  if (!data) return null;

  return mapRowToContact(data);
}

// Create a new contact
async function createContact(formData: ContactFormData): Promise<Contact> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('User not authenticated');
  }

  const insertData = {
    user_id: userData.user.id,
    module: 'landlord' as const,
    first_name: formData.first_name,
    last_name: formData.last_name || null,
    email: formData.email || null,
    phone: formData.phone || null,
    contact_types: formData.contact_types || ['lead'],
    company: formData.company || null,
    job_title: formData.job_title || null,
    source: formData.source || null,
    status: formData.status || 'new',
    notes: formData.notes || null,
  };

  const { data, error } = await supabase
    .schema('crm').from('contacts')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }

  return mapRowToContact(data);
}

// Update an existing contact
async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Only map fields that exist in the database
  if (updates.first_name !== undefined) updateData.first_name = updates.first_name;
  if (updates.last_name !== undefined) updateData.last_name = updates.last_name;
  if (updates.email !== undefined) updateData.email = updates.email;
  if (updates.phone !== undefined) updateData.phone = updates.phone;
  if (updates.contact_types !== undefined) updateData.contact_types = updates.contact_types;
  if (updates.company !== undefined) updateData.company = updates.company;
  if (updates.job_title !== undefined) updateData.job_title = updates.job_title;
  if (updates.source !== undefined) updateData.source = updates.source;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.score !== undefined) updateData.score = updates.score;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.tags !== undefined) updateData.tags = updates.tags;

  const { data, error } = await supabase
    .schema('crm').from('contacts')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact:', error);
    throw error;
  }

  return mapRowToContact(data);
}

// Soft delete a contact
async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase
    .schema('crm').from('contacts')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
}

// ============================================
// Hooks
// ============================================

/**
 * Hook to fetch all landlord-relevant contacts
 * Filters for contact_types containing: lead, guest, tenant, vendor
 */
export function useContacts() {
  const {
    data: contacts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contacts', 'landlord'],
    queryFn: fetchContacts,
  });

  return {
    contacts,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Paginated contacts hook using useInfiniteQuery
 * Use this for large datasets where infinite scroll is needed
 */
export function useContactsPaginated() {
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['contacts', 'landlord', 'paginated'],
    queryFn: ({ pageParam = 0 }) => fetchContactsPaginated(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const contacts = data?.pages.flatMap((page) => page.contacts) ?? [];

  return {
    contacts,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
  };
}

/**
 * Hook to fetch a single contact by ID
 */
export function useContact(id: string) {
  const {
    data: contact,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => fetchContactById(id),
    // Only fetch if id is a valid UUID
    enabled: isValidUuid(id),
  });

  return {
    contact,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to create a new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

/**
 * Hook to update an existing contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Contact> }) =>
      updateContact(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] });
    },
  });
}

/**
 * Hook to delete a contact (soft delete)
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export default useContacts;
