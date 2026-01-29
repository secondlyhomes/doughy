// src/features/leads/hooks/useLeads.ts
// Lead hooks for fetching and managing leads
// Uses supabase.from() which auto-switches between mock/real based on EXPO_PUBLIC_USE_MOCK_DATA

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { Lead, LeadFormData, LeadWithProperties } from '../types';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';
import { isValidUuid } from '@/lib/validation';
import { Property } from '@/features/real-estate/types/property';

// Type alias for the crm_leads table row
type CrmLeadRow = Database['public']['Tables']['crm_leads']['Row'];

// Pagination constants
const PAGE_SIZE = 20;

// ============================================
// Fetch functions
// ============================================

// Map a database row to a Lead object
function mapRowToLead(row: CrmLeadRow): Lead {
  const lead: Lead = {
    id: row.id,
    user_id: row.user_id ?? undefined,
    workspace_id: row.workspace_id ?? undefined,
    name: row.name || '',
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    company: row.company ?? undefined,
    status: (row.status as Lead['status']) || 'new',
    score: row.score ?? undefined,
    tags: row.tags || [],
    opt_status: (row.opt_status ?? undefined) as Lead['opt_status'],
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  };
  return lead;
}

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

  return (data || []).map(mapRowToLead);
}

// Paginated fetch function for useInfiniteQuery
interface PaginatedLeadsResult {
  leads: Lead[];
  nextCursor: number | null;
  hasMore: boolean;
}

async function fetchLeadsPaginated(pageParam: number = 0): Promise<PaginatedLeadsResult> {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('crm_leads')
    .select('*', { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching paginated leads:', error);
    throw error;
  }

  const leads = (data || []).map(mapRowToLead);
  const totalCount = count || 0;
  const hasMore = (pageParam + 1) * PAGE_SIZE < totalCount;

  return {
    leads,
    nextCursor: hasMore ? pageParam + 1 : null,
    hasMore,
  };
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

  const lead: Lead = {
    id: data.id,
    user_id: data.user_id ?? undefined,
    workspace_id: data.workspace_id ?? undefined,
    name: data.name || '',
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    company: data.company ?? undefined,
    status: (data.status as Lead['status']) || 'new',
    score: data.score ?? undefined,
    tags: data.tags || [],
    opt_status: (data.opt_status ?? undefined) as Lead['opt_status'],
    created_at: data.created_at ?? undefined,
    updated_at: data.updated_at ?? undefined,
  };
  return lead;
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
    // Cast to database enum type - app may have additional statuses not in DB
    status: (formData.status || 'new') as Database['public']['Enums']['lead_status'],
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

  const lead: Lead = {
    id: data.id,
    user_id: data.user_id ?? undefined,
    name: data.name || '',
    status: (data.status as Lead['status']) || 'new',
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    company: data.company ?? undefined,
    tags: data.tags || [],
    created_at: data.created_at ?? undefined,
    updated_at: data.updated_at ?? undefined,
  };
  return lead;
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

  const lead: Lead = {
    id: data.id,
    user_id: data.user_id ?? undefined,
    name: data.name || '',
    status: (data.status as Lead['status']) || 'new',
    email: data.email ?? undefined,
    phone: data.phone ?? undefined,
    company: data.company ?? undefined,
    tags: data.tags || [],
    score: data.score ?? undefined,
    opt_status: (data.opt_status ?? undefined) as Lead['opt_status'],
    created_at: data.created_at ?? undefined,
    updated_at: data.updated_at ?? undefined,
  };
  return lead;
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

// Fetch leads with their associated properties (hierarchical view)
async function fetchLeadsWithProperties(): Promise<LeadWithProperties[]> {
  // First fetch all leads
  const { data: leadsData, error: leadsError } = await supabase
    .from('crm_leads')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (leadsError) {
    console.error('Error fetching leads:', leadsError);
    throw leadsError;
  }

  // Then fetch all properties with lead_id, including their images
  // Use * with join syntax (same pattern as useProperties.ts) to ensure images are properly fetched
  const { data: propertiesData, error: propertiesError } = await supabase
    .from('investor_properties')
    .select(`
      *,
      images:investor_property_images(id, url, is_primary, label)
    `)
    .not('lead_id', 'is', null);

  if (propertiesError) {
    console.error('Error fetching properties:', propertiesError);
    throw propertiesError;
  }

  // Group properties by lead_id
  const propertiesByLead = new Map<string, LeadWithProperties['properties']>();
  (propertiesData || []).forEach((prop) => {
    if (prop.lead_id) {
      const existing = propertiesByLead.get(prop.lead_id) || [];
      existing.push({
        id: prop.id,
        address_line_1: prop.address_line_1,
        address_line_2: prop.address_line_2 || undefined,
        city: prop.city,
        state: prop.state,
        zip: prop.zip,
        bedrooms: prop.bedrooms || undefined,
        bathrooms: prop.bathrooms ? Number(prop.bathrooms) : undefined,
        square_feet: prop.square_feet || undefined,
        arv: prop.arv ? Number(prop.arv) : undefined,
        purchase_price: prop.purchase_price ? Number(prop.purchase_price) : undefined,
        status: prop.status || undefined,
        property_type: prop.property_type || undefined,
        images: (prop.images || []).map((img: { id: string; url: string; is_primary: boolean | null; label: string | null }) => ({
          id: img.id,
          url: img.url,
          is_primary: img.is_primary ?? undefined,
          label: img.label ?? undefined,
        })),
      });
      propertiesByLead.set(prop.lead_id, existing);
    }
  });

  // Map leads with their properties
  const leadsWithProperties: LeadWithProperties[] = (leadsData || []).map((row) => {
    const properties = propertiesByLead.get(row.id) || [];
    return {
      ...mapRowToLead(row),
      properties,
      propertyCount: properties.length,
    };
  });

  return leadsWithProperties;
}

// Fetch orphan properties (no lead assigned) - for "Unknown Seller" section
async function fetchOrphanProperties(): Promise<LeadWithProperties['properties']> {
  const { data, error } = await supabase
    .from('investor_properties')
    .select(`
      id, address_line_1, address_line_2, city, state, zip,
      bedrooms, bathrooms, square_feet, arv, purchase_price, status, property_type,
      images:investor_property_images(id, url, is_primary, label)
    `)
    .is('lead_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orphan properties:', error);
    throw error;
  }

  return (data || []).map((prop) => ({
    id: prop.id,
    address_line_1: prop.address_line_1,
    address_line_2: prop.address_line_2 || undefined,
    city: prop.city,
    state: prop.state,
    zip: prop.zip,
    bedrooms: prop.bedrooms || undefined,
    bathrooms: prop.bathrooms ? Number(prop.bathrooms) : undefined,
    square_feet: prop.square_feet || undefined,
    arv: prop.arv ? Number(prop.arv) : undefined,
    purchase_price: prop.purchase_price ? Number(prop.purchase_price) : undefined,
    status: prop.status || undefined,
    property_type: prop.property_type || undefined,
    images: (prop.images || []).map((img: { id: string; url: string; is_primary: boolean | null; label: string | null }) => ({
      id: img.id,
      url: img.url,
      is_primary: img.is_primary ?? undefined,
      label: img.label ?? undefined,
    })),
  }));
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

/**
 * Paginated leads hook using useInfiniteQuery
 * Use this for large datasets where infinite scroll is needed
 */
export function useLeadsPaginated() {
  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['leads', 'paginated'],
    queryFn: ({ pageParam = 0 }) => fetchLeadsPaginated(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  });

  // Flatten all pages into a single array
  const leads = data?.pages.flatMap((page) => page.leads) ?? [];

  return {
    leads,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
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
    // Only fetch if id is a valid UUID (prevents "new" or other strings from hitting DB)
    enabled: isValidUuid(id),
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

/**
 * Hook to fetch leads with their associated properties (hierarchical view)
 * Use this for the unified Leads tab showing sellers with their properties
 */
export function useLeadsWithProperties() {
  const {
    data: leads = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['leads', 'with-properties'],
    queryFn: fetchLeadsWithProperties,
  });

  return {
    leads,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch orphan properties (no lead assigned)
 * Use this for the "Unknown Seller" section
 */
export function useOrphanProperties() {
  const {
    data: properties = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['properties', 'orphan'],
    queryFn: fetchOrphanProperties,
  });

  return {
    properties,
    isLoading,
    error,
    refetch,
  };
}

export default useLeads;
